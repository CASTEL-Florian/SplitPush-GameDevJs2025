import { Undoable } from '../undo/Undoable';
import { WindowID } from '../GameBridge';
import { gameBridge } from '../GameBridge';
import { Events } from '../GameBridge';

export class PlayerStateUndoable implements Undoable {
    private tileX: number;
    private tileY: number;
    private windowId: WindowID;


    constructor(tileX: number, tileY: number, windowId: WindowID) {
        this.tileX = tileX;
        this.tileY = tileY;
        this.windowId = windowId;
    }

    undo(): void {
        gameBridge.emit(Events.PLAYER_POSITION_UPDATE, {
            x: this.tileX,
            y: this.tileY,
            windowId: this.windowId
        });
    }
}
