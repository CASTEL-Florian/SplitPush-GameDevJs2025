import { LevelElement } from './LevelElement';

export class Level {
    elements: LevelElement[];

    constructor(elements: LevelElement[] = []) {
        this.elements = elements;
    }

    addElement(element: LevelElement) {
        this.elements.push(element);
    }

    removeElement(element: LevelElement) {
        const idx = this.elements.indexOf(element);
        if (idx !== -1) this.elements.splice(idx, 1);
    }

    /**
     * Spawns all elements in this level into the scene.
     */
    spawn(scene: Phaser.Scene): void {
        for (const element of this.elements) {
            element.spawn(scene);
        }
    }

    /**
     * Despawns all elements in this level from the scene.
     */
    despawn(scene: Phaser.Scene): void {
        for (const element of this.elements) {
            element.despawn(scene);
        }
    }
}
