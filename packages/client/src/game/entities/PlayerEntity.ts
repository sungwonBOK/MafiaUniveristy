// ============================================================
// Player 엔티티 (Phaser3)
// 게임 내 플레이어 스프라이트와 입력 처리를 담당합니다.
// ============================================================
import Phaser from 'phaser';

export class PlayerEntity extends Phaser.GameObjects.Container {
  /** 이동 속도 (픽셀/초) */
  static readonly SPEED = 160;

  private body_sprite: Phaser.GameObjects.Arc;
  private nameLabel: Phaser.GameObjects.Text;
  public physicsBody!: Phaser.Physics.Arcade.Body;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    public readonly playerId: string,
    public readonly nickname: string,
    color: number = 0x6366f1,
  ) {
    super(scene, x, y);

    // 몸체 (원형)
    this.body_sprite = scene.add.circle(0, 0, 14, color);

    // 눈 장식
    const eyeL = scene.add.circle(-5, -3, 3, 0xffffff);
    const eyeR = scene.add.circle(5, -3, 3, 0xffffff);

    // 닉네임 레이블
    this.nameLabel = scene.add.text(0, 22, nickname, {
      fontSize: '11px',
      fontFamily: 'Noto Sans KR, sans-serif',
      color: '#e2e8ff',
      stroke: '#00000088',
      strokeThickness: 3,
      align: 'center',
    }).setOrigin(0.5, 0);

    this.add([this.body_sprite, eyeL, eyeR, this.nameLabel]);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.physicsBody = this.body as Phaser.Physics.Arcade.Body;
    this.physicsBody.setCollideWorldBounds(true);
    this.physicsBody.setCircle(14, -14, -14);
  }

  /** 방향벡터로 이동 (NetworkManager에서 호출) */
  setVelocity(vx: number, vy: number): void {
    this.physicsBody.setVelocity(vx, vy);
  }

  /** 색상 변경 (역할 표시용) */
  setBodyColor(color: number): void {
    this.body_sprite.setFillStyle(color);
  }

  /** 사망 처리 시각 효과 */
  die(): void {
    this.setAlpha(0.35);
    this.nameLabel.setText(`✝ ${this.nickname}`);
    this.physicsBody.setVelocity(0, 0);
    this.physicsBody.enable = false;
  }
}
