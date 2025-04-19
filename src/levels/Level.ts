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
}
