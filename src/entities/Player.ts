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
import { WINDOW_WIDTH } from '../game';

export type EyesDirection = 'right' | 'left' | 'up' | 'down' | 'none';

export class Player {
    public sprite: Phaser.GameObjects.Container;
    private eyesSprite: Phaser.GameObjects.Sprite;
    private eyesDirection: EyesDirection = 'none';
    private windowId: WindowID;
    private tileX: number;
    private tileY: number;
    private tileSize: number;
    private mainScene: MainScene; // MainScene type
    private isInWindow: boolean = true;
    private bobOffset: number = 0;
    private bobTween?: Phaser.Tweens.Tween;

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
        // Create a container to group the player sprite and eyes sprite
        this.sprite = scene.add.container(
            this.tileX * this.tileSize + this.tileSize / 2,
            this.tileY * this.tileSize + this.tileSize / 2
        );
        const tileSize = getTileSize();
        // Add player sprite to the container
        const playerSprite = scene.add.sprite(0, 0, 'player').setDisplaySize(tileSize, tileSize);
        this.sprite.add(playerSprite);
        // Add eyes sprite to the container
        this.eyesSprite = scene.add.sprite(0, 0, 'eyes').setDisplaySize(tileSize, tileSize);
        this.sprite.add(this.eyesSprite);
        this.eyesSprite.setDepth(1);
        this.setEyes('none');

        this.isInWindow = windowId === 'left';
        this.sprite.alpha = this.isInWindow ? 1 : 0;
        this.setupBridgeListeners(scene);
    }

    public getSprite() {
        return this.sprite;
    }

    private setEyes(direction: EyesDirection) {
        this.eyesDirection = direction;
        switch (direction) {
            case 'right':
                this.eyesSprite.setTexture('eyes_right');
                this.eyesSprite.setFlipX(false);
                break;
            case 'left':
                this.eyesSprite.setTexture('eyes_right');
                this.eyesSprite.setFlipX(true);
                break;
            case 'up':
                this.eyesSprite.setTexture('eyes_up');
                this.eyesSprite.setFlipX(false);
                break;
            case 'down':
                this.eyesSprite.setTexture('eyes_down');
                this.eyesSprite.setFlipX(false);
                break;
            default:
                this.eyesSprite.setTexture('eyes');
                this.eyesSprite.setFlipX(false);
        }
    }

    private setupBridgeListeners(scene: Phaser.Scene): void {
        const handlePlayerUpdate = (data: PlayerPositionData & { eyesDirection?: EyesDirection }) => {
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
            if (data.eyesDirection) {
                this.setEyes(data.eyesDirection);
            } else {
                this.setEyes('none');
            }
        };

        const handleMusicBeat = () => {
            this.onMusicBeat();
        };

        gameBridge.on(Events.MUSIC_BEAT, handleMusicBeat);

        gameBridge.on(Events.PLAYER_POSITION_UPDATE, handlePlayerUpdate);
        scene.events.on(Phaser.Scenes.Events.SHUTDOWN, () => {
            console.log(`[${this.windowId}] Shutting down scene, removing bridge listener.`);
            gameBridge.off(Events.PLAYER_POSITION_UPDATE, handlePlayerUpdate);
            gameBridge.off(Events.MUSIC_BEAT, handleMusicBeat);
        });
    }


    private onMusicBeat() {
        if (this.bobTween) {
            this.bobTween.stop();
        }

        const bobAmount = 0.06 * this.tileSize;
        // Instantly set to bobAmount
        this.bobOffset = bobAmount;
        if (this.eyesSprite) {
            this.eyesSprite.y = this.bobOffset;
        }
        // Tween back to 0 with easing
        this.bobTween = this.mainScene.tweens.add({
            targets: this,
            bobOffset: 0,
            duration: 600,
            ease: 'Quad.easeOut',
            onUpdate: () => {
                if (this.eyesSprite) {
                    this.eyesSprite.y = this.bobOffset;
                }
            },
            onComplete: () => {
                this.bobOffset = 0;
                if (this.eyesSprite) {
                    this.eyesSprite.y = 0;
                }
            }
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
            if (undoManager.canUndo()) {
                undoManager.undo();
                gameBridge.emit(Events.PLAY_SFX, { sfx: 'undo' });
            }
            return;
        }
        if (restart) {
            this._moveLock = true;
            if (undoManager.canUndo()) {
                undoManager.undoAll();
                gameBridge.emit(Events.PLAY_SFX, { sfx: 'undo' });
            }
            return;
        }
        let dx = 0, dy = 0;
        let eyesDir: EyesDirection = 'none';
        if (left) { dx = -1; eyesDir = 'left'; }
        else if (right) { dx = 1; eyesDir = 'right'; }
        else if (up) { dy = -1; eyesDir = 'up'; }
        else if (down) { dy = 1; eyesDir = 'down'; }
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
            undoManager.register(new PlayerStateUndoable(this.tileX, this.tileY, this.windowId, this.eyesDirection));
            this.setEyes(eyesDir);
            undoManager.beginNewStep();
            gameBridge.emit(Events.PLAYER_POSITION_UPDATE, {
                x: nextX,
                y: nextY,
                windowId: currentWindowId,
                eyesDirection: eyesDir
            });
            gameBridge.emit(Events.PLAY_SFX, { sfx: 'move' });
            const playerTarget = this.mainScene.getPlayerTargetAt(nextX, nextY, currentWindowId)
            if (playerTarget) {
                // Check if all the box targets are filled
                const allTargetsFilled = targetManager.getCurrentTargets() === targetManager.getTotalTargets();
                if (allTargetsFilled) {
                    // Emit event to notify the game is won
                    gameBridge.emit(Events.GAME_WON, { backToLevel1: playerTarget.isSpecial()});
                    console.log(`[${currentWindowId}] Game won!`);
                }
            }
        }
    }
    private _moveLock: boolean = false;
}
