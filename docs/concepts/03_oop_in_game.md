# 03. OOP 원칙 — 게임 코드에 적용하기

## 사용된 주요 원칙

### SRP (단일 책임 원칙)
> 클래스는 하나의 이유로만 변경되어야 한다.

| 클래스 | 담당하는 것 하나 |
|--------|----------------|
| `Player.ts` | 플레이어 상태만 |
| `Room.ts` | 방 구성원 관리만 |
| `RoomService.ts` | 방 CRUD만 |
| `GameService.ts` | 게임 로직만 |
| `InputManager.ts` | 키보드 입력만 |
| `NetworkManager.ts` | 네트워크 동기화만 |

### DRY (중복 금지)
`ChatBox` 컴포넌트가 로비/대기방/투표 세 곳에서 재사용됩니다.

### Registry 패턴 (Open/Closed)
`SchoolMapRegistry.ts`에 한 줄만 추가하면 새 학교가 추가됩니다.  
기존 코드를 수정할 필요가 없습니다.

## 더 공부하고 싶다면

- 키워드: SOLID, SRP, OCP, 의존성 역전, 팩토리 패턴
- 책: "클린 코드" (로버트 마틴)
