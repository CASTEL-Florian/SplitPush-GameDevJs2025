import Phaser from 'phaser';
import { Events, PlayerPositionData, WindowID, gameBridge } from '../GameBridge';

const PLAYER_MAX_SPEED = 200;
const PLAYER_ACCELERATION = 800;
const PLAYER_DECELERATION = 200;

export class Player {
    public sprite: Phaser.Physics.Arcade.Sprite;
    public cursors: Phaser.Types.Input.Keyboard.CursorKeys;
    private wasdKeys: { [key: string]: Phaser.Input.Keyboard.Key };
    private isAutoMoving: boolean = false;
    private autoMoveDirection: Phaser.Math.Vector2 = new Phaser.Math.Vector2(1, 0);
    private rotationSpeed: number = Math.PI * 2;
    private windowId: WindowID;
    private scene: Phaser.Scene;
    private gameBridge = gameBridge;

    constructor(scene: Phaser.Scene, windowId: WindowID) {
        this.scene = scene;
        this.windowId = windowId;
        // Create player sprite and enable physics
        const startX = scene.cameras.main.width / 2 * (windowId === 'left' ? 1 : -1);
        const startY = scene.cameras.main.height / 2;
        this.sprite = scene.physics.add.sprite(startX, startY, 'player').setDisplaySize(32, 32);
        this.sprite.setCollideWorldBounds(false);
        // Input Handling
        this.cursors = scene.input!.keyboard!.createCursorKeys();
        this.wasdKeys = scene.input!.keyboard!.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            upAlt: Phaser.Input.Keyboard.KeyCodes.Z, // AZERTY
            left: Phaser.Input.Keyboard.KeyCodes.A,
            leftAlt: Phaser.Input.Keyboard.KeyCodes.Q, // AZERTY
            down: Phaser.Input.Keyboard.KeyCodes.S,
            right: Phaser.Input.Keyboard.KeyCodes.D
        }) as { [key: string]: Phaser.Input.Keyboard.Key };
        // Space bar toggles auto-move
        const spaceKey = scene.input!.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        spaceKey.on('down', () => {
            this.isAutoMoving = !this.isAutoMoving;
            if (this.isAutoMoving) {
                const body = this.sprite.body as Phaser.Physics.Arcade.Body;
                const vel = new Phaser.Math.Vector2(body.velocity.x, body.velocity.y);
                if (vel.lengthSq() > 0.01) {
                    this.autoMoveDirection = vel.normalize();
                }
            }
        });
    }

    public getSprite() {
        return this.sprite;
    }

    public update(delta: number) {
        const body = this.sprite.body as Phaser.Physics.Arcade.Body;
        if (this.isAutoMoving) {
            // Auto-move logic
            let inputDir = new Phaser.Math.Vector2(0, 0);
            if (
                this.cursors.left.isDown ||
                (this.wasdKeys.left && this.wasdKeys.left.isDown) ||
                (this.wasdKeys.leftAlt && this.wasdKeys.leftAlt.isDown)
            ) {
                inputDir.x = -1;
            } else if (
                this.cursors.right.isDown ||
                (this.wasdKeys.right && this.wasdKeys.right.isDown)
            ) {
                inputDir.x = 1;
            }
            if (
                this.cursors.up.isDown ||
                (this.wasdKeys.up && this.wasdKeys.up.isDown) ||
                (this.wasdKeys.upAlt && this.wasdKeys.upAlt.isDown)
            ) {
                inputDir.y = -1;
            } else if (
                this.cursors.down.isDown ||
                (this.wasdKeys.down && this.wasdKeys.down.isDown)
            ) {
                inputDir.y = 1;
            }
            if (inputDir.lengthSq() > 0) {
                inputDir.normalize();
                const currentAngle = Phaser.Math.Angle.Normalize(this.autoMoveDirection.angle());
                const targetAngle = Phaser.Math.Angle.Normalize(inputDir.angle());
                let deltaAngle = Phaser.Math.Angle.Wrap(targetAngle - currentAngle);
                const maxStep = this.rotationSpeed * (delta / 1000);
                if (Math.abs(deltaAngle) < maxStep) {
                    this.autoMoveDirection = inputDir.clone();
                } else {
                    const newAngle = currentAngle + Math.sign(deltaAngle) * maxStep;
                    this.autoMoveDirection.setToPolar(newAngle, 1);
                }
            }
            body.setVelocity(
                this.autoMoveDirection.x * PLAYER_MAX_SPEED,
                this.autoMoveDirection.y * PLAYER_MAX_SPEED
            );
        } else {
            // Normal input mode
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
            if (targetVelX !== 0 && targetVelY !== 0) {
                const norm = Math.sqrt(2) / 2;
                targetVelX *= norm;
                targetVelY *= norm;
            }
            let velX = body.velocity.x;
            let velY = body.velocity.y;
            if (targetVelX !== 0) {
                velX += targetVelX * PLAYER_ACCELERATION * (delta / 1000);
                if (Math.abs(velX) > PLAYER_MAX_SPEED) {
                    velX = PLAYER_MAX_SPEED * Math.sign(velX);
                }
            } else {
                if (velX > 0) {
                    velX -= PLAYER_DECELERATION * (delta / 1000);
                    if (velX < 0) velX = 0;
                } else if (velX < 0) {
                    velX += PLAYER_DECELERATION * (delta / 1000);
                    if (velX > 0) velX = 0;
                }
            }
            if (targetVelY !== 0) {
                velY += targetVelY * PLAYER_ACCELERATION * (delta / 1000);
                if (Math.abs(velY) > PLAYER_MAX_SPEED) {
                    velY = PLAYER_MAX_SPEED * Math.sign(velY);
                }
            } else {
                if (velY > 0) {
                    velY -= PLAYER_DECELERATION * (delta / 1000);
                    if (velY < 0) velY = 0;
                } else if (velY < 0) {
                    velY += PLAYER_DECELERATION * (delta / 1000);
                    if (velY > 0) velY = 0;
                }
            }
            body.setVelocity(velX, velY);
        }
        // Emit position update if velocity changed
        const previousVelX = (body as any)._prevVelocityX ?? 0;
        const previousVelY = (body as any)._prevVelocityY ?? 0;
        const currentVel = body.velocity;
        const moved = currentVel?.x !== 0 || currentVel?.y !== 0;
        const stopped = !moved && (previousVelX !== 0 || previousVelY !== 0);
        const xoffset = this.scene.cameras.main.width * (this.windowId === 'left' ? -1 : 1);
        if (moved || stopped) {
            const positionData: PlayerPositionData = {
                x: this.sprite.x + xoffset,
                y: this.sprite.y,
                windowId: this.windowId
            };
            this.gameBridge.emit(Events.PLAYER_POSITION_UPDATE, positionData);
        }
        (body as any)._prevVelocityX = currentVel?.x ?? 0;
        (body as any)._prevVelocityY = currentVel?.y ?? 0;
    }
}
