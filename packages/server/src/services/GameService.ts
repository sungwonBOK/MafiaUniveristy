// ============================================================
// GameService (SRP: 마피아 게임 로직만 책임)
// ============================================================
import { Role } from '@mafia-university/shared';
import { Room } from '../domain/Room';
import { Player } from '../domain/Player';

export class GameService {
  // ── 게임 시작 ────────────────────────────────────────────────

  /**
   * 역할을 랜덤 배분합니다.
   * 배분 기준: 총 인원에 따라 마피아 수 결정
   *   2~4명 → 마피아 1명
   *   5~7명 → 마피아 2명, 의사 1명
   *   8~10명 → 마피아 2명, 탐정 1명, 의사 1명
   */
  assignRoles(room: Room): Map<string, Role> {
    const players = Array.from(room.players.values());
    const count = players.length;
    const roles = this.buildRolePool(count);

    // Fisher-Yates 셔플
    this.shuffle(players);
    this.shuffle(roles);

    const assignments = new Map<string, Role>();
    players.forEach((player, i) => {
      const role = roles[i] ?? 'citizen';
      player.assignRole(role);
      assignments.set(player.id, role);
    });

    room.phase = 'playing';
    return assignments;
  }

  // ── 킬 처리 ──────────────────────────────────────────────────

  /**
   * 마피아가 대상을 킬합니다.
   * 킬 성공 여부를 반환합니다.
   */
  processKill(room: Room, killerId: string, targetId: string): boolean {
    const killer = room.players.get(killerId);
    const target = room.players.get(targetId);
    if (!killer || !target) return false;
    if (killer.role !== 'mafia') return false;
    if (!target.isAlive) return false;

    target.kill();
    return true;
  }

  // ── 투표 집계 ────────────────────────────────────────────────

  /**
   * 투표 결과를 집계해 최다 득표자를 반환합니다.
   * 동점이면 null(추방 없음)을 반환합니다.
   */
  processVotes(votes: Map<string, string | null>): string | null {
    const tally = new Map<string, number>();

    for (const targetId of votes.values()) {
      if (targetId === null) continue;
      tally.set(targetId, (tally.get(targetId) ?? 0) + 1);
    }

    if (tally.size === 0) return null;

    const maxVotes = Math.max(...tally.values());
    const topCandidates = [...tally.entries()].filter(([, v]) => v === maxVotes);
    return topCandidates.length === 1 ? topCandidates[0][0] : null; // 동점 → null
  }

  // ── 승패 판정 ────────────────────────────────────────────────

  /**
   * 게임 종료 여부를 확인합니다.
   * 반환값: 'mafia' | 'citizen' | null (게임 계속)
   */
  checkWinCondition(room: Room): 'mafia' | 'citizen' | null {
    const alivePlayers = Array.from(room.players.values()).filter(p => p.isAlive);
    const aliveMafia  = alivePlayers.filter(p => p.role === 'mafia');
    const aliveCitizen = alivePlayers.filter(p => p.role !== 'mafia');

    if (aliveMafia.length === 0) return 'citizen'; // 마피아 전원 사망 → 시민 승
    if (aliveMafia.length >= aliveCitizen.length) return 'mafia'; // 마피아 ≥ 시민 → 마피아 승
    return null;
  }

  // ── 내부 유틸 ────────────────────────────────────────────────

  private buildRolePool(count: number): Role[] {
    if (count <= 4) {
      return ['mafia', ...Array(count - 1).fill('citizen') as Role[]];
    } else if (count <= 7) {
      return ['mafia', 'mafia', 'doctor', ...Array(count - 3).fill('citizen') as Role[]];
    } else {
      return ['mafia', 'mafia', 'detective', 'doctor', ...Array(count - 4).fill('citizen') as Role[]];
    }
  }

  private shuffle<T>(arr: T[]): void {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }
}
