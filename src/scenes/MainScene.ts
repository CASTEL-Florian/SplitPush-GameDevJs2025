// MainScene.ts
import Phaser from 'phaser';
import { gameBridge, Events, WindowID, PlayerPositionData } from '../GameBridge'; // Make sure path is correct
import { Player } from '../entities/Player';
import { LevelManager } from '../levels/LevelManager';
import { leftLevels, rightLevels } from '../levels/LevelDefinitions';

export default class MainScene extends Phaser.Scene {
    private windowId!: WindowID; // 'left' or 'right' - set during init
    private gameBridge = gameBridge;

    private player!: Player;
    private levelManager!: LevelManager;


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

        // Create LevelManager with all levels and load the first level
        this.levelManager = new LevelManager(leftLevels, rightLevels);
        this.levelManager.spawn(0, this, this.windowId);
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
                // Stop the player if the update indicates no movement from the other side
                // Setting position stops velocity for this frame. If the next update
                // from the other side keeps sending the same position, it remains stopped.
                // If the other side starts moving, new position updates will reflect that.
                this.player.sprite.setVelocity(0, 0); // Explicitly stop velocity when updating from bridge
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

}