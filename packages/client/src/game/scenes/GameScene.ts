// ============================================================
// GameScene — 메인 게임 씬 (오케스트레이터 역할)
// 각 Manager가 실제 로직을 담당하고, GameScene은 조합만 합니다.
// ============================================================
import Phaser from 'phaser';
import type { Socket } from 'socket.io-client';
import { EVENTS } from '@mafia-university/shared';
import type { PlayerState, RoomInfo } from '@mafia-university/shared';
import { PlayerEntity } from '../entities/PlayerEntity';
import { InputManager } from '../managers/InputManager';
import { NetworkManager } from '../managers/NetworkManager';
import { SCHOOL_MAP_REGISTRY } from '../maps/SchoolMapRegistry';
import { useGameStore } from '../../store/useGameStore';

interface GameSceneData {
  socket: Socket;
  myId: string;
  nickname: string;
  room: RoomInfo;
}

export class GameScene extends Phaser.Scene {
  // ── 초기화 데이터 ─────────────────────────────────────────
  private socket!: Socket;
  private myId!: string;
  private nickname!: string;
  private room!: RoomInfo;

  // ── 매니저 ────────────────────────────────────────────────
  private inputManager!: InputManager;
  private networkManager!: NetworkManager;

  // ── 엔티티 ─────────────────────────────────────────────────
  private myPlayer!: PlayerEntity;
  private remotePlayers: Map<string, PlayerEntity> = new Map();

  // ── 타이머 ─────────────────────────────────────────────────
  /** 마피아 킬 쿨다운 (ms) */
  private abilityCooldown = 0;
  private readonly KILL_COOLDOWN = 25000;

  /** 내 플레이어 생존 여부 — false면 update()에서 이동 입력을 차단합니다 */
  private isMyPlayerAlive = true;

  constructor() {
    super({ key: 'GameScene' });
  }

  // ── 씬 초기화 ────────────────────────────────────────────

  init(data: GameSceneData): void {
    this.socket = data.socket;
    this.myId = data.myId;
    this.nickname = data.nickname;
    this.room = data.room;
  }

  create(): void {
    // ① 매니저 먼저 초기화 (spawnRemotePlayer에서 사용하므로 최우선)
    this.inputManager = new InputManager(this);
    this.networkManager = new NetworkManager(this.socket, this.room.id, this);

    // ② 맵, 내 플레이어, 원격 플레이어 순서대로 생성
    this.createMap();
    this.createMyPlayer();
    this.createRemotePlayers();   // 내부에서 networkManager.addRemotePlayer 호출

    // ③ UI 씬 시작
    this.scene.launch('UIScene');

    this.setupGameEvents();
    this.setupCamera();
  }

  // ── 매 프레임 업데이트 ────────────────────────────────────

  update(time: number, _delta: number): void {
    // 사망 상태에서는 이동 입력 처리 완전 차단
    if (!this.isMyPlayerAlive) return;

    const { vx, vy } = this.inputManager.getMovement();
    this.networkManager.update(this.myPlayer, vx, vy, PlayerEntity.SPEED);

    // Space키 능력 사용
    if (this.inputManager.isAbilityJustPressed() && time > this.abilityCooldown) {
      this.useAbility();
    }
  }

  // ── 내부 초기화 메서드 ────────────────────────────────────

  private createMap(): void {
    const mapConfig = SCHOOL_MAP_REGISTRY[this.room.school];

    try {
      const map = this.make.tilemap({ key: mapConfig.tilemapKey });
      const tileset = map.addTilesetImage('tiles', 'tiles_prototype');
      if (tileset) {
        const groundLayer = map.createLayer('Ground', tileset, 0, 0);
        const wallLayer = map.createLayer('Walls', tileset, 0, 0);

        // 학교별 색조 적용
        groundLayer?.setTint(mapConfig.tint);
        wallLayer?.setCollisionByProperty({ collides: true });

        if (wallLayer && this.myPlayer) {
          this.physics.add.collider(this.myPlayer, wallLayer);
        }

        this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
      }
    } catch {
      // 에셋 없을 때 (초기 개발) 단순 배경으로 대체
      this.createPrototypeBackground(mapConfig.tint);
    }
  }

  /** 에셋 없을 때 사용하는 임시 배경 */
  private createPrototypeBackground(tint: number): void {
    const { width, height } = this.scale;

    // 배경
    this.add.rectangle(width / 2, height / 2, width, height, 0x0a0a14);

    // 그리드 라인 (통로 표현)
    const graphics = this.add.graphics();
    graphics.lineStyle(1, tint, 0.15);
    for (let x = 0; x < width; x += 48) {
      graphics.lineBetween(x, 0, x, height);
    }
    for (let y = 0; y < height; y += 48) {
      graphics.lineBetween(0, y, width, y);
    }

    // 방 이름 표시
    this.add.text(width / 2, 30, `🗺️ ${this.room.school} — 프로토타입 맵`, {
      fontSize: '13px',
      color: '#' + tint.toString(16).padStart(6, '0'),
      fontFamily: 'Noto Sans KR, sans-serif',
    }).setOrigin(0.5, 0).setScrollFactor(0);

    this.physics.world.setBounds(0, 0, width, height);
  }

  private createMyPlayer(): void {
    const { width, height } = this.scale;
    this.myPlayer = new PlayerEntity(this, width / 2, height / 2, this.myId, this.nickname, 0x6366f1);
  }

  private createRemotePlayers(): void {
    for (const p of this.room.players) {
      if (p.id === this.myId) continue;
      this.spawnRemotePlayer(p);
    }
  }


  private spawnRemotePlayer(state: PlayerState): void {
    const entity = new PlayerEntity(this, state.x || 200, state.y || 200, state.id, state.nickname, 0xf43f5e);
    this.remotePlayers.set(state.id, entity);
    this.networkManager.addRemotePlayer(entity);
  }

  private setupCamera(): void {
    this.cameras.main.startFollow(this.myPlayer, true, 0.1, 0.1);
  }

  // ── 게임 이벤트 처리 ─────────────────────────────────────

  private setupGameEvents(): void {
    // 플레이어 사망
    this.socket.on(EVENTS.ABILITY_RESULT, (data: { type: string; targetId: string }) => {
      if (data.type === 'kill') {
        const entity = this.remotePlayers.get(data.targetId);
        entity?.die();
        if (data.targetId === this.myId) {
          this.isMyPlayerAlive = false;  // 이동 차단 플래그 비활성화
          this.myPlayer.die();
          this.showDeathMessage();
        }
      }
    });

    // 투표 회의 시작
    this.socket.on(EVENTS.MEETING_STARTED, (data: { callerId: string }) => {
      useGameStore.getState().setMeetingInfo(true, data.callerId);
    });

    // 투표 결과 (누군가 추방됨)
    this.socket.on(EVENTS.VOTE_RESULT, (data: { ejectedId: string | null; roomInfo: any }) => {
      // 투표 창 닫기
      useGameStore.getState().setMeetingInfo(false);
      
      if (data.ejectedId) {
        if (data.ejectedId === this.myId) {
          this.isMyPlayerAlive = false;  // 투표 추방 시에도 이동 차단
          this.myPlayer.die();
          this.showDeathMessage();
        } else {
          this.remotePlayers.get(data.ejectedId)?.die();
        }
      }
    });

    // 게임 종료
    // shutdown()을 먼저 호출해 모든 소켓 리스너를 즉시 제거합니다.
    // scene.start()는 Phaser 내부 큐에 비동기 등록되므로,
    // 그 찰나에 도착하는 ABILITY_RESULT 등이 파괴된 Phaser 객체를
    // 건드리는 TypeError를 차단하는 것이 목적입니다.
    this.socket.on(EVENTS.GAME_ENDED, (data: { winner: string }) => {
      this.shutdown();
      this.scene.start('EndScene', { winner: data.winner });
    });
  }

  private useAbility(): void {
    // 가장 가까운 살아있는 플레이어 탐색 (킬 범위: 60px)
    const RANGE = 60;
    let nearestId: string | null = null;
    let nearestDist = RANGE;

    for (const [id, entity] of this.remotePlayers) {
      const dist = Phaser.Math.Distance.Between(this.myPlayer.x, this.myPlayer.y, entity.x, entity.y);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearestId = id;
      }
    }

    if (nearestId) {
      this.socket.emit(EVENTS.USE_ABILITY, {
        roomId: this.room.id,
        targetId: nearestId,
      });
      this.abilityCooldown = this.time.now + this.KILL_COOLDOWN;
    }
  }

  private showDeathMessage(): void {
    const { width, height } = this.scale;
    this.add.text(width / 2, height / 2, '💀 사망했습니다\n유령으로 게임을 관전합니다', {
      fontSize: '20px',
      color: '#f43f5e',
      fontFamily: 'Noto Sans KR, sans-serif',
      align: 'center',
      stroke: '#000',
      strokeThickness: 4,
    }).setOrigin(0.5).setScrollFactor(0);
  }

  // ── 씬 종료 시 정리 ──────────────────────────────────────

  shutdown(): void {
    this.networkManager?.destroy();
    this.socket.off(EVENTS.ABILITY_RESULT);
    this.socket.off(EVENTS.MEETING_STARTED);
    this.socket.off(EVENTS.VOTE_RESULT);
    this.socket.off(EVENTS.GAME_ENDED);
  }
}
