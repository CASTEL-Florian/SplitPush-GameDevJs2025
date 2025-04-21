import { levelManager } from '../levels/LevelManager';
import { BoxTarget } from './BoxTarget';

export class TargetManager {
    private totalTargets: number;
    private currentTargets: number;

    constructor(totalTargets: number, currentTargets?: number) {
        this.totalTargets = totalTargets;
        this.currentTargets = currentTargets !== undefined ? currentTargets : totalTargets;
    }

    getTotalTargets(): number {
        return this.totalTargets;
    }

    getCurrentTargets(): number {
        return this.currentTargets;
    }

    setCurrentTargets(count: number): void {
        this.currentTargets = count;
    }

    setTotalTargets(count: number): void {
        this.totalTargets = count;
    }

    incrementTargets(amount: number = 1): void {
        this.currentTargets += amount;
    }

    decrementTargets(amount: number = 1): void {
        this.currentTargets -= amount;
    }

    loadLevel(index: number): void {
        const leftLevel = levelManager.leftLevels[index];
        const rightLevel = levelManager.rightLevels[index];
        if (!leftLevel || !rightLevel) return;
        let totalTargets = 0;
        // Count BoxTarget elements in both levels
        for (const element of leftLevel.elements) {
            if (element instanceof BoxTarget) totalTargets++;
        }
        for (const element of rightLevel.elements) {
            if (element instanceof BoxTarget) totalTargets++;
        }
        this.setTotalTargets(totalTargets);
        this.setCurrentTargets(0);
    }
}
