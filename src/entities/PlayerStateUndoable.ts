import { Undoable } from '../undo/Undoable';
import { WindowID } from '../GameBridge';
import { gameBridge } from '../GameBridge';
import { Events } from '../GameBridge';
import { EyesDirection } from './Player';

export class PlayerStateUndoable implements Undoable {
    private tileX: number;
    private tileY: number;
    private windowId: WindowID;
    private eyesDirection: EyesDirection;

    constructor(tileX: number, tileY: number, windowId: WindowID, eyesDirection: EyesDirection = 'none') {
        this.tileX = tileX;
        this.tileY = tileY;
        this.windowId = windowId;
        this.eyesDirection = eyesDirection;
    }

    undo(): void {
        gameBridge.emit(Events.PLAYER_POSITION_UPDATE, {
            x: this.tileX,
            y: this.tileY,
            windowId: this.windowId,
            eyesDirection: this.eyesDirection
        });
    }
}
