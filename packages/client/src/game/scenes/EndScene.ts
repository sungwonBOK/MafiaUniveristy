// ============================================================
// EndScene.ts — 게임 승패 결과를 보여주는 화면
// ============================================================
import Phaser from 'phaser';
import { useGameStore } from '../../store/useGameStore';
import { socketService } from '../../services/SocketService';
import { EVENTS } from '@mafia-university/shared';
import type { RoomInfo, Winner } from '@mafia-university/shared';

export class EndScene extends Phaser.Scene {
  private winner!: Winner;

  constructor() {
    super({ key: 'EndScene' });
  }

  init(data: { winner: Winner }): void {
    this.winner = data.winner;
  }

  create(): void {
    const { width, height } = this.scale;
    const cx = width / 2;
    const cy = height / 2;

    // 배경 어둡게 만들기
    this.add.rectangle(cx, cy, width, height, 0x0a0a14);

    // 승리 텍스트 설정
    const isMafiaWin = this.winner === 'mafia';
    const mainText = isMafiaWin ? '마피아 승리' : '시민 승리';
    const mainColor = isMafiaWin ? '#f43f5e' : '#3b82f6';
    const subText = isMafiaWin ? '마피아가 시민을 모두 처치했습니다.' : '마피아를 성공적으로 검거했습니다.';

    // 승리 애니메이션 텍스트
    const title = this.add.text(cx, cy - 50, mainText, {
      fontSize: '64px',
      fontFamily: 'Noto Sans KR, sans-serif',
      color: mainColor,
      stroke: '#000000',
      strokeThickness: 8,
      fontStyle: 'bold',
    }).setOrigin(0.5).setAlpha(0).setScale(0.5);

    const desc = this.add.text(cx, cy + 40, subText, {
      fontSize: '20px',
      fontFamily: 'Noto Sans KR, sans-serif',
      color: '#cbd5e1',
    }).setOrigin(0.5).setAlpha(0);

    // 단순한 줌인 페이드 애니메이션
    this.tweens.add({
      targets: title,
      alpha: 1,
      scale: 1,
      duration: 1000,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.tweens.add({
          targets: desc,
          alpha: 1,
          duration: 500,
        });
      }
    });

    // ── 방장/일반 플레이어 구분 버튼 ────────────────────────────
    const { myId, currentRoom } = useGameStore.getState();
    const isHost = currentRoom?.hostId === myId;

    const returnButton = this.add.text(cx, cy + 120,
      isHost ? '🔄 게임 재시작 (대기방으로)' : '⏳ 방장이 재시작하길 기다리는 중...', {
      fontSize: '18px',
      fontFamily: 'Noto Sans KR, sans-serif',
      color: isHost ? '#ffffff' : '#666688',
      backgroundColor: '#1e1e2f',
      padding: { x: 20, y: 10 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: isHost }).setAlpha(0);

    this.tweens.add({
      targets: returnButton,
      alpha: 1,
      delay: 1500,
      duration: 500,
    });

    if (isHost) {
      returnButton.on('pointerover', () => returnButton.setStyle({ fill: '#a78bfa' }));
      returnButton.on('pointerout', () => returnButton.setStyle({ fill: '#ffffff' }));
      returnButton.on('pointerdown', () => this.requestReset());
    }

    // ── 서버의 GAME_RESET 수신 → 대기방으로 이동 ────────────────
    // 방장이 리셋하면 모든 클라이언트(방장 포함)가 이 이벤트를 받습니다.
    const socket = socketService.getSocket();
    socket.once(EVENTS.GAME_RESET, (roomInfo: RoomInfo) => {
      this.goToWaitingRoom(roomInfo);
    });

    // 창 리사이즈
    this.scale.on('resize', (gameSize: Phaser.Structs.Size) => {
      const gCx = gameSize.width / 2;
      const gCy = gameSize.height / 2;
      title.setPosition(gCx, gCy - 50);
      desc.setPosition(gCx, gCy + 40);
      returnButton.setPosition(gCx, gCy + 120);
    });
  }

  // ── 방장: 서버에 방 초기화 요청 ────────────────────────────────
  private requestReset(): void {
    const { currentRoom } = useGameStore.getState();
    if (!currentRoom) return;
    const socket = socketService.getSocket();
    socket.emit(EVENTS.RESET_GAME, currentRoom.id);
  }

  // ── 모든 플레이어: 대기방 화면으로 전환 ─────────────────────────
  private goToWaitingRoom(roomInfo: RoomInfo): void {
    const store = useGameStore.getState();

    // 씬 파괴 전 키보드 리스너 제거
    this.input.keyboard?.removeAllKeys();

    // 인게임 잔여 상태(remotePlayers, 역할, 회의, 투표채팅) 일괄 초기화
    store.resetGameState();
    // 서버에서 받은 최신 roomInfo로 갱신 (플레이어 isReady/isAlive 등이 리셋된 상태)
    store.setCurrentRoom(roomInfo);

    // 화면을 대기방으로 전환
    store.setScreen('waiting');
  }

  // ── 씬 종료 시 정리 ──────────────────────────────────────────
  shutdown(): void {
    // GAME_RESET 리스너 정리 (once이므로 대부분 자동 해제되지만 안전하게 명시)
    socketService.getSocket().off(EVENTS.GAME_RESET);
  }
}
