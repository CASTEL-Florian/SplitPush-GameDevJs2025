// MainScene.ts
import Phaser from 'phaser';
import { Events, WindowID } from '../GameBridge'
import { Player } from '../entities/Player';
import { levelManager } from '../levels/LevelManager';
import { weightManager } from '../WeightManager';
import { Box } from '../entities/Box';
import { BoxPositionData } from '../GameBridge';
import { gameBridge } from '../GameBridge';
import { GridTransitionPipeline } from '../Pipelines/GridTransitionPipeline';
import { WINDOW_HEIGHT, WINDOW_WIDTH } from '../game';
import { MusicManager } from '../MusicManager';
import { undoManager } from '../undo/UndoManager';
import { BoxTarget } from '../entities/BoxTarget';
import { PlayerTarget } from '../entities/PlayerTarget';
import { ScanlinePipeline } from '../Pipelines/ScanLinePipeline';

export default class MainScene extends Phaser.Scene {
    /**
     * Returns all Box instances in the current level.
     */
    public getAllBoxes(windowId: WindowID): import("../entities/Box").Box[] {
        const levelArr = windowId === 'left' ? levelManager.leftLevels : levelManager.rightLevels;
        const level = levelArr[this.lastLevelIndex];
        if (!level) return [];
        // Only return elements that are Box
        return level.elements.filter(e => e instanceof Box) as import("../entities/Box").Box[];
    }

    public getAllTargets(windowId: WindowID): import("../entities/BoxTarget").BoxTarget[] {
        const levelArr = windowId === 'left' ? levelManager.leftLevels : levelManager.rightLevels;
        const level = levelArr[this.lastLevelIndex];
        if (!level) return [];
        // Only return elements that are BoxTarget
        return level.elements.filter(e => e instanceof BoxTarget) as import("../entities/BoxTarget").BoxTarget[];
    }

    public getAllPlayerTargets(windowId: WindowID): import("../entities/PlayerTarget.ts").PlayerTarget[] {
        const levelArr = windowId === 'left' ? levelManager.leftLevels : levelManager.rightLevels;
        const level = levelArr[this.lastLevelIndex];
        if (!level) return [];
        // Only return elements that are PlayerTarget
        console.log(level.elements);
        return level.elements.filter(e => e instanceof PlayerTarget) as import("../entities/PlayerTarget.ts").PlayerTarget[];
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

    public getPlayerTargetAt(tileX: number, tileY: number, windowId: WindowID): import("../entities/PlayerTarget.ts").PlayerTarget | undefined {
        return this.getAllPlayerTargets(windowId).find(target => target.tileX === tileX && target.tileY === tileY);
    }

    
    private windowId!: WindowID; // 'left' or 'right' - set during init
    private player!: Player;
    public lastLevelIndex: number = 0;
    private musicManager?: MusicManager;
    public isWindowMoving: boolean = false;
    private gridTransitionSprite?: Phaser.GameObjects.Sprite;
    private scanLineSprite?: Phaser.GameObjects.Sprite;
    public isTransitioning: boolean = false;

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
        this.load.image('player', 'assets/player.png');
        this.load.image('lightOrb', 'assets/lightOrb.png');
        this.load.image('darkOrb', 'assets/darkOrb.png');
        this.load.image('lightTeleporter', 'assets/lightTeleporter.png');
        this.load.image('darkTeleporter', 'assets/darkTeleporter.png');
        this.load.image('tiles', 'assets/tiles3.png');
        this.load.image('box', 'assets/box.png');
        this.load.image('box_target', 'assets/box_target.png');
        this.load.image('player_target', 'assets/player_target.png');
        this.load.image('eyes', 'assets/eyes.png');
        this.load.image('eyes_right', 'assets/eyes_right.png');
        this.load.image('eyes_up', 'assets/eyes_up.png');
        this.load.image('eyes_down', 'assets/eyes_down.png');
        this.load.image('box_activated', 'assets/box_activated.png');
        if (this.windowId === 'left') {
            this.musicManager = new MusicManager(this, 'mainMusic', 117.91);
            this.musicManager.preload();
        }
    }

    create(): void {
        // Register the pipeline if not already present
        if (this.game.renderer instanceof Phaser.Renderer.WebGL.WebGLRenderer && !this.game.renderer.pipelines.has('GridTransitionPipeline')) {
            this.game.renderer.pipelines.add('GridTransitionPipeline', new GridTransitionPipeline(this.game));
        }
        if (this.game.renderer instanceof Phaser.Renderer.WebGL.WebGLRenderer && !this.game.renderer.pipelines.has('ScanlinePipeline')) {
            this.game.renderer.pipelines.add('ScanlinePipeline', new ScanlinePipeline(this.game));
        }
        // Add a fullscreen sprite (using a 1x1 white texture scaled up)
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        // Create a 1x1 white texture if not already loaded
        if (!this.textures.exists('white1x1')) {
            const rt = this.textures.createCanvas('white1x1', 1, 1);
            rt!.context.fillStyle = '#000000';
            rt!.context.fillRect(0, 0, 1, 1);
            rt!.refresh();
        }
        this.gridTransitionSprite = this.add.sprite(0, 0, 'white1x1')
            .setOrigin(0, 0)
            .setDisplaySize(width, height)
            .setDepth(1000); // ensure it's above everything
        this.gridTransitionSprite.setPipeline('GridTransitionPipeline');

        this.scanLineSprite = this.add.sprite(0, 0, 'white1x1')
            .setOrigin(0, 0)
            .setDisplaySize(width, height)
            .setDepth(1000);
        this.scanLineSprite.setPipeline('ScanlinePipeline');

        // Setup game elements (player and physics bounds)
        this.setupGame();

        // Play looping music if windowId is 'left'
        if (this.windowId === 'left' && this.musicManager) {
            this.musicManager.create(() => {
                gameBridge.emit(Events.MUSIC_BEAT, null);
            });
        }

        // Optional: Add background color for visual distinction
        this.cameras.main.setBackgroundColor(this.windowId === 'left' ? '#92C5C6' : '#FBBD82');
        console.log(`[${this.windowId}] Scene Created`);
    }

    update(time: number, delta: number): void {
        if (this.player) {
            this.player.update(delta);
        }
        if (this.windowId === 'left' && this.musicManager) {
            this.musicManager.update();
        }
    }

    // --- Setup Methods ---

    private setupGame(): void {
        this.physics.world.setBounds(0, 0, this.cameras.main.width, this.cameras.main.height);
        this.player = new Player(this, this.windowId);

        // --- Smooth window movement state ---
        // Store animation frame id and state per window
        const windowAnimKey = this.windowId === 'left' ? '_windowMoveAnimLeft' : '_windowMoveAnimRight';
        (window as any)[windowAnimKey] = (window as any)[windowAnimKey] || { frame: null, cancel: false };

        // Helper to animate window movement
        const animateWindowMove = (container: HTMLElement, fromY: number, toY: number, duration: number = 400) => {
            const animState = (window as any)[windowAnimKey];
            animState.cancel = true; // cancel any previous animation
            if (animState.frame) cancelAnimationFrame(animState.frame);
            animState.cancel = false;
            this.isWindowMoving = true;
            const start = performance.now();
            const ease = (t: number) => this.scaleEaseFunction(t);
            const step = (now: number) => {
                if (animState.cancel) {
                    this.isWindowMoving = false;
                    return;
                }
                const elapsed = now - start;
                const t = Math.min(1, elapsed / duration);
                const eased = ease(t);
                const y = fromY + (toY - fromY) * eased;
                container.style.transform = `translateY(${y}px)`;
                if (t < 1) {
                    animState.frame = requestAnimationFrame(step);
                } else {
                    animState.frame = null;
                    this.isWindowMoving = false;
                }
            };
            animState.frame = requestAnimationFrame(step);
        };

        // Set up the callback to update the window position when weights change
        if (this.windowId === 'left'){
            weightManager.onWeightChangeLeft = (wm) => {
                const containerId = this.windowId === 'left' ? 'game-container-left' : 'game-container-right';
                const container = document.getElementById(containerId);
                if (container) {
                    const prevY = parseFloat(container.style.transform.replace(/[^-\d.]/g, '')) || wm.getInitialY();
                    const y = wm.getInitialY() + (this.windowId === 'left' ? 1 : -1) * wm.getDeltaPixels();
                    animateWindowMove(container, prevY, y);
                }
            };
        }
        if (this.windowId === 'right'){
            weightManager.onWeightChangeRight = (wm) => {
                const containerId = this.windowId === 'left' ? 'game-container-left' : 'game-container-right';
                const container = document.getElementById(containerId);
                if (container) {
                    const prevY = parseFloat(container.style.transform.replace(/[^-\d.]/g, '')) || wm.getInitialY();
                    const y = wm.getInitialY() + (this.windowId === 'left' ? 1 : -1) * wm.getDeltaPixels();
                    animateWindowMove(container, prevY, y);
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

        // Create LevelManager with all levels and load the first level
        this.lastLevelIndex = 0;
        levelManager.spawn(this.lastLevelIndex, this, this.windowId);
        this.setupBridgeListeners(this);
        Box.setGetBoxTargetAt((x, y, windowId) => this.getBoxTargetAt(x, y, windowId));
    }

    private scaleEaseFunction(t: number): number {
        return t * t * (3 - 2 * t);
    }

    private setupBridgeListeners(scene: Phaser.Scene): void {
        const handleBoxUpdate = (data: BoxPositionData) => {
            if (data.windowId != this.windowId) {
                console.log(`[${this.windowId}] Box respawned in other window, ignoring.`);
                return;
            }
            console.log(`[${this.windowId}] Box respawned at ${data.x}, ${data.y}`);
            const box = this.getAllBoxes(this.windowId).find(b => b.boxId === data.boxId);
            if (!box) {
                console.error(`[${this.windowId}] Box with ID ${data.boxId} not found in current level.`);
                return;
            }
            box?.spawn(scene, this.windowId);

        };
        gameBridge.on(Events.BOX_RESPAWN, handleBoxUpdate);

        const handleWin = (data: any) => {
            this.transitionToNextLevel();
            console.log(`[${this.windowId}] Transitioning to next level.`);
        };
        gameBridge.on(Events.GAME_WON, handleWin);

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

    public currentTilemapDataWidth(): number {
        if (!levelManager) return -1;
        // Get the current level for the given window
        const levelArr = this.windowId === 'left' ? levelManager.leftLevels : levelManager.rightLevels;
        const level = levelArr[this.lastLevelIndex];
        if (!level || !level.tileset || !level.tilemapData) return -1;
        return level.tilemapData.mapWidthInTiles;
    }

    /**
     * Transitions to the next level using the gridTransitionSprite.
     * Animates progress from 0 to 1, loads the next level, then animates from 1 to 0.
     */
    public transitionToNextLevel(): void {
        if (!this.gridTransitionSprite) return;
        const pipeline = this.gridTransitionSprite.pipeline as GridTransitionPipeline;
        if (!pipeline) return;

        this.isTransitioning = true;
        this.musicManager?.playTransition();
        const duration = 1000; // ms for each transition
        let startTime: number | null = null;

        const gridTransitionSprite = this.gridTransitionSprite;

        // Animate progress from 0 to 1
        const animateForward = (now: number) => {
            gridTransitionSprite.setRotation(0);
            gridTransitionSprite.setPosition(0, 0);
            if (startTime === null) startTime = now;
            const elapsed = now - startTime;
            const t = Math.min(1, elapsed / duration);
            pipeline.progress = t;
            if (t < 1) {
                requestAnimationFrame(animateForward);
            } else {
                // After forward transition, load next level and play reverse
                this.musicManager?.playTransition2();
                this.loadNextLevel();
                startTime = null;
                requestAnimationFrame(animateReverse);
            }
        };

        // Animate progress from 1 to 0
        const animateReverse = (now: number) => {
            gridTransitionSprite.setRotation(Math.PI);
            gridTransitionSprite.setPosition(WINDOW_WIDTH, WINDOW_HEIGHT);
            if (startTime === null) startTime = now;
            const elapsed = now - startTime;
            const t = Math.min(1, elapsed / duration);
            pipeline.progress = 1 - t;
            if (t < 1) {
                requestAnimationFrame(animateReverse);
            } else {
                pipeline.progress = 0;
                this.isTransitioning = false;
            }
        };

        requestAnimationFrame(animateForward);
    }

    /**
     * Loads the next level and respawns entities.
     */
    private loadNextLevel(): void {
        levelManager.despawn(this.lastLevelIndex, this, this.windowId);
        this.lastLevelIndex++;
        levelManager.spawn(this.lastLevelIndex, this, this.windowId);
        weightManager.leftWeight = 0;
        weightManager.rightWeight = 0;
        undoManager.clear();
    }
}