// ============================================================
// 홈 화면 — 닉네임 & 학교 입력
// ============================================================
import React, { useState } from 'react';
import { SCHOOLS, EVENTS } from '@mafia-university/shared';
import type { School } from '@mafia-university/shared';
import { socketService } from '../../services/SocketService';
import { useGameStore } from '../../store/useGameStore';
import './Home.css';

export const Home: React.FC = () => {
  const [nickname, setNickname] = useState('');
  const [school, setSchool] = useState<School | ''>('');
  const [error, setError] = useState('');

  const { setProfile, setScreen, setMyId } = useGameStore();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = nickname.trim();
    if (!trimmed) { setError('닉네임을 입력해 주세요.'); return; }
    if (!school)  { setError('학교를 선택해 주세요.'); return; }
    if (trimmed.length < 2) { setError('닉네임은 2자 이상이어야 합니다.'); return; }

    setError('');
    const socket = socketService.connect();

    // 소켓 연결 후 로비 입장 이벤트 전송
    socket.on('connect', () => {
      setMyId(socket.id ?? '');
      socket.emit(EVENTS.JOIN_LOBBY, { nickname: trimmed, school });
    });

    // 이미 연결된 경우 바로 전송
    if (socket.connected) {
      setMyId(socket.id ?? '');
      socket.emit(EVENTS.JOIN_LOBBY, { nickname: trimmed, school });
    }

    setProfile(trimmed, school as School);
    setScreen('lobby');
  };

  return (
    <div className="home page">
      <div className="home__bg" />

      <div className="home__card card animate-in">
        {/* 로고 */}
        <div className="home__logo">
          <span className="home__logo-icon">🎭</span>
          <h1 className="home__title">MafiaUniversity</h1>
          <p className="home__subtitle">같은 학교 친구들과 즐기는 실시간 마피아 게임</p>
        </div>

        {/* 입력 폼 */}
        <form className="home__form" onSubmit={handleSubmit}>
          <div className="home__field">
            <label className="label" htmlFor="nickname">닉네임</label>
            <input
              id="nickname"
              className="input"
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="게임에서 사용할 이름을 입력하세요"
              maxLength={12}
              autoComplete="off"
            />
          </div>

          <div className="home__field">
            <label className="label" htmlFor="school">학교</label>
            <select
              id="school"
              className="select"
              value={school}
              onChange={(e) => setSchool(e.target.value as School)}
            >
              <option value="" disabled>학교를 선택하세요</option>
              {SCHOOLS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {error && <p className="home__error">⚠ {error}</p>}

          <button type="submit" className="btn btn--primary home__submit">
            시작하기 →
          </button>
        </form>

        {/* 하단 배지 */}
        <div className="home__badge">
          <div className="home__badge-item">
            <span>🎓</span>
            <span>학교별 매칭</span>
          </div>
          <div className="home__badge-item">
            <span>⚡</span>
            <span>실시간 멀티플레이</span>
          </div>
          <div className="home__badge-item">
            <span>🗺️</span>
            <span>전용 맵</span>
          </div>
        </div>
      </div>
    </div>
  );
};
