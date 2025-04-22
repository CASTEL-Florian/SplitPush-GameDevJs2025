// MainScene.ts
import Phaser from 'phaser';
import { Events, WindowID } from '../GameBridge'
import { Player } from '../entities/Player';
import { levelManager } from '../levels/LevelManager';
import { weightManager } from '../WeightManager';
import { Box } from '../entities/Box';
import { BoxPositionData } from '../GameBridge';
import { gameBridge } from '../GameBridge';

export default class MainScene extends Phaser.Scene {
    /**
     * Returns all Box instances in the current level.
     */
    public getAllBoxes(windowId: WindowID): import("../entities/Box").Box[] {
        const levelArr = windowId === 'left' ? levelManager.leftLevels : levelManager.rightLevels;
        const level = levelArr[this.lastLevelIndex];
        if (!level) return [];
        // Only return elements that are Box
        return level.elements.filter(e => e.constructor.name === 'Box') as import("../entities/Box").Box[];
    }

    public getAllTargets(windowId: WindowID): import("../entities/BoxTarget").BoxTarget[] {
        const levelArr = windowId === 'left' ? levelManager.leftLevels : levelManager.rightLevels;
        const level = levelArr[this.lastLevelIndex];
        if (!level) return [];
        // Only return elements that are BoxTarget
        return level.elements.filter(e => e.constructor.name === 'BoxTarget') as import("../entities/BoxTarget").BoxTarget[];
    }

    /**
     * Returns the Box at the given tile, or undefined if none exists.
     */
    public getBoxAt(tileX: number, tileY: number, windowId: WindowID): import("../entities/Box").Box | undefined {
        return this.getAllBoxes(windowId).find(box => box.tileX === tileX && box.tileY === tileY);
    }
    
    public getBoxTargetAt(tileX: number, tileY: number, windowId: WindowID): import("../entities/BoxTarget").BoxTarget | undefined {
        return this.getAllTargets(windowId).find(target => target.tileX === tileX && target.tileY === tileY);
    }
    
    private windowId!: WindowID; // 'left' or 'right' - set during init
    private player!: Player;
    private lastLevelIndex: number = 0;
    private mainMusic?: Phaser.Sound.BaseSound; // Reference to looping music
    private beatInterval: number = 1 / (95 / 60);
    private isLastBeatOdd: boolean = false;
    private lastBeat: number = 0;
    private onBeatCallback?: () => void;

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
        this.load.image('player', 'assets/playerFront.png');
        this.load.image('lightOrb', 'assets/lightOrb.png');
        this.load.image('darkOrb', 'assets/darkOrb.png');
        this.load.image('lightTeleporter', 'assets/lightTeleporter.png');
        this.load.image('darkTeleporter', 'assets/darkTeleporter.png');
        this.load.image('tiles', 'assets/tiles.png');
        this.load.image('box', 'assets/box.png');
        this.load.image('box_target', 'assets/box_target.png');
        if (this.windowId === 'left') {
            this.load.audio('mainMusic', 'assets/Pixel-Balloons_v2.mp3');
        }
    }

    create(): void {
        // Setup game elements (player and physics bounds)
        this.setupGame();

        // Play looping music if windowId is 'left'
        if (this.windowId === 'left') {
            if (!this.mainMusic) {
                this.mainMusic = this.sound.add('mainMusic', { loop: true, volume: 0.5 });
                this.mainMusic.play();
            } else if (!this.mainMusic.isPlaying) {
                this.mainMusic.play();
            }
            this.lastBeat = 0;
            this.onBeatCallback = () => {
                //console.log('Beat!');
            };
        }

        // Optional: Add background color for visual distinction
        this.cameras.main.setBackgroundColor(this.windowId === 'left' ? '#92C5C6' : '#FBBD82');
        this.add.text(10, 10, `Window: ${this.windowId}`, { color: '#000000', fontSize: '16px' });
        console.log(`[${this.windowId}] Scene Created`);
    }

    update(time: number, delta: number): void {
        if (this.player) {
            this.player.update(delta);
        }
        // Beat tracking
        if (this.windowId === 'left' && this.mainMusic && this.mainMusic.isPlaying) {
            const currentTime = (this.mainMusic as Phaser.Sound.HTML5AudioSound).seek;
            if (currentTime - this.lastBeat >= this.beatInterval) {
                this.lastBeat += this.beatInterval;
                this.isLastBeatOdd = !this.isLastBeatOdd;
                if (this.onBeatCallback && this.isLastBeatOdd) this.onBeatCallback();
            }
            // Handle music restart or stop
            if (currentTime < this.lastBeat) {
                this.lastBeat = 0;
            }
        }
    }

    // --- Setup Methods ---

    private setupGame(): void {
        this.physics.world.setBounds(0, 0, this.cameras.main.width, this.cameras.main.height);
        this.player = new Player(this, this.windowId);

        // Set up the callback to update the window position when weights change
        if (this.windowId === 'left'){
            weightManager.onWeightChangeLeft = (wm) => {
                // Move the actual HTML container (not the camera)
                console.log(`[${this.windowId}] Updating window position`);
                const containerId = this.windowId === 'left' ? 'game-container-left' : 'game-container-right';
                const container = document.getElementById(containerId);
                if (container) {
                    // Calculate the new Y position
                    const y = wm.getInitialY() + (this.windowId === 'left' ? 1 : -1) * wm.getDeltaPixels();
                    container.style.transform = `translateY(${y}px)`;
                }
            };
        }
        if (this.windowId === 'right'){
            weightManager.onWeightChangeRight = (wm) => {
                // Move the actual HTML container (not the camera)
                console.log(`[${this.windowId}] Updating window position`);
                const containerId = this.windowId === 'left' ? 'game-container-left' : 'game-container-right';
                const container = document.getElementById(containerId);
                if (container) {
                    // Calculate the new Y position
                    const y = wm.getInitialY() + (this.windowId === 'left' ? 1 : -1) * wm.getDeltaPixels();
                    container.style.transform = `translateY(${y}px)`;
                }
            };
        }
        // Set initial container position
        {
            const containerId = this.windowId === 'left' ? 'game-container-left' : 'game-container-right';
            const container = document.getElementById(containerId);
            if (container) {
                container.style.transform = `translateY(${weightManager.getInitialY()}px)`;
            }
        }
        weightManager.leftWeight = 1;
        weightManager.rightWeight = 1;

        // Create LevelManager with all levels and load the first level
        this.lastLevelIndex = 0;
        levelManager.spawn(this.lastLevelIndex, this, this.windowId);
        this.setupBridgeListeners(this);
        Box.setGetBoxTargetAt((x, y, windowId) => this.getBoxTargetAt(x, y, windowId));
    }

    private setupBridgeListeners(scene: Phaser.Scene): void {
            const handleBoxUpdate = (data: BoxPositionData) => {
                if (data.windowId != this.windowId) {
                    console.log(`[${this.windowId}] Box respawned in other window, ignoring.`);
                    return;
                }
                console.log(`[${this.windowId}] Box respawned at ${data.x}, ${data.y}`);
                const box = this.getAllBoxes(this.windowId).find(b => b.boxId === data.boxId);
                box?.spawn(scene, this.windowId);

            };
            gameBridge.on(Events.BOX_RESPAWN, handleBoxUpdate);
            scene.events.on(Phaser.Scenes.Events.SHUTDOWN, () => {
                console.log(`[${this.windowId}] Shutting down scene, removing bridge listener.`);
                gameBridge.off(Events.BOX_RESPAWN, handleBoxUpdate);
            });
        }

    public isTileEmptyOrInvalid(tileX: number, tileY: number, windowId: WindowID): boolean {
        if (!levelManager) return true;
        // Get the current level for the given window
        const levelArr = windowId === 'left' ? levelManager.leftLevels : levelManager.rightLevels;
        const level = levelArr[this.lastLevelIndex];

        if (!level || !level.tileset || !level.tilemapData) {
            return true;
        }
        const tilemapData = level.tilemapData;
        // Check bounds
        
        if (tileY < 0 || tileY >= tilemapData.mapHeightInTiles || tileX < 0 || tileX >= tilemapData.mapWidthInTiles) return false;
        // 0 means empty in most tilemaps
        const tileValue = tilemapData.mapData[tileY][tileX];
        return tileValue === -1;
    }

    public currentTilemapDataWidth(): number | undefined {
        if (!levelManager) return undefined;
        // Get the current level for the given window
        const levelArr = this.windowId === 'left' ? levelManager.leftLevels : levelManager.rightLevels;
        const level = levelArr[this.lastLevelIndex];
        if (!level || !level.tileset || !level.tilemapData) return undefined;
        return level.tilemapData.mapWidthInTiles;
    }
}