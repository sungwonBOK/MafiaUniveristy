import type { ProceduralLayoutContext } from '../types';
import { addObstacle, addPlaza } from '../helpers';

export function buildKoreaLayout(context: ProceduralLayoutContext): void {
  addPlaza(context, 1100, 760, 1280, 160);

  addObstacle(context, 540, 490, 320, 170, 0x5b1f1f, { label: '중앙광장' });
  addObstacle(context, 980, 470, 320, 170, 0x7a2626, { label: '도서관' });
  addObstacle(context, 1420, 490, 320, 170, 0x8c2f2f, { label: '본관' });
  addObstacle(context, 1860, 520, 240, 170, 0x6b2323, { label: '법학관' });
  addObstacle(context, 700, 1030, 360, 180, 0x4f1919, { label: '학생회관' });
  addObstacle(context, 1280, 1030, 420, 180, 0x732727, { label: '이과대' });
}
