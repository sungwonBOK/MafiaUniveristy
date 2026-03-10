// ============================================================
// GameView — React가 Phaser3 게임을 마운트하는 래퍼 컴포넌트
// ============================================================
import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { useGameStore } from '../../store/useGameStore';
import { socketService } from '../../services/SocketService';
import { PreloadScene } from '../../game/scenes/PreloadScene';
import { GameScene } from '../../game/scenes/GameScene';
import { UIScene } from '../../game/scenes/UIScene';
import { EndScene } from '../../game/scenes/EndScene';
import { VotingModal } from './VotingModal';

export const GameView: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);

  // useRef로 최신 스토어 값을 항상 참조합니다.
  // useEffect의 빈 의존성 배열([])은 "마운트 시 한 번만 실행"을 보장하지만,
  // 클로저 내부 변수가 초기값에 고정되는 stale closure 문제가 발생합니다.
  // 특히 myId(socket.id)가 두 번째 게임 세션에서 잘못된 값이 되면
  // ABILITY_RESULT의 targetId 비교가 실패해 킬이 피해자 클라이언트에만 반영 안되는 버그 발생.
  const storeRef = useRef(useGameStore.getState());
  useEffect(() => {
    // Zustand 상태가 바뀔 때마다 storeRef를 최신으로 유지
    return useGameStore.subscribe((state) => {
      storeRef.current = state;
    });
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    // 혹시 이전 인스턴스가 남아있으면 먼저 파괴 (두 번째 게임 시작 보장)
    if (gameRef.current) {
      gameRef.current.destroy(true);
      gameRef.current = null;
    }

    // useRef를 통해 최신 스토어 값을 읽음 (stale closure 완전 방지)
    const { myId, nickname, currentRoom } = storeRef.current;
    if (!currentRoom || !myId) return;

    const socket = socketService.getSocket();

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent: containerRef.current,
      width: window.innerWidth,
      height: window.innerHeight,
      backgroundColor: '#0a0a14',
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { x: 0, y: 0 },
          debug: false,
        },
      },
      scene: [PreloadScene, GameScene, UIScene, EndScene],
      callbacks: {
        preBoot: (game) => {
          // Phaser 레지스트리에 게임 초기화 데이터 저장
          // PreloadScene의 create()에서 이 데이터로 GameScene을 시작합니다
          game.registry.set('gameSceneData', {
            socket,
            myId,
            nickname,
            room: currentRoom,
          });
        },
      },
    };

    gameRef.current = new Phaser.Game(config);

    const handleResize = () => {
      gameRef.current?.scale.resize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, []);

  return (
    <>
      <div
        ref={containerRef}
        style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}
      />
      <VotingModal />
    </>
  );
};
