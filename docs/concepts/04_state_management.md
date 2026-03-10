# 04. Zustand — 상태 관리

## 이게 뭔가요?

React에서 여러 컴포넌트가 같은 데이터를 공유할 때 사용합니다.  
예: 닉네임은 홈/로비/대기방 모두에서 알아야 합니다.

## 사용법

```typescript
// 읽기
const nickname = useGameStore(s => s.nickname);

// 쓰기
const { setScreen } = useGameStore();
setScreen('lobby');
```

## 이 프로젝트에서 관리하는 상태

| 상태 | 설명 |
|------|------|
| `screen` | 현재 화면 (home/lobby/waiting/game) |
| `nickname`, `school` | 내 플레이어 정보 |
| `currentRoom` | 현재 참가 중인 방 |
| `roomList` | 로비 방 목록 |
| `lobbyChats` 등 | 채팅 메시지 배열 |

## 더 공부하고 싶다면

- [Zustand 공식 문서](https://zustand-demo.pmnd.rs/)
- 키워드: `store`, `slice`, `selector`, `immer`
