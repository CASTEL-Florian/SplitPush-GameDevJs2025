import { WindowID } from '../GameBridge';
import { Undoable } from '../undo/Undoable';
import { Box } from './Box';

export class BoxUndoable implements Undoable {
    private tileX: number;
    private tileY: number;
    private windowId: WindowID;
    private box: Box;

    constructor(tileX: number, tileY: number, windowId: WindowID, box: Box) {
        this.tileX = tileX;
        this.tileY = tileY;
        this.windowId = windowId;
        this.box = box;
    }

    undo(): void {
        this.box.moveBoxToPosition(this.tileX, this.tileY, this.windowId);
    }
}
