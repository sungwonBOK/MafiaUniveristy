// ============================================================
// 로비 화면 — 방 목록 + 방 생성 + 실시간 채팅
// ============================================================
import React, { useEffect, useState } from 'react';
import { EVENTS } from '@mafia-university/shared';
import type { RoomInfo } from '@mafia-university/shared';
import { socketService } from '../../services/SocketService';
import { useGameStore } from '../../store/useGameStore';
import { ChatBox } from '../common/ChatBox';
import './Lobby.css';

// 학교별 컬러
const SCHOOL_COLORS: Record<string, string> = {
  '상명대학교': 'var(--c-sangmyung)',
  '세종대학교': 'var(--c-sejong)',
  '고려대학교': 'var(--c-korea)',
  '연세대학교': 'var(--c-yonsei)',
};

export const Lobby: React.FC = () => {
  const {
    nickname, school, myId,
    roomList, setRoomList,
    setCurrentRoom, setScreen,
    lobbyChats, addChat,
  } = useGameStore();

  const [roomNameInput, setRoomNameInput] = useState('');
  const socket = socketService.getSocket();

  useEffect(() => {
    if (!socket) return;

    // 방 목록 수신
    socket.on(EVENTS.ROOM_LIST, (rooms: RoomInfo[]) => setRoomList(rooms));

    // 방 참가 성공
    socket.on(EVENTS.ROOM_UPDATED, (room: RoomInfo) => {
      setCurrentRoom(room);
      setScreen('waiting');
    });

    // 채팅 수신
    socket.on(EVENTS.RECEIVE_CHAT, addChat);

    // 에러
    socket.on(EVENTS.ROOM_ERROR, (msg: string) => alert(msg));

    return () => {
      socket.off(EVENTS.ROOM_LIST);
      socket.off(EVENTS.ROOM_UPDATED);
      socket.off(EVENTS.RECEIVE_CHAT);
      socket.off(EVENTS.ROOM_ERROR);
    };
  }, [socket]);

  // ── 핸들러 ────────────────────────────────────────────────

  const handleCreateRoom = () => {
    const name = roomNameInput.trim() || `${nickname}의 방`;
    socket.emit(EVENTS.CREATE_ROOM, { roomName: name });
    setRoomNameInput('');
  };

  const handleJoinRoom = (roomId: string) => {
    socket.emit(EVENTS.JOIN_ROOM, { roomId });
  };

  const handleSendChat = (content: string) => {
    socket.emit(EVENTS.SEND_CHAT, { content });
  };

  const schoolColor = school ? SCHOOL_COLORS[school] : 'var(--c-primary)';

  return (
    <div className="lobby">
      {/* 헤더 */}
      <header className="lobby__header">
        <div className="lobby__header-left">
          <span className="lobby__logo">🎭</span>
          <span className="lobby__title">MafiaUniversity</span>
          <span className="lobby__school-badge" style={{ color: schoolColor, borderColor: schoolColor }}>
            {school}
          </span>
        </div>
        <div className="lobby__user-info">
          <div className="lobby__avatar">{nickname[0]?.toUpperCase() ?? '?'}</div>
          <span>{nickname}</span>
        </div>
      </header>

      {/* 본문 */}
      <div className="lobby__body">
        {/* 방 목록 */}
        <div className="lobby__rooms">
          <div className="lobby__rooms-header">
            <span className="lobby__rooms-title">게임 방 목록</span>
            <span className="lobby__rooms-count">{roomList.length}개의 방</span>
          </div>

          {/* 방 생성 */}
          <div className="lobby__create-area">
            <input
              className="input lobby__create-input"
              value={roomNameInput}
              onChange={(e) => setRoomNameInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateRoom()}
              placeholder="방 이름 (비워두면 자동 생성)"
            />
            <button className="btn btn--primary" onClick={handleCreateRoom}>
              방 만들기
            </button>
          </div>

          {/* 방 목록 */}
          <div className="lobby__rooms-list">
            {roomList.length === 0 ? (
              <div className="lobby__empty">
                <span className="lobby__empty-icon">🏠</span>
                <span className="lobby__empty-text">아직 방이 없습니다. 첫 번째 방을 만들어보세요!</span>
              </div>
            ) : (
              roomList.map((room) => (
                <RoomCard
                  key={room.id}
                  room={room}
                  onJoin={() => handleJoinRoom(room.id)}
                />
              ))
            )}
          </div>
        </div>

        {/* 채팅 패널 */}
        <div className="lobby__chat-panel">
          <div className="lobby__chat-header">💬 학교 채팅</div>
          <div className="lobby__chat-body">
            <ChatBox
              messages={lobbyChats}
              myId={myId ?? ''}
              onSend={handleSendChat}
              placeholder="같은 학교 친구들과 채팅해보세요..."
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// ── 방 카드 서브 컴포넌트 ─────────────────────────────────────

interface RoomCardProps {
  room: RoomInfo;
  onJoin: () => void;
}

const RoomCard: React.FC<RoomCardProps> = ({ room, onJoin }) => {
  const isPlaying = room.phase !== 'waiting';
  return (
    <div className="room-card">
      <div className="room-card__info">
        <div className="room-card__name">{room.name}</div>
        <div className="room-card__meta">
          <span>👤 {room.players.length} / {room.maxPlayers}</span>
          <span className={`room-card__status room-card__status--${isPlaying ? 'playing' : 'waiting'}`}>
            {isPlaying ? '게임 중' : '대기 중'}
          </span>
        </div>
      </div>
      <button
        className="btn btn--ghost room-card__join-btn"
        onClick={onJoin}
        disabled={isPlaying || room.players.length >= room.maxPlayers}
      >
        입장
      </button>
    </div>
  );
};
