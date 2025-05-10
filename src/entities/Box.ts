import { LevelElement } from "../levels/LevelElement";
import { gameBridge, Events, BoxPositionData, WindowID } from "../GameBridge";
import Phaser from "phaser";
import { getTileSize } from "../levels/LevelManager";
import { weightManager, WeightManager } from "../WeightManager";
import { leftLevels, rightLevels } from "../levels/LevelDefinitions";
import { targetManager } from "./TargetManager";
import MainScene from "../scenes/MainScene";

export class Box extends LevelElement {
    static nextBoxId = 1;
    public readonly boxId: number;
    sprite: Phaser.GameObjects.Sprite | null = null;
    tileX: number;
    tileY: number;
    weight: number;
    spriteKey: string;
    tileSize: number;
    spawned: boolean = false;
    boxType: string;
    public windowId: WindowID;
    private scene: Phaser.Scene | null = null;
    private static getBoxTargetAt: ((x: number, y: number, windowId: WindowID) => any) | null = null;
    private isOnTarget: boolean = false;
    private animScale: number = 1;
    private animTween?: Phaser.Tweens.Tween;
    private lastBeatTime: number = 0;
    private originalScaleX: number = 1;
    private originalScaleY: number = 1;
    private currentlySpawned: boolean = false;

    static setGetBoxTargetAt(fn: (x: number, y: number, windowId: WindowID) => any) {
        Box.getBoxTargetAt = fn;
    }

    constructor(tileX: number, tileY: number, weight: number, windowId: WindowID, spriteKey: string = "box", boxType: string = "default") {
        super();
        this.boxId = Box.nextBoxId++;
        this.tileX = tileX;
        this.tileY = tileY;
        this.weight = weight;
        this.spriteKey = spriteKey;
        this.tileSize = 0;
        this.windowId = windowId;
        this.boxType = boxType;
    }
    
    spawn(scene: Phaser.Scene, windowId: WindowID): void {
        this.windowId = windowId;
        this.tileSize = getTileSize();  
        if (this.sprite) return; // Already spawned
        const x = this.tileX * this.tileSize + this.tileSize / 2;
        const y = this.tileY * this.tileSize + this.tileSize / 2;
        this.sprite = scene.add.sprite(x, y, this.isOnTarget ? 'box_activated' : this.spriteKey).setDisplaySize(this.tileSize, this.tileSize);
        this.sprite.setOrigin(0.5, 0.5);
        this.sprite.setData('box', this);
        // Store the scale that setDisplaySize produced as the "original" scale
        this.originalScaleX = this.sprite.scaleX;
        this.originalScaleY = this.sprite.scaleY;
        if (!this.spawned) {
            this.setupBridgeListeners(scene);
        }
        this.spawned = true;
        this.scene = scene;
        // Ensure scale is reset to original
        if (this.sprite) {
            this.sprite.setScale(this.originalScaleX, this.originalScaleY);
        }
        this.currentlySpawned = true;
    }

    despawn(scene: Phaser.Scene): void {
        if (this.sprite) {
            this.sprite.destroy();
            this.sprite = null;
        }
        this.currentlySpawned = false;
    }

    private setupBridgeListeners(scene: Phaser.Scene): void {
        const handleBoxUpdate = (data: BoxPositionData) => {
            if (this.boxId !== data.boxId) return;
    
            this.tileX = data.x;
            this.tileY = data.y;
            if (this.sprite) {
                this.sprite.setPosition(
                    this.tileX * this.tileSize + this.tileSize / 2,
                    this.tileY * this.tileSize + this.tileSize / 2
                );
            }
        };

        const handleMusicBeat = () => {
            if (!this.currentlySpawned) return;
            this.onBeatPulse();
        }
        
        gameBridge.on(Events.BOX_POSITION_UPDATE, handleBoxUpdate);
        gameBridge.on(Events.MUSIC_BEAT, handleMusicBeat);

        scene.events.on(Phaser.Scenes.Events.SHUTDOWN, () => {
            console.log(`[${this.windowId}] Shutting down scene, removing bridge listener.`);
            gameBridge.off(Events.BOX_POSITION_UPDATE, handleBoxUpdate);
            gameBridge.off(Events.MUSIC_BEAT, handleMusicBeat);
        });
    }

    private updateTargetAnimation(isOnTarget: boolean) {
        if (!this.sprite) return;
        if (isOnTarget && !this.isOnTarget) {
            // Just landed on target, start anim
            this.sprite.setScale(this.originalScaleX * 1.1, this.originalScaleY * 1.1);
            this.sprite.setTexture('box_activated');
            gameBridge.emit(Events.PLAY_SFX, { sfx: 'pop' });
        }
        if (!isOnTarget && this.isOnTarget) {
            // Just left target, reset anim
            if (this.animTween) {
                this.animTween.stop();
                this.animTween = undefined;
            }
            this.sprite.setScale(this.originalScaleX, this.originalScaleY);
            this.sprite.setTexture(this.spriteKey);
        }
        this.isOnTarget = isOnTarget;
    }

    /** Called by MainScene on every beat to pulse the box if it's on a target */
    public onBeatPulse() {
        if (!this.sprite || !this.isOnTarget) return;
        // Animate scale up then back down
        if (this.animTween) this.animTween.stop();
        this.animTween = this.scene!.tweens.add({
            targets: this.sprite,
            scaleX: { from: this.originalScaleX * 1.2, to: this.originalScaleX },
            scaleY: { from: this.originalScaleY * 1.2, to: this.originalScaleY },
            duration: 300,
            ease: 'Quad.easeOut'
        });
    }

    public moveBox(dx: number, dy: number, currentTilemapDataWidth: number, weightManager: WeightManager): void {
        // --- Target check: before move ---
        let prevTarget: any = null;
        if (Box.getBoxTargetAt) {
            prevTarget = Box.getBoxTargetAt(this.tileX, this.tileY, this.windowId);
        }
        const wasOnTarget = prevTarget && prevTarget.boxType === this.boxType;

        let destX = this.tileX + dx;
        let destY = this.tileY + dy;
        let destWindowId = this.windowId;
        if (this.windowId === 'left' && currentTilemapDataWidth && destX >= currentTilemapDataWidth) {
            destX = 0;
            destY += weightManager.leftWeight - weightManager.rightWeight;
            destWindowId = 'right';
        }
        else if (this.windowId === 'right' && currentTilemapDataWidth && destX < 0) {
            destX = currentTilemapDataWidth - 1;
            destY += weightManager.rightWeight - weightManager.leftWeight;
            destWindowId = 'left';
        }

        // --- Target check: after move ---
        let newTarget: any = null;
        if (Box.getBoxTargetAt) {
            newTarget = Box.getBoxTargetAt(destX, destY, destWindowId);
        }
        const isOnTarget = newTarget && newTarget.boxType === this.boxType;

        // Animate if needed
        this.updateTargetAnimation(isOnTarget);

        gameBridge.emit(Events.BOX_POSITION_UPDATE, {
            x: destX,
            y: destY,
            boxId: this.boxId,
            windowId: destWindowId
        });

        // --- Update TargetManager ---
        if (targetManager) {
            if (!wasOnTarget && isOnTarget) {
                targetManager.incrementTargets();
            } else if (wasOnTarget && !isOnTarget) {
                targetManager.decrementTargets();
            }
        }

        if (this.windowId != destWindowId){
            // Remove the box from the level manager and add it to the new window
            this.despawn(this.scene!);
            const previousArray = this.windowId === 'left' ? leftLevels : rightLevels;
            const newArray = destWindowId === 'left' ? leftLevels : rightLevels;
            // Remove this box from the previous LevelDef's elements array
            for (const levelDef of previousArray) {
                const idx = levelDef.elements.indexOf(this);
                if (idx !== -1) {
                    levelDef.elements.splice(idx, 1);
                    break;
                }
            }
            // Add this box to the new LevelDef's elements array (first level for now)
            if (newArray.length > 0) {
                newArray[(this.scene as MainScene).lastLevelIndex].elements.push(this);
            }
            gameBridge.emit(Events.BOX_RESPAWN, {
                x: destX,
                y: destY,
                boxId: this.boxId,
                windowId: destWindowId
            });
            if (destWindowId === 'left'){
                weightManager.leftWeight += this.weight;
                weightManager.rightWeight -= this.weight;
            }
            else {
                weightManager.rightWeight += this.weight;
                weightManager.leftWeight -= this.weight;
            }
        }
    }

    public moveBoxToPosition(destX: number, destY: number, destWindowId: WindowID): void {
        console.log("test");
        // --- Target check: before move ---
        let prevTarget: any = null;
        if (Box.getBoxTargetAt) {
            prevTarget = Box.getBoxTargetAt(this.tileX, this.tileY, this.windowId);
        }
        const wasOnTarget = prevTarget && prevTarget.boxType === this.boxType;

        // --- Target check: after move ---
        let newTarget: any = null;
        if (Box.getBoxTargetAt) {
            newTarget = Box.getBoxTargetAt(destX, destY, destWindowId);
        }
        const isOnTarget = newTarget && newTarget.boxType === this.boxType;

        // Animate if needed
        this.updateTargetAnimation(isOnTarget);

        gameBridge.emit(Events.BOX_POSITION_UPDATE, {
            x: destX,
            y: destY,
            boxId: this.boxId,
            windowId: destWindowId
        });

        // --- Update TargetManager ---
        if (targetManager) {
            if (!wasOnTarget && isOnTarget) {
                targetManager.incrementTargets();
            } else if (wasOnTarget && !isOnTarget) {
                targetManager.decrementTargets();
            }
        }
        
        if (this.windowId != destWindowId){
            // Remove the box from the level manager and add it to the new window
            this.despawn(this.scene!);
            const previousArray = this.windowId === 'left' ? leftLevels : rightLevels;
            const newArray = destWindowId === 'left' ? leftLevels : rightLevels;
            // Remove this box from the previous LevelDef's elements array
            for (const levelDef of previousArray) {
                const idx = levelDef.elements.indexOf(this);
                if (idx !== -1) {
                    levelDef.elements.splice(idx, 1);
                    break;
                }
            }
            // Add this box to the new LevelDef's elements array
            
            if (newArray.length > 0) {
                console.log(`Adding box to new level: ${newArray[(this.scene as MainScene).lastLevelIndex].elements.length}`);
                newArray[(this.scene as MainScene).lastLevelIndex].elements.push(this);
            }
            gameBridge.emit(Events.BOX_RESPAWN, {
                x: destX,
                y: destY,
                boxId: this.boxId,
                windowId: destWindowId
            });
            if (destWindowId === 'left'){
                weightManager.leftWeight += this.weight;
                weightManager.rightWeight -= this.weight;
            }
            else {
                weightManager.rightWeight += this.weight;
                weightManager.leftWeight -= this.weight;
            }
        }
    }
}
