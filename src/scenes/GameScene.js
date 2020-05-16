import { Scene } from 'phaser';

import gameScenePreloader from '../utils/gameScenePreloader';
import addRectST from '../utils/rectCreatorST';

import ObstacleHandler from '../ObstacleHandler';
import Player from '../player';
import BonusHandler from '../BonusHandler';
import NotSecretStage from '../NotSecretStage';

const toggleFullscreen = () => {
  const isInFullscreen = document.fullscreenElement;
  return isInFullscreen
    ? document.exitFullscreen()
    : document.documentElement.requestFullscreen();
};

const highscoreHandler = (score, highscore) => (score > highscore && localStorage.setItem('highscore', score));

export default class GameScene extends Scene {
  constructor() {
    super({ key: 'gameScene', active: false });

    this.stages = new Map([
      [3, () => this.stageHandler(8, 2, false, false)],
      [10, () => this.stageHandler(9, 2)],
      [20, () => this.stageHandler(10, 3)],
      [50, () => this.stageHandler(12, 3)],
      [70, () => this.stageHandler(15, 3)],
      ['notsecret', () => this.notSecretStage.sprite.emit('play')],
    ]);
  }

  preload() {
    gameScenePreloader(this);
    this.scene.launch('gameoverScene');
  }

  init() {
    this.physics.pause();
    this.scene.sendToBack();
  }

  create() {
    // setup
    this.targetSpeed = 7;
    this.speed = 2;
    this.score = 0;
    this.progress = 0;
    this.paused = false;
    this.positiveSnd = this.sound.add('positive', { volume: 0.5 });
    this.negativeSnd = this.sound.add('negative', { volume: 0.5 });
    this.gOverSnd = this.sound.add('g-over', { volume: 0.5 });

    const { width, height } = this.game.config;
    const midX = width / 2;
    const prlxBGY = height / 2.8;

    this.spawnPoint = { x: width + 200, y: height / 1.4 };
    this.playerSpawn = { x: width / 5, y: height / 1.4 };

    // backgrounds
    this.bg4 = this.add.tileSprite(midX, prlxBGY, 480, 272, 'fourth').setDisplaySize(width, height);
    this.bg3 = this.add.tileSprite(midX, prlxBGY, 592, 272, 'third').setDisplaySize(width, height);
    this.bg2 = this.add.tileSprite(midX, prlxBGY, 592, 272, 'second').setDisplaySize(width, height);
    this.bg1 = this.add.tileSprite(midX, prlxBGY, 700, 272, 'first').setDisplaySize(width, height);
    this.groundBg = this.add.tileSprite(midX, height - height / 10, 1024, 288, 'newground').setScale(1, 0.5);

    // static bodies
    this.ground = addRectST(this, midX, height / 1.2, width + 3000, 1, null, 0);
    this.scoreCheck = addRectST(this, width / 10, height / 2, 1, height, null, 0);
    this.catcher = addRectST(this, -200, height / 2, 1, height, null, 0);
    this.stompCatcher = addRectST(this, midX, height + 200, width + 3000, 1, null, 0);

    // text content
    this.scoreText = this.add.bitmapText(midX, -50, 'pixfnt', this.score, 56, 1)
      .setOrigin(0.5)
      .setVisible(false);

    // elements
    this.notSecretStage = new NotSecretStage(this);
    this.obstacles = new ObstacleHandler(this);
    this.player = new Player(this, this.playerSpawn.x, this.playerSpawn.y);
    this.bonus = new BonusHandler(this);

    const fsButton = this.add.image(width - 50, 25, 'uifs').setInteractive();
    fsButton.on('pointerup', () => {
      fsButton.disableInteractive();
      toggleFullscreen();
      this.time.delayedCall(500, () => fsButton.setInteractive());
    });

    this.scoreJiggle = this.tweens.add({
      targets: [this.scoreText],
      duration: 400,
      alpha: { from: 0, to: 0.8 },
      y: { from: 85, to: 100 },
      ease: 'Bounce',
      onStart: () => {
        this.scoreText.setY(-75);
        this.scoreText.setAlpha(0);
      },
    });
  }

  setScore(num = 1, toIncrement = true) {
    const newScore = toIncrement ? this.score + num : this.score - num;
    if (newScore >= 0) this.score = newScore;
    this.scoreText.setText(`${this.score}`);
    if (this.score % 10 === 0 && toIncrement) {
      this.positiveSnd.play();
      this.scoreJiggle.restart();
    }
  }

  incProgress() {
    const { stages } = this;
    this.progress += 1;
    this.setScore();
    const nextStage = stages.get(this.progress);
    return nextStage && nextStage();
  }

  stageHandler(speed, amount, toPlay = true, bonusInteractive = true) {
    this.targetSpeed = speed;
    this.obstacles.setObstacles(amount);
    this.obstacles.setPlaying(toPlay);
    this.bonus.setInteractive(bonusInteractive);
  }

  startGame() {
    this.stageHandler(7, 1, false, false);
    this.paused = false;
    this.physics.resume();
    this.scoreText.setVisible(true);
    this.scoreJiggle.restart();
  }

  gameOver() {
    this.paused = true;
    this.obstacles.setPlaying(false);
    this.bonus.setInteractive(false);
    this.player.sprite.anims.pause();
    highscoreHandler(this.score, localStorage.getItem('highscore'));

    this.gOverSnd.play();
    this.player.sprite.setTexture('dead');
    this.player.sprite.setVelocityY(-1000);
    this.scoreText.setVisible(false);

    this.time.delayedCall(200, () => {
      this.physics.pause();
      this.scene.wake('gameoverScene');
    }, null, this);
  }

  resetGame() {
    this.progress = 0;
    this.score = 0;
    this.scoreText.setText(`${this.score}`);
    this.speed = 2;
    this.player.reset();
    this.obstacles.reset();
    this.bonus.reset();
  }

  update() {
    if (this.speed < this.targetSpeed) this.speed += 0.03;

    this.bg3.tilePositionX += 0.3;
    this.bg2.tilePositionX += 0.5;
    this.bg1.tilePositionX += 0.8;
    this.groundBg.tilePositionX += this.speed;

    if (!this.paused) {
      this.player.update();
      this.bonus.update();
      this.obstacles.update();
    }
  }
}