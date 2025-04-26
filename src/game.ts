export const WINDOW_WIDTH = 490;
export const WINDOW_HEIGHT = 630;

import Phaser from 'phaser';
import MainScene from './scenes/MainScene';
import { WindowID } from './GameBridge';

const BACKGROUND_COLOR = '#000033'; // Dark blue

if ((window as any).__PHASER_GAMES__) {
    (window as any).__PHASER_GAMES__.forEach((game: Phaser.Game) => game.destroy(true));
}
(window as any).__PHASER_GAMES__ = [];

// Configuration for the Left Game Instance
const configLeft: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: WINDOW_WIDTH,
    height: WINDOW_HEIGHT,
    parent: 'game-container-left',
    physics: { default: 'arcade' },
    scene: [MainScene],
    backgroundColor: BACKGROUND_COLOR,
    pixelArt: true,

    callbacks: {
        preBoot: (game) => {
            game.registry.set('initData', { windowId: 'left' as WindowID });
        }
    }
};

// Configuration for the Right Game Instance
const configRight: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: WINDOW_WIDTH,
    height: WINDOW_HEIGHT,
    parent: 'game-container-right',     
    physics: { default: 'arcade' },
    scene: [MainScene],
    backgroundColor: BACKGROUND_COLOR,
    pixelArt: true,
    callbacks: {
        preBoot: (game) => {
            game.registry.set('initData', { windowId: 'right' as WindowID });
        }
    }
};


// Create the two game instances
const gameLeft = new Phaser.Game(configLeft);
const gameRight = new Phaser.Game(configRight);
(window as any).__PHASER_GAMES__.push(gameLeft, gameRight);
