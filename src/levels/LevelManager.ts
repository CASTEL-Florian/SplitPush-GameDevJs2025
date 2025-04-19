import { Level } from './Level';
import { WindowID } from '../GameBridge';

export class LevelManager {
    leftLevels: Level[];
    rightLevels: Level[];

    constructor(leftLevels: Level[] = [], rightLevels: Level[] = []) {
        this.leftLevels = leftLevels;
        this.rightLevels = rightLevels;
    }

    /**
     * Spawns the left and right levels at the given index.
     */
    spawn(index: number, scene: Phaser.Scene, windowId: WindowID): void {
        if (windowId === 'left') {
            this.leftLevels[index].spawn(scene);
        }
        if (windowId === 'right') {
            this.rightLevels[index].spawn(scene);
        }
    }

    /**
     * Despawns the left and right levels at the given index.
     */
    despawn(index: number, scene: Phaser.Scene, windowId: WindowID): void {
        if (windowId === 'left') {
            this.leftLevels[index].despawn(scene);
        }
        if (windowId === 'right') {
            this.rightLevels[index].despawn(scene);
        }
    }
}

