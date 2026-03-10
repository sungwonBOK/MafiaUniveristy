// ============================================================
// VotingModal.tsx — 투표 화면 모달 컴포넌트
// ============================================================
import React, { useState, useEffect } from 'react';
import { EVENTS } from '@mafia-university/shared';
import type { PlayerState } from '@mafia-university/shared';
import { useGameStore } from '../../store/useGameStore';
import { socketService } from '../../services/SocketService';
import { ChatBox } from '../common/ChatBox';
import './VotingModal.css';

export const VotingModal: React.FC = () => {
  const { currentRoom, isMeeting, voteChats, myId, addChat, meetingCallerId } = useGameStore();
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);

  // 컴포넌트 마운트/언마운트 시 로컬 상태 초기화 및 채팅 수신
  useEffect(() => {
    const socket = socketService.getSocket();
    
    if (isMeeting) {
      setSelectedPlayerId(null);
      setHasVoted(false);

      socket.on(EVENTS.RECEIVE_CHAT, addChat);
    }
    
    return () => {
      socket.off(EVENTS.RECEIVE_CHAT, addChat);
    };
  }, [isMeeting, addChat]);

  const socket = socketService.getSocket();

  if (!isMeeting || !currentRoom) return null;

  // 타이マー는 간단히 무한 또는 60초 (서버에서 시간 제어를 관리한다고 가정)
  // 현재는 모두가 투표해야만 넘어가는 무제한 구조
  const myPlayer = currentRoom.players.find((p) => p.id === myId);
  const amIDead = myPlayer ? !myPlayer.isAlive : false;

  const handleSelect = (playerId: string) => {
    if (hasVoted || amIDead) return;
    const player = currentRoom.players.find((p) => p.id === playerId);
    if (!player || !player.isAlive) return;
    
    // 이미 선택된 상태면 선택 취소
    if (selectedPlayerId === playerId) {
      setSelectedPlayerId(null);
    } else {
      setSelectedPlayerId(playerId);
    }
  };

  const handleSubmit = (targetId: string | null) => {
    if (hasVoted || amIDead) return;
    socket.emit(EVENTS.SUBMIT_VOTE, { roomId: currentRoom.id, targetId });
    setHasVoted(true);
  };

  const handleSendChat = (content: string) => {
    socket.emit(EVENTS.SEND_CHAT, { content, roomId: currentRoom.id, context: 'vote' });
  };

  const callerName = currentRoom.players.find(p => p.id === meetingCallerId)?.nickname ?? '누군가';

  return (
    <div className="voting-modal-overlay">
      <div className="voting-modal">
        {/* 헤더 */}
        <header className="voting-modal__header">
          <h2 className="voting-modal__title">🚨 긴급 회의 소집 🚨</h2>
          <p className="voting-modal__subtitle">
            {callerName} 님이 회의를 소집했습니다. 대화로 마피아를 찾고 투표하세요!
          </p>
        </header>

        {/* 바디 (플레이어 목록 + 채팅) */}
        <div className="voting-modal__body">
          <div className="voting-modal__players">
            {currentRoom.players.map((p) => {
              const isDead = !p.isAlive;
              const isSelected = selectedPlayerId === p.id;
              
              return (
                <div
                  key={p.id}
                  className={`player-vote-card ${isDead ? 'player-vote-card--dead' : ''} ${isSelected ? 'player-vote-card--selected' : ''}`}
                  onClick={() => handleSelect(p.id)}
                >
                  <div className="player-vote-card__info">
                    <div className="player-vote-card__avatar">
                      {p.nickname[0]?.toUpperCase()}
                    </div>
                    <div>
                      <div className="player-vote-card__name">{p.nickname} {p.id === myId ? '(나)' : ''}</div>
                      {isDead && <div className="player-vote-card__status">💀 사망</div>}
                    </div>
                  </div>
                  {/* 투표 완료 상태를 보여줄 수도 있습니다 */}
                </div>
              );
            })}
          </div>

          <div className="voting-modal__chat">
            <ChatBox
              messages={voteChats}
              myId={myId ?? ''}
              onSend={handleSendChat}
              placeholder={amIDead ? '유령은 채팅할 수 없습니다...' : '마피아를 잡아내세요!'}
            />
          </div>
        </div>

        {/* 푸터 (기권 및 투표하기 버튼) */}
        <footer className="voting-modal__footer">
          <button 
            className="voting-modal__skip-btn" 
            onClick={() => handleSubmit(null)}
            disabled={hasVoted || amIDead}
          >
            기권하기 (Skip)
          </button>
          
          <button 
            className="btn btn--primary voting-modal__submit-btn"
            disabled={!selectedPlayerId || hasVoted || amIDead}
            onClick={() => handleSubmit(selectedPlayerId)}
          >
            {hasVoted ? '투표 완료 대기 중...' : amIDead ? '유령은 투표할 수 없습니다' : '선택한 플레이어 투표'}
          </button>
        </footer>
      </div>
    </div>
  );
};
