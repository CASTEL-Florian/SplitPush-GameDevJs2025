import { levelManager } from '../levels/LevelManager';
import { BoxTarget } from './BoxTarget';

type TargetCountListener = (current: number, total: number) => void;

export class TargetManager {
    private totalTargets: number;
    private currentTargets: number;
    private listeners: TargetCountListener[] = [];

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
        this.emitTargetCountChanged();
    }

    setTotalTargets(count: number): void {
        this.totalTargets = count;
    }

    incrementTargets(amount: number = 1): void {
        console.log(`Incrementing targets by ${amount}. Current: ${this.currentTargets}`);
        this.currentTargets += amount;
        this.emitTargetCountChanged();
    }

    decrementTargets(amount: number = 1): void {
        console.log(`Decrementing targets by ${amount}. Current: ${this.currentTargets}`);
        this.currentTargets -= amount;
        this.emitTargetCountChanged();
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
        console.log(`Loaded level ${index}. Total targets: ${totalTargets}`);
    }

    onTargetCountChanged(listener: TargetCountListener): void {
        this.listeners.push(listener);
    }

    offTargetCountChanged(listener: TargetCountListener): void {
        this.listeners = this.listeners.filter(l => l !== listener);
    }

    private emitTargetCountChanged(): void {
        for (const listener of this.listeners) {
            listener(this.currentTargets, this.totalTargets);
        }
    }
}

export const targetManager = new TargetManager(0);