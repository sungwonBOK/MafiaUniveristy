# AI 핸드오버 (진척 상황 요약 문서)

> 이 문서는 다른 AI (Cursor, Cursor IDE, Copilot 등) 가 프로젝트의 현재 상태를 즉각 파악하고 바로 작업을 이어갈 수 있도록 설계되었습니다. 처음 이 프로젝트를 여는 AI는 **이 문서를 최우선으로 분석**해야 합니다.

---

## 1. 프로젝트 개요 (Project Overview)
- **이름**: MafiaUniversity
- **장르**: 2D 멀티플레이어 어몽어스 스타일 마피아 게임
- **핵심 특징**: 같은 대학교 사람들끼리만 플레이, 학교별 고유 맵 지원.
- **아키텍처**: NPM Workspaces를 활용한 **Monorepo (서버 & 클라이언트 공유 구조)**
- **기술 스택**: 
  - `Shared`: TypeScript
  - `Server`: Node.js, Express, Socket.IO, TypeScript
  - `Client`: React (Vite), Zustand(상태관리), Phaser 3(게임엔진), Socket.IO Client

---

## 2. 지금까지 완료된 작업 (Implementation Status)

### ⚙️ 공통 (Shared) — `완료`
- `PlayerState`, `RoomInfo`, `School` 등 도메인 타입 정의.
- `EVENTS` 상수 객체를 통한 오타 방지 및 안전한 Socket 통신 구현 완료.

### 🖥️ 백엔드 (Server) — `완료`
- **도메인 모델 (OOP)**: `Player`, `Room` 클래스 분리.
- **서비스 계층 (SRP)**:
  - `RoomService`: 방 생성, 퇴장, 유저 학교 기준 인덱싱 관리.
  - `GameService`: 인원수에 따른 역할 분배(마피아/경찰/시민), 킬 판정, 투표 집계.
  - `ChatService`: 로비/대기방 등 컨텍스트 기반 채팅 라우팅.
- **핸들러**: `LobbyHandler`와 `GameHandler`가 이벤트 처리 (회의 소집, 이동, 승패 판정 완성).

### 🌐 네트워크 최적화 — `완료`
- **서버 틱 배칭 (24Hz)**: `PLAYER_MOVE` 즉시 브로드캐스트 제거, 고정 틱마다 큐 배출.
- **MessagePack 직렬화**: `socket.io-msgpack-parser` 적용으로 패킷 크기 절감.
- **클라이언트 예측**: 입력 변화 시에만 전송 + 원격 플레이어 lerp 보간.
- **RTT 계측**: `net:probe` 기반 측정 루프 + `NetworkMetricsService` 완성.
- 상세 내용: `NETWORK_OPTIMIZATION_TODO.md` 참고.

### 🎨 프론트엔드 (React & Phaser) — `주요 구성 완료`
- **로비 / 대기방 UI**: 로비(방생성/참가), 대기방(준비토글, 채팅 결합) 완비.
- **Phaser 3 게임 코어**:
  - `GameScene`, `NetworkManager`: 저지연 예측 이동 로직 적용, `UIScene` 분리로 UI 덮어씌우기 (SRP 분리 완료).
- **인-게임 회의 & 투표 모달** (`완료`):
  - `VotingModal` (React) 컴포넌트를 구현하여 `useGameStore` 상태를 통해 R키 클릭(긴급회의) 시 투표창 팝업. 
  - 살아있는 플레이어 목록, 기권 옵션, 회의 전용 채팅방까지 연동 완료.

---

## 3. 역할 시스템 기획 확정 (New Role System)

> ⚠️ 기존 `'citizen' | 'mafia' | 'doctor' | 'detective'` 4종 Role 타입을 **10종으로 전면 교체 예정**.

| 진영 | 역할명 (한국어) | 코드 Role 이름 |
|------|--------------|--------------|
| 시민 | 시민(일반) | `citizen` |
| 시민 | 학생회장 | `president` |
| 시민 | 홍보국장 | `investigator` |
| 시민 | 새내기 | `freshman` |
| 시민 | 취준생 | `jobseeker` |
| 시민 | 과탑 | `topstudent` |
| 마피아 | 교수 | `professor` |
| 마피아 | 대학원생 | `grad_student` |
| 마피아 | 출석 대리인 | `impersonator` |
| 중립 | CC (커플) | `couple` |
| 중립 | 아싸 | `loner` |

**역할별 스킬 및 세부 기획은 `GAME_ROADMAP.md` → 섹션 2 참고.**

---

## 4. 남은 작업 및 다음 단계 (To-Do & Next Steps)

> 🔑 **모든 남은 작업의 상세 목록, 우선순위, 단계별 체크리스트는 `GAME_ROADMAP.md`에 정리되어 있습니다.**  
> 다음 AI는 반드시 `GAME_ROADMAP.md`를 먼저 읽고 작업을 이어가십시오.

### 🚨 당면한 핵심 미완성 과제 (우선 진행)
1. **게임 종료 재시작 (Restart / Play Again) 로직**
   - 현재 `EndScene`에서 클라이언트 화면만 리셋되고, 서버의 `Room` 객체 phase가 `'ended'` 상태에 갇혀 새 게임을 시작할 수 없는 상태입니다 (방 리셋 핸들러 필요).
2. **실제 맵 타일 디자인 및 직업 스킬 연출**
   - 시각적인 맵 타일 에셋 부재 및 스킬 타겟팅(십자선) UI, 킬 이펙트 등이 누락된 프로토타입 상태입니다.

### 요약 (3단계 구조)
1. **1단계** — 기술 부채 해소 + 역할 타입 구조 교체 (`EVENTS`, `Role` 타입, `GameService` 배분 로직, 방 리셋 핸들러 등)
2. **2단계** — 핵심 스킬 구현 (교수 킬, 홍보국장 조사, 과탑 시체분석 화살표, 새내기 방어막, 아싸 0표 승리, 쿨다운 UI 등)
3. **3단계** — 고급 스킬 + 맵 타일 + 미션 시스템 (학생회장, 대학원생, CC, 출석대리인, 사보타주 등)

---

## 5. 후임 AI를 위한 절대 규칙 (CRITICAL RULES)

1. **언어 규칙**: README, 주석 및 코드 설명은 항상 **한국어(Korean)**로 유지할 것.
2. **타입 임포트**: `packages/shared`에서 인터페이스를 가져올 때 **반드시 `import type { ... }`** 구문 사용. (미사용 시 Vite 빌드 크래시 재발)
3. **OOP 및 단일 책임 원칙 준수**: 기존 매니저 파일이 너무 커지면 즉각적으로 SRP에 의거해 파일로 나눌 것.
4. **저지연 지향**: 게임 엔진 내부의 좌표 이동 코드는 항상 클라이언트 예측 기법을 존중하도록 구성할 것.
5. **역할 하드코딩 절대 금지**: `Role` 타입은 `shared`에서만 정의. 스킬 분기는 `role → handler` 맵핑 구조로 작성. 역할이 추가될 때 최소한의 파일만 수정하도록 설계할 것. (`GAME_ROADMAP.md` 섹션 0 원칙 준수)
6. **역할/스킬 확장 시 체크리스트 준수**: 새 역할 추가 시 반드시 ① `shared/index.ts` ② `GameService.buildRolePool()` ③ `AbilityService`(예정) ④ `UIScene ROLE_CONFIG` ⑤ 이 문서 + `GAME_ROADMAP.md` 를 모두 수정할 것.
7. **⚠️ 출석 대리인(impersonator) 변신 스킬 구조 — 초기 설계 필수**: `Player` 클래스에는 반드시 `realNickname`/`realColor`(실제 정체, 서버 내부 전용)와 `displayNickname`/`displayColor`(클라이언트 렌더링용)를 분리해야 함. `PlayerState` 소켓 전송 시에도 `display*` 필드를 포함해야 하며, 이 구조를 나중에 추가하면 **대규모 리팩토링**이 불가피함. 조사/시체분석 등 역할 파악 스킬은 항상 `real*` 값 기준으로 결과를 반환해야 함.
