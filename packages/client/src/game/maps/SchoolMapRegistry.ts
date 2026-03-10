import type { School } from '@mafia-university/shared';

export type SchoolLayoutKey = 'sangmyung' | 'sejong' | 'korea' | 'yonsei';

export interface SchoolMapConfig {
  key: SchoolLayoutKey;
  tilemapKey: string;
  tilesetKey: string;
  tilesetName: string;
  tint: number;
  displayName: School;
  themeColor: string;
  worldWidth: number;
  worldHeight: number;
  spawn: { x: number; y: number };
}

export const SCHOOL_MAP_REGISTRY: Record<School, SchoolMapConfig> = {
  상명대학교: {
    key: 'sangmyung',
    tilemapKey: 'map_sangmyung',
    tilesetKey: 'tiles_sangmyung',
    tilesetName: 'tiles',
    tint: 0x4a90d9,
    displayName: '상명대학교',
    themeColor: '#4a90d9',
    worldWidth: 1960,
    worldHeight: 1320,
    spawn: { x: 220, y: 1080 },
  },
  세종대학교: {
    key: 'sejong',
    tilemapKey: 'map_sejong',
    tilesetKey: 'tiles_sejong',
    tilesetName: 'tiles',
    tint: 0x27ae60,
    displayName: '세종대학교',
    themeColor: '#27ae60',
    worldWidth: 2080,
    worldHeight: 1320,
    spawn: { x: 260, y: 1040 },
  },
  고려대학교: {
    key: 'korea',
    tilemapKey: 'map_korea',
    tilesetKey: 'tiles_korea',
    tilesetName: 'tiles',
    tint: 0xc0392b,
    displayName: '고려대학교',
    themeColor: '#c0392b',
    worldWidth: 2200,
    worldHeight: 1360,
    spawn: { x: 260, y: 1140 },
  },
  연세대학교: {
    key: 'yonsei',
    tilemapKey: 'map_yonsei',
    tilesetKey: 'tiles_yonsei',
    tilesetName: 'tiles',
    tint: 0x2980b9,
    displayName: '연세대학교',
    themeColor: '#2980b9',
    worldWidth: 2160,
    worldHeight: 1360,
    spawn: { x: 300, y: 1120 },
  },
};

const DEFAULT_SCHOOL: School = '상명대학교';

export function getSchoolMapConfig(school: School | null | undefined): SchoolMapConfig {
  if (!school) {
    return SCHOOL_MAP_REGISTRY[DEFAULT_SCHOOL];
  }

  return SCHOOL_MAP_REGISTRY[school] ?? SCHOOL_MAP_REGISTRY[DEFAULT_SCHOOL];
}
