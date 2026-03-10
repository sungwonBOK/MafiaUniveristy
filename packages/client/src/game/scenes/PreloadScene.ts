import Phaser from 'phaser';
import { getSchoolMapConfig } from '../maps/SchoolMapRegistry';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PreloadScene' });
  }

  preload(): void {
    this.createLoadingBar();

    const data = this.registry.get('gameSceneData');
    const mapConfig = getSchoolMapConfig(data?.room?.school);

    this.load.image(mapConfig.tilesetKey, `/maps/${mapConfig.key}/tiles.png`);
    this.load.tilemapTiledJSON(mapConfig.tilemapKey, `/maps/${mapConfig.key}/map.json`);
  }

  create(): void {
    const data = this.registry.get('gameSceneData');
    this.scene.start('GameScene', data);
  }

  private createLoadingBar(): void {
    const { width, height } = this.scale;
    const cx = width / 2;
    const cy = height / 2;

    this.add.rectangle(cx, cy, width, height, 0x0a0a14);

    this.add
      .text(cx, cy - 60, 'MafiaUniversity', {
        fontSize: '28px',
        fontFamily: 'Noto Sans KR, sans-serif',
        color: '#a78bfa',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.add
      .text(cx, cy - 20, '게임 준비 중...', {
        fontSize: '14px',
        color: '#666688',
      })
      .setOrigin(0.5);

    this.add.rectangle(cx, cy + 20, 320, 10, 0x1a1a2e).setOrigin(0.5);
    const bar = this.add.rectangle(cx - 160, cy + 20, 0, 10, 0x6366f1).setOrigin(0, 0.5);

    this.load.on('progress', (value: number) => {
      bar.width = 320 * value;
    });
  }
}
