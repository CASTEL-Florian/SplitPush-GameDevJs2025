import { LevelDef } from "./LevelManager";
import { Box } from "../entities/Box";
import { BoxTarget } from "../entities/BoxTarget";
import { PlayerTarget } from "../entities/PlayerTarget";
import { TextElement } from "../entities/TextElement";
import { PlayerPositionData } from "../GameBridge";


export const leftLevelTest: LevelDef = {
    elements: [
        new Box(5, 6, 0.5, 'left'), // tileX, tileY, weight
        new Box(5, 4, 0.5, 'left'),
        new BoxTarget(5, 7, 'default'),
        new PlayerTarget(5, 5),
    ],
    tilemapPath: 'assets/levelTest.json'
};

// Level 1
export const leftLevel1: LevelDef = {
    elements: [
        new PlayerTarget(4, 2),
    ],
    tilemapPath: 'assets/level1.json'
};

export const rightLevel1: LevelDef = {
    elements: [
        new TextElement('Move with WASD\nor arrow keys', 185, 200, 30, '#995007', true),
    ],
    tilemapPath: 'assets/level1.json'
};

// Level 2
export const leftLevel2: LevelDef = {
    elements: [
        new TextElement('Press U to undo\nyour last move\n\nR to reset', 185, 200, 30, '#20476B', true),
    ],
    tilemapPath: 'assets/level1.json'
};

export const rightLevel2: LevelDef = {
    elements: [
        new Box(2, 6, 0.5, 'right'),
        new PlayerTarget(2, 2),
        new BoxTarget(4, 2, 'default'),
    ],
    tilemapPath: 'assets/level1.json'
};

// Level 3

export const leftLevel3: LevelDef = {
    elements: [
        new BoxTarget(3, 6, 'default'),
        new TextElement('Change side', 270, 100, 32, '#20476B', false),
        new TextElement('BALANCE', 378, 200, 100, '#20476B', true),


    ],
    tilemapPath: 'assets/level3_left.json'
};

export const rightLevel3: LevelDef = {
    elements: [
        new Box(2, 5, 0.5, 'right'),
        new PlayerTarget(4, 6),
        new TextElement('to shift the', 115, 100, 32, '#995007', false),
        new TextElement('BALANCE', 0, 200, 100, '#995007', true),
    ],
    tilemapPath: 'assets/level3_right.json'
};


export const leftLevels: LevelDef[] = [leftLevel1, leftLevel2, leftLevel3];
export const rightLevels: LevelDef[] = [rightLevel1, rightLevel2, rightLevel3];

export const playerStartPositions: PlayerPositionData[] = [
    { windowId: 'left', x: 2, y: 6 },
    { windowId: 'right', x: 4, y: 6 },
    { windowId: 'left', x: 2, y: 3 },
    
];