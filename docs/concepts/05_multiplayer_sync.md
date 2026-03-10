# 05. 멀티플레이 동기화 — 저지연 전략

## 문제: 왜 끊기나요?

서버까지 패킷이 왕복하는 시간(RTT)이 있습니다.  
내가 WASD를 눌렀지만 서버 응답을 기다리면 100ms 이상 지연됩니다.

## 해결책 1: 클라이언트 예측 (Client-Side Prediction)

내 캐릭터는 **서버 응답을 기다리지 않고 즉시 이동**합니다.  
서버는 위치를 받아 다른 플레이어에게 브로드캐스트만 합니다.

```typescript
// NetworkManager.ts
myEntity.setVelocity(vx * speed, vy * speed); // 즉시 반영
socket.emit(EVENTS.PLAYER_MOVE, { x, y });     // 서버에는 알림만
```

## 해결책 2: 보간 (Lerp)

다른 플레이어의 위치는 매 프레임 **현재 위치 → 목표 위치로 20% 이동**합니다.  
이렇게 하면 패킷이 늦게 와도 부드럽게 움직입니다.

```typescript
// 매 프레임 실행
entity.x = Phaser.Math.Linear(entity.x, targetX, 0.2);
entity.y = Phaser.Math.Linear(entity.y, targetY, 0.2);
```

## 해결책 3: 이벤트 쓰로틀링

이동 입력이 변했을 때 + 최소 50ms 간격으로만 서버에 전송합니다.

## 서버 권위 (중요한 것만)

킬, 투표 등 **게임 결과를 바꾸는 행동**은 반드시 서버가 검증하고 결정합니다.  
이동은 예측하지만, 킬은 서버가 최종 판단합니다.

## 더 공부하고 싶다면

- 키워드: `client-side prediction`, `lag compensation`, `lerp`, `server authoritative`
- 글: Gabriel Gambetta의 "Fast-Paced Multiplayer" 시리즈
