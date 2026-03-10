import type { ProceduralLayoutContext } from '../types';
import { addObstacle, addPlaza } from '../helpers';

export function buildSejongLayout(context: ProceduralLayoutContext): void {
  addPlaza(context, 1040, 720, 520, 300);

  addObstacle(context, 620, 500, 300, 180, 0x19452d, { label: '집현관' });
  addObstacle(context, 1460, 500, 300, 180, 0x1e5b3a, { label: '광개토관' });
  addObstacle(context, 620, 930, 320, 190, 0x1c5035, { label: '학생회관' });
  addObstacle(context, 1460, 930, 320, 190, 0x246944, { label: '도서관' });
  addObstacle(context, 1040, 280, 420, 120, 0x143a27, { label: '정문 광장' });
}
