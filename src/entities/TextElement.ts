import { LevelElement } from '../levels/LevelElement';
import { WindowID } from '../GameBridge';

export class TextElement extends LevelElement {
    text: string;
    x: number;
    y: number;
    size: number;
    color: string;
    isBold: boolean;
    sprite: Phaser.GameObjects.Text | null = null;
    scene: Phaser.Scene | null = null;

    constructor(text: string, x: number, y: number, size: number, color: string, isBold: boolean) {
        super();
        this.text = text;
        this.x = x;
        this.y = y;
        this.size = size;
        this.color = color;
        this.isBold = isBold;
    }

    spawn(scene: Phaser.Scene, windowId: WindowID): void {
        if (this.sprite) return;
        this.scene = scene;
        this.sprite = scene.add.text(this.x, this.y, this.text, {
            fontFamily: 'monospace, "Press Start 2P", "VT323", "Courier New", Courier',
            fontSize: `${this.size}px`,
            color: this.color,
            fontStyle: this.isBold ? 'bold' : 'normal',
            resolution: 2,
        });
        this.sprite.setOrigin(0.5, 0.5);
        this.sprite.setPadding(2, 2, 2, 2);
        this.sprite.setStyle({
            align: 'center',
        });
        this.sprite.setDepth(-1000);
        this.sprite.setScrollFactor(0);
    }

    despawn(scene: Phaser.Scene): void {
        if (this.sprite) {
            this.sprite.destroy();
            this.sprite = null;
        }
    }
}
