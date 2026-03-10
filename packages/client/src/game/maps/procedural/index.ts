import Phaser from 'phaser';
import type { SchoolMapConfig } from '../SchoolMapRegistry';
import { createLayoutContext } from './helpers';
import { buildSangmyungLayout } from './layouts/sangmyungLayout';
import { buildSejongLayout } from './layouts/sejongLayout';
import { buildKoreaLayout } from './layouts/koreaLayout';
import { buildYonseiLayout } from './layouts/yonseiLayout';

export function buildProceduralSchoolMap(
  scene: Phaser.Scene,
  config: SchoolMapConfig,
): Phaser.Physics.Arcade.StaticGroup {
  const context = createLayoutContext(scene, config);

  switch (config.key) {
    case 'sangmyung':
      buildSangmyungLayout(context);
      break;
    case 'sejong':
      buildSejongLayout(context);
      break;
    case 'korea':
      buildKoreaLayout(context);
      break;
    case 'yonsei':
      buildYonseiLayout(context);
      break;
  }

  return context.colliders;
}
