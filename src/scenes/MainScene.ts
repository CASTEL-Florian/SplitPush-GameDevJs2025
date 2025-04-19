// MainScene.ts
import Phaser from 'phaser';
import { gameBridge, Events, WindowID, PlayerPositionData } from '../GameBridge'; // Make sure path is correct

const PLAYER_SPEED = 200; // Pixels per second

export default class MainScene extends Phaser.Scene {
    private windowId!: WindowID; // 'left' or 'right' - set during init
    private gameBridge = gameBridge;

    private player!: Phaser.Physics.Arcade.Sprite;
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;

    private isUpdatingFromBridge = false;

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
    }

    create(): void {
        // Setup game elements (player and physics bounds)
        this.setupGame(); // Now sets up physics bounds too

        // Setup listeners after player exists
        this.setupBridgeListeners();

         // Optional: Add background color for visual distinction
        this.cameras.main.setBackgroundColor(this.windowId === 'left' ? '#ddddff' : '#ddffdd');
        this.add.text(10, 10, `Window: ${this.windowId}`, { color: '#000000', fontSize: '16px' });
        console.log(`[${this.windowId}] Scene Created`);
    }

    update(time: number, delta: number): void {
       if (this.player) {
             this.handleInput();
       }
    }

    // --- Setup Methods ---

    private setupGame(): void {
        this.physics.world.setBounds(0, 0, this.cameras.main.width, this.cameras.main.height);


        // Create player sprite and enable physics
        const startX = this.cameras.main.width / 2 * (this.windowId === 'left' ? 1 : -1);
        const startY = this.cameras.main.height / 2;
        this.player = this.physics.add.sprite(startX, startY, 'player').setDisplaySize(32, 32);

        // Enable collision with the world bounds we just set
        this.player.setCollideWorldBounds(false);

        // Input Handling
        this.cursors = this.input!.keyboard!.createCursorKeys();
        console.log(`[${this.windowId}] Player created at (${startX}, ${startY})`);
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
                this.isUpdatingFromBridge = true;
                this.player.setPosition(data.x, data.y);
                // Stop the player if the update indicates no movement from the other side
                // Setting position stops velocity for this frame. If the next update
                // from the other side keeps sending the same position, it remains stopped.
                // If the other side starts moving, new position updates will reflect that.
                this.player.setVelocity(0, 0); // Explicitly stop velocity when updating from bridge

                 this.time.delayedCall(10, () => {
                     this.isUpdatingFromBridge = false;
                 });
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
        if (!this.cursors || !this.player || this.isUpdatingFromBridge) {
            return;
        }

        let velocityX = 0;
        let velocityY = 0;
        const previousVelX = (this.player.body as any)._prevVelocityX ?? 0;
        const previousVelY = (this.player.body as any)._prevVelocityY ?? 0;

        // Horizontal movement
        if (this.cursors.left.isDown) {
            velocityX = -PLAYER_SPEED;
        } else if (this.cursors.right.isDown) {
            velocityX = PLAYER_SPEED;
        }

        // Vertical movement
        if (this.cursors.up.isDown) {
            velocityY = -PLAYER_SPEED;
        } else if (this.cursors.down.isDown) {
            velocityY = PLAYER_SPEED;
        }

        // Apply velocity
        this.player.setVelocity(velocityX, velocityY);

        // Normalize diagonal movement
        if (velocityX !== 0 && velocityY !== 0) {
            this.player.body!.velocity.normalize().scale(PLAYER_SPEED);
        }

        // Emit position update if velocity changed (start moving, stop moving, change direction)
        // or if position changed significantly (e.g., pushed by something else - less relevant here)
         const currentVel = this.player.body!.velocity;
         // Check if velocity *vector* has changed significantly OR if we stopped
         const moved = currentVel?.x !== 0 || currentVel?.y !== 0;
         const stopped = !moved && (previousVelX !== 0 || previousVelY !== 0);

        const xoffset = this.cameras.main.width * (this.windowId === 'left' ? -1 : 1);
        

         if (moved || stopped) {
             const positionData: PlayerPositionData = {
                x: this.player.x + xoffset,
                y: this.player.y,
                windowId: this.windowId
             };
             this.gameBridge.emit(Events.PLAYER_POSITION_UPDATE, positionData);
         }

         // Store current velocity for next frame comparison
         (this.player.body as any)._prevVelocityX = currentVel?.x ?? 0;
         (this.player.body as any)._prevVelocityY = currentVel?.y ?? 0;
    }
}