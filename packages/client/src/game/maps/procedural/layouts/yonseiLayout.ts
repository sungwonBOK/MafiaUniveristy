import type { ProceduralLayoutContext } from '../types';
import { addObstacle, addPlaza } from '../helpers';

export function buildYonseiLayout(context: ProceduralLayoutContext): void {
  addPlaza(context, 1080, 710, 600, 300);

  addObstacle(context, 520, 470, 300, 180, 0x15476a, { label: '백양관' });
  addObstacle(context, 1080, 410, 380, 170, 0x1b5c86, { label: '언더우드관' });
  addObstacle(context, 1640, 470, 300, 180, 0x236f9b, { label: '도서관' });
  addObstacle(context, 720, 980, 330, 180, 0x123b57, { label: '학생회관' });
  addObstacle(context, 1440, 980, 330, 180, 0x1f5a80, { label: '공학관' });

  const grove = context.scene.add.graphics();
  grove.fillStyle(0xa7f3d0, 0.08);
  grove.fillEllipse(1080, 720, 720, 360);
  grove.lineStyle(3, 0xffffff, 0.12);
  grove.strokeEllipse(1080, 720, 720, 360);
}
