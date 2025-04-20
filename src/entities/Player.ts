import Phaser from 'phaser';
import { Events, PlayerPositionData, WindowID, gameBridge } from '../GameBridge';
import MainScene from '../scenes/MainScene';

const PLAYER_MAX_SPEED = 200;
const PLAYER_ACCELERATION = 800;
const PLAYER_DECELERATION = 200;

export class Player {
    public sprite: Phaser.GameObjects.Sprite;
    public cursors: Phaser.Types.Input.Keyboard.CursorKeys;
    private windowId: WindowID;
    private tileX: number;
    private tileY: number;
    private tileSize: number;
    private mainScene: MainScene; // MainScene type

    constructor(scene: MainScene, windowId: WindowID) {
        this.windowId = windowId;
        this.cursors = scene.input!.keyboard!.createCursorKeys();
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
    }

    public getSprite() {
        return this.sprite;
    }

    public update(delta: number) {
        // Only allow one move per key press
        if (!this.cursors.left.isDown && !this.cursors.right.isDown && !this.cursors.up.isDown && !this.cursors.down.isDown) {
            this._moveLock = false;
        }
        if (this._moveLock) return;
        let dx = 0, dy = 0;
        if (this.cursors.left.isDown) dx = -1;
        else if (this.cursors.right.isDown) dx = 1;
        else if (this.cursors.up.isDown) dy = -1;
        else if (this.cursors.down.isDown) dy = 1;
        if (dx !== 0 || dy !== 0) {
            this._moveLock = true;
            // Find last empty tile in this direction
            let tx = this.tileX;
            let ty = this.tileY;
            let lastEmptyX = tx;
            let lastEmptyY = ty;
            let maxIt = 20;
            while (maxIt-- > 0) {
                const nextX = tx + dx;
                const nextY = ty + dy;
                if (!this.mainScene.isTileEmptyOrInvalid(nextX, nextY, this.windowId)) {
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
            }
        }
    }
    private _moveLock: boolean = false;
}
