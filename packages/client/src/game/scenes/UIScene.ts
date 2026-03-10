// ============================================================
// UIScene — 게임 씬 위단에 덮어지는 UI (역할, 회의 소집 등)
// Zustand 스토어와 직접 상호작용하여 상태를 렌더링합니다.
// ============================================================
import Phaser from 'phaser';
import { useGameStore } from '../../store/useGameStore';
import { socketService } from '../../services/SocketService';
import { EVENTS } from '@mafia-university/shared';

export class UIScene extends Phaser.Scene {
  private roleText!: Phaser.GameObjects.Text;
  private callMeetingText!: Phaser.GameObjects.Text;
  private callMeetingKey!: Phaser.Input.Keyboard.Key;
  /** Zustand 구독 해제 함수 — shutdown() 시 반드시 호출해야 좀비 구독자 버그 방지 */
  private unsubscribeStore?: () => void;

  constructor() {
    super({ key: 'UIScene' });
  }

  create(): void {
    const { width } = this.scale;

    // ── 역할 텍스트 (위측 중앙) ────────────────────────────────────
    const roleContent = this.getRoleFormattedText();
    this.roleText = this.add.text(width / 2, 20, roleContent, {
      fontSize: '20px',
      fontFamily: 'Noto Sans KR, sans-serif',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4,
      fontStyle: 'bold',
    }).setOrigin(0.5, 0);

    // ── 긴급 회의 소집 (우측 하단) ──────────────────────────────────
    this.callMeetingText = this.add.text(width - 20, this.scale.height - 30, '🚨 긴급 회의 (R)', {
      fontSize: '16px',
      fontFamily: 'Noto Sans KR, sans-serif',
      color: '#f43f5e',
      stroke: '#000000',
      strokeThickness: 3,
      fontStyle: 'bold',
      backgroundColor: '#1a1a2e',
      padding: { x: 10, y: 5 },
    }).setOrigin(1, 1).setInteractive({ useHandCursor: true });

    // 단축키 설정
    if (this.input.keyboard) {
      this.callMeetingKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);
    }

    // 마우스 클릭
    this.callMeetingText.on('pointerdown', () => this.callMeeting());

    // ── 상태 변경 감지 (Zustand) ────────────────────────────────────
    // 역할이 바뀔 때 (시작 후 지연 배정 등) 텍스트 갱신.
    // 반환된 unsubscribe 함수를 반드시 저장해야 씬 파괴 후 좀비 구독 방지 가능.
    this.unsubscribeStore = useGameStore.subscribe((state, prevState) => {
      if (state.myRole !== prevState.myRole) {
        // 씬이 이미 파괴된 경우를 대비해 roleText 존재 여부 확인
        if (this.roleText?.active) {
          this.roleText.setText(this.getRoleFormattedText());
        }
      }
    });

    // 화면 리사이즈 대응
    this.scale.on('resize', (gameSize: Phaser.Structs.Size) => {
      this.roleText.setPosition(gameSize.width / 2, 20);
      this.callMeetingText.setPosition(gameSize.width - 20, gameSize.height - 30);
    });
  }

  shutdown(): void {
    // Zustand 구독 해제: 이 줄이 없으면 씬 파괴 후에도 콜백이 살아남아
    // null이 된 Phaser 게임오브젝트를 참조하는 'drawImage' TypeError 발생
    this.unsubscribeStore?.();
    this.input.keyboard?.removeAllKeys();
  }

  update(): void {
    // R키 입력 감지
    if (Phaser.Input.Keyboard.JustDown(this.callMeetingKey)) {
      this.callMeeting();
    }
  }

  private callMeeting(): void {
    const socket = socketService.getSocket();
    const { currentRoom } = useGameStore.getState();
    if (!currentRoom) return;
    
    // 서버에 회의 소집 이벤트 전송 (조건 체크는 서버가 함)
    socket.emit(EVENTS.CALL_MEETING, currentRoom.id);
  }

  private getRoleFormattedText(): string {
    const role = useGameStore.getState().myRole;
    switch (role) {
      case 'mafia': return '당신은 🔪 마피아입니다';
      case 'doctor': return '당신은 💉 의사입니다';
      case 'detective': return '당신은 🔍 탐정입니다';
      case 'citizen': return '당신은 🧑‍🎓 시민입니다';
      default: return '역할 확인 중...';
    }
  }
}
