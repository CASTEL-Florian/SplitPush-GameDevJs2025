import { Level, TilemapData } from './Level';
import { WindowID } from '../GameBridge';
import { WINDOW_WIDTH} from '../game';
import { leftLevels, rightLevels, playerStartPositions } from '../levels/LevelDefinitions';
import { targetManager } from '../entities/TargetManager';
import { gameBridge, Events } from '../GameBridge';

const TILEMAP_WIDTH = 6;

export interface LevelDef {
    elements: any[];
    tilemapPath: string;
}

export function getTileSize(): number {
    return WINDOW_WIDTH / TILEMAP_WIDTH;
}

export class LevelManager {
    leftLevelDefs: LevelDef[];
    rightLevelDefs: LevelDef[];
    leftLevels: (Level | undefined)[];
    rightLevels: (Level | undefined)[];

    constructor(leftLevelDefs: LevelDef[] = [], rightLevelDefs: LevelDef[] = []) {
        this.leftLevelDefs = leftLevelDefs;
        this.rightLevelDefs = rightLevelDefs;
        this.leftLevels = new Array(leftLevelDefs.length).fill(undefined);
        this.rightLevels = new Array(rightLevelDefs.length).fill(undefined);
    }

    /**
     * Spawns the left and right levels at the given index. Loads tilemap JSON if not already loaded.
     */
    async spawn(index: number, scene: Phaser.Scene, windowId: WindowID): Promise<void> {
        if (windowId === 'left') {
            if (!this.leftLevels[index]) {
                const def = this.leftLevelDefs[index];
                const tilemapData = await this.loadTilemapData(def.tilemapPath);
                this.leftLevels[index] = new Level(def.elements, tilemapData);
            }
            this.leftLevels[index]?.spawn(scene, windowId, TILEMAP_WIDTH);


            // Only move player once.
            gameBridge.emit(Events.PLAYER_POSITION_UPDATE, playerStartPositions[index]);
        }
        if (windowId === 'right') {
            if (!this.rightLevels[index]) {
                const def = this.rightLevelDefs[index];
                const tilemapData = await this.loadTilemapData(def.tilemapPath);
                this.rightLevels[index] = new Level(def.elements, tilemapData);
            }
            this.rightLevels[index]?.spawn(scene, windowId, TILEMAP_WIDTH);
        }
        targetManager.loadLevel(index);
    }

    /**
     * Despawns the left and right levels at the given index.
     */
    despawn(index: number, scene: Phaser.Scene, windowId: WindowID): void {
        if (windowId === 'left') {
            this.leftLevels[index]?.despawn(scene);
        }
        if (windowId === 'right') {
            this.rightLevels[index]?.despawn(scene);
        }
    }

    /**
     * Loads the tilemap JSON from the given path and returns the parsed data.
     */
    private async loadTilemapData(path: string): Promise<TilemapData> {
        const response = await fetch(path);
        if (!response.ok) {
            throw new Error(`Failed to load tilemap JSON: ${path}`);
        }
        return await response.json();
    }
}

export const levelManager = new LevelManager(leftLevels, rightLevels);

