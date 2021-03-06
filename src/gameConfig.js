import Phaser from 'phaser';

import GameScene from './scenes/GameScene';
import MenuScene from './scenes/MenuScene';
import GameoverScene from './scenes/GameoverScene';
import LoadingScene from './scenes/LoadingScene';

export default {
  type: Phaser.WEBGL,
  width: 1024,
  height: 450,
  parent: 'game-container',
  scale: {
    mode: Phaser.Scale.FIT,
    autocenter: Phaser.Scale.CENTER_BOTH,
  },
  input: {
    activePointers: 1,
    touch: {
      target: null,
      capture: false,
    },
  },
  scene: [LoadingScene, MenuScene, GameScene, GameoverScene],
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 1700 },
    },
  },
};
