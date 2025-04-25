import Phaser from 'phaser';
import { Events, PlayerPositionData, WindowID, gameBridge } from '../GameBridge';
import MainScene from '../scenes/MainScene';
import { weightManager } from '../WeightManager';
import { getTileSize } from '../levels/LevelManager';
import { undoManager } from '../undo/UndoManager';
import { PlayerStateUndoable } from './PlayerStateUndoable';
import { WeightUndoable } from './WeightUndoable';
import { BoxUndoable } from './BoxUndoable';
import { TargetManagerUndoable } from './TargetManagerUndoable';
import { targetManager } from './TargetManager';
import { Box } from './Box';

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
        this.tileSize = getTileSize();
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
        const undo = Input.isPressed('KeyU');
        const restart = Input.isPressed('KeyR');

        if (!left && !right && !up && !down && !undo && !restart) {
            this._moveLock = false;
        }

        if (!this.isInWindow) return;
        if (this.mainScene.isTransitioning) return;
        if (this._moveLock) return;
        if (undo) {
            this._moveLock = true;
            undoManager.undo();
            return;
        }
        if (restart) {
            this._moveLock = true;
            undoManager.undoAll();
            return;
        }
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
            let currentWindowId = this.windowId;

            let nextX = tx + dx;
            let nextY = ty + dy;
            const currentTilemapDataWidth = this.mainScene.currentTilemapDataWidth();
            if (currentWindowId === 'left' && currentTilemapDataWidth && nextX >= currentTilemapDataWidth) {
                if (this.mainScene.isWindowMoving){
                    return;
                }
                nextX = 0;
                nextY += weightManager.leftWeight - weightManager.rightWeight;
                currentWindowId = 'right';
            }
            else if (currentWindowId === 'right' && currentTilemapDataWidth && nextX < 0) {
                if (this.mainScene.isWindowMoving){
                    return;
                }
                nextX = currentTilemapDataWidth - 1;
                nextY += weightManager.rightWeight - weightManager.leftWeight;
                currentWindowId = 'left';
            }
            // --- Box pushing logic ---
            const boxAtNext = this.mainScene.getBoxAt(nextX, nextY, currentWindowId);
            if (boxAtNext) {
                // Collect all contiguous boxes in the push direction
                let boxesToPush: Box[] = [];
                let checkX = nextX;
                let checkY = nextY;
                let currentBoxWindowId = currentWindowId;
                while (true) {
                    if (currentBoxWindowId === 'left' && currentTilemapDataWidth && checkX >= currentTilemapDataWidth) {
                        if (this.mainScene.isWindowMoving){
                            return;
                        }
                        checkX = 0;
                        checkY += weightManager.leftWeight - weightManager.rightWeight;
                        currentBoxWindowId = 'right';
                    }
                    else if (currentBoxWindowId === 'right' && currentTilemapDataWidth && checkX < 0) {
                        if (this.mainScene.isWindowMoving){
                            return;
                        }
                        checkX = currentTilemapDataWidth - 1;
                        checkY += weightManager.rightWeight - weightManager.leftWeight;
                        currentBoxWindowId = 'left';
                    }
                    const box = this.mainScene.getBoxAt(checkX, checkY, currentBoxWindowId);
                    if (!box) break;
                    boxesToPush.push(box);
                    checkX += dx;
                    checkY += dy;
                }
                // Check if the tile after the last box is empty
                if (!this.mainScene.isTileEmptyOrInvalid(checkX, checkY, currentBoxWindowId)) {
                    return; // Blocked, can't push
                }
                // Move all boxes forward (last to first, so no overwrite)
                for (let i = boxesToPush.length - 1; i >= 0; i--) {
                    const box = boxesToPush[i];
                    undoManager.register(new BoxUndoable(box.tileX, box.tileY, box.windowId, box));
                    box.moveBox(dx, dy, currentTilemapDataWidth, weightManager);
                }
            } else if (!this.mainScene.isTileEmptyOrInvalid(nextX, nextY, currentWindowId)) {
                return;
            }

            undoManager.register(new WeightUndoable(weightManager.leftWeight, weightManager.rightWeight));
            if (this.windowId != currentWindowId){
                if (currentWindowId === 'left'){
                    weightManager.leftWeight += 0.5;
                    weightManager.rightWeight -= 0.5;
                }
                else {
                    weightManager.rightWeight += 0.5;
                    weightManager.leftWeight -= 0.5;
                }
            }
            undoManager.register(new PlayerStateUndoable(this.tileX, this.tileY, this.windowId));
            undoManager.beginNewStep();
            gameBridge.emit(Events.PLAYER_POSITION_UPDATE, {
                x: nextX,
                y: nextY,
                windowId: currentWindowId
            });

            console.log("Checking if player target is filled...");
            if (this.mainScene.getPlayerTargetAt(nextX, nextY, currentWindowId)) {
                // Check if all the box targets are filled
                console.log("Checking if all targets are filled...");
                const allTargetsFilled = targetManager.getCurrentTargets() === targetManager.getTotalTargets();
                if (allTargetsFilled) {
                    // Emit event to notify the game is won
                    gameBridge.emit(Events.GAME_WON, { windowId: currentWindowId });
                    console.log(`[${currentWindowId}] Game won!`);
                }
            }
        }
    }
    private _moveLock: boolean = false;
}
