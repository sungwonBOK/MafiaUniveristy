# ⚙️ MafiaUniversity — 설치 & 실행 가이드

> 새 컴퓨터에서 프로젝트를 세팅할 때 이 파일을 참고하세요.

---

## 사전 요구 사항

| 도구 | 최소 버전 | 설치 링크 |
|------|-----------|-----------|
| Node.js | 20 이상 | https://nodejs.org |
| npm | 10 이상 (Node.js와 함께 설치됨) | — |
| Git | 최신 | https://git-scm.com |

설치 확인:
```bash
node -v    # v20.x.x 이상이어야 함
npm -v     # 10.x.x 이상이어야 함
```

---

## 첫 세팅 (클론 후 최초 1회)

```bash
# 프로젝트 루트에서 (MafiaUniversity/)
npm install
```

> 이 명령어 하나로 server, client, shared 세 패키지의 의존성이 모두 설치됩니다.

---

## 환경변수 설정

### 서버 (`packages/server/`)
```bash
# .env.example을 복사해서 .env 파일 생성
cp packages/server/.env.example packages/server/.env

# 내용:
PORT=4000
CLIENT_URL=http://localhost:5173
```

### 클라이언트 (`packages/client/`)
```
# 개발 환경에서는 Vite 프록시가 자동으로 처리합니다.
# 별도 설정 불필요.
```

---

## 개발 서버 실행

### 방법 1 — 서버 + 클라이언트 동시 실행 (권장)
```bash
# 프로젝트 루트에서
npm run dev
```

### 방법 2 — 각각 따로 실행
```bash
# 터미널 1 — 서버
npm run server

# 터미널 2 — 클라이언트
npm run client
```

| 서비스 | 주소 |
|--------|------|
| 클라이언트 (게임) | http://localhost:5173 |
| 서버 (Socket.IO) | http://localhost:4000 |

---

## 의존성 추가 시

### 서버에 패키지 추가
```bash
npm install <패키지명> --workspace=packages/server
```

### 클라이언트에 패키지 추가
```bash
npm install <패키지명> --workspace=packages/client
```

---

## 프로덕션 빌드 (배포용)

### 클라이언트 빌드
```bash
npm run build
# 결과물: packages/client/dist/
```

### 서버 빌드
```bash
cd packages/server
npm run build
# 결과물: packages/server/dist/server.js
```

---

## 배포

### 프론트엔드 → Vercel

1. GitHub에 푸시
2. https://vercel.com 에서 GitHub 저장소 연결
3. **Root Directory**: `packages/client`
4. **환경변수** 추가:
   ```
   VITE_SERVER_URL=https://your-railway-url.railway.app
   ```
5. 배포 완료

### 백엔드 → Railway

1. https://railway.app 에서 GitHub 저장소 연결
2. **Start Command**: `cd packages/server && npm run start`
3. **환경변수** 추가:
   ```
   PORT=4000
   CLIENT_URL=https://your-vercel-url.vercel.app
   ```
4. 배포 완료

---

## 문제 해결

| 증상 | 원인 | 해결 |
|------|------|------|
| `node_modules not found` | npm install 안 함 | `npm install` 실행 |
| 포트 충돌 | 다른 프로세스 사용 중 | `packages/server/.env`에서 PORT 변경 |
| Socket 연결 안 됨 | 서버 미실행 | `npm run server` 먼저 실행 |
| 타입 오류 | shared 타입 변경 후 빌드 안 함 | 자동 연동됨 (ts-node-dev) |
