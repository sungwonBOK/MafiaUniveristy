// ============================================================
// GameService (SRP: 마피아 게임 로직만 책임)
// ============================================================
import {
  Role,
  Winner,
  isKillRole,
  isProfessorFaction,
} from '@mafia-university/shared';
import { Room } from '../domain/Room';

export class GameService {
  // ── 게임 시작 ────────────────────────────────────────────────

  /**
   * 역할을 랜덤 배분합니다.
   * 배분 기준: 총 인원에 따라 교수진 수를 조절하고
   * 나머지는 학생 진영 역할 사이클로 채웁니다.
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
      const role = roles[i] ?? 'president';
      player.assignRole(role);
      assignments.set(player.id, role);
    });

    room.phase = 'playing';
    return assignments;
  }

  // ── 킬 처리 ──────────────────────────────────────────────────

  /**
   * 킬 가능한 역할(현재 교수/레거시 마피아)이 대상을 킬합니다.
   * 킬 성공 여부를 반환합니다.
   */
  processKill(room: Room, killerId: string, targetId: string): boolean {
    const killer = room.players.get(killerId);
    const target = room.players.get(targetId);
    if (!killer || !target) return false;
    if (!isKillRole(killer.role)) return false;
    if (!target.isAlive) return false;
    if (isProfessorFaction(target.role)) return false;

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
   * 현재 winner 문자열은 클라이언트 EndScene 호환을 위해 유지합니다.
   */
  checkWinCondition(room: Room): Winner | null {
    const alivePlayers = Array.from(room.players.values()).filter(p => p.isAlive);
    const aliveProfessor = alivePlayers.filter(p => isProfessorFaction(p.role));
    const aliveNonProfessor = alivePlayers.filter(p => !isProfessorFaction(p.role));

    if (aliveProfessor.length === 0) return 'citizen';
    if (aliveProfessor.length >= aliveNonProfessor.length) return 'mafia';
    return null;
  }

  // ── 내부 유틸 ────────────────────────────────────────────────

  private buildRolePool(count: number): Role[] {
    const professorRoles: Role[] =
      count <= 4
        ? ['professor']
        : count <= 8
          ? ['professor', 'grad_student']
          : ['professor', 'impersonator'];

    const studentRoleCycle: Role[] = [
      'president',
      'investigator',
      'freshman',
      'topstudent',
      'jobseeker',
    ];

    const rolePool: Role[] = [...professorRoles];

    let studentRoleIndex = 0;
    while (rolePool.length < count) {
      rolePool.push(studentRoleCycle[studentRoleIndex % studentRoleCycle.length]);
      studentRoleIndex += 1;
    }

    return rolePool;
  }

  private shuffle<T>(arr: T[]): void {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }
}
