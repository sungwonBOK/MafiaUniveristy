// ============================================================
// NetworkManager — 멀티플레이 동기화 (SRP, 저지연 핵심)
//
// [저지연 전략]
// 1. 이동 입력이 바뀐 프레임만 서버에 전송 (불필요한 패킷 제거)
// 2. 원격 플레이어는 lerp()로 부드럽게 보간
// 3. 자신의 이동은 클라이언트에서 즉시 반영 (클라이언트 예측)
// ============================================================
import Phaser from 'phaser';
import type { Socket } from 'socket.io-client';
import { EVENTS } from '@mafia-university/shared';
import { PlayerEntity } from '../entities/PlayerEntity';
import { networkMetricsService } from '../../services/NetworkMetricsService';

interface RemoteSnapshot {
  entity: PlayerEntity;
  targetX: number;
  targetY: number;
}

export class NetworkManager {
  /** 원격 플레이어 스냅샷 (id → 보간 데이터) */
  private remotes: Map<string, RemoteSnapshot> = new Map();

  /** 이전 프레임 이동 입력 (변화 감지용) */
  private prevVx = 0;
  private prevVy = 0;

  /** 마지막 전송 시각 (쓰로틀링) */
  private lastSendTime = 0;
  /** 최소 전송 간격 (ms) — 50ms = 20fps 상당 */
  private readonly SEND_INTERVAL = 40;

  constructor(
    private readonly socket: Socket,
    private readonly roomId: string,
    private readonly scene: Phaser.Scene,
  ) {
    this.setupListeners();
  }

  // ── 이벤트 구독 ──────────────────────────────────────────

  private setupListeners(): void {
    // 원격 플레이어 위치 수신
    this.socket.on(EVENTS.PLAYER_STATE, (state: { id: string; x: number; y: number }) => {
      networkMetricsService.trackInbound(EVENTS.PLAYER_STATE, state);
      const snap = this.remotes.get(state.id);
      if (snap) {
        snap.targetX = state.x;
        snap.targetY = state.y;
      }
    });
  }

  // ── 원격 플레이어 등록 ────────────────────────────────────

  addRemotePlayer(entity: PlayerEntity): void {
    this.remotes.set(entity.playerId, {
      entity,
      targetX: entity.x,
      targetY: entity.y,
    });
  }

  removeRemotePlayer(id: string): void {
    const snap = this.remotes.get(id);
    snap?.entity.destroy();
    this.remotes.delete(id);
  }

  // ── 매 프레임 호출 ───────────────────────────────────────

  /**
   * @param myEntity  내 플레이어 엔티티
   * @param vx        현재 이동 입력 x
   * @param vy        현재 이동 입력 y
   * @param speed     이동 속도
   */
  update(myEntity: PlayerEntity, vx: number, vy: number, speed: number): void {
    const now = Date.now();

    // ① 내 플레이어 이동 (클라이언트 예측 — 즉시 반영)
    myEntity.setVelocity(vx * speed, vy * speed);

    // ② 입력이 변했거나 쓰로틀 간격이 지났을 때만 서버에 전송
    const inputChanged = vx !== this.prevVx || vy !== this.prevVy;
    if (inputChanged || (vx !== 0 || vy !== 0) && now - this.lastSendTime > this.SEND_INTERVAL) {
      const movePayload = {
        roomId: this.roomId,
        x: myEntity.x,
        y: myEntity.y,
      };
      networkMetricsService.trackOutbound(EVENTS.PLAYER_MOVE, movePayload);
      this.socket.emit(EVENTS.PLAYER_MOVE, movePayload);
      this.prevVx = vx;
      this.prevVy = vy;
      this.lastSendTime = now;
    }

    // ③ 원격 플레이어 lerp 보간 (끊김 없이 부드럽게)
    for (const snap of this.remotes.values()) {
      const dist = Phaser.Math.Distance.Between(
        snap.entity.x,
        snap.entity.y,
        snap.targetX,
        snap.targetY,
      );

      const lerpFactor = dist > 80 ? 0.30 : dist > 24 ? 0.24 : 0.20;
      snap.entity.x = Phaser.Math.Linear(snap.entity.x, snap.targetX, lerpFactor);
      snap.entity.y = Phaser.Math.Linear(snap.entity.y, snap.targetY, lerpFactor);
    }
  }

  destroy(): void {
    this.socket.off(EVENTS.PLAYER_STATE);
  }
}
