import { Undoable } from '../undo/Undoable';
import { weightManager } from '../WeightManager';

export class WeightUndoable implements Undoable {
    private leftWeight: number;
    private rightWeight: number;

    constructor(leftWeight: number, rightWeight: number) {
        this.leftWeight = leftWeight;
        this.rightWeight = rightWeight;
    }

    undo(): void {
        weightManager.leftWeight = this.leftWeight;
        weightManager.rightWeight = this.rightWeight;
    }
}
