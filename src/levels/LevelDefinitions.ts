import { LevelDef } from "./LevelManager";
import { Box } from "../entities/Box";
import { BoxTarget } from "../entities/BoxTarget";
import { PlayerTarget } from "../entities/PlayerTarget";
import { TextElement } from "../entities/TextElement";
import { PlayerPositionData } from "../GameBridge";

export const leftLevel1: LevelDef = {
    elements: [
        new Box(5, 6, 0.5, 'left'), // tileX, tileY, weight
        new Box(5, 4, 0.5, 'left'),
        new BoxTarget(5, 7, 'default'),
        new PlayerTarget(5, 5),
    ],
    tilemapPath: 'assets/level1.json'
};

export const rightLevel1: LevelDef = {
    elements: [
        new Box(3, 7, 0.5, 'right'),
        new Box(3, 10, 0.5, 'right'),
        new BoxTarget(3, 5, 'default'),
        new TextElement('Hello from the right!', 120, 6, 16, '#00ff00', true),
    ],
    tilemapPath: 'assets/level2.json'
};

export const leftLevel2: LevelDef = {
    elements: [
        new Box(0, 0, 0.5, 'left'), // tileX, tileY, weight
        new Box(1, 0, 0.5, 'left'),
        new BoxTarget(5, 7, 'default'),
        new PlayerTarget(5, 5),
    ],
    tilemapPath: 'assets/level2.json'
};

export const rightLevel2: LevelDef = {
    elements: [
        new Box(0, 0, 0.5, 'right'),
        new Box(1, 0, 0.5, 'right'),
        new BoxTarget(3, 5, 'default'),
        new TextElement('Hello from the right!', 120, 6, 16, '#00ff00', true),
    ],
    tilemapPath: 'assets/level1.json'
};

export const leftLevels: LevelDef[] = [leftLevel1, leftLevel2];
export const rightLevels: LevelDef[] = [rightLevel1, rightLevel2];

export const playerStartPositions: PlayerPositionData[] = [
    { windowId: 'left', x: 5, y: 5 },
    { windowId: 'left', x: 2, y: 2 },
];