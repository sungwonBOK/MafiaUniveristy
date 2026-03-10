// ============================================================
// InputManager — 키보드 입력 처리 (SRP)
// WASD 이동만 담당합니다.
// ============================================================
import Phaser from 'phaser';

export class InputManager {
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd: {
    up: Phaser.Input.Keyboard.Key;
    down: Phaser.Input.Keyboard.Key;
    left: Phaser.Input.Keyboard.Key;
    right: Phaser.Input.Keyboard.Key;
  };
  private spaceKey: Phaser.Input.Keyboard.Key;

  constructor(scene: Phaser.Scene) {
    const kb = scene.input.keyboard!;
    this.cursors = kb.createCursorKeys();
    this.wasd = {
      up:    kb.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      down:  kb.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      left:  kb.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: kb.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };
    this.spaceKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
  }

  /** 현재 프레임 이동 벡터 반환 (정규화, 최대 1) */
  getMovement(): { vx: number; vy: number } {
    let vx = 0;
    let vy = 0;

    if (this.wasd.left.isDown  || this.cursors.left.isDown)  vx -= 1;
    if (this.wasd.right.isDown || this.cursors.right.isDown) vx += 1;
    if (this.wasd.up.isDown    || this.cursors.up.isDown)    vy -= 1;
    if (this.wasd.down.isDown  || this.cursors.down.isDown)  vy += 1;

    // 대각선 이동 시 정규화
    if (vx !== 0 && vy !== 0) {
      vx *= 0.707;
      vy *= 0.707;
    }

    return { vx, vy };
  }

  /** Space키가 이번 프레임에 눌렸는지 */
  isAbilityJustPressed(): boolean {
    return Phaser.Input.Keyboard.JustDown(this.spaceKey);
  }
}
