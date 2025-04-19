import { LevelElement } from "./LevelElement";

export class Teleporter extends LevelElement {
    spriteKey: string;
    x: number;
    y: number;
    private sprite?: Phaser.GameObjects.Sprite;

    constructor(x: number, y: number) {
        super();
        this.spriteKey = "teleporter";
        this.x = x;
        this.y = y;
    }

    spawn(scene: Phaser.Scene): void {
        if (!this.sprite) {
            this.sprite = scene.add.sprite(this.x, this.y, this.spriteKey).setDisplaySize(32, 32);
            // Optionally set up physics or other properties here
        }
    }

    despawn(scene: Phaser.Scene): void {
        if (this.sprite) {
            this.sprite.destroy();
            this.sprite = undefined;
        }
    }
}
