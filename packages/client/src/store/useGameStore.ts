// ============================================================
// Zustand 전역 상태 스토어
// ============================================================
import { create } from 'zustand';
import type { ChatMessage, PlayerState, RoomInfo, Role, School } from '@mafia-university/shared';

interface GameStore {
  myId: string | null;
  nickname: string;
  school: School | null;
  myRole: Role | null;
  screen: 'home' | 'lobby' | 'waiting' | 'game';
  roomList: RoomInfo[];
  currentRoom: RoomInfo | null;
  lobbyChats: ChatMessage[];
  waitingChats: ChatMessage[];
  voteChats: ChatMessage[];
  remotePlayers: Map<string, PlayerState>;

  isMeeting: boolean;
  meetingCallerId: string | null;

  setMyId: (id: string) => void;
  setProfile: (nickname: string, school: School) => void;
  setScreen: (screen: GameStore['screen']) => void;
  setRoomList: (rooms: RoomInfo[]) => void;
  setCurrentRoom: (room: RoomInfo | null) => void;
  setMyRole: (role: Role) => void;
  setMeetingInfo: (isMeeting: boolean, callerId?: string | null) => void;
  addChat: (msg: ChatMessage) => void;
  updateRemotePlayer: (state: Partial<PlayerState> & { id: string }) => void;
  removeRemotePlayer: (id: string) => void;
  /** 게임 종료 후 대기방 복귀 시 인게임 상태를 모두 초기화합니다 */
  resetGameState: () => void;
}

export const useGameStore = create<GameStore>((set) => ({
  myId: null,
  nickname: '',
  school: null,
  myRole: null,
  isMeeting: false,
  meetingCallerId: null,
  screen: 'home',
  roomList: [],
  currentRoom: null,
  lobbyChats: [],
  waitingChats: [],
  voteChats: [],
  remotePlayers: new Map(),

  setMyId: (id) => set({ myId: id }),
  setProfile: (nickname, school) => set({ nickname, school }),
  setScreen: (screen) => set({ screen }),
  setRoomList: (rooms) => set({ roomList: rooms }),
  setCurrentRoom: (room) => set({ currentRoom: room }),
  setMyRole: (role) => set({ myRole: role }),
  setMeetingInfo: (isMeeting, callerId = null) => set({ isMeeting, meetingCallerId: callerId }),

  addChat: (msg) =>
    set((state) => {
      const key =
        msg.context === 'lobby' ? 'lobbyChats' :
        msg.context === 'waiting' ? 'waitingChats' : 'voteChats';
      return { [key]: [...(state[key] as ChatMessage[]), msg] };
    }),

  updateRemotePlayer: (partial) =>
    set((state) => {
      const next = new Map(state.remotePlayers);
      const existing = next.get(partial.id) ?? ({} as PlayerState);
      next.set(partial.id, { ...existing, ...partial } as PlayerState);
      return { remotePlayers: next };
    }),

  removeRemotePlayer: (id) =>
    set((state) => {
      const next = new Map(state.remotePlayers);
      next.delete(id);
      return { remotePlayers: next };
    }),

  // 게임 종료 후 대기방 복귀 시 인게임 잔여 상태를 모두 초기화합니다.
  // remotePlayers(맵 위 원격 플레이어), 역할, 회의 상태, 투표 채팅을 비웁니다.
  resetGameState: () =>
    set({
      remotePlayers: new Map(),
      myRole: null,
      isMeeting: false,
      meetingCallerId: null,
      voteChats: [],
    }),
}));
