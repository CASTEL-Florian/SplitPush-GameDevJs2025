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
    tilemapPath: 'assets/level1_left.json'
};

export const rightLevel1: LevelDef = {
    elements: [
        new TextElement('Move with WASD\nor arrow keys', 185, 200, 30, '#995007', true),
    ],
    tilemapPath: 'assets/level1_right.json'
};

// Level 2
export const leftLevel2: LevelDef = {
    elements: [
        new TextElement('Press U to undo\nyour last move\n\nR to reset', 185, 200, 30, '#20476B', true),
    ],
    tilemapPath: 'assets/level1_left.json'
};

export const rightLevel2: LevelDef = {
    elements: [
        new Box(2, 6, 0.5, 'right'),
        new PlayerTarget(2, 2),
        new BoxTarget(4, 2, 'default'),
    ],
    tilemapPath: 'assets/level1_right.json'
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

// Level 4
export const leftLevel4: LevelDef = {
    elements: [
        new BoxTarget(3, 4, 'default'),
        new Box(5, 6, 0.5, 'left'),
        new Box(5, 3, 0.5, 'left'),

    ],
    tilemapPath: 'assets/level4_left.json'
};

export const rightLevel4: LevelDef = {
    elements: [
        new BoxTarget(3, 4, 'default'),
        new PlayerTarget(4, 4),
    ],
    tilemapPath: 'assets/level4_right.json'
};

// Level 5
export const leftLevel5: LevelDef = {
    elements: [
        new BoxTarget(3, 4, 'default'),
        new Box(6, 6, 0.5, 'left'),
    ],
    tilemapPath: 'assets/level5_left.json'
};

export const rightLevel5: LevelDef = {
    elements: [
        new BoxTarget(4, 4, 'default'),
        new Box(0, 4, 0.5, 'right'),
        new PlayerTarget(0, 3),
    ],
    tilemapPath: 'assets/level5_right.json'
};

// Level 6
export const leftLevel6: LevelDef = {
    elements: [
        new BoxTarget(5, 6, 'default'),
        new Box(2, 4, 0.5, 'left'),
    ],
    tilemapPath: 'assets/level6_left.json'
};

export const rightLevel6: LevelDef = {
    elements: [
        new BoxTarget(1, 2, 'default'),
        new Box(4, 4, 0.5, 'right'),
        new PlayerTarget(4, 6),
    ],
    tilemapPath: 'assets/level6_right.json'
};

// Level 7
export const leftLevel7: LevelDef = {
    elements: [
        new PlayerTarget(2, 3),
    ],
    tilemapPath: 'assets/level7_left.json'
};

export const rightLevel7: LevelDef = {
    elements: [
        new BoxTarget(0, 7, 'default'),
        new Box(0, 3, 0.5, 'right'),
    ],
    tilemapPath: 'assets/level7_right.json'
};

// Level 8
export const leftLevel8: LevelDef = {
    elements: [
        new BoxTarget(2, 7, 'default'),
        new BoxTarget(3, 7, 'default'),
        new BoxTarget(4, 7, 'default'),
        new Box(2, 2, 0.5, 'left'),
        new Box(2, 3, 0.5, 'left'),
        new Box(3, 2, 0.5, 'left'),
        new Box(3, 3, 0.5, 'left'),
    ],
    tilemapPath: 'assets/level8_left.json'
};

export const rightLevel8: LevelDef = {
    elements: [
        new BoxTarget(0, 1, 'default'),
        new PlayerTarget(3, 4),
    ],
    tilemapPath: 'assets/level8_right.json'
};

// Level 10
export const leftLevel10: LevelDef = {
    elements: [
        new BoxTarget(2, 3, 'default'),
        new Box(2, 6, 0.5, 'left'),
        new PlayerTarget(5, 3),
    ],
    tilemapPath: 'assets/level10_left.json'
};

export const rightLevel10: LevelDef = {
    elements: [
        new BoxTarget(0, 7, 'default'),
        new BoxTarget(4, 5, 'default'),
        new Box(0, 4, 0.5, 'right'),
        new Box(4, 2, 0.5, 'right'),

    ],
    tilemapPath: 'assets/level10_right.json'
};

export const leftLevels: LevelDef[] = [leftLevel1, leftLevel2, leftLevel3, leftLevel4, leftLevel5, leftLevel6, leftLevel7, leftLevel8, leftLevel10];
export const rightLevels: LevelDef[] = [rightLevel1, rightLevel2, rightLevel3, rightLevel4, rightLevel5, rightLevel6, rightLevel7, rightLevel8, rightLevel10];

// export const leftLevels: LevelDef[] = [leftLevel8, leftLevel10];
// export const rightLevels: LevelDef[] = [rightLevel8, rightLevel10];

export const playerStartPositions: PlayerPositionData[] = [
    { windowId: 'left', x: 2, y: 6 }, // Level 1
    { windowId: 'right', x: 4, y: 6 }, // Level 2
    { windowId: 'left', x: 2, y: 3 }, // Level 3
    { windowId: 'left', x: 2, y: 4 }, // Level 4
    { windowId: 'right', x: 2, y: 4 }, // Level 5
    { windowId: 'left', x: 2, y: 2 }, // Level 6
    { windowId: 'left', x: 5, y: 5 }, // Level 7
    { windowId: 'right', x: 4, y: 3 }, // Level 8
    { windowId: 'right', x: 4, y: 6 }, // Level 10
];