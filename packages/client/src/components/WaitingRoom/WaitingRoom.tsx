// ============================================================
// 대기방 화면 — 플레이어 준비 + 실시간 채팅
// ============================================================
import React, { useEffect } from 'react';
import { EVENTS } from '@mafia-university/shared';
import type { RoomInfo } from '@mafia-university/shared';
import { socketService } from '../../services/SocketService';
import { useGameStore } from '../../store/useGameStore';
import { ChatBox } from '../common/ChatBox';
import './WaitingRoom.css';

export const WaitingRoom: React.FC = () => {
  const {
    myId, nickname,
    currentRoom, setCurrentRoom,
    setScreen, setMyRole,
    waitingChats, addChat,
  } = useGameStore();

  const socket = socketService.getSocket();
  const room = currentRoom;
  const isHost = room?.hostId === myId;
  const me = room?.players.find(p => p.id === myId);

  useEffect(() => {
    if (!socket) return;

    // 재마운트 시 이전 세션의 핸들러가 남아있을 수 있으므로 먼저 정리
    socket.off(EVENTS.ROOM_UPDATED);
    socket.off(EVENTS.GAME_STARTED);
    socket.off(EVENTS.RECEIVE_CHAT);
    socket.off(EVENTS.ROOM_ERROR);

    socket.on(EVENTS.ROOM_UPDATED, (updated: RoomInfo) => setCurrentRoom(updated));

    socket.on(EVENTS.GAME_STARTED, ({ role, roomInfo }: { role: string; roomInfo: RoomInfo }) => {
      setMyRole(role as any);
      setCurrentRoom(roomInfo);
      setScreen('game');
    });

    socket.on(EVENTS.RECEIVE_CHAT, addChat);
    socket.on(EVENTS.ROOM_ERROR, (msg: string) => alert(msg));

    return () => {
      socket.off(EVENTS.ROOM_UPDATED);
      socket.off(EVENTS.GAME_STARTED);
      socket.off(EVENTS.RECEIVE_CHAT);
      socket.off(EVENTS.ROOM_ERROR);
    };
  }, [socket]);

  // ── 핸들러 ────────────────────────────────────────────────

  const handleToggleReady = () => {
    socket.emit(EVENTS.SET_READY, room?.id);
  };

  const handleStartGame = () => {
    socket.emit(EVENTS.START_GAME, room?.id);
  };

  const handleLeaveRoom = () => {
    socket.emit(EVENTS.LEAVE_ROOM, room?.id);
    setCurrentRoom(null);
    setScreen('lobby');
  };

  const handleSendChat = (content: string) => {
    socket.emit(EVENTS.SEND_CHAT, { content, roomId: room?.id, context: 'waiting' });
  };

  const readyCount = room?.players.filter(p => p.isReady || p.id === room.hostId).length ?? 0;
  const totalCount = room?.players.length ?? 0;
  const canStart = isHost && (room?.players.every(p => p.isReady || p.id === room?.hostId) ?? false) && totalCount >= 2;

  if (!room) return null;

  return (
    <div className="waiting">
      {/* 헤더 */}
      <header className="waiting__header">
        <div>
          <div className="waiting__room-name">🏠 {room.name}</div>
          <div className="waiting__room-id">방 ID: {room.id}</div>
        </div>
        <button className="btn btn--ghost" onClick={handleLeaveRoom} style={{ fontSize: '0.82rem' }}>
          ← 나가기
        </button>
      </header>

      <div className="waiting__body">
        {/* 플레이어 목록 + 액션 */}
        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div className="waiting__players">
            <div className="waiting__players-title">
              플레이어 ({totalCount} / {room.maxPlayers})
            </div>
            <div className="waiting__player-grid">
              {room.players.map((p) => (
                <div
                  key={p.id}
                  className={[
                    'player-slot',
                    p.isReady || p.id === room.hostId ? 'player-slot--ready' : '',
                    p.id === room.hostId ? 'player-slot--host' : '',
                  ].join(' ')}
                >
                  <div className="player-slot__avatar">
                    {p.nickname[0]?.toUpperCase() ?? '?'}
                  </div>
                  <span className="player-slot__name">{p.nickname}</span>
                  <span className={`player-slot__status player-slot__status--${p.id === room.hostId || p.isReady ? 'ready' : 'waiting'}`}>
                    {p.id === room.hostId ? '방장' : p.isReady ? '준비 완료' : '대기 중'}
                  </span>
                </div>
              ))}

              {/* 빈 슬롯 */}
              {Array.from({ length: Math.max(0, room.maxPlayers - room.players.length) }).slice(0, 4).map((_, i) => (
                <div key={`empty-${i}`} className="player-slot player-slot--empty">
                  <div className="player-slot__avatar" style={{ opacity: 0.2 }}>?</div>
                  <span className="player-slot__name" style={{ opacity: 0.3 }}>빈 자리</span>
                </div>
              ))}
            </div>
          </div>

          {/* 액션 버튼 */}
          <div className="waiting__actions">
            <span className="waiting__ready-info">
              {readyCount} / {totalCount} 명 준비 완료
            </span>

            {isHost ? (
              <button
                className="btn btn--primary"
                onClick={handleStartGame}
                disabled={!canStart}
                title={!canStart ? '모든 플레이어가 준비해야 시작할 수 있습니다' : ''}
              >
                🚀 게임 시작
              </button>
            ) : (
              <button
                className={`btn ${me?.isReady ? 'btn--ghost' : 'btn--primary'}`}
                onClick={handleToggleReady}
              >
                {me?.isReady ? '⏸ 준비 취소' : '✅ 준비 완료'}
              </button>
            )}
          </div>
        </div>

        {/* 채팅 패널 */}
        <div className="waiting__chat-panel">
          <div className="waiting__chat-header">💬 대기방 채팅</div>
          <ChatBox
            messages={waitingChats}
            myId={myId ?? ''}
            onSend={handleSendChat}
            placeholder="대기 중에 채팅해보세요..."
          />
        </div>
      </div>
    </div>
  );
};
