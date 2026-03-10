# 02. Phaser 3 — 게임 씬 구조

## 이게 뭔가요?

Phaser 3는 브라우저에서 2D 게임을 만드는 라이브러리입니다.  
핵심 개념은 **씬(Scene)** 입니다. 씬 = 게임의 한 화면.

## 씬 생명주기

```
preload() → create() → update() (매 프레임 반복)
```

| 단계 | 역할 |
|------|------|
| `preload` | 이미지, 맵 등 에셋 불러오기 |
| `create` | 게임 오브젝트 배치 |
| `update` | 매 프레임 로직 실행 (이동, 충돌 등) |

## 이 프로젝트 씬 구조

```
PreloadScene  → 에셋 로딩
    ↓
GameScene     → 실제 게임 (이동, 충돌, 동기화)
    ↓
EndScene      → 게임 결과 화면 (예정)
```

## 더 공부하고 싶다면

- [Phaser 3 공식 문서](https://newdocs.phaser.io/)
- [Phaser 3 예제](https://phaser.io/examples)
- 키워드: `Scene`, `GameObject`, `Physics.Arcade`, `Camera`
