// ============================================================
// LobbyHandler — 로비 관련 Socket 이벤트 처리
// (방 생성, 방 참가, 방 퇴장, 로비 채팅)
// ============================================================
import { Socket, Server } from 'socket.io';
import { EVENTS, School } from '@mafia-university/shared';
import { Player } from '../domain/Player';
import { RoomService } from '../services/RoomService';
import { ChatService } from '../services/ChatService';

interface JoinLobbyPayload {
  nickname: string;
  school: School;
}

interface CreateRoomPayload {
  roomName: string;
}

interface JoinRoomPayload {
  roomId: string;
}

interface SendChatPayload {
  content: string;
  roomId?: string; // 로비면 undefined (학교 채널 사용)
}

export function registerLobbyHandlers(
  io: Server,
  socket: Socket,
  player: Player,
  roomService: RoomService,
  chatService: ChatService,
): void {

  // ── 로비 입장 ────────────────────────────────────────────────
  // 학교별 로비 채널에 join해 학교 방 목록만 수신
  socket.on(EVENTS.JOIN_LOBBY, () => {
    const lobbyChannel = `lobby:${player.school}`;
    socket.join(lobbyChannel);

    // 해당 학교의 방 목록 전송
    const rooms = roomService.getRoomListBySchool(player.school);
    socket.emit(EVENTS.ROOM_LIST, rooms);
  });

  // ── 방 생성 ──────────────────────────────────────────────────
  socket.on(EVENTS.CREATE_ROOM, (payload: CreateRoomPayload) => {
    const room = roomService.createRoom(player, payload.roomName || `${player.nickname}의 방`);
    socket.join(room.id);

    // 방 생성자에게 방 정보 전송
    socket.emit(EVENTS.ROOM_UPDATED, room.toInfo());

    // 같은 학교 로비에 방 목록 갱신 브로드캐스트
    broadcastRoomList(io, roomService, player.school);
  });

  // ── 방 참가 ──────────────────────────────────────────────────
  socket.on(EVENTS.JOIN_ROOM, (payload: JoinRoomPayload) => {
    const result = roomService.joinRoom(payload.roomId, player);
    if (!result.success) {
      socket.emit(EVENTS.ROOM_ERROR, result.error);
      return;
    }

    socket.join(payload.roomId);
    const room = roomService.getRoom(payload.roomId)!;

    // 방 전체에 갱신된 방 정보 브로드캐스트
    io.to(payload.roomId).emit(EVENTS.ROOM_UPDATED, room.toInfo());
    broadcastRoomList(io, roomService, player.school);
  });

  // ── 방 퇴장 ──────────────────────────────────────────────────
  socket.on(EVENTS.LEAVE_ROOM, (roomId: string) => {
    handleLeaveRoom(io, socket, player, roomId, roomService);
  });

  // ── 로비 채팅 ────────────────────────────────────────────────
  socket.on(EVENTS.SEND_CHAT, (payload: SendChatPayload) => {
    // roomId가 없으면 로비 채팅, 있으면 대기방/인게임 채팅
    const targetRoom = payload.roomId ?? `lobby:${player.school}`;
    chatService.broadcast(targetRoom, {
      senderId: player.id,
      senderNickname: player.nickname,
      content: payload.content,
      context: payload.roomId ? 'waiting' : 'lobby',
    });
  });

  // ── 연결 끊김 처리 ───────────────────────────────────────────
  socket.on('disconnect', () => {
    // 플레이어가 속한 모든 방에서 퇴장 처리
    // (실제 구현에서는 PlayerRoomMap을 통해 추적)
    console.log(`[disconnect] ${player.nickname} (${player.id})`);
  });
}

// ── 유틸: 로비 방 목록 브로드캐스트 ──────────────────────────
export function broadcastRoomList(io: Server, roomService: RoomService, school: School): void {
  const rooms = roomService.getRoomListBySchool(school);
  io.to(`lobby:${school}`).emit(EVENTS.ROOM_LIST, rooms);
}

// ── 유틸: 방 퇴장 처리 ───────────────────────────────────────
export function handleLeaveRoom(
  io: Server,
  socket: Socket,
  player: Player,
  roomId: string,
  roomService: RoomService,
): void {
  roomService.leaveRoom(roomId, player.id);
  socket.leave(roomId);

  const room = roomService.getRoom(roomId);
  if (room) {
    io.to(roomId).emit(EVENTS.ROOM_UPDATED, room.toInfo());
  }
  broadcastRoomList(io, roomService, player.school);
}
