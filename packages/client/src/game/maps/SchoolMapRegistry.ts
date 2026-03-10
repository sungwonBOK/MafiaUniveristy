// ============================================================
// 학교 맵 레지스트리 (확장 가능한 설계)
// 새 학교를 추가할 때 이 파일에 한 항목만 추가하면 됩니다.
// ============================================================
export interface SchoolMapConfig {
  /** Phaser 씬 키 */
  key: string;
  /** Phaser 에셋 키 (타일맵 JSON) */
  tilemapKey: string;
  /** 프로토타입 단계에서 사용할 배경 색조 (0xRRGGBB) */
  tint: number;
  /** 학교 이름 */
  displayName: string;
  /** 테마 컬러 (HEX) */
  themeColor: string;
}

/**
 * 학교 맵 레지스트리
 * ---
 * 새 학교 추가 방법:
 *   1. 이 객체에 항목 추가
 *   2. PreloadScene에서 타일맵 에셋 로딩 추가 (tilemapKey 기준)
 *   3. 실제 에셋 파일을 public/maps/{tilemapKey}.json에 추가
 *
 * 현재는 프로토타입 단계이므로 공용 맵에 tint만 다르게 적용합니다.
 */
export const SCHOOL_MAP_REGISTRY: Record<string, SchoolMapConfig> = {
  '상명대학교': {
    key: 'sangmyung',
    tilemapKey: 'map_prototype',  // 나중에 'map_sangmyung'으로 교체
    tint: 0x4a90d9,
    displayName: '상명대학교',
    themeColor: '#4a90d9',
  },
  '세종대학교': {
    key: 'sejong',
    tilemapKey: 'map_prototype',
    tint: 0x27ae60,
    displayName: '세종대학교',
    themeColor: '#27ae60',
  },
  '고려대학교': {
    key: 'korea',
    tilemapKey: 'map_prototype',
    tint: 0xc0392b,
    displayName: '고려대학교',
    themeColor: '#c0392b',
  },
  '연세대학교': {
    key: 'yonsei',
    tilemapKey: 'map_prototype',
    tint: 0x2980b9,
    displayName: '연세대학교',
    themeColor: '#2980b9',
  },
  // ── 새 학교 추가 예시 ──────────────────────────────────────
  // '한양대학교': {
  //   key: 'hanyang',
  //   tilemapKey: 'map_prototype',  // 실제 맵: 'map_hanyang'
  //   tint: 0xe67e22,
  //   displayName: '한양대학교',
  //   themeColor: '#e67e22',
  // },
};
