import Phaser from 'phaser';
import type { Socket } from 'socket.io-client';
import { EVENTS } from '@mafia-university/shared';
import type { PlayerState, RoomInfo, VoteProgressInfo, Winner } from '@mafia-university/shared';
import { PlayerEntity } from '../entities/PlayerEntity';
import { InputManager } from '../managers/InputManager';
import { NetworkManager } from '../managers/NetworkManager';
import {
  getSchoolMapConfig,
  type SchoolMapConfig,
} from '../maps/SchoolMapRegistry';
import { buildProceduralSchoolMap } from '../maps/procedural';
import { useGameStore } from '../../store/useGameStore';

interface GameSceneData {
  socket: Socket;
  myId: string;
  nickname: string;
  room: RoomInfo;
}

export class GameScene extends Phaser.Scene {
  private socket!: Socket;
  private myId!: string;
  private nickname!: string;
  private room!: RoomInfo;
  private inputManager!: InputManager;
  private networkManager!: NetworkManager;
  private myPlayer!: PlayerEntity;
  private remotePlayers: Map<string, PlayerEntity> = new Map();
  private activeMapConfig!: SchoolMapConfig;
  private mapColliders?: Phaser.Physics.Arcade.StaticGroup;
  private wallLayer?: Phaser.Tilemaps.TilemapLayer;

  private abilityCooldown = 0;
  private readonly KILL_COOLDOWN = 25000;
  private isMyPlayerAlive = true;

  constructor() {
    super({ key: 'GameScene' });
  }

  init(data: GameSceneData): void {
    this.socket = data.socket;
    this.myId = data.myId;
    this.nickname = data.nickname;
    this.room = data.room;
  }

  create(): void {
    this.activeMapConfig = getSchoolMapConfig(this.room.school);
    this.inputManager = new InputManager(this);
    this.networkManager = new NetworkManager(this.socket, this.room.id, this);

    this.createMap();
    this.createMyPlayer();
    this.attachMapColliders();
    this.createRemotePlayers();

    this.scene.launch('UIScene');

    this.setupGameEvents();
    this.setupCamera();
  }

  update(time: number, _delta: number): void {
    if (!this.isMyPlayerAlive) return;

    const { vx, vy } = this.inputManager.getMovement();
    this.networkManager.update(this.myPlayer, vx, vy, PlayerEntity.SPEED);

    if (this.inputManager.isAbilityJustPressed() && time > this.abilityCooldown) {
      this.useAbility();
    }
  }

  private createMap(): void {
    if (this.hasTilemapAssets(this.activeMapConfig)) {
      const map = this.make.tilemap({ key: this.activeMapConfig.tilemapKey });
      const tileset = map.addTilesetImage(
        this.activeMapConfig.tilesetName,
        this.activeMapConfig.tilesetKey,
      );

      if (tileset) {
        const groundLayer = map.createLayer('Ground', tileset, 0, 0);
        this.wallLayer = map.createLayer('Walls', tileset, 0, 0) ?? undefined;

        groundLayer?.setTint(this.activeMapConfig.tint);
        this.wallLayer?.setCollisionByProperty({ collides: true });
        this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
        return;
      }
    }

    this.mapColliders = buildProceduralSchoolMap(this, this.activeMapConfig);
  }

  private createMyPlayer(): void {
    const { x, y } = this.activeMapConfig.spawn;
    this.myPlayer = new PlayerEntity(this, x, y, this.myId, this.nickname, 0x6366f1);
  }

  private attachMapColliders(): void {
    if (this.wallLayer) {
      this.physics.add.collider(this.myPlayer, this.wallLayer);
    }

    if (this.mapColliders) {
      this.physics.add.collider(this.myPlayer, this.mapColliders);
    }
  }

  private createRemotePlayers(): void {
    for (const player of this.room.players) {
      if (player.id === this.myId) continue;
      this.spawnRemotePlayer(player);
    }
  }

  private hasTilemapAssets(config: SchoolMapConfig): boolean {
    return (
      this.cache.tilemap.exists(config.tilemapKey) &&
      this.textures.exists(config.tilesetKey)
    );
  }

  private spawnRemotePlayer(state: PlayerState): void {
    const spawnX = state.x || this.activeMapConfig.spawn.x + 80;
    const spawnY = state.y || this.activeMapConfig.spawn.y;
    const displayName = state.displayNickname || state.nickname;
    const displayColor = this.parseDisplayColor(state.displayColor, 0xf43f5e);
    const entity = new PlayerEntity(this, spawnX, spawnY, state.id, displayName, displayColor);

    this.remotePlayers.set(state.id, entity);
    this.networkManager.addRemotePlayer(entity);

    if (this.wallLayer) {
      this.physics.add.collider(entity, this.wallLayer);
    }

    if (this.mapColliders) {
      this.physics.add.collider(entity, this.mapColliders);
    }
  }

  private parseDisplayColor(colorValue: string | undefined, fallback: number): number {
    if (!colorValue) return fallback;

    const normalized = colorValue.startsWith('#') ? colorValue.slice(1) : colorValue;
    if (!/^[0-9a-fA-F]{6}$/.test(normalized)) {
      return fallback;
    }

    return Number.parseInt(normalized, 16);
  }

  private setupCamera(): void {
    this.cameras.main.startFollow(this.myPlayer, true, 0.1, 0.1);
  }

  private setupGameEvents(): void {
    this.socket.on(EVENTS.ABILITY_RESULT, (data: { type: string; targetId: string }) => {
      if (data.type === 'kill') {
        const entity = this.remotePlayers.get(data.targetId);
        entity?.die();

        if (data.targetId === this.myId) {
          this.isMyPlayerAlive = false;
          this.myPlayer.die();
          this.showDeathMessage();
        }
      }
    });

    this.socket.on(
      EVENTS.MEETING_STARTED,
      (data: { callerId: string; roomInfo: RoomInfo } & VoteProgressInfo) => {
        useGameStore.getState().setCurrentRoom(data.roomInfo);
        useGameStore.getState().setMeetingInfo(true, data.callerId);
        useGameStore.getState().setVoteProgress({
          votedPlayerIds: data.votedPlayerIds,
          totalEligibleVoters: data.totalEligibleVoters,
          deadlineAt: data.deadlineAt,
        });
      },
    );

    this.socket.on(EVENTS.VOTE_PROGRESS, (data: VoteProgressInfo) => {
      useGameStore.getState().setVoteProgress(data);
    });

    this.socket.on(EVENTS.VOTE_RESULT, (data: { ejectedId: string | null; roomInfo: RoomInfo }) => {
      useGameStore.getState().setCurrentRoom(data.roomInfo);
      useGameStore.getState().setMeetingInfo(false);
      useGameStore.getState().resetVoteProgress();

      if (data.ejectedId) {
        if (data.ejectedId === this.myId) {
          this.isMyPlayerAlive = false;
          this.myPlayer.die();
          this.showDeathMessage();
        } else {
          this.remotePlayers.get(data.ejectedId)?.die();
        }
      }
    });

    this.socket.on(EVENTS.GAME_ENDED, (data: { winner: Winner }) => {
      useGameStore.getState().setMeetingInfo(false);
      useGameStore.getState().resetVoteProgress();
      this.shutdown();
      this.scene.start('EndScene', { winner: data.winner });
    });
  }

  private useAbility(): void {
    const range = 60;
    let nearestId: string | null = null;
    let nearestDistance = range;

    for (const [id, entity] of this.remotePlayers) {
      const distance = Phaser.Math.Distance.Between(
        this.myPlayer.x,
        this.myPlayer.y,
        entity.x,
        entity.y,
      );

      if (distance < nearestDistance) {
        nearestDistance = distance;
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
    this.add
      .text(width / 2, height / 2, '당신은 사망했습니다\n유령 상태로 게임을 관전합니다', {
        fontSize: '20px',
        color: '#f43f5e',
        fontFamily: 'Noto Sans KR, sans-serif',
        align: 'center',
        stroke: '#000',
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setScrollFactor(0);
  }

  shutdown(): void {
    this.networkManager?.destroy();
    this.socket.off(EVENTS.ABILITY_RESULT);
    this.socket.off(EVENTS.MEETING_STARTED);
    this.socket.off(EVENTS.VOTE_PROGRESS);
    this.socket.off(EVENTS.VOTE_RESULT);
    this.socket.off(EVENTS.GAME_ENDED);
  }
}
