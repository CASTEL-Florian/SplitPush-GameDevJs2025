import { Orb } from "./Orb";
import { Teleporter } from "./Teleporter";


import { LevelDef } from "./LevelManager";

// Create a level with one orb in each window
export const leftLevel1: LevelDef = {
    elements: [
        new Orb(200, 300),
        new Teleporter(100, 200)
    ],
    tilemapPath: 'assets/level1.json'
};

export const rightLevel1: LevelDef = {
    elements: [
        new Orb(300, 400),
        new Teleporter(100, 300)
    ],
    tilemapPath: 'assets/level2.json'
};

// You can export more levels here as needed
export const leftLevels: LevelDef[] = [leftLevel1];
export const rightLevels: LevelDef[] = [rightLevel1];
