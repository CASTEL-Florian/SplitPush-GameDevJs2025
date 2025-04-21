import { LevelElement } from "./LevelElement";
import { WindowID } from "../GameBridge";
import Phaser from "phaser";
import { getTileSize } from "../levels/LevelManager";

export class Box extends LevelElement {
    sprite: Phaser.GameObjects.Sprite | null = null;
    tileX: number;
    tileY: number;
    weight: number;
    spriteKey: string;
    tileSize: number;


    constructor(tileX: number, tileY: number, weight: number, spriteKey: string = "box") {
        super();
        this.tileX = tileX;
        this.tileY = tileY;
        this.weight = weight;
        this.spriteKey = spriteKey;
        this.tileSize = 0;
    }
    
    spawn(scene: Phaser.Scene, windowId: WindowID): void {
        this.tileSize = getTileSize();  
        if (this.sprite) return; // Already spawned
        const x = this.tileX * this.tileSize + this.tileSize / 2;
        const y = this.tileY * this.tileSize + this.tileSize / 2;
        this.sprite = scene.add.sprite(x, y, this.spriteKey).setDisplaySize(this.tileSize, this.tileSize);
        this.sprite.setOrigin(0.5, 0.5);
        this.sprite.setData('box', this);
    }

    despawn(scene: Phaser.Scene): void {
        if (this.sprite) {
            this.sprite.destroy();
            this.sprite = null;
        }
    }
}
