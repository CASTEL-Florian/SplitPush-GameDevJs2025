// MainScene.ts
import Phaser from 'phaser';
import { gameBridge, Events, WindowID, PlayerPositionData } from '../GameBridge'; // Make sure path is correct

const PLAYER_MAX_SPEED = 200; // Max speed in pixels per second
const PLAYER_ACCELERATION = 800; // Pixels per second squared
const PLAYER_DECELERATION = 200; // Pixels per second squared

export default class MainScene extends Phaser.Scene {
    private windowId!: WindowID; // 'left' or 'right' - set during init
    private gameBridge = gameBridge;

    private player!: Phaser.Physics.Arcade.Sprite;
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private wasdKeys!: { [key: string]: Phaser.Input.Keyboard.Key };

    private isUpdatingFromBridge = false;

    // --- AUTO-MOVE STATE ---
    private isAutoMoving: boolean = false;
    private autoMoveDirection: Phaser.Math.Vector2 = new Phaser.Math.Vector2(1, 0); // Default right
    private rotationSpeed: number = Math.PI * 2; // radians per second (360°/s)


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

        // Space bar toggles auto-move
        const spaceKey = this.input!.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        spaceKey.on('down', () => {
            this.isAutoMoving = !this.isAutoMoving;
            if (this.isAutoMoving) {
                // Set initial auto-move direction to last input or keep current
                const body = this.player.body as Phaser.Physics.Arcade.Body;
                const vel = new Phaser.Math.Vector2(body.velocity.x, body.velocity.y);
                if (vel.lengthSq() > 0.01) {
                    this.autoMoveDirection = vel.normalize();
                }
            }
        });

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
        // Support WASD (QWERTY), ZQSD (AZERTY), and arrow keys
        this.wasdKeys = this.input!.keyboard!.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            upAlt: Phaser.Input.Keyboard.KeyCodes.Z, // AZERTY
            left: Phaser.Input.Keyboard.KeyCodes.A,
            leftAlt: Phaser.Input.Keyboard.KeyCodes.Q, // AZERTY
            down: Phaser.Input.Keyboard.KeyCodes.S,
            right: Phaser.Input.Keyboard.KeyCodes.D
        }) as { [key: string]: Phaser.Input.Keyboard.Key };
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

        const delta = this.game.loop.delta / 1000;
        const body = this.player.body as Phaser.Physics.Arcade.Body;

        // --- AUTO-MOVE MODE ---
        if (this.isAutoMoving) {
            // Check for directional input
            let inputX = 0, inputY = 0;
            if (
                this.cursors.left.isDown ||
                (this.wasdKeys.left && this.wasdKeys.left.isDown) ||
                (this.wasdKeys.leftAlt && this.wasdKeys.leftAlt.isDown)
            ) {
                inputX = -1;
            } else if (
                this.cursors.right.isDown ||
                (this.wasdKeys.right && this.wasdKeys.right.isDown)
            ) {
                inputX = 1;
            }
            if (
                this.cursors.up.isDown ||
                (this.wasdKeys.up && this.wasdKeys.up.isDown) ||
                (this.wasdKeys.upAlt && this.wasdKeys.upAlt.isDown)
            ) {
                inputY = -1;
            } else if (
                this.cursors.down.isDown ||
                (this.wasdKeys.down && this.wasdKeys.down.isDown)
            ) {
                inputY = 1;
            }
            // If any input, steer autoMoveDirection
            if (inputX !== 0 || inputY !== 0) {
                const inputVec = new Phaser.Math.Vector2(inputX, inputY).normalize();
                if (inputVec.lengthSq() > 0) {
                    // Calculate angle between current and target
                    const currentAngle = Phaser.Math.Angle.Between(0, 0, this.autoMoveDirection.x, this.autoMoveDirection.y);
                    const targetAngle = Phaser.Math.Angle.Between(0, 0, inputVec.x, inputVec.y);
                    let deltaAngle = Phaser.Math.Angle.Wrap(targetAngle - currentAngle);
                    const maxStep = this.rotationSpeed * delta; // radians
                    if (Math.abs(deltaAngle) <= maxStep) {
                        // Snap to target
                        this.autoMoveDirection.copy(inputVec);
                    } else {
                        // Rotate towards input
                        const newAngle = currentAngle + Math.sign(deltaAngle) * maxStep;
                        this.autoMoveDirection.setToPolar(newAngle, 1);
                    }
                }
            }
            // Move at max speed in autoMoveDirection
            body.setVelocity(
                this.autoMoveDirection.x * PLAYER_MAX_SPEED,
                this.autoMoveDirection.y * PLAYER_MAX_SPEED
            );
        } else {
            // --- NORMAL INPUT MODE ---
            let targetVelX = 0;
            let targetVelY = 0;
            if (
                this.cursors.left.isDown ||
                (this.wasdKeys.left && this.wasdKeys.left.isDown) ||
                (this.wasdKeys.leftAlt && this.wasdKeys.leftAlt.isDown)
            ) {
                targetVelX = -1;
            } else if (
                this.cursors.right.isDown ||
                (this.wasdKeys.right && this.wasdKeys.right.isDown)
            ) {
                targetVelX = 1;
            }
            if (
                this.cursors.up.isDown ||
                (this.wasdKeys.up && this.wasdKeys.up.isDown) ||
                (this.wasdKeys.upAlt && this.wasdKeys.upAlt.isDown)
            ) {
                targetVelY = -1;
            } else if (
                this.cursors.down.isDown ||
                (this.wasdKeys.down && this.wasdKeys.down.isDown)
            ) {
                targetVelY = 1;
            }
            // Normalize diagonal
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
                velX += targetVelX * PLAYER_ACCELERATION * delta;
                if (Math.abs(velX) > PLAYER_MAX_SPEED) {
                    velX = PLAYER_MAX_SPEED * Math.sign(velX);
                }
            } else {
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
        }

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