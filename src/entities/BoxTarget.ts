import { WindowID } from "../GameBridge";
import { LevelElement } from "../levels/LevelElement";
import { getTileSize } from "../levels/LevelManager";

// BoxTarget is a target location for a box of a specific type.
export class BoxTarget extends LevelElement {
    tileX: number;
    tileY: number;
    boxType: string;
    tileSize: number;
    sprite: Phaser.GameObjects.Sprite | null = null;
    spawned: boolean = false;
    scene: Phaser.Scene | null = null;
    spriteKey: string;

    constructor(tileX: number, tileY: number, boxType: string,  spriteKey: string = "box_target") {
        super();
        this.tileX = tileX;
        this.tileY = tileY;
        this.tileSize = 0;
        this.boxType = boxType;
        this.spriteKey = spriteKey;
    }

    spawn(scene: Phaser.Scene, windowId: WindowID): void {
        this.tileSize = getTileSize();  
        if (this.sprite) return; // Already spawned
        const x = this.tileX * this.tileSize + this.tileSize / 2;
        const y = this.tileY * this.tileSize + this.tileSize / 2;
        this.sprite = scene.add.sprite(x, y, this.spriteKey).setDisplaySize(this.tileSize, this.tileSize);
        this.sprite.setOrigin(0.5, 0.5);
        this.sprite.setDepth(-1000);
        this.spawned = true;
        this.scene = scene;
    }

    despawn(scene: Phaser.Scene): void {
        if (this.sprite) {
            this.sprite.destroy();
            this.sprite = null;
        }
    }
}
