# 멀티플레이어 네트워크 최적화 현황 문서

업데이트 일자: 2026-03-10  
프로젝트: **MafiaUniversity**

---

## 1) 이번 라운드 목표

- 서버 틱 배칭(Tick Rate + Batching) 적용
- Socket.IO MessagePack(`socket.io-msgpack-parser`) 적용
- 적용 후 빌드/실플레이 테스트 검증

---

## 2) 완료된 작업 (완료)

### A. 기준선 계측(사전 작업)
- 서버/클라이언트 네트워크 계측 로깅 추가
  - 이벤트별 `packets`, `bytes`, `packetsPerSec`, `kbps`
  - RTT 샘플 집계(`avgMs`, `maxMs`)
- `net:probe` 기반 RTT 측정 루프 추가

주요 파일:
- `packages/server/src/services/NetworkMetricsService.ts`
- `packages/client/src/services/NetworkMetricsService.ts`
- `packages/server/src/server.ts`
- `packages/client/src/services/SocketService.ts`
- `packages/client/src/game/managers/NetworkManager.ts`

### B. 서버 틱 배칭 적용
- `GameHandler`에서 `PLAYER_MOVE` 즉시 브로드캐스트 제거
- `Room`에 플레이어별 최신 좌표 큐(`pendingPlayerStates`) 추가
- 서버 메인 루프에서 고정 틱으로 큐 배출 후 브로드캐스트
  - 송신자 제외 브로드캐스트(`io.to(room.id).except(state.id)`)
- `RoomService.forEachRoom` 추가로 룸 순회 처리
- 플레이어 퇴장 시 큐 잔존 데이터 정리

주요 파일:
- `packages/server/src/handlers/GameHandler.ts`
- `packages/server/src/domain/Room.ts`
- `packages/server/src/services/RoomService.ts`
- `packages/server/src/server.ts`

### C. 끊김 완화 튜닝(과부하 방지형)
- 서버 틱 기본값 `24Hz` 적용
- `SERVER_TICK_RATE` 안전 범위 클램프: `15~30`
- 클라이언트 전송 간격 `SEND_INTERVAL`: `50ms -> 40ms`
- 원격 보간을 거리 기반 계수로 조정(`0.20~0.30`)

주요 파일:
- `packages/server/src/server.ts`
- `packages/client/src/game/managers/NetworkManager.ts`

### D. MessagePack 직렬화 적용
- 서버/클라이언트 워크스페이스에 `socket.io-msgpack-parser` 설치
- 서버 `new Server(...)`에 `parser` 주입
- 클라이언트 `io(...)`에 `parser` 주입

주요 파일:
- `packages/server/src/server.ts`
- `packages/client/src/services/SocketService.ts`
- `packages/server/package.json`
- `packages/client/package.json`
- `package-lock.json`

---

## 3) 검증 결과

- 서버 빌드: `npm run build --workspace=packages/server` 통과
- 클라이언트 빌드: `npm run build --workspace=packages/client` 통과
- 실플레이 테스트: 오류 없음(사용자 확인)
- 체감 성능: 지연 약 `0.15ms` 수준으로 개선(사용자 보고 기준)

참고:
- 클라이언트 번들 크기 경고(500kB 초과)는 존재하나 빌드 실패는 아님

---

## 4) 현재 상태 요약

- 요청한 2개 핵심 최적화 작업 완료:
  1. 서버 틱 배칭
  2. MessagePack 직렬화

---

## 5) 남은 선택 과제 (필요 시)

아래는 이번 범위 밖이며, 운영/동접 증가 시 선택적으로 진행:

1. 서버 권위 검증 + 롤백
2. 데드 레코닝 고도화
3. 델타 압축(변경값만 전송)
4. UDP(WebRTC DataChannel) 분리 전송

---

## 6) 운영 파라미터 메모

- `SERVER_TICK_RATE` (기본 24, 서버 내부에서 15~30으로 제한)
- `NETWORK_METRICS` / `NETWORK_METRICS_WINDOW_MS` (서버 계측)
- `VITE_NETWORK_METRICS` / `VITE_NETWORK_METRICS_WINDOW_MS` (클라이언트 계측)

