import { WindowID } from '../GameBridge';

export abstract class LevelElement {
    // Abstract base for game objects to be spawned/removed in the scene
    // Add common properties or methods if needed

    /**
     * Spawn this element in the scene.
     * @param scene The Phaser.Scene to spawn into
     */
    abstract spawn(scene: Phaser.Scene, windowId: WindowID): void;

    /**
     * Despawn this element from the scene.
     * @param scene The Phaser.Scene to despawn from
     */
    abstract despawn(scene: Phaser.Scene): void;
}
