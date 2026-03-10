// ============================================================
// 공유 타입 정의 (서버 & 클라이언트 양쪽에서 import)
// Socket.IO 이벤트 이름과 데이터 구조를 한 곳에서 관리합니다.
// ============================================================

// ── 학교 목록 ────────────────────────────────────────────────
export const SCHOOLS = [
  '상명대학교',
  '세종대학교',
  '고려대학교',
  '연세대학교',
] as const;

export type School = (typeof SCHOOLS)[number];

// ── 역할 ────────────────────────────────────────────────────
export type LegacyRole = 'citizen' | 'mafia' | 'doctor' | 'detective';
export type CoreRole =
  | 'president'
  | 'investigator'
  | 'freshman'
  | 'jobseeker'
  | 'topstudent'
  | 'professor'
  | 'grad_student'
  | 'impersonator'
  | 'couple'
  | 'loner';
export type Role = CoreRole | LegacyRole;

export type Faction = 'student' | 'professor' | 'neutral';
export type Winner = 'mafia' | 'citizen';

export interface RoleMeta {
  faction: Faction;
  label: string;
  icon: string;
}

export const ROLE_META: Record<Role, RoleMeta> = {
  // Legacy roles
  citizen: { faction: 'student', label: '시민', icon: '🧑‍🎓' },
  mafia: { faction: 'professor', label: '마피아', icon: '🔪' },
  doctor: { faction: 'student', label: '의사', icon: '💉' },
  detective: { faction: 'student', label: '탐정', icon: '🔍' },

  // Core roles
  president: { faction: 'student', label: '학생회장', icon: '📣' },
  investigator: { faction: 'student', label: '홍보국장', icon: '🔎' },
  freshman: { faction: 'student', label: '새내기', icon: '🛡️' },
  jobseeker: { faction: 'student', label: '취준생', icon: '🗂️' },
  topstudent: { faction: 'student', label: '과탑', icon: '🧠' },
  professor: { faction: 'professor', label: '교수', icon: '📋' },
  grad_student: { faction: 'professor', label: '대학원생', icon: '🧪' },
  impersonator: { faction: 'professor', label: '출석 대리인', icon: '🎭' },
  couple: { faction: 'neutral', label: 'CC', icon: '💞' },
  loner: { faction: 'neutral', label: '아싸', icon: '🧍' },
};

export function getRoleFaction(role: Role | null): Faction | null {
  if (!role) return null;
  return ROLE_META[role].faction;
}

export function isProfessorFaction(role: Role | null): boolean {
  return getRoleFaction(role) === 'professor';
}

export function isKillRole(role: Role | null): boolean {
  return role === 'professor' || role === 'mafia';
}

// ── 게임 단계 ────────────────────────────────────────────────
export type GamePhase = 'waiting' | 'playing' | 'meeting' | 'vote' | 'ended';

// ── 플레이어 상태 ─────────────────────────────────────────────
export interface PlayerState {
  id: string;       // Socket ID
  nickname: string;
  displayNickname: string;
  displayColor: string;
  school: School;
  x: number;
  y: number;
  isAlive: boolean;
  isReady: boolean;
  role: Role | null; // 게임 시작 전에는 null
}

// ── 방 정보 ──────────────────────────────────────────────────
export interface RoomInfo {
  id: string;
  name: string;
  hostId: string;
  school: School;
  players: PlayerState[];
  maxPlayers: number;
  phase: GamePhase;
}

// ── 채팅 메시지 ───────────────────────────────────────────────
export interface ChatMessage {
  senderId: string;
  senderNickname: string;
  content: string;
  timestamp: number;
  /** 채팅이 발생한 컨텍스트 (로비/대기방/투표) */
  context: 'lobby' | 'waiting' | 'vote';
}

// ── 투표 데이터 ───────────────────────────────────────────────
export interface VoteData {
  voterId: string;
  targetId: string | null; // null은 기권
}

export interface VoteProgressInfo {
  votedPlayerIds: string[];
  totalEligibleVoters: number;
  deadlineAt: number;
}

// ============================================================
// Socket 이벤트 이름 (오타 방지를 위해 상수로 관리)
// ============================================================
export const EVENTS = {
  // 연결
  JOIN_LOBBY:      'join_lobby',       // 클라→서버: 로비 입장
  LEAVE_LOBBY:     'leave_lobby',      // 클라→서버: 로비 퇴장

  // 방 관련
  ROOM_LIST:       'room_list',        // 서버→클라: 방 목록 갱신
  CREATE_ROOM:     'create_room',      // 클라→서버: 방 생성
  JOIN_ROOM:       'join_room',        // 클라→서버: 방 참가
  LEAVE_ROOM:      'leave_room',       // 클라→서버: 방 퇴장
  ROOM_UPDATED:    'room_updated',     // 서버→클라: 방 상태 변경
  ROOM_ERROR:      'room_error',       // 서버→클라: 방 오류

  // 대기방
  SET_READY:       'set_ready',        // 클라→서버: 준비 상태 토글
  START_GAME:      'start_game',       // 클라→서버: 게임 시작 (방장만)
  GAME_STARTED:    'game_started',     // 서버→클라: 게임 시작 알림

  // 게임 중 이동
  PLAYER_MOVE:     'player_move',      // 클라→서버: 내 위치 전송
  PLAYER_STATE:    'player_state',     // 서버→클라: 전체 플레이어 상태 스냅샷
  PLAYER_LEFT:     'player_left',      // 서버→클라: 플레이어 이탈

  // 능력 사용 (Space키)
  USE_ABILITY:     'use_ability',      // 클라→서버: 능력 사용
  ABILITY_RESULT:  'ability_result',   // 서버→클라: 능력 결과
  INVESTIGATE_BODY:'investigate_body', // 클라→서버: 시체 분석 요청

  // 회의/투표
  CALL_MEETING:    'call_meeting',     // 클라→서버: 긴급 회의 소집
  MEETING_STARTED: 'meeting_started',  // 서버→클라: 회의 시작
  SUBMIT_VOTE:     'submit_vote',      // 클라→서버: 투표
  VOTE_PROGRESS:   'vote_progress',    // 서버→클라: 현재 투표 진행 상태
  VOTE_RESULT:     'vote_result',      // 서버→클라: 투표 결과 + 추방 대상

  // 채팅
  SEND_CHAT:       'send_chat',        // 클라→서버: 채팅 전송
  RECEIVE_CHAT:    'receive_chat',     // 서버→클라: 채팅 수신

  // 게임 종료
  GAME_ENDED:      'game_ended',       // 서버→클라: 게임 종료 + 승리 팀

  // 게임 재시작 (대기방으로 복귀)
  RESET_GAME:      'reset_game',       // 클라→서버: 방장이 방 상태 초기화 요청
  GAME_RESET:      'game_reset',       // 서버→클라: 방 초기화 완료, 대기방으로 복귀
} as const;
