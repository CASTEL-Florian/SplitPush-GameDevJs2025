import { LevelDef } from "./LevelManager";
import { Box } from "./Box";

// Create a level with one orb in each window
export const leftLevel1: LevelDef = {
    elements: [
        new Box(5, 6, 2, 'left'), // tileX, tileY, weight
        new Box(5, 4, 3, 'left')
    ],
    tilemapPath: 'assets/level1.json'
};

export const rightLevel1: LevelDef = {
    elements: [
        new Box(3, 7, 1, 'right'),
        new Box(3, 10, 4, 'right')
    ],
    tilemapPath: 'assets/level2.json'
};

// You can export more levels here as needed
export const leftLevels: LevelDef[] = [leftLevel1];
export const rightLevels: LevelDef[] = [rightLevel1];
