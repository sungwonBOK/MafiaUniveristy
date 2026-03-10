import Phaser from 'phaser';
import type { SchoolMapConfig } from '../SchoolMapRegistry';
import type { ProceduralLayoutContext } from './types';

interface ObstacleOptions {
  alpha?: number;
  label?: string;
}

export function createBaseMap(scene: Phaser.Scene, config: SchoolMapConfig): Phaser.Physics.Arcade.StaticGroup {
  const colliders = scene.physics.add.staticGroup();

  scene.cameras.main.setBackgroundColor('#081018');
  scene.add.rectangle(
    config.worldWidth / 2,
    config.worldHeight / 2,
    config.worldWidth,
    config.worldHeight,
    0x081018,
  );

  drawGrid(scene, config);
  drawHeader(scene, config);
  drawRoads(scene, config);

  scene.physics.world.setBounds(0, 0, config.worldWidth, config.worldHeight);

  return colliders;
}

export function createLayoutContext(
  scene: Phaser.Scene,
  config: SchoolMapConfig,
): ProceduralLayoutContext {
  return {
    scene,
    config,
    colliders: createBaseMap(scene, config),
  };
}

export function addObstacle(
  context: ProceduralLayoutContext,
  x: number,
  y: number,
  width: number,
  height: number,
  color: number,
  options: ObstacleOptions = {},
): void {
  const rect = context.scene.add.rectangle(x, y, width, height, color, options.alpha ?? 0.92);
  rect.setStrokeStyle(2, 0xffffff, 0.12);
  context.scene.physics.add.existing(rect, true);
  context.colliders.add(rect);

  if (options.label) {
    context.scene.add
      .text(x, y, options.label, {
        fontSize: '14px',
        fontFamily: 'Noto Sans KR, sans-serif',
        color: '#f7fafc',
        align: 'center',
      })
      .setOrigin(0.5);
  }
}

export function addPlaza(
  context: ProceduralLayoutContext,
  x: number,
  y: number,
  width: number,
  height: number,
): void {
  const rect = context.scene.add.rectangle(x, y, width, height, context.config.tint, 0.16);
  rect.setStrokeStyle(2, context.config.tint, 0.4);
}

function drawGrid(scene: Phaser.Scene, config: SchoolMapConfig): void {
  const graphics = scene.add.graphics();
  graphics.lineStyle(1, config.tint, 0.09);

  for (let x = 0; x <= config.worldWidth; x += 80) {
    graphics.lineBetween(x, 0, x, config.worldHeight);
  }

  for (let y = 0; y <= config.worldHeight; y += 80) {
    graphics.lineBetween(0, y, config.worldWidth, y);
  }
}

function drawHeader(scene: Phaser.Scene, config: SchoolMapConfig): void {
  scene.add
    .text(36, 28, `${config.displayName} 프로토타입 맵`, {
      fontSize: '22px',
      fontFamily: 'Noto Sans KR, sans-serif',
      color: config.themeColor,
      fontStyle: 'bold',
    })
    .setScrollFactor(0);

  scene.add
    .text(36, 58, '학교별 구조 차이를 먼저 검증하는 절차적 캠퍼스입니다.', {
      fontSize: '13px',
      fontFamily: 'Noto Sans KR, sans-serif',
      color: '#9fb3c8',
    })
    .setScrollFactor(0);
}

function drawRoads(scene: Phaser.Scene, config: SchoolMapConfig): void {
  const roads = scene.add.graphics();
  roads.lineStyle(18, 0xffffff, 0.05);
  roads.strokeRect(120, 120, config.worldWidth - 240, config.worldHeight - 240);
  roads.lineBetween(150, config.worldHeight - 170, config.worldWidth - 150, config.worldHeight - 170);
}
