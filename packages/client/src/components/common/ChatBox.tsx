// ============================================================
// ChatBox — 공통 채팅 컴포넌트 (로비/대기방/투표에서 재사용)
// ============================================================
import React, { useEffect, useRef, useState } from 'react';
import type { ChatMessage } from '@mafia-university/shared';
import './ChatBox.css';

interface ChatBoxProps {
  messages: ChatMessage[];
  myId: string;
  onSend: (content: string) => void;
  placeholder?: string;
}

export const ChatBox: React.FC<ChatBoxProps> = ({
  messages,
  myId,
  onSend,
  placeholder = '채팅 입력...',
}) => {
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  // 새 메시지 올 때  자동 스크롤
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="chatbox">
      <div className="chatbox__messages">
        {messages.map((msg, i) => {
          const isMine = msg.senderId === myId;
          return (
            <div key={i} className="chatbox__message">
              {!isMine && (
                <span className="chatbox__sender">{msg.senderNickname}</span>
              )}
              <span className={`chatbox__content${isMine ? ' chatbox__content--mine' : ''}`}>
                {msg.content}
              </span>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div className="chatbox__input-row">
        <input
          className="chatbox__input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          maxLength={200}
        />
        <button className="chatbox__send-btn" onClick={handleSend}>
          전송
        </button>
      </div>
    </div>
  );
};
