// ============================================================
// Player 도메인 모델 (SRP: 플레이어 상태만 책임)
// ============================================================
import { Role, School } from '@mafia-university/shared';

export class Player {
  public x: number = 0;
  public y: number = 0;
  public isAlive: boolean = true;
  public isReady: boolean = false;
  public role: Role | null = null;

  constructor(
    public readonly id: string,      // Socket ID
    public readonly nickname: string,
    public readonly school: School,
  ) {}

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

  /** 사망 처리합니다 */
  kill(): void {
    this.isAlive = false;
  }

  /** 게임 재시작 시 상태를 초기화합니다 */
  reset(): void {
    this.isAlive = true;
    this.isReady = false;
    this.role = null;
    this.x = 0;
    this.y = 0;
  }

  /** 직렬화 (Socket 전송용) */
  toState() {
    return {
      id: this.id,
      nickname: this.nickname,
      school: this.school,
      x: this.x,
      y: this.y,
      isAlive: this.isAlive,
      isReady: this.isReady,
      role: this.role,
    };
  }
}
