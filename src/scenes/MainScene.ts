// MainScene.ts
import Phaser from 'phaser';
import { gameBridge, Events, WindowID, PlayerPositionData } from '../GameBridge'; // Make sure path is correct

const PLAYER_MAX_SPEED = 200; // Max speed in pixels per second
const PLAYER_ACCELERATION = 800; // Pixels per second squared
const PLAYER_DECELERATION = 1000; // Pixels per second squared

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

        // Get delta time in seconds
        const delta = this.game.loop.delta / 1000;
        const body = this.player.body as Phaser.Physics.Arcade.Body;

        let targetVelX = 0;
        let targetVelY = 0;

        // Input direction
        if (this.cursors.left.isDown) {
            targetVelX = -1;
        } else if (this.cursors.right.isDown) {
            targetVelX = 1;
        }
        if (this.cursors.up.isDown) {
            targetVelY = -1;
        } else if (this.cursors.down.isDown) {
            targetVelY = 1;
        }

        // Normalize direction for diagonal movement
        if (targetVelX !== 0 && targetVelY !== 0) {
            const norm = Math.sqrt(2) / 2;
            targetVelX *= norm;
            targetVelY *= norm;
        }

        // Current velocity
        let velX = body.velocity.x;
        let velY = body.velocity.y;

        // Acceleration/deceleration logic
        if (targetVelX !== 0) {
            // Accelerate toward max speed in input direction
            velX += targetVelX * PLAYER_ACCELERATION * delta;
            // Clamp to max speed
            if (Math.abs(velX) > PLAYER_MAX_SPEED) {
                velX = PLAYER_MAX_SPEED * Math.sign(velX);
            }
        } else {
            // Decelerate X
            if (velX > 0) {
                velX -= PLAYER_DECELERATION * delta;
                if (velX < 0) velX = 0;
            } else if (velX < 0) {
                velX += PLAYER_DECELERATION * delta;
                if (velX > 0) velX = 0;
            }
        }
        if (targetVelY !== 0) {
            velY += targetVelY * PLAYER_ACCELERATION * delta;
            if (Math.abs(velY) > PLAYER_MAX_SPEED) {
                velY = PLAYER_MAX_SPEED * Math.sign(velY);
            }
        } else {
            if (velY > 0) {
                velY -= PLAYER_DECELERATION * delta;
                if (velY < 0) velY = 0;
            } else if (velY < 0) {
                velY += PLAYER_DECELERATION * delta;
                if (velY > 0) velY = 0;
            }
        }

        body.setVelocity(velX, velY);

        // Emit position update if velocity changed (start moving, stop moving, change direction)
        const previousVelX = (body as any)._prevVelocityX ?? 0;
        const previousVelY = (body as any)._prevVelocityY ?? 0;
        const currentVel = body.velocity;
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
        (body as any)._prevVelocityX = currentVel?.x ?? 0;
        (body as any)._prevVelocityY = currentVel?.y ?? 0;
    }
}