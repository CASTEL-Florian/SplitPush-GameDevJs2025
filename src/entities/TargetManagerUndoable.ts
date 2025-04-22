import { Undoable } from '../undo/Undoable';
import { TargetManager } from './TargetManager';

export class TargetManagerUndoable implements Undoable {
    private targetManager: TargetManager;
    private prevCurrentTargets: number;
    private prevTotalTargets: number;

    constructor(targetManager: TargetManager) {
        this.targetManager = targetManager;
        this.prevCurrentTargets = targetManager.getCurrentTargets();
        this.prevTotalTargets = targetManager.getTotalTargets();
    }

    restoreState() {
        this.targetManager.setCurrentTargets(this.prevCurrentTargets);
        this.targetManager.setTotalTargets(this.prevTotalTargets);
    }

    undo(): void {
        this.restoreState();
    }
}
