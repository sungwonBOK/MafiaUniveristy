// ============================================================
// GameHandler — 게임 진행 관련 Socket 이벤트 처리
// (게임 시작, 이동, 능력 사용, 회의, 투표)
// ============================================================
import { Socket, Server } from 'socket.io';
import { EVENTS } from '@mafia-university/shared';
import { Player } from '../domain/Player';
import { RoomService } from '../services/RoomService';
import { GameService } from '../services/GameService';
import { ChatService } from '../services/ChatService';
import type { NetworkMetricsService } from '../services/NetworkMetricsService';
import { broadcastRoomList } from './LobbyHandler';

interface MovePayload {
  roomId: string;
  x: number;
  y: number;
}

interface AbilityPayload {
  roomId: string;
  targetId: string;
}

const VOTE_DURATION_MS = 60_000;

type VoteTimeout = ReturnType<typeof setTimeout>;

interface RoomVoteState {
  votes: Map<string, string | null>;
  deadlineAt: number;
  timeoutId: VoteTimeout;
}

const roomVoteStates = new Map<string, RoomVoteState>();

export function registerGameHandlers(
  io: Server,
  socket: Socket,
  player: Player,
  roomService: RoomService,
  gameService: GameService,
  chatService: ChatService,
  networkMetrics?: NetworkMetricsService,
): void {
  const clearVoteState = (roomId: string) => {
    const voteState = roomVoteStates.get(roomId);
    if (!voteState) return;

    clearTimeout(voteState.timeoutId);
    roomVoteStates.delete(roomId);
  };

  const emitVoteProgress = (roomId: string) => {
    const room = roomService.getRoom(roomId);
    const voteState = roomVoteStates.get(roomId);
    if (!room || !voteState) return;

    const totalEligibleVoters = Array.from(room.players.values()).filter((candidate) => candidate.isAlive).length;

    io.to(roomId).emit(EVENTS.VOTE_PROGRESS, {
      votedPlayerIds: [...voteState.votes.keys()],
      totalEligibleVoters,
      deadlineAt: voteState.deadlineAt,
    });
  };

  const finalizeVote = (roomId: string) => {
    const room = roomService.getRoom(roomId);
    const voteState = roomVoteStates.get(roomId);
    if (!room || !voteState || room.phase !== 'meeting') return;

    const ejectedId = gameService.processVotes(voteState.votes);

    if (ejectedId) {
      const ejected = room.getPlayer(ejectedId);
      ejected?.kill();
    }

    clearVoteState(roomId);
    room.phase = 'playing';

    const winner = gameService.checkWinCondition(room);
    if (winner) {
      room.phase = 'ended';
      io.to(roomId).emit(EVENTS.GAME_ENDED, { winner });
      return;
    }

    io.to(roomId).emit(EVENTS.VOTE_RESULT, {
      ejectedId,
      roomInfo: room.toInfo(),
    });
  };

  // ── 준비 상태 토글 ───────────────────────────────────────────
  socket.on(EVENTS.SET_READY, (roomId: string) => {
    const room = roomService.getRoom(roomId);
    if (!room) return;
    const p = room.getPlayer(player.id);
    if (!p) return;

    p.toggleReady();
    io.to(roomId).emit(EVENTS.ROOM_UPDATED, room.toInfo());
  });

  // ── 게임 시작 (방장만 가능) ───────────────────────────────────
  socket.on(EVENTS.START_GAME, (roomId: string) => {
    const room = roomService.getRoom(roomId);
    if (!room) return;
    if (room.hostId !== player.id) {
      socket.emit(EVENTS.ROOM_ERROR, '방장만 게임을 시작할 수 있습니다.');
      return;
    }
    if (!room.allReady()) {
      socket.emit(EVENTS.ROOM_ERROR, '모든 플레이어가 준비 완료해야 합니다.');
      return;
    }

    const assignments = gameService.assignRoles(room);

    // 각 플레이어에게 자신의 역할만 개인 이벤트로 전송
    for (const [playerId, role] of assignments) {
      io.to(playerId).emit(EVENTS.GAME_STARTED, {
        role,
        roomInfo: room.toInfo(),
      });
    }

    broadcastRoomList(io, roomService, room.school);
  });

  // ── 플레이어 이동 ────────────────────────────────────────────
  // 저지연: 입력 변화 시에만 전송, 서버는 검증 후 다른 플레이어에게만 전달
  socket.on(EVENTS.PLAYER_MOVE, (payload: MovePayload) => {
    networkMetrics?.trackInbound(EVENTS.PLAYER_MOVE, payload);
    const room = roomService.getRoom(payload.roomId);
    if (!room) return;
    const p = room.getPlayer(player.id);
    if (!p || !p.isAlive) return;

    p.updatePosition(payload.x, payload.y);

    // 나 자신을 제외한 같은 방 플레이어에게 전송 (broadcast)
    room.enqueuePlayerState(player.id, payload.x, payload.y);
  });

  // ── 능력 사용 (Space키) ──────────────────────────────────────
  socket.on(EVENTS.USE_ABILITY, (payload: AbilityPayload) => {
    const room = roomService.getRoom(payload.roomId);
    if (!room) return;
    const p = room.getPlayer(player.id);
    if (!p || !p.isAlive) return;

    const killed = gameService.processKill(room, player.id, payload.targetId);
    if (killed) {
      io.to(payload.roomId).emit(EVENTS.ABILITY_RESULT, {
        type: 'kill',
        targetId: payload.targetId,
      });

      const winner = gameService.checkWinCondition(room);
      if (winner) {
        clearVoteState(payload.roomId);
        room.phase = 'ended';
        io.to(payload.roomId).emit(EVENTS.GAME_ENDED, { winner });
        return;
      }
    }
    // TODO: 역할별 액티브 스킬(조사/시체분석/변신 등) 추가 예정
  });

  // ── 긴급 회의 소집 ────────────────────────────────────────────
  socket.on(EVENTS.CALL_MEETING, (roomId: string) => {
    const room = roomService.getRoom(roomId);
    if (!room || room.phase !== 'playing') return;
    const p = room.getPlayer(player.id);
    if (!p || !p.isAlive) return;

    clearVoteState(roomId);
    room.phase = 'meeting';
    const deadlineAt = Date.now() + VOTE_DURATION_MS;
    const timeoutId = setTimeout(() => {
      finalizeVote(roomId);
    }, VOTE_DURATION_MS);

    roomVoteStates.set(roomId, {
      votes: new Map(),
      deadlineAt,
      timeoutId,
    });

    io.to(roomId).emit(EVENTS.MEETING_STARTED, {
      callerId: player.id,
      roomInfo: room.toInfo(),
      votedPlayerIds: [],
      totalEligibleVoters: Array.from(room.players.values()).filter((candidate) => candidate.isAlive).length,
      deadlineAt,
    });
  });

  socket.on(EVENTS.SUBMIT_VOTE, ({ roomId, targetId }: { roomId: string; targetId: string | null }) => {
    const room = roomService.getRoom(roomId);
    if (!room || room.phase !== 'meeting') return;
    const currentPlayer = room.getPlayer(player.id);
    if (!currentPlayer || !currentPlayer.isAlive) return;

    const voteState = roomVoteStates.get(roomId);
    if (!voteState) return;
    if (voteState.votes.has(player.id)) return;

    if (targetId !== null) {
      const targetPlayer = room.getPlayer(targetId);
      if (!targetPlayer || !targetPlayer.isAlive) return;
    }

    voteState.votes.set(player.id, targetId);
    emitVoteProgress(roomId);

    const aliveCount = Array.from(room.players.values()).filter((candidate) => candidate.isAlive).length;

    // 모든 살아있는 플레이어가 투표 완료했을 때 집계
    if (voteState.votes.size >= aliveCount) {
      finalizeVote(roomId);
    }
  });

  // ── 게임 재시작 (방장만 가능) ─────────────────────────────────
  // 게임 종료(ended) 상태에서 방장이 대기방으로 복귀를 요청합니다.
  // 모든 플레이어의 상태(역할, 생존, 준비)를 초기화하고 phase를 'waiting'으로 되돌립니다.
  socket.on(EVENTS.RESET_GAME, (roomId: string) => {
    const room = roomService.getRoom(roomId);
    if (!room) return;

    // 방장만 리셋 가능
    if (room.hostId !== player.id) {
      socket.emit(EVENTS.ROOM_ERROR, '방장만 게임을 재시작할 수 있습니다.');
      return;
    }

    // 방이 ended 상태일 때만 리셋 허용 (이중 실행 방지)
    if (room.phase !== 'ended') return;

    clearVoteState(roomId);

    // 모든 플레이어 상태 초기화
    for (const p of room.players.values()) {
      p.reset();
    }

    // 방 phase를 대기 중으로 복원
    room.phase = 'waiting';

    // 전체 플레이어에게 초기화된 방 정보 전송 → 클라이언트가 대기방 화면으로 전환
    io.to(roomId).emit(EVENTS.GAME_RESET, room.toInfo());

    // 로비의 방 목록도 갱신
    broadcastRoomList(io, roomService, room.school);
  });
}
