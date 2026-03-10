// ============================================================
// Room 도메인 모델 (SRP: 방의 구성원 관리만 책임)
// ============================================================
import { GamePhase, RoomInfo, School } from '@mafia-university/shared';
import { Player } from './Player';

export interface QueuedPlayerState {
  id: string;
  x: number;
  y: number;
}

export class Room {
  public players: Map<string, Player> = new Map();
  public phase: GamePhase = 'waiting';
  public readonly maxPlayers: number = 10;
  private pendingPlayerStates: Map<string, QueuedPlayerState> = new Map();

  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly school: School,
    public hostId: string,
  ) {}

  // ── 플레이어 관리 ────────────────────────────────────────────

  addPlayer(player: Player): boolean {
    if (this.players.size >= this.maxPlayers) return false;
    this.players.set(player.id, player);
    return true;
  }

  removePlayer(playerId: string): void {
    this.players.delete(playerId);
    this.pendingPlayerStates.delete(playerId);
    // 방장이 나갔을 때 다음 플레이어에게 방장 위임
    if (this.hostId === playerId && this.players.size > 0) {
      this.hostId = this.players.values().next().value!.id;
    }
  }

  getPlayer(playerId: string): Player | undefined {
    return this.players.get(playerId);
  }

  isEmpty(): boolean {
    return this.players.size === 0;
  }

  isFull(): boolean {
    return this.players.size >= this.maxPlayers;
  }

  enqueuePlayerState(playerId: string, x: number, y: number): void {
    this.pendingPlayerStates.set(playerId, {
      id: playerId,
      x,
      y,
    });
  }

  drainQueuedPlayerStates(): QueuedPlayerState[] {
    if (this.pendingPlayerStates.size === 0) return [];
    const states = Array.from(this.pendingPlayerStates.values());
    this.pendingPlayerStates.clear();
    return states;
  }

  // ── 준비 상태 확인 ───────────────────────────────────────────

  /** 방장을 제외한 모든 플레이어가 준비됐는지 확인 */
  allReady(): boolean {
    if (this.players.size < 2) return false;
    for (const [id, player] of this.players) {
      if (id !== this.hostId && !player.isReady) return false;
    }
    return true;
  }

  // ── 직렬화 (Socket 전송용) ───────────────────────────────────

  toInfo(): RoomInfo {
    return {
      id: this.id,
      name: this.name,
      hostId: this.hostId,
      school: this.school,
      players: Array.from(this.players.values()).map(p => p.toState()),
      maxPlayers: this.maxPlayers,
      phase: this.phase,
    };
  }
}
