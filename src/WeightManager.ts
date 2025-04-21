import { getTileSize } from './levels/LevelManager';

const maxWeightDiff = 10;

export class WeightManager {
    private _leftWeight: number;
    private _rightWeight: number;

    /**
     * Optional callback to be called whenever the weights change.
     * The callback receives the WeightManager instance as a parameter.
     * Example usage:
     *   weightManager.onWeightChange = (wm) => { ...update window positions... }
     */
    public onWeightChangeLeft?: (wm: WeightManager) => void;
    public onWeightChangeRight?: (wm: WeightManager) => void;

    /**
     * Returns the initial Y position for both windows when weight difference is zero.
     * Use this to center the windows vertically, so they can move up or down by up to half the max difference.
     *   initialY = maxWeightDiff * getTileSize() / 2
     */
    getInitialY(): number {
        return maxWeightDiff * getTileSize() / 2;
    }

    constructor(leftWeight: number = 0, rightWeight: number = 0) {
        this._leftWeight = leftWeight;
        this._rightWeight = rightWeight;
    }

    get leftWeight(): number {
        return this._leftWeight;
    }

    set leftWeight(value: number) {
        this._leftWeight = value;
        if (this.onWeightChangeLeft) this.onWeightChangeLeft(this);
        if (this.onWeightChangeRight) this.onWeightChangeRight(this);
    }

    get rightWeight(): number {
        return this._rightWeight;
    }

    set rightWeight(value: number) {
        this._rightWeight = value;
        if (this.onWeightChangeRight) this.onWeightChangeRight(this);
    }

    getDeltaPixels(): number {
        const diff = this._leftWeight - this._rightWeight;
        return getTileSize() / 2 * Math.min(maxWeightDiff, Math.max(-maxWeightDiff, diff));
    } 
}

export const weightManager = new WeightManager();