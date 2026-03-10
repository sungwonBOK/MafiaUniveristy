// ============================================================
// PreloadScene — 에셋 로딩 씬
// GameView가 Phaser 레지스트리에 저장한 데이터를 꺼내
// GameScene으로 전달합니다.
// ============================================================
import Phaser from 'phaser';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PreloadScene' });
  }

  preload(): void {
    this.createLoadingBar();

    // ── 프로토타입: 맵 에셋 없음 ──────────────────────────────
    // 실제 타일맵 추가 시 주석을 해제하고 /public/maps/ 에 파일을 추가하세요.
    // this.load.image('tiles_prototype', '/maps/prototype_tiles.png');
    // this.load.tilemapTiledJSON('map_prototype', '/maps/prototype_map.json');
  }

  create(): void {
    // 레지스트리에서 GameScene 초기화 데이터 꺼내기
    const data = this.registry.get('gameSceneData');
    this.scene.start('GameScene', data);
  }

  private createLoadingBar(): void {
    const { width, height } = this.scale;
    const cx = width / 2;
    const cy = height / 2;

    this.add.rectangle(cx, cy, width, height, 0x0a0a14);

    this.add.text(cx, cy - 60, '🎭 MafiaUniversity', {
      fontSize: '28px',
      fontFamily: 'Noto Sans KR, sans-serif',
      color: '#a78bfa',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(cx, cy - 20, '게임 준비 중...', {
      fontSize: '14px',
      color: '#666688',
    }).setOrigin(0.5);

    this.add.rectangle(cx, cy + 20, 320, 10, 0x1a1a2e).setOrigin(0.5);
    const bar = this.add.rectangle(cx - 160, cy + 20, 0, 10, 0x6366f1).setOrigin(0, 0.5);

    this.load.on('progress', (value: number) => {
      bar.width = 320 * value;
    });
  }
}
