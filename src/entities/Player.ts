import Phaser from 'phaser';
import { Events, PlayerPositionData, WindowID, gameBridge } from '../GameBridge';
import MainScene from '../scenes/MainScene';

const PLAYER_MAX_SPEED = 200;
const PLAYER_ACCELERATION = 800;
const PLAYER_DECELERATION = 200;

export class Player {
    public sprite: Phaser.GameObjects.Sprite;
    public cursors: Phaser.Types.Input.Keyboard.CursorKeys;
    private keyW: Phaser.Input.Keyboard.Key;
    private keyA: Phaser.Input.Keyboard.Key;
    private keyS: Phaser.Input.Keyboard.Key;
    private keyD: Phaser.Input.Keyboard.Key;
    private keyZ: Phaser.Input.Keyboard.Key;
    private keyQ: Phaser.Input.Keyboard.Key;
    private windowId: WindowID;
    private tileX: number;
    private tileY: number;
    private tileSize: number;
    private mainScene: MainScene; // MainScene type
    private isInWindow: boolean = true;

    constructor(scene: MainScene, windowId: WindowID) {
        this.windowId = windowId;
        this.cursors = scene.input!.keyboard!.createCursorKeys();
        // WASD (QWERTY) and ZQSD (AZERTY) support
        this.keyW = scene.input!.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W);
        this.keyA = scene.input!.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A);
        this.keyS = scene.input!.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S);
        this.keyD = scene.input!.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D);
        this.keyZ = scene.input!.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.Z);
        this.keyQ = scene.input!.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.Q);
        // Start in the center of the map (tile coordinates)
        // For now, use 4,4 as default (assuming 8x8 map)
        this.tileX = 4;
        this.tileY = 4;
        // Get tile size from LevelManager
        // @ts-ignore
        this.tileSize = require('../levels/LevelManager').getTileSize();
        // Get MainScene reference
        this.mainScene = scene;
        // Place sprite at correct position
        this.sprite = scene.add.sprite(
            this.tileX * this.tileSize + this.tileSize / 2,
            this.tileY * this.tileSize + this.tileSize / 2,
            'player'
        ).setDisplaySize(32, 32);

        this.isInWindow = windowId === 'left';
        this.sprite.alpha = this.isInWindow ? 1 : 0;
        this.setupBridgeListeners(scene);
    }
    
    public getSprite() {
        return this.sprite;
    }

    private setupBridgeListeners(scene: Phaser.Scene): void {
        const handlePlayerUpdate = (data: PlayerPositionData) => {
            if (data.windowId === this.windowId) {
                this.isInWindow = true;
                this.sprite.alpha = 1;
            }
            else {
                this.isInWindow = false;
                this.sprite.alpha = 0;
            }
            this.sprite.setPosition(data.x, data.y);
        };
        gameBridge.on(Events.PLAYER_POSITION_UPDATE, handlePlayerUpdate);
        scene.events.on(Phaser.Scenes.Events.SHUTDOWN, () => {
            console.log(`[${this.windowId}] Shutting down scene, removing bridge listener.`);
            gameBridge.off(Events.PLAYER_POSITION_UPDATE, handlePlayerUpdate);
        });
    }
    
    public update(delta: number) {
        // Only allow one move per key press
        if (!this.cursors.left.isDown && !this.cursors.right.isDown && !this.cursors.up.isDown && !this.cursors.down.isDown &&
            !this.keyW.isDown && !this.keyA.isDown && !this.keyS.isDown && !this.keyD.isDown &&
            !this.keyZ.isDown && !this.keyQ.isDown) {
            this._moveLock = false;
        }
            
        if (!this.isInWindow) return;
        
        if (this._moveLock) return;
        let dx = 0, dy = 0;
        if (this.cursors.left.isDown || this.keyA.isDown || this.keyQ.isDown) dx = -1;
        else if (this.cursors.right.isDown || this.keyD.isDown) dx = 1;
        else if (this.cursors.up.isDown || this.keyW.isDown || this.keyZ.isDown) dy = -1;
        else if (this.cursors.down.isDown || this.keyS.isDown) dy = 1;
        if (dx !== 0 || dy !== 0) {
            this._moveLock = true;
            // Find last empty tile in this direction
            let tx = this.tileX;
            let ty = this.tileY;
            let lastEmptyX = tx;
            let lastEmptyY = ty;
            let maxIt = 100; // Just to be sure it ends.
            let currentWindowId = this.windowId;
            while (maxIt-- > 0) {
                let nextX = tx + dx;
                const nextY = ty + dy;
                if (!this.mainScene.isTileEmptyOrInvalid(nextX, nextY, currentWindowId)) {
                    const currentTilemapDataWidth = this.mainScene.currentTilemapDataWidth();
                    if (currentWindowId === 'left' && currentTilemapDataWidth && nextX >= currentTilemapDataWidth) {
                        tx = -1;
                        currentWindowId = 'right';
                        continue;
                    }
                    else if (currentWindowId === 'right' && currentTilemapDataWidth && nextX < 0) {
                        tx = currentTilemapDataWidth;
                        currentWindowId = 'left';
                        continue;
                    }
                    break;
                }
                
                lastEmptyX = nextX;
                lastEmptyY = nextY;
                tx = nextX;
                ty = nextY;
            }
            if (lastEmptyX !== this.tileX || lastEmptyY !== this.tileY) {
                this.tileX = lastEmptyX;
                this.tileY = lastEmptyY;
                this.sprite.setPosition(
                    this.tileX * this.tileSize + this.tileSize / 2,
                    this.tileY * this.tileSize + this.tileSize / 2
                );
               gameBridge.emit(Events.PLAYER_POSITION_UPDATE, {
                    x: this.tileX * this.tileSize + this.tileSize / 2,
                    y: this.tileY * this.tileSize + this.tileSize / 2,
                    windowId: currentWindowId
                });
            }
        }
    }
    private _moveLock: boolean = false;
}
