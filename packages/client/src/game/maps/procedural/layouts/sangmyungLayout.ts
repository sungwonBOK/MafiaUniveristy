import type { ProceduralLayoutContext } from '../types';
import { addObstacle, addPlaza } from '../helpers';

export function buildSangmyungLayout(context: ProceduralLayoutContext): void {
  addPlaza(context, 980, 880, 1420, 180);

  addObstacle(context, 430, 1020, 280, 150, 0x183447, { label: '예술관' });
  addObstacle(context, 840, 900, 320, 170, 0x1d4560, { label: '도서관' });
  addObstacle(context, 1270, 780, 360, 180, 0x24506f, { label: '학생회관' });
  addObstacle(context, 1680, 640, 280, 150, 0x2d5b7f, { label: '본관' });
  addObstacle(context, 1540, 1040, 260, 140, 0x143447, { label: '체육관' });

  const stairs = context.scene.add.graphics();
  stairs.lineStyle(3, 0xffffff, 0.18);
  for (let i = 0; i < 8; i += 1) {
    const y = 1110 - i * 54;
    stairs.lineBetween(300 + i * 140, y, 560 + i * 140, y);
  }
}
