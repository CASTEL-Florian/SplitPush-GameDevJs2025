import { Level } from './Level';

export class LevelManager {
    leftLevels: Level[];
    rightLevels: Level[];

    constructor(leftLevels: Level[] = [], rightLevels: Level[] = []) {
        this.leftLevels = leftLevels;
        this.rightLevels = rightLevels;
    }

    addLevelToLeft(level: Level) {
        this.leftLevels.push(level);
    }

    addLevelToRight(level: Level) {
        this.rightLevels.push(level);
    }
}
