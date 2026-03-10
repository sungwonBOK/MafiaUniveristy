// ============================================================
// ChatService (SRP: 채팅 브로드캐스트만 책임)
// ============================================================
import { Server } from 'socket.io';
import { ChatMessage, EVENTS } from '@mafia-university/shared';

export class ChatService {
  constructor(private readonly io: Server) {}

  /**
   * 특정 Socket.IO 룸에 채팅 메시지를 브로드캐스트합니다.
   * @param roomId  Socket.IO 룸 ID (게임방 ID 또는 학교 로비 ID)
   * @param message 채팅 메시지 데이터
   */
  broadcast(roomId: string, message: Omit<ChatMessage, 'timestamp'>): void {
    const fullMessage: ChatMessage = {
      ...message,
      timestamp: Date.now(),
    };
    this.io.to(roomId).emit(EVENTS.RECEIVE_CHAT, fullMessage);
  }
}
