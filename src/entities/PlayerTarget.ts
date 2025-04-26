import { WindowID } from "../GameBridge";
import { LevelElement } from "../levels/LevelElement";
import { getTileSize } from "../levels/LevelManager";
import { targetManager } from "./TargetManager";
import { gameBridge, Events } from "../GameBridge";

export class PlayerTarget extends LevelElement {
    tileX: number;
    tileY: number;
    tileSize: number;
    sprite: Phaser.GameObjects.Sprite | null = null;
    spawned: boolean = false;
    scene: Phaser.Scene | null = null;
    spriteKey: string;
    private targetListener: ((current: number, total: number) => void) | null = null;
    private pulseOnBeat: boolean = false;
    private beatListener: (() => void) | null = null;
    private originalScaleX: number = 1;
    private originalScaleY: number = 1;

    constructor(tileX: number, tileY: number,  spriteKey: string = "player_target") {
        super();
        this.tileX = tileX;
        this.tileY = tileY;
        this.tileSize = 0;
        this.spriteKey = spriteKey;
    }

    spawn(scene: Phaser.Scene, windowId: WindowID): void {
        this.tileSize = getTileSize();  
        if (this.sprite) return; // Already spawned
        const x = this.tileX * this.tileSize + this.tileSize / 2;
        const y = this.tileY * this.tileSize + this.tileSize / 2;
        this.sprite = scene.add.sprite(x, y, this.spriteKey).setDisplaySize(this.tileSize, this.tileSize);
        this.sprite.setDepth(-1000);
        this.sprite.setOrigin(0.5, 0.5);
        this.spawned = true;
        this.scene = scene;
        this.originalScaleX = this.sprite.scaleX;
        this.originalScaleY = this.sprite.scaleY;

        // Listen for target count changes
        this.targetListener = (current, total) => {
            if (!this.sprite) return;
            if (current === total) {
                this.sprite.setTint(0xffffff); // white
                this.enablePulseOnBeat();
            } else {
                this.sprite.setTint(0x888888); // grey
                this.disablePulseOnBeat();
            }
        };
        targetManager.onTargetCountChanged(this.targetListener);

        // Set initial tint and pulse state
        if (this.sprite) {
            if (targetManager.getCurrentTargets() === targetManager.getTotalTargets()) {
                this.sprite.setTint(0xffffff);
                this.enablePulseOnBeat();
            } else {
                this.sprite.setTint(0x888888);
                this.disablePulseOnBeat();
            }
        }
    }

    private enablePulseOnBeat() {
        if (this.pulseOnBeat) return;
        this.pulseOnBeat = true;
        if (!this.beatListener && this.sprite) {
            this.beatListener = () => {
                if (this.sprite) {
                    this.sprite.scene.tweens.add({
                        targets: this.sprite,
                        scaleX: { from: this.originalScaleX * 1.2, to: this.originalScaleX },
                        scaleY: { from: this.originalScaleY * 1.2, to: this.originalScaleY },
                        duration: 300,
                        ease: 'Quad.easeOut'
                    });
                }
            };
            gameBridge.on(Events.MUSIC_BEAT, this.beatListener);
        }
    }

    private disablePulseOnBeat() {
        if (!this.pulseOnBeat) return;
        this.pulseOnBeat = false;
        if (this.beatListener) {
            gameBridge.off(Events.MUSIC_BEAT, this.beatListener);
            this.beatListener = null;
        }
        if (this.sprite) {
            this.sprite.setScale(this.originalScaleX, this.originalScaleY);
        }
    }

    despawn(scene: Phaser.Scene): void {
        if (this.targetListener) {
            targetManager.offTargetCountChanged(this.targetListener);
            this.targetListener = null;
        }
        this.disablePulseOnBeat();
        if (this.sprite) {
            this.sprite.destroy();
            this.sprite = null;
        }
    }
}
