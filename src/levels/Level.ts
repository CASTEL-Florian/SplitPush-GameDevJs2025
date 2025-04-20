import { LevelElement } from './LevelElement';
import { WindowID } from '../GameBridge';
import { WINDOW_WIDTH} from '../game';

export interface TilemapData {
    tileWidth: number;
    tileHeight: number;
    mapWidthInTiles: number;
    mapHeightInTiles: number;
    mapData: number[][];
}

export class Level {
    elements: LevelElement[];
    tilemapData?: TilemapData;
    tilemapLayer?: Phaser.Tilemaps.TilemapLayer;
    tilemap?: Phaser.Tilemaps.Tilemap;
    tileset?: Phaser.Tilemaps.Tileset;

    constructor(elements: LevelElement[] = [], tilemapData?: TilemapData) {
        this.elements = elements;
        this.tilemapData = tilemapData;
    }

    addElement(element: LevelElement) {
        this.elements.push(element);
    }

    removeElement(element: LevelElement) {
        const idx = this.elements.indexOf(element);
        if (idx !== -1) this.elements.splice(idx, 1);
    }

    /**
     * Spawns all elements in this level into the scene.
     */
    spawn(scene: Phaser.Scene, windowId: WindowID, tilemapWidth: number): void {
        // Create tilemap if data is present
        if (this.tilemapData) {
            // Phaser expects a 2D array of tile indices
            this.tilemap = scene.make.tilemap({
                data: this.tilemapData.mapData,
                tileWidth: this.tilemapData.tileWidth,
                tileHeight: this.tilemapData.tileHeight,
            });
            const tileset = this.tilemap.addTilesetImage('tiles'); // Assumes 'tiles' key is loaded in preload
            if (tileset) {
                this.tileset = tileset;
                this.tilemapLayer = this.tilemap.createLayer(0, tileset, 0, 0) || undefined;
                const scale = (WINDOW_WIDTH / tilemapWidth) / this.tilemapData.tileWidth;
                this.tilemapLayer?.setScale(scale);
            } else {
                this.tileset = undefined;
                this.tilemapLayer = undefined;
            }
        }
        for (const element of this.elements) {
            element.spawn(scene, windowId);
        }
    }

    /**
     * Despawns all elements in this level from the scene.
     */
    despawn(scene: Phaser.Scene): void {
        // Remove tilemap layer if present
        if (this.tilemapLayer) {
            this.tilemapLayer.destroy();
            this.tilemapLayer = undefined;
        }
        for (const element of this.elements) {
            element.despawn(scene);
        }
    }
}
