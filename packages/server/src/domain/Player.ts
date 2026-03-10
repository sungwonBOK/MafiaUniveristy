// ============================================================
// Player 도메인 모델 (SRP: 플레이어 상태만 책임)
// ============================================================
import { PlayerState, Role, School } from '@mafia-university/shared';

export class Player {
  public x: number = 0;
  public y: number = 0;
  public isAlive: boolean = true;
  public isReady: boolean = false;
  public role: Role | null = null;
  public readonly realNickname: string;
  public readonly realColor: string;
  public displayNickname: string;
  public displayColor: string;

  constructor(
    public readonly id: string,      // Socket ID
    nickname: string,
    public readonly school: School,
    color: string = '#6366f1',
  ) {
    this.realNickname = nickname;
    this.realColor = color;
    this.displayNickname = nickname;
    this.displayColor = color;
  }

  get nickname(): string {
    return this.displayNickname;
  }

  /** 준비 상태를 토글합니다 */
  toggleReady(): void {
    this.isReady = !this.isReady;
  }

  /** 위치를 업데이트합니다 */
  updatePosition(x: number, y: number): void {
    this.x = x;
    this.y = y;
  }

  /** 역할을 배정합니다 */
  assignRole(role: Role): void {
    this.role = role;
  }

  /** 표시용 신원을 변경합니다 (실제 신원은 유지) */
  setDisplayIdentity(nickname: string, color: string): void {
    this.displayNickname = nickname;
    this.displayColor = color;
  }

  /** 표시용 신원을 실제 신원으로 복원합니다 */
  resetDisplayIdentity(): void {
    this.displayNickname = this.realNickname;
    this.displayColor = this.realColor;
  }

  /** 사망 처리합니다 */
  kill(): void {
    this.isAlive = false;
  }

  /** 게임 재시작 시 상태를 초기화합니다 */
  reset(): void {
    this.isAlive = true;
    this.isReady = false;
    this.role = null;
    this.resetDisplayIdentity();
    this.x = 0;
    this.y = 0;
  }

  /** 직렬화 (Socket 전송용) */
  toState(): PlayerState {
    return {
      id: this.id,
      nickname: this.displayNickname,
      displayNickname: this.displayNickname,
      displayColor: this.displayColor,
      school: this.school,
      x: this.x,
      y: this.y,
      isAlive: this.isAlive,
      isReady: this.isReady,
      role: this.role,
    };
  }
}
