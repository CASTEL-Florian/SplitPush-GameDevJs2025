import { Undoable } from './Undoable';

/**
 * UndoManager manages a stack of steps, each containing a list of Undoable actions.
 * For each game step, register Undoables. Undo will undo all Undoables in the last step.
 */
export class UndoManager {
    private steps: Undoable[][] = [];
    private currentStep: Undoable[] = [];

    /**
     * Begin a new step. All subsequently registered Undoables will belong to this new step.
     */
    beginNewStep(): void {
        if (this.currentStep.length > 0) {
            this.steps.push(this.currentStep);
        }
        this.currentStep = [];
    }

    /**
     * Register an Undoable action for the current step.
     */
    register(undoable: Undoable): void {
        this.currentStep.push(undoable);
    }

    /**
     * Undo all Undoables in the last step (in reverse order of registration).
     */
    undo(): void {
        // If currentStep has actions but hasn't been pushed, treat it as the last step
        if (this.currentStep.length > 0 && this.steps.length === 0) {
            while (this.currentStep.length > 0) {
                this.currentStep.pop()!.undo();
            }
            this.currentStep = [];
            return;
        }
        // Otherwise pop last step from stack
        const lastStep = this.steps.pop();
        if (lastStep) {
            for (let i = lastStep.length - 1; i >= 0; i--) {
                lastStep[i].undo();
            }
        }
    }

    /**
     * Clears all steps and the current step.
     */
    clear(): void {
        this.steps = [];
        this.currentStep = [];
    }
}

export const undoManager = new UndoManager();
