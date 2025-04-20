// MainScene.ts
import Phaser from 'phaser';
import { gameBridge, Events, WindowID, PlayerPositionData } from '../GameBridge'; // Make sure path is correct
import { Player } from '../entities/Player';
import { LevelManager } from '../levels/LevelManager';
import { leftLevels, rightLevels } from '../levels/LevelDefinitions';
import { WeightManager } from '../WeightManager';

export default class MainScene extends Phaser.Scene {
    private windowId!: WindowID; // 'left' or 'right' - set during init
    private gameBridge = gameBridge;
    private player!: Player;
    private levelManager!: LevelManager;
    private weightManager!: WeightManager;
    private lastLevelIndex: number = 0;

    constructor() {
        super({ key: 'MainScene' });
    }

    init(): void {
        const initData = this.game.registry.get('initData');

        if (initData && initData.windowId) {
            this.windowId = initData.windowId;
        } else {
            console.error("!!! Scene init data not found in registry. WindowID is undefined !!!");
            this.windowId = 'undefined';
        }

        console.log(`Initializing Scene for window: ${this.windowId}`);
    }


    preload(): void {
        this.load.image('player', 'assets/arrow.png');
        this.load.image('lightOrb', 'assets/lightOrb.png');
        this.load.image('darkOrb', 'assets/darkOrb.png');
        this.load.image('lightTeleporter', 'assets/lightTeleporter.png');
        this.load.image('darkTeleporter', 'assets/darkTeleporter.png');
        this.load.image('tiles', 'assets/tiles.png');
    }

    create(): void {
        // Setup game elements (player and physics bounds)
        this.setupGame();
        // Setup listeners after player exists
        this.setupBridgeListeners();
        // Optional: Add background color for visual distinction
        this.cameras.main.setBackgroundColor(this.windowId === 'left' ? '#ddddff' : '#ddffdd');
        this.add.text(10, 10, `Window: ${this.windowId}`, { color: '#000000', fontSize: '16px' });
        console.log(`[${this.windowId}] Scene Created`);
    }

    update(time: number, delta: number): void {
        if (this.player) {
            this.player.update(delta);
        }
    }

    // --- Setup Methods ---

    private setupGame(): void {
        this.physics.world.setBounds(0, 0, this.cameras.main.width, this.cameras.main.height);
        this.player = new Player(this, this.windowId);

        // --- WeightManager Integration ---
        this.weightManager = new WeightManager();

        // Set up the callback to update the window position when weights change
        this.weightManager.onWeightChange = (wm) => {
            // Move the actual HTML container (not the camera)
            const containerId = this.windowId === 'left' ? 'game-container-left' : 'game-container-right';
            const container = document.getElementById(containerId);
            if (container) {
                // Calculate the new Y position
                const y = wm.getInitialY() + (this.windowId === 'left' ? 1 : -1) * wm.getDeltaPixels();
                container.style.transform = `translateY(${y}px)`;
            }
        };
        // Set initial container position
        {
            const containerId = this.windowId === 'left' ? 'game-container-left' : 'game-container-right';
            const container = document.getElementById(containerId);
            if (container) {
                container.style.transform = `translateY(${this.weightManager.getInitialY()}px)`;
            }
        }

        // Create LevelManager with all levels and load the first level
        this.levelManager = new LevelManager(leftLevels, rightLevels);
        this.lastLevelIndex = 0;
        this.levelManager.spawn(this.lastLevelIndex, this, this.windowId);
    }

    /**
     * Sets up listeners for events from the GameBridge.
     */
    private setupBridgeListeners(): void {
        const handlePlayerUpdate = (data: PlayerPositionData) => {
            if (data.windowId === this.windowId) {
                return;
            }
            if (this.player) {
                this.player.sprite.setPosition(data.x, data.y);
            }
        };

        this.gameBridge.on(Events.PLAYER_POSITION_UPDATE, handlePlayerUpdate);

        this.events.on(Phaser.Scenes.Events.SHUTDOWN, () => {
            console.log(`[${this.windowId}] Shutting down scene, removing bridge listener.`);
            this.gameBridge.off(Events.PLAYER_POSITION_UPDATE, handlePlayerUpdate);
        });
    }

    // --- Input Handling Method ---
    private handleInput(): void {
        
    }

    /**
     * Returns true if the tile at the given position and windowID is empty, or if the tileset is null, or if no level is loaded.
     * @param tileX Tile X coordinate
     * @param tileY Tile Y coordinate
     * @param windowId 'left' or 'right'
     */
    public isTileEmptyOrInvalid(tileX: number, tileY: number, windowId: WindowID): boolean {
        if (!this.levelManager) return true;
        // Get the current level for the given window
        const levelArr = windowId === 'left' ? this.levelManager.leftLevels : this.levelManager.rightLevels;
        const level = levelArr[this.lastLevelIndex];
        if (!level || !level.tileset || !level.tilemapData) return true;
        const tilemapData = level.tilemapData;
        // Check bounds
        
        if (tileY < 0 || tileY >= tilemapData.mapHeightInTiles || tileX < 0 || tileX >= tilemapData.mapWidthInTiles) return false;
        // 0 means empty in most tilemaps
        const tileValue = tilemapData.mapData[tileY][tileX];
        return tileValue === -1;
    }

}