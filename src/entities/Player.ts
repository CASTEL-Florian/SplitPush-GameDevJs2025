import Phaser from 'phaser';
import { Events, PlayerPositionData, WindowID, gameBridge } from '../GameBridge';
import MainScene from '../scenes/MainScene';
import { weightManager } from '../WeightManager';

const PLAYER_MAX_SPEED = 200;
const PLAYER_ACCELERATION = 800;
const PLAYER_DECELERATION = 200;

export class Player {
    public sprite: Phaser.GameObjects.Sprite;
    private windowId: WindowID;
    private tileX: number;
    private tileY: number;
    private tileSize: number;
    private mainScene: MainScene; // MainScene type
    private isInWindow: boolean = true;

    constructor(scene: MainScene, windowId: WindowID) {
        this.windowId = windowId;
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
            console.log(`[${this.windowId}] Received position update:`, data);
            this._moveLock = true;
            if (data.windowId === this.windowId) {
                this.isInWindow = true;
                this.sprite.alpha = 1;
            }
            else {
                this.isInWindow = false;
                this.sprite.alpha = 0;
            }
            this.tileX = data.x;
            this.tileY = data.y;
            this.sprite.setPosition(
                this.tileX * this.tileSize + this.tileSize / 2,
                this.tileY * this.tileSize + this.tileSize / 2
            );
        };
        gameBridge.on(Events.PLAYER_POSITION_UPDATE, handlePlayerUpdate);
        scene.events.on(Phaser.Scenes.Events.SHUTDOWN, () => {
            console.log(`[${this.windowId}] Shutting down scene, removing bridge listener.`);
            gameBridge.off(Events.PLAYER_POSITION_UPDATE, handlePlayerUpdate);
        });
    }
    
    public update(delta: number) {
        const Input = require('../InputManager').default.instance;
        const left = Input.isPressed('ArrowLeft') || Input.isPressed('KeyA') || Input.isPressed('KeyQ');
        const right = Input.isPressed('ArrowRight') || Input.isPressed('KeyD');
        const up = Input.isPressed('ArrowUp') || Input.isPressed('KeyW') || Input.isPressed('KeyZ');
        const down = Input.isPressed('ArrowDown') || Input.isPressed('KeyS');

        if (!left && !right && !up && !down) {
            this._moveLock = false;
        }

        if (!this.isInWindow) return;
        if (this._moveLock) return;
        let dx = 0, dy = 0;
        if (left) dx = -1;
        else if (right) dx = 1;
        else if (up) dy = -1;
        else if (down) dy = 1;
        if (dx !== 0 || dy !== 0) {
            this._moveLock = true;
            // Find last empty tile in this direction
            let tx = this.tileX;
            let ty = this.tileY;
            let lastEmptyX = tx;
            let lastEmptyY = ty;
            let maxIt = 100; // Just to be sure it ends.
            let currentWindowId = this.windowId;
            let isEnteringOtherWindow = false;
            while (maxIt-- > 0) {
                let nextX = tx + dx;
                const nextY = ty + dy;
                console.log("Checking tile:", nextX, nextY, currentWindowId, this.windowId);
                if (!this.mainScene.isTileEmptyOrInvalid(nextX, nextY, currentWindowId)) {
                    const currentTilemapDataWidth = this.mainScene.currentTilemapDataWidth();
                    if (currentWindowId === 'left' && currentTilemapDataWidth && nextX >= currentTilemapDataWidth) {
                        tx = -1;
                        ty += weightManager.leftWeight - weightManager.rightWeight;
                        currentWindowId = 'right';
                        isEnteringOtherWindow = true;
                        continue;
                    }
                    else if (currentWindowId === 'right' && currentTilemapDataWidth && nextX < 0) {
                        tx = currentTilemapDataWidth;
                        ty += weightManager.rightWeight - weightManager.leftWeight;
                        currentWindowId = 'left';
                        isEnteringOtherWindow = true;
                        continue;
                    }
                    if (isEnteringOtherWindow) {
                        currentWindowId = currentWindowId === 'left' ? 'right' : 'left';
                    }
                    break;
                }
                
                isEnteringOtherWindow = false;
                lastEmptyX = nextX;
                lastEmptyY = nextY;
                tx = nextX;
                ty = nextY;
            }
            if (lastEmptyX !== this.tileX || lastEmptyY !== this.tileY || currentWindowId !== this.windowId) {
                this.tileX = lastEmptyX;
                this.tileY = lastEmptyY;
                this.sprite.setPosition(
                    this.tileX * this.tileSize + this.tileSize / 2,
                    this.tileY * this.tileSize + this.tileSize / 2
                );
               gameBridge.emit(Events.PLAYER_POSITION_UPDATE, {
                    x: this.tileX,
                    y: this.tileY,
                    windowId: currentWindowId
                });
            }
        }
    }
    private _moveLock: boolean = false;
}
