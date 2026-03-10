# 01. WebSocket & Socket.IO 개념

## 이게 뭔가요?

HTTP는 클라이언트가 요청을 보내야만 서버가 응답합니다. 하지만 게임에서는  
**서버가 먼저 모든 플레이어에게 "누가 움직였다"를 알려줘야** 합니다.  
이걸 가능하게 해주는 기술이 **WebSocket**이고, Socket.IO는 그걸 더 쓰기 쉽게 감싼 라이브러리입니다.

```
일반 HTTP:
클라 → 서버 (요청)  →  서버 → 클라 (응답) [끝]

WebSocket:
클라 ↔ 서버 (연결 유지, 양방향 실시간 통신)
```

## 이 프로젝트에서 어디에 쓰이나요?

| 위치 | 역할 |
|------|------|
| `packages/server/src/server.ts` | Socket.IO 서버 초기화 |
| `packages/client/src/services/SocketService.ts` | Socket.IO 클라이언트 싱글톤 |
| `packages/shared/src/index.ts` | 공유 이벤트 이름 상수 |
| `handlers/` | 이벤트 핸들러 등록 |

## 핵심 패턴

```typescript
// 서버에서 이벤트 보내기
socket.emit('event_name', data);        // 이 클라이언트에게만
io.to(roomId).emit('event_name', data); // 특정 방 전체에게
socket.to(roomId).emit('...', data);    // 나 빼고 방 전체에게

// 클라이언트에서 이벤트 받기
socket.on('event_name', (data) => { ... });
```

## 더 공부하고 싶다면

- [Socket.IO 공식 문서](https://socket.io/docs/v4/)
- 키워드: `emit`, `on`, `room`, `namespace`, `broadcast`
