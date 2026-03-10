// ============================================================
// VotingModal.tsx - 투표 화면 모달 컴포넌트
// ============================================================
import React, { useEffect, useState } from 'react';
import { EVENTS } from '@mafia-university/shared';
import { useGameStore } from '../../store/useGameStore';
import { socketService } from '../../services/SocketService';
import { ChatBox } from '../common/ChatBox';
import './VotingModal.css';

export const VotingModal: React.FC = () => {
  const {
    currentRoom,
    isMeeting,
    voteChats,
    myId,
    addChat,
    meetingCallerId,
    voteDeadlineAt,
    votedPlayerIds,
    totalEligibleVoters,
  } = useGameStore();
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(0);

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

  useEffect(() => {
    if (!isMeeting || !voteDeadlineAt) {
      setRemainingSeconds(0);
      return;
    }

    const updateRemainingSeconds = () => {
      const seconds = Math.max(0, Math.ceil((voteDeadlineAt - Date.now()) / 1000));
      setRemainingSeconds(seconds);
    };

    updateRemainingSeconds();
    const timerId = window.setInterval(updateRemainingSeconds, 250);

    return () => {
      window.clearInterval(timerId);
    };
  }, [isMeeting, voteDeadlineAt]);

  useEffect(() => {
    if (!myId) return;
    setHasVoted(votedPlayerIds.includes(myId));
  }, [myId, votedPlayerIds]);

  const socket = socketService.getSocket();

  if (!isMeeting || !currentRoom) return null;

  const myPlayer = currentRoom.players.find((player) => player.id === myId);
  const amIDead = myPlayer ? !myPlayer.isAlive : false;
  const votedCount = votedPlayerIds.length;

  const handleSelect = (playerId: string) => {
    if (hasVoted || amIDead) return;

    const player = currentRoom.players.find((candidate) => candidate.id === playerId);
    if (!player || !player.isAlive) return;

    setSelectedPlayerId((current) => (current === playerId ? null : playerId));
  };

  const handleSubmit = (targetId: string | null) => {
    if (hasVoted || amIDead) return;

    socket.emit(EVENTS.SUBMIT_VOTE, { roomId: currentRoom.id, targetId });
    setHasVoted(true);
  };

  const handleSendChat = (content: string) => {
    socket.emit(EVENTS.SEND_CHAT, { content, roomId: currentRoom.id, context: 'vote' });
  };

  const callerName =
    currentRoom.players.find((player) => player.id === meetingCallerId)?.nickname ?? '누군가';

  return (
    <div className="voting-modal-overlay">
      <div className="voting-modal">
        <header className="voting-modal__header">
          <h2 className="voting-modal__title">긴급 회의 소집</h2>
          <p className="voting-modal__subtitle">
            {callerName}님이 회의를 소집했습니다. 대화로 마피아를 찾고 투표하세요.
          </p>
          <p className="voting-modal__subtitle">
            남은 시간 {remainingSeconds}초 · 투표 완료 {votedCount}/{totalEligibleVoters}
          </p>
        </header>

        <div className="voting-modal__body">
          <div className="voting-modal__players">
            {currentRoom.players.map((player) => {
              const isDead = !player.isAlive;
              const isSelected = selectedPlayerId === player.id;
              const hasPlayerVoted = votedPlayerIds.includes(player.id);

              return (
                <div
                  key={player.id}
                  className={`player-vote-card ${isDead ? 'player-vote-card--dead' : ''} ${isSelected ? 'player-vote-card--selected' : ''}`}
                  onClick={() => handleSelect(player.id)}
                >
                  <div className="player-vote-card__info">
                    <div className="player-vote-card__avatar">
                      {player.nickname[0]?.toUpperCase()}
                    </div>
                    <div>
                      <div className="player-vote-card__name">
                        {player.nickname} {player.id === myId ? '(나)' : ''}
                      </div>
                      {isDead && <div className="player-vote-card__status">사망</div>}
                      {!isDead && hasPlayerVoted && (
                        <div className="player-vote-card__status">투표 완료</div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="voting-modal__chat">
            <ChatBox
              messages={voteChats}
              myId={myId ?? ''}
              onSend={handleSendChat}
              placeholder={amIDead ? '유령은 채팅할 수 없습니다...' : '마피아를 찾아보세요...'}
            />
          </div>
        </div>

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
            {hasVoted
              ? '투표 완료, 대기 중...'
              : amIDead
                ? '유령은 투표할 수 없습니다'
                : '선택한 플레이어 투표'}
          </button>
        </footer>
      </div>
    </div>
  );
};
