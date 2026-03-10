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

export function registerGameHandlers(
  io: Server,
  socket: Socket,
  player: Player,
  roomService: RoomService,
  gameService: GameService,
  chatService: ChatService,
  networkMetrics?: NetworkMetricsService,
): void {

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

    if (p.role === 'mafia') {
      const killed = gameService.processKill(room, player.id, payload.targetId);
      if (killed) {
        io.to(payload.roomId).emit(EVENTS.ABILITY_RESULT, {
          type: 'kill',
          targetId: payload.targetId,
        });

        const winner = gameService.checkWinCondition(room);
        if (winner) {
          room.phase = 'ended';
          io.to(payload.roomId).emit(EVENTS.GAME_ENDED, { winner });
        }
      }
    }
    // TODO: 탐정/의사 능력 추가 예정
  });

  // ── 긴급 회의 소집 ────────────────────────────────────────────
  socket.on(EVENTS.CALL_MEETING, (roomId: string) => {
    const room = roomService.getRoom(roomId);
    if (!room || room.phase !== 'playing') return;
    const p = room.getPlayer(player.id);
    if (!p || !p.isAlive) return;

    room.phase = 'meeting';
    io.to(roomId).emit(EVENTS.MEETING_STARTED, { callerId: player.id });
  });

  // ── 투표 ─────────────────────────────────────────────────────
  // 투표는 방 단위로 서버에서 집계
  const voteMap = new Map<string, Map<string, string | null>>();

  socket.on(EVENTS.SUBMIT_VOTE, ({ roomId, targetId }: { roomId: string; targetId: string | null }) => {
    const room = roomService.getRoom(roomId);
    if (!room || room.phase !== 'meeting') return;

    if (!voteMap.has(roomId)) voteMap.set(roomId, new Map());
    voteMap.get(roomId)!.set(player.id, targetId);

    const aliveCount = Array.from(room.players.values()).filter(p => p.isAlive).length;
    const votes = voteMap.get(roomId)!;

    // 모든 살아있는 플레이어가 투표 완료했을 때 집계
    if (votes.size >= aliveCount) {
      const ejectedId = gameService.processVotes(votes);

      if (ejectedId) {
        const ejected = room.getPlayer(ejectedId);
        ejected?.kill();
      }

      voteMap.delete(roomId);
      room.phase = 'playing';

      const winner = gameService.checkWinCondition(room);
      if (winner) {
        room.phase = 'ended';
        io.to(roomId).emit(EVENTS.GAME_ENDED, { winner });
      } else {
        io.to(roomId).emit(EVENTS.VOTE_RESULT, {
          ejectedId,
          roomInfo: room.toInfo(),
        });
      }
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
