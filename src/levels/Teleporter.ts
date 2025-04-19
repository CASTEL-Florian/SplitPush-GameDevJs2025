import { LevelElement } from "./LevelElement";
import { WindowID } from '../GameBridge';

export class Teleporter extends LevelElement {
    x: number;
    y: number;
    private sprite?: Phaser.GameObjects.Sprite;

    constructor(x: number, y: number) {
        super();
        this.x = x;
        this.y = y;
    }

    spawn(scene: Phaser.Scene, windowId: WindowID): void {
        if (!this.sprite) {
            this.sprite = scene.add.sprite(this.x, this.y, windowId === 'left' ? 'lightTeleporter' : 'darkTeleporter').setDisplaySize(32, 32);
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
