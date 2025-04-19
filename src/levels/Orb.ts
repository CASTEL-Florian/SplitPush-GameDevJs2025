import { LevelElement } from "./LevelElement";

export class Orb extends LevelElement {
    spriteKey: string;
    x: number;
    y: number;
    constructor(x: number, y: number) {
        super();
        this.spriteKey = "orb";
        this.x = x;
        this.y = y;
    }
}
