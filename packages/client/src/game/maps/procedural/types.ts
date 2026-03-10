import Phaser from 'phaser';
import type { SchoolMapConfig } from '../SchoolMapRegistry';

export interface ProceduralLayoutContext {
  scene: Phaser.Scene;
  config: SchoolMapConfig;
  colliders: Phaser.Physics.Arcade.StaticGroup;
}
