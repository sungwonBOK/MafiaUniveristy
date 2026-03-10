// ============================================================
// server.ts — 서버 진입점
// Express + Socket.IO 초기화 및 이벤트 핸들러 연결
// ============================================================
import 'dotenv/config';
import express from 'express';
import http from 'http';
import cors from 'cors';
import { Server } from 'socket.io';
import msgpackParser from 'socket.io-msgpack-parser';
import { EVENTS, School, SCHOOLS } from '@mafia-university/shared';

import { Player } from './domain/Player';
import { RoomService } from './services/RoomService';
import { GameService } from './services/GameService';
import { ChatService } from './services/ChatService';
import { NetworkMetricsService } from './services/NetworkMetricsService';
import { registerLobbyHandlers } from './handlers/LobbyHandler';
import { registerGameHandlers } from './handlers/GameHandler';

// ── 앱 초기화 ────────────────────────────────────────────────
const app = express();
const httpServer = http.createServer(app);

app.use(cors({ origin: process.env.CLIENT_URL ?? 'http://localhost:5173' }));
app.use(express.json());

// 헬스체크 엔드포인트 (Railway 배포용)
app.get('/health', (_, res) => res.json({ status: 'ok' }));

// ── Socket.IO 설정 ───────────────────────────────────────────
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL ?? 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
  parser: msgpackParser,
  // 저지연 최적화: WebSocket 전용 (HTTP polling 비활성화)
  transports: ['websocket'],
  pingInterval: 5000,
  pingTimeout: 10000,
});

// ── 서비스 인스턴스 (싱글톤) ──────────────────────────────────
const roomService = new RoomService();
const gameService = new GameService();
const chatService = new ChatService(io);
const networkMetrics = new NetworkMetricsService();

networkMetrics.start(() => ({
  connectedSockets: io.engine.clientsCount,
}));

const requestedTickRate = Number(process.env.SERVER_TICK_RATE ?? 24);
const normalizedTickRate = Number.isFinite(requestedTickRate) && requestedTickRate > 0
  ? Math.min(30, Math.max(15, requestedTickRate))
  : 24;
const tickIntervalMs = Math.max(16, Math.floor(1000 / normalizedTickRate));

setInterval(() => {
  roomService.forEachRoom((room) => {
    const queuedStates = room.drainQueuedPlayerStates();
    if (queuedStates.length === 0) return;

    for (const state of queuedStates) {
      networkMetrics.trackOutbound(EVENTS.PLAYER_STATE, state);
      io.to(room.id).except(state.id).emit(EVENTS.PLAYER_STATE, state);
    }
  });
}, tickIntervalMs);

// ── Socket 연결 처리 ─────────────────────────────────────────
io.on('connection', (socket) => {
  console.log(`[connect] ${socket.id}`);

  socket.on('net:probe', (clientSentAt: number, ack?: () => void) => {
    if (typeof ack === 'function') ack();
    if (typeof clientSentAt === 'number' && Number.isFinite(clientSentAt)) {
      networkMetrics.trackInbound('net:probe', { clientSentAt });
      networkMetrics.trackOutbound('net:probe:ack', {});
    }
  });

  // 첫 연결 시 로비 입장 페이로드로 플레이어 생성
  socket.once(EVENTS.JOIN_LOBBY, (payload: { nickname: string; school: School }) => {
    // 학교 유효성 검사
    if (!SCHOOLS.includes(payload.school)) {
      socket.emit(EVENTS.ROOM_ERROR, '유효하지 않은 학교입니다.');
      socket.disconnect();
      return;
    }

    const player = new Player(socket.id, payload.nickname.trim(), payload.school);
    console.log(`[join] ${player.nickname} @ ${player.school}`);

    // 학교별 로비 채널 입장
    const lobbyChannel = `lobby:${player.school}`;
    socket.join(lobbyChannel);

    // 방 목록 전송
    socket.emit(EVENTS.ROOM_LIST, roomService.getRoomListBySchool(player.school));

    // 나머지 이벤트 핸들러 등록
    registerLobbyHandlers(io, socket, player, roomService, chatService);
    registerGameHandlers(io, socket, player, roomService, gameService, chatService, networkMetrics);
  });
});

// ── 서버 시작 ────────────────────────────────────────────────
const PORT = Number(process.env.PORT ?? 4000);
httpServer.listen(PORT, () => {
  console.log(`🚀 MafiaUniversity 서버 실행 중 → http://localhost:${PORT}`);
});
