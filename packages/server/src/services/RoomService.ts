// ============================================================
// RoomService (SRP: 방 CRUD와 학교별 격리만 책임)
// ============================================================
import { randomBytes } from 'crypto';
import { RoomInfo, School } from '@mafia-university/shared';
import { Room } from '../domain/Room';
import { Player } from '../domain/Player';

export class RoomService {
  /** 전체 방 목록 (roomId → Room) */
  private rooms: Map<string, Room> = new Map();

  /** 학교별 방 ID 인덱스 (빠른 조회용) */
  private schoolIndex: Map<School, Set<string>> = new Map();

  // ── 방 생성 ──────────────────────────────────────────────────

  createRoom(host: Player, roomName: string): Room {
    const roomId = randomBytes(4).toString('hex');  // 8자리 hex ID
    const room = new Room(roomId, roomName, host.school, host.id);

    this.rooms.set(roomId, room);
    this.getOrCreateSchoolSet(host.school).add(roomId);
    room.addPlayer(host);

    return room;
  }

  // ── 방 참가 ──────────────────────────────────────────────────

  joinRoom(roomId: string, player: Player): { success: boolean; error?: string } {
    const room = this.rooms.get(roomId);
    if (!room) return { success: false, error: '방을 찾을 수 없습니다.' };
    if (room.school !== player.school) return { success: false, error: '같은 학교 방에만 입장할 수 있습니다.' };
    if (room.isFull()) return { success: false, error: '방이 꽉 찼습니다.' };
    if (room.phase !== 'waiting') return { success: false, error: '이미 게임이 시작된 방입니다.' };

    room.addPlayer(player);
    return { success: true };
  }

  // ── 방 퇴장 ──────────────────────────────────────────────────

  leaveRoom(roomId: string, playerId: string): void {
    const room = this.rooms.get(roomId);
    if (!room) return;

    room.removePlayer(playerId);
    if (room.isEmpty()) {
      this.deleteRoom(roomId, room.school);
    }
  }

  // ── 조회 ─────────────────────────────────────────────────────

  getRoom(roomId: string): Room | undefined {
    return this.rooms.get(roomId);
  }

  forEachRoom(callback: (room: Room) => void): void {
    for (const room of this.rooms.values()) {
      callback(room);
    }
  }

  /** 해당 학교의 방 목록만 반환 (학교 격리 핵심 로직) */
  getRoomListBySchool(school: School): RoomInfo[] {
    const ids = this.schoolIndex.get(school) ?? new Set();
    return Array.from(ids)
      .map(id => this.rooms.get(id))
      .filter(Boolean)
      .map(room => room!.toInfo());
  }

  // ── 내부 유틸 ────────────────────────────────────────────────

  private deleteRoom(roomId: string, school: School): void {
    this.rooms.delete(roomId);
    this.schoolIndex.get(school)?.delete(roomId);
  }

  private getOrCreateSchoolSet(school: School): Set<string> {
    if (!this.schoolIndex.has(school)) {
      this.schoolIndex.set(school, new Set());
    }
    return this.schoolIndex.get(school)!;
  }
}
