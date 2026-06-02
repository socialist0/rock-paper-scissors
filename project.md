# 미니게임 프로젝트 개발 로그 (Project.md)

---

## 📌 프로젝트 개요
Supabase 백엔드와 GitHub Pages 프론트엔드를 연동한 실시간 명예의 전당 기능 탑재 미니게임 플랫폼입니다. 보안 위변조 방지 및 악의적인 트래픽 도배를 차단하는 상용 서비스 수준의 보안 레이어가 적용되어 있으며, 독립적인 모듈 구조(Modular Architecture)로 설계되어 있습니다. 현재 **가위바위보**, **원 그리기**, **앞뒤 맞추기 서바이벌**, **블록쌓기** 4개의 게임이 탭 방식으로 운영됩니다.

특히 화면 전환에 따라 인터페이스와 스타일을 완전히 다르게 제어하는 **'닉네임 설정 화면'과 '게임 영역 화면'의 물리적·시각적 디자인 격리 설계**가 핵심적으로 적용되어 있습니다.

---

## 🎨 화면별 디자인 분리 및 레이아웃 아키텍처

본 플랫폼은 한 페이지 내에서 상태에 따라 화면을 전환하는 SPA(Single Page Application) 방식을 취하면서도, 사용자 경험을 위해 두 화면의 스타일 디자인을 철저하게 이원화했습니다.

### 1. 🔑 닉네임 입력 화면 (로그인 전)
- **레이아웃**: 상단 배너나 제목을 과감히 생략하고, 오직 닉네임 입력 보드(`#user-setup`)만을 브라우저 화면의 **정밀한 기하학적 수직·가로 정중앙(Center of View)**에 격리 배치합니다.
- **배경 연출**: `body.nickname-page` 클래스를 동적으로 주입하여 `images/nickbgimage.png` 배경화면이 전체 화면에 꽉 차게 덮이도록 제어합니다 (`background-size: cover; background-attachment: fixed;`).
- **가독성 보호**: 배경 이미지 위에서 글자가 흐려지지 않도록 안내 텍스트에 강력한 섀도우 효과(`text-shadow`)를 두르고, 입력 칸과 버튼은 반투명 흰색 레이어를 적용하여 가독성을 100% 사수합니다.

### 2. 🕹️ 실제 게임 영역 화면 (로그인 후)
- **레이아웃**: 로그인 성공 즉시 `body.nickname-page` 클래스를 제거하여 단색 톤(`background-color: #f4f7f6`)의 차분하고 몰입감 높은 게임판 배경으로 전환됩니다. 또한 화면 배치가 수직 중앙 정렬에서 **상단 벽 밀착 정렬(`justify-content: flex-start`)**로 재구성됩니다.
- **최상단 일체형 배너 시스템**: 과거의 텍스트 제목(`잠시만 혹시...?`)을 전면 삭제하고, 진짜 이미지 자원인 `images/logoimage.png`를 활용한 독창적인 **독립형 버튼형 배너(`#game-banner`)**를 도입했습니다.
  - **밀착 디자인**: 게임 화면 진입 시 상단에 어정쩡하게 붕 뜨는 빈 여백을 제로화(`margin: 0 auto; padding: 0`)하여, 배너 상단면이 브라우저 천장 벽에 칼같이 바짝 맞물려 떨어지도록 튜닝했습니다.
  - **모서리 변칙 제어**: 천장과 맞닿는 배너의 위쪽 모서리는 라운딩을 주지 않고(`border-radius: 0 0 12px 12px`), 아래쪽 두 모서리만 둥글게 깎아 전체 UI 화면과 매끄러운 공간 일체감을 형성합니다.
- **배너 내비게이션 기능**: 유저가 언제든지 게임 영역 최상단의 배너 이미지를 마우스로 클릭하거나 모바일로 터치하면, 게임 세션이 즉시 로그아웃 처리되며 다시 배경이 깔린 정중앙의 닉네임 설정 화면으로 완벽하게 되돌아가는 리턴 루프(Return Loop)를 제공합니다. (`cursor: pointer` 및 클릭 시 꾹 눌리는 수축 반응 `:active` 효과 탑재)
- **환영 문구의 하단 재배치**: 배너 내부나 글자 뒤에 배경으로 뭉개지던 환영 메시지를 배너 이미지의 **바로 아래쪽 외곽 공간(`.welcome-text`)**으로 완벽하게 끄집어내어, 정돈된 가독성과 넓은 공간 밸런스를 구축했습니다.

---

## 🎮 포함된 게임 및 플랫폼 주요 특징

### 1. 👊 가위바위보 (RPS Game)
- **게임 방식**: 컴퓨터와 실시간 가위바위보 대결을 펼쳐 연속 승리(연승) 기록을 측정합니다.
- **밸런스 패치**: 게임 진행 속도가 빠른 특성을 고려하여 1초의 연속 제출 제한(쿨타임)이 적용되어 있으며, 사용자 경험을 위해 경고창(alert) 없이 부드럽게 연타가 차단됩니다.
- **히든 보상**: Supabase `game_config` 테이블의 `rps_threshold` 값 이상 연승 달성 시 깜짝 축하 페이지(`suddenwinner.html`)로 이동합니다.
- **실시간 순위 표시**: 게임에서 졌을 때 최종 기록 옆에 현재 전체 순위가 함께 표시됩니다. 순위 조회 완료 후 한 번에 표시되어 깜빡임이 없습니다.

### 2. 🎯 원 그리기 (Circle Drawing Game)
- **게임 방식**: HTML5 Canvas 위에 마우스나 터치로 정밀하게 원을 그려 완벽한 원에 가까운지 정확도(%)를 판정합니다.
- **드로잉 연출**: 게이머가 원을 그릴 때는 직관적이고 몰입감 높은 파란색 실선으로 캔버스에 렌더링됩니다.
- **컴퓨터 매칭 시각화 엔진**: 유저가 드로잉을 끝내고 마우스/터치를 떼는 순간, 판정 엔진이 계산한 실시간 수학적 중심점(무게중심)에 빨간색 점이 찍히고, 그 중심점과 평균 반지름을 기준으로 삼는 컴퓨터의 완벽한 정원이 '빨간색 점선 가이드라인'으로 위에 부드럽게 겹쳐서 나타납니다.
- **중심점 산출 원리**: 게이머가 붓질을 하며 화면에 남긴 모든 좌표(X, Y)들의 수학적 평균 위치(Centroid, 무게중심)를 추적하여 중심을 잡습니다.
- **드로잉 리플레이 애니메이션**: 원 그리기 완료 후 판정 결과가 표시되면, 빨간 점선 가이드라인이 먼저 나타난 뒤 게이머가 그렸던 파란 실선 경로가 처음부터 다시 천천히 재생됩니다. 재생 속도는 `REPLAY_DURATION_MS` 값으로 조절할 수 있습니다 (기본값: 2000ms).
- **실시간 순위 표시**: 원 그리기 완료 후 점수 옆에 현재 전체 순위가 함께 표시됩니다. 두 번째 원을 그리기 시작할 때는 이전 점수와 순위가 유지되다가 새 결과로 업데이트됩니다.
- **히든 보상**: Supabase `game_config` 테이블의 `circle_threshold` 값 이상 획득 시 깜짝 축하 페이지(`suddenwinner.html`)로 이동합니다.

### 3. 🔤 앞뒤 맞추기 서바이벌 (Letter Game)
- **게임 방식**: 화면 중앙에 표시된 알파벳 또는 한글 자음을 보고, 그 앞 글자와 뒷 글자를 5초 이내에 순서대로 선택합니다. 틀리거나 시간이 초과되면 게임이 종료됩니다.
- **문자 세트**: 50% 확률로 알파벳(a~z) 또는 한글 자음(ㄱ~ㅎ) 중 하나가 무작위 출제됩니다. 양쪽 끝 글자(a, z, ㄱ, ㅎ)는 제외하여 앞뒤가 항상 존재하도록 보장합니다.
- **2단계 입력 구조**: 1단계에서 앞 글자를 맞추면 해당 버튼이 주황색으로 하이라이트되고 빈 칸에 채워지며, 2단계에서 뒷 글자를 선택합니다. 단계별로 즉각적인 시각 피드백을 제공합니다.
- **보기 구성**: 정답 2개(앞글자, 뒷글자) + 오답 4개로 총 6개 버튼이 3x2 그리드로 배치됩니다.
- **게임 오버 피드백**: 종료 시 빈 칸에 정답이 자동으로 채워지고, 보기 버튼에서 앞글자(파란색)와 뒷글자(초록색)의 정답 위치가 색상으로 구분 표시됩니다.
- **타이머**: 5초 카운트다운이 실시간으로 표시되며, 1.5초 이하로 남으면 빨간색 점멸 애니메이션으로 긴박감을 연출합니다.
- **히든 보상**: Supabase `game_config` 테이블의 `abc_threshold` 값 이상 연승 달성 시 깜짝 축하 페이지(`suddenwinner.html`)로 이동합니다.
- **실시간 순위 표시**: 게임 오버 시 최종 연승 기록과 전체 순위가 함께 표시됩니다.

### 4. 🧱 블록쌓기 (Block Stacking Game)
- **게임 방식**: 좌우로 움직이는 블록을 화면 터치 또는 스페이스바로 낙하시켜 최대한 높이 쌓습니다. 쌓인 층수가 점수(연승)로 기록됩니다.
- **물리 엔진**: `BlockPiece` 클래스 기반 무게중심(Center of Gravity) 계산으로 실제 붕괴를 연출합니다. 블록 형태는 직사각형(`rectangle`)과 사다리꼴(`trapezoid`) 두 종류가 무작위로 등장합니다.
- **붕괴 애니메이션**: 균형이 무너지면 해당 블록부터 위쪽 전체가 회전하며 낙하하는 다중 붕괴(Multi-Collapse) 애니메이션이 재생됩니다.
- **카메라 스크롤**: 블록을 높이 쌓을수록 카메라가 부드럽게 위로 따라올라가며, 게임 오버 시 자연스럽게 원위치로 복귀합니다.
- **히든 보상**: Supabase `game_config` 테이블의 `block_threshold` 값 이상 쌓으면 깜짝 축하 페이지(`suddenwinner.html?game=block`)로 이동합니다.
- **실시간 순위 표시**: 게임 오버 시 오버레이에 쌓은 층수 + 전체 순위(`🏅 전체 N위`)가 함께 표시됩니다.

---

## 🛡️ 적용된 보안 및 플랫폼 백엔드 아키텍처

### 1. 데이터 위변조 방지 (Crypto Hash Verification)
- **원리**: 점수를 Supabase 서버로 전송하기 직전, 클라이언트 사이드에서 유저의 닉네임과 점수, 그리고 외부인은 알 수 없는 나만의 비밀 키(SECRET_SALT)를 조합하여 SHA-256 암호화 해시 토큰을 생성합니다.
- **데이터베이스 연동**: Supabase 테이블에 `verification_token` 컬럼을 활용하여 점수 등록 시 이 암호화 토큰을 함께 탑재해 전송합니다.

### 2. 로컬 스토리지 기반 트래픽 도배 방지 (Time-Lock)
- **원리**: 브라우저의 `localStorage` 시스템을 이용해 성공적으로 점수가 저장된 시점의 타임스탬프를 기억하여 Supabase API 트래픽 비용을 보호합니다.

### 3. 초효율적 데이터 청소 시스템 (Daily Cron Job & Top 10 보존)
- **원리**: 매일 하루에 한 번, 상위 10개(Top 10) 기록만 남기고 나머지는 자동으로 삭제하는 SQL 크론탭(pg_cron) 시스템이 백엔드 내부에서 가동 중입니다.
- **보안 무결성**: Supabase 백엔드 내부의 RLS(Row Level Security) 시스템을 철저히 활성화하여 anon_key가 외부에 노출되더라도 데이터 임의 삭제나 변조가 원천 차단됩니다.
- **등록된 크론 목록** (`SELECT * FROM cron.job`으로 확인 가능):
  - `cleanup-rankings-daily` → `rankings` 테이블 (가위바위보) — `0 0 * * *`
  - `cleanup-circle-rankings-daily` → `circle_rankings` 테이블 (원 그리기) — `0 0 * * *`
  - `cleanup-abc-rank-daily` → `abc_rank` 테이블 (앞뒤 맞추기) — `0 0 * * *`
  - `cleanup-block-rank-daily` → `block_rank` 테이블 (블록쌓기) — `0 0 * * *`

> ⚠️ **크론 정비 이력 (2026-05-28)**: 초기 `daily_ranking_keep_top10` 크론의 `ORDER BY created_at DESC` 오류 및 `rankings` 크론 누락, `daily-abc-rank-cleanup` 중복 크론을 정리하고 올바른 크론으로 재등록했습니다.

> ⚠️ **크론 정비 이력 (2026-05-31)**: `clean_rankings_keep_top10` 크론이 여러 DELETE문을 하나의 `$$...$$` 블록에 묶어 실행하다 `syntax error at or near "DELETE"` 오류로 계속 실패하고 있었음을 `cron.job_run_details`로 확인. 해당 크론 삭제 후 테이블별로 크론 1개씩 총 4개로 분리 재등록. 쌓여있던 초과 데이터는 수동 DELETE로 정리.

### 4. 축하 페이지 비정상 접근 차단 (SessionStorage 티켓 검증)
- **원리**: 게임 조건 달성 시 `sessionStorage`에 인증 티켓과 점수를 저장한 뒤 `suddenwinner.html`로 이동합니다. 축하 페이지 진입 시 티켓을 검증하고 즉시 폐기하여 URL 직접 접근, 새로고침, 주소 공유를 통한 재접속을 원천 차단합니다.
- **게임별 분기**: URL 파라미터 `?game=rps`, `?game=abc`, `?game=block` 여부로 가위바위보 / 앞뒤 맞추기 / 블록쌓기 / 원 그리기 케이스를 분리 처리합니다.

### 5. Supabase 기반 게임 조건 중앙 관리 (game_config 테이블)
- **원리**: 축하 페이지 진입 조건(연승 수, 점수 기준)을 코드에 하드코딩하지 않고 Supabase `game_config` 테이블에서 관리합니다. 대시보드에서 값만 변경하면 코드 배포 없이 즉시 반영됩니다.
- **테이블 구조**:

| key | value | 설명 |
|-----|-------|------|
| `rps_threshold` | `9` | 가위바위보 축하 페이지 진입 기준 연승 수 |
| `circle_threshold` | `95` | 원 그리기 축하 페이지 진입 기준 점수 |
| `abc_threshold` | `9` | 앞뒤 맞추기 축하 페이지 진입 기준 연승 수 |
| `block_threshold` | `9` | 블록쌓기 축하 페이지 진입 기준 층수 |

- **동적 UI 연동**: 값이 fetch된 후 `index.html`의 안내 문구(`rps-threshold-hint`, `circle-threshold-hint`, `abc-threshold-hint`, `block-threshold-hint` span)도 자동으로 업데이트됩니다. 코드와 화면 문구가 항상 동기화됩니다.

---

## 📂 프로젝트 파일 구조 및 연동 명세

| 파일 | 역할 |
|------|------|
| `index.html` | 웹 게임 UI 레이아웃, Canvas 구성, 헤더 통합 및 스크립트 로드 총괄 |
| `style.css` | 플랫폼 공통 레이아웃 및 탭 메뉴, 버튼, 랭킹 리스트 디자인 스타일시트 (화면 분리 핵심 통제) |
| `security.js` | 암호화 해시 생성(SHA-256) 및 게임별 쿨타임 타임락 통제 담당 |
| `main.js` | 플랫폼 공통 관리자 모듈. Supabase 초기화, game_config fetch, 닉네임 세션 및 독립형 배너 내비게이션 복귀 로직 통제. 4탭 전환(`switchGame`) 및 `RPS_THRESHOLD`, `CIRCLE_THRESHOLD`, `ABC_THRESHOLD`, `BLOCK_THRESHOLD` 전역변수 관리 포함 |
| `game_rps.js` | 가위바위보 독립 모듈 (컴퓨터 패 산출, 연승 연산, 랭킹 데이터 입출력, 축하 페이지 분기) |
| `game_circle.js` | 원 그리기 독립 모듈 (파란 실선 드로잉, 빨간 점선 가이드 매칭 시각화, 판정 엔진, 드로잉 리플레이 애니메이션, 축하 페이지 분기). `ment.json`을 내부에서 직접 `fetch`하여 `circleMents` 로컬 배열에 캐싱 |
| `game_letter.js` | 앞뒤 맞추기 서바이벌 독립 모듈 (알파벳/한글 자음 무작위 출제, 5초 타이머, 2단계 입력, `abc_rank` 테이블 랭킹 입출력, 축하 페이지 분기) |
| `game_block.js` | 블록쌓기 독립 모듈 (`BlockPiece` 클래스, 무게중심 안정성 판정, 다중 붕괴 애니메이션, 카메라 스크롤, `block_rank` 테이블 랭킹 입출력, 축하 페이지 분기) |
| `suddenwinner.html` | 가위바위보/원 그리기/앞뒤 맞추기/블록쌓기 공용 축하 페이지. SessionStorage 티켓 검증 및 게임별(`?game=block`, `?game=rps`, `?game=abc`, 파라미터 없음) 문구 분기 처리 |
| `ment.json` | 원 그리기 최종 점수대별(0% ~ 100%) 맞춤형 평가 피드백 멘트 데이터셋 |
| `config.js` | Supabase URL 및 anon_key 보관 |
| `project.md` | [현재 파일] 프로젝트 개발 명세 및 전체 히스토리 관리 가이드 문서 |
| `images` | **디렉토리** — 로그인 배경(`nickbgimage.png`), 상단 밀착형 독립 배너(`logoimage.png`) 자원 보관 주소 |

---

## 🚨 파일 간 핵심 연동 및 트러블슈팅 히스토리

### 스크립트 로드 순서 의존성
반드시 `config.js` → `main.js` → `security.js` → 각 게임 모듈(`game_rps.js` → `game_circle.js` → `game_letter.js` → `game_block.js`) 순서로 로드되어야 Supabase 클라이언트 및 암호화 해시 엔진을 에러 없이 상속받을 수 있습니다.

### 독립형 배너 이미지 내비게이션 연동 (`images/logoimage.png`)
메인 화면의 독립 배너 이미지를 누르면 언제든지 로그인 세션이 리셋되며 최초 닉네임 설정 화면으로 완벽하게 복귀하는 제어 트리거를 심었습니다. `main.js` 내부에서 `document.getElementById('game-banner')` 요소를 안전하게 확보하여 `click` 이벤트를 매핑했으며, 복귀 시 body에 `nickname-page` 클래스를 즉각 재주입하여 배경화면 스타일을 안전하게 복구합니다.

### 닉네임 입력 제한 및 레이아웃
- 최대 **12바이트** 제한 (한글 4자 = 12바이트 / 영어 8자 이내)
- `placeholder` 및 초과 시 alert 문구 모두 12바이트 기준으로 통일
- 입력 UI: 안내 문구(위) → 입력칸(아래) → 시작하기 버튼 세로 배치를 완전한 화면 중앙에 고정하기 위해 `body.nickname-page` 진입 시 `justify-content: center`와 전용 패딩을 활성화합니다.

### Google AdSense 연동
- `index.html` `<head>` 태그 내에 `<meta name="google-adsense-account" content="ca-pub-...">` 코드 삽입 완료
- 구글 애드센스 심사 승인 완료
- 루트 도메인(`username.github.io`) 기준으로 심사 진행 중이며, 콘텐츠 보강 후 재심사 요청 완료

### 점수/순위 UI 글자 크기
- `score-display` 글자 크기: `1.5rem` (모바일 줄 밀림 방지)
- 순위 배지(`my-rank-badge`) 글자 크기: `1.5rem` (점수와 동일하게 통일)
- `score-display`에 `flex` 레이아웃 적용하여 점수와 순위가 같은 줄에 자연스럽게 배치

### git 버전 관리 팁
- 수정 전 백업: `git add . && git commit -m "수정 전 백업"` 후 작업
- 특정 파일만 이전 버전으로 복구: `git checkout HEAD~1 -- 파일명`
- 이미 push된 파일을 git 추적에서 제거: `git rm --cached 파일명` 후 커밋
- `.gitignore`는 이미 추적 중인 파일에는 적용 안 됨 → `git rm --cached`로 먼저 제거 필요

### game_config fetch 타이밍
`main.js`의 `loadGameConfig()`는 `window.addEventListener('load', ...)` 안에서 **가장 먼저** `await`로 호출되어, 게임 모듈이 초기화되기 전에 `RPS_THRESHOLD`, `CIRCLE_THRESHOLD`, `ABC_THRESHOLD`, `BLOCK_THRESHOLD` 전역변수가 반드시 채워지도록 보장합니다. fetch 실패 시에는 각각 `9`, `95`, `9`, `9`를 fallback 기본값으로 사용합니다.

### game_config 테이블 컬럼명 주의
`game_config` 테이블의 실제 컬럼명은 `key`, `value`입니다. `main.js`에서 `.select('key, value')` 및 `item.key`, `item.value`로 참조해야 합니다. `config_key`, `config_value` 등 다른 이름으로 조회하면 400 에러가 발생합니다.

### 각 게임 모듈의 랭킹 초기 로드 함수 필수 선언
`main.js`의 `saveUsername()`에서 로그인 성공 시 `loadRpsRankings()`, `loadCircleRankings()`, `loadLetterRankings()`, `loadBlockRankings()`를 호출합니다. 각 게임 모듈 파일 내에 이 함수들이 반드시 선언되어 있어야 하며, `game_circle.js`는 추가로 `window.addEventListener('load', () => { initCircleCanvas(); })`도 포함해야 캔버스가 정상 초기화됩니다. `game_block.js`도 마찬가지로 `window.addEventListener('load', () => { initBlockGame(); })`가 포함되어야 블록 캔버스가 초기화됩니다.

### 블록쌓기 오버레이 미숨김 버그 (해결 완료)
- **원인**: `#block-overlay`의 초기 숨김이 `.hidden` CSS 클래스에만 의존했는데 `.hidden` 클래스가 정의되지 않아 오버레이가 항상 노출되고, 게임이 오버레이 뒤에서 실행되는 문제가 발생했습니다.
- **해결**: CSS에 `#block-overlay`의 초기 `display` 상태를 명시적으로 정의하고, 시작 버튼 클릭 시 오버레이를 제거하는 로직을 `e.stopPropagation()`과 함께 안전하게 처리했습니다.

### ment.json 평가 멘트 미적용 버그 (해결 완료)
- **원인**: `evaluationMents`가 `main.js`에 빈 배열(`[]`)로 선언만 되어 있고, `ment.json`을 실제로 `fetch`해서 채우는 코드가 어디에도 없었습니다. 따라서 `game_circle.js`에서 `evaluationMents.find()`를 호출해도 항상 `undefined`가 반환되어 기본 멘트("훌륭한 원입니다!")만 표시됐습니다.
- **해결**: `game_circle.js` 내부에 `loadCircleMents()` 함수를 추가해 `ment.json`을 직접 `fetch`하여 `circleMents` 로컬 배열에 캐싱합니다. `initCircleCanvas()` 진입 시 미리 fetch하고, `calculateCircleScore()` 실행 시에도 `await loadCircleMents()`로 보장합니다. `fetch` 실패 시 전역 `evaluationMents`를 폴백으로 사용합니다.

### 랭킹 날짜 포맷 통일 (전 게임 적용)
- **변경 전**: `new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul', hour12: false })` — 브라우저/OS 로케일에 따라 출력 형식이 달라지고 연도 4자리로 길게 표시됨.
- **변경 후**: `formatBlockDate()` 함수로 UTC+9 수동 계산 후 `yy/mm/dd hh:mm:ss` 형식으로 통일 (예: `25/05/27 14:32:08`). 4개 게임 모듈(`game_rps.js`, `game_circle.js`, `game_letter.js`, `game_block.js`) 모두 동일 함수 각 파일 내 선언 적용.

### block_rank verification_token null 버그 (해결 완료)
- **원인**: `game_block.js`의 해시 생성 코드가 `generateHash()`를 호출하고 있었는데 해당 함수명이 `security.js`에 존재하지 않아 항상 `null`로 저장됐습니다.
- **해결**: 다른 게임 모듈과 동일하게 `generateVerificationToken()` → `generateVerificationHash()` 체인 방식으로 교체했습니다.

### 블록쌓기 재게임 시 순위 미표시 버그 (해결 완료)
- **원인**: 타임락(60초) 안에 두 번째 게임을 하면 `canSaveBlockScore()`가 false를 반환하여 저장을 건너뛰면서 `loadBlockRankings()`에 `myScore`를 전달하지 않아 순위가 표시되지 않았습니다.
- **해결**: 타임락이 걸려도 `loadBlockRankings(blockScore)`로 점수를 전달하여 저장 여부와 관계없이 항상 순위가 표시되도록 수정했습니다.

### 블록쌓기 랭킹 Supabase 호출 최적화 (2회 → 1회)
- **원인**: `loadBlockRankings()`에서 Top 10 조회 후 내 순위 계산을 위해 전체 데이터를 한 번 더 조회하는 구조로 딜레이가 발생했습니다.
- **해결**: `limit(10)` 제거 후 전체 데이터를 1번만 조회하여 `slice(0, 10)`으로 Top 10 표시와 `findIndex`로 순위 계산을 동시에 처리합니다.

### pg_cron 크론 정비 (2025-05-28)
- **문제 1**: `daily_ranking_keep_top10` 크론의 `ORDER BY created_at DESC` 오류 — 동점자 처리 기준이 잘못되어 크론이 예상대로 동작하지 않았습니다. `ASC`로 수정 재등록했습니다.
- **문제 2**: `rankings`(가위바위보) 테이블 크론이 누락되어 있었습니다. `cleanup-rankings-daily`로 신규 등록했습니다.
- **문제 3**: `abc_rank` 크론이 `cleanup-abc-rank-daily`와 `daily-abc-rank-cleanup` 두 개 중복 등록되어 있었습니다. `daily-abc-rank-cleanup`을 제거했습니다.
- **수동 정리**: 크론 오류로 쌓인 `circle_rankings` 15개, `rankings` 초과분을 수동 DELETE로 각각 10개로 정리했습니다.

### pg_cron 크론 syntax error 재정비 (2026-05-31)
- **원인**: `clean_rankings_keep_top10` 크론이 여러 DELETE문을 하나의 `$$...$$` 블록에 묶어 실행하려 했으나, pg_cron은 `$$...$$` 안에 SQL 문 1개만 실행 가능하여 `syntax error at or near "DELETE"` 오류로 계속 실패했습니다. `cron.job_run_details` 테이블로 실패 로그 확인.
- **해결**: 문제 크론 삭제 후 테이블별로 크론 1개씩 총 4개로 분리 재등록. 누적된 초과 데이터는 수동 DELETE로 정리.
- **교훈**: pg_cron의 `$$...$$` 블록에는 반드시 SQL 문 1개만 작성해야 합니다.

### 축하 페이지에서 해당 게임 탭으로 복귀 (2026-05-31)
- **변경 전**: `suddenwinner.html`의 '다시 도전하기' 버튼이 `index.html`로 이동하여 항상 로그인 화면이 표시됨.
- **해결**: 버튼 href를 `index.html?game=xxx`로 수정하고, `main.js`의 `saveUsername()` 완료 시 URL 파라미터 `?game=xxx`를 읽어 자동으로 해당 탭(`switchGame()`)으로 전환.

### 블록쌓기 Top 10 하이라이트 미작동 버그 (2026-05-31)
- **원인 1**: `loadBlockRankings`의 `.select('nickname, score, created_at')`에서 `id` 컬럼이 누락되어 `lastBlockUploadedId`와 비교 불가.
- **원인 2**: `insert()`에 `.select()`가 없어 저장 후 반환된 `id`를 받지 못해 `lastBlockUploadedId`가 항상 `null`.
- **해결**: `.select('id, nickname, score, created_at')`으로 수정, `insert().select()`로 반환된 id를 `lastBlockUploadedId`에 저장.

### 블록쌓기 점수/순위 깜빡임 버그 (2026-05-31)
- **원인**: `blockGameOver`에서 점수 텍스트를 먼저 표시하고 `loadBlockRankings`에서 순위를 추가하는 2단계 구조로 깜빡임 발생.
- **해결**: 점수+순위를 `loadBlockRankings`에서 `innerHTML` 한 번에 세팅하도록 통합.

### 블록쌓기 재게임 시 이전 판 하이라이트 잔존 버그 (2026-05-31)
- **원인**: `lastBlockUploadedId`가 이전 판 id를 계속 유지하여 다음 판 랭킹 로드 시에도 이전 기록이 하이라이트됨.
- **해결**: `blockInitGame()` 호출 시 `lastBlockUploadedId = null`로 초기화.

### 블록쌓기 코드 구조 붕괴 버그 (2026-05-31)
- **원인**: 누적된 수정 작업으로 `blockGameOver` 함수가 `loadBlockRankings` 함수 내부에 끼어들어 코드 구조가 완전히 깨짐.
- **해결**: 중복 삽입된 `blockGameOver` 코드 제거 및 각 함수 구조 복원.

### block_rank score 컬럼 정렬 오류 (2026-05-31)
- **원인**: `score` 컬럼 타입이 `text`로 저장되어 숫자 정렬이 아닌 문자열 정렬(`9 > 10`)이 적용됨.
- **해결**: 컬럼 타입을 `int4`로 변경하여 정상 정렬 처리.

---

## 📊 고도화된 '원 그리기' 판정 알고리즘 상세 공식
단순히 전체 점들의 평균 반지름과 표준편차만 비교하던 방식에서 탈피하여, 지글거림과 미시적 일탈을 잡아내는 3중 감점 시스템을 적용하여 판정의 엄격함을 극대화했습니다.

### 기본 도형 점수 (shapeScore)
사용자가 그린 모든 좌표의 중심점(X, Y 평균 위치 = 무게중심)을 계산한 뒤, 각 좌표와 중심점 사이의 거리(반지름)들의 표준편차를 구합니다.
> 공식: `shapeScore = (1 - (반지름 표준편차 / 평균 반지름) * 2) * 100`

### 미시적 요동 및 지글거림 감점 (smoothnessPenalty)
인접한 두 점 사이의 반지름 격차(`Math.abs(distances[i] - distances[i-1])`)를 모두 누적 계산합니다.
> 수식 가중치: 계산된 요동 비율에 **250**을 곱해 다이렉트 감점

### 돌출 및 함몰 최대 오차 감점 (maxErrorPenalty)
평균 반지름과 비교했을 때 가장 격차가 큰 단 하나의 '최대 오차값'을 찾아 저격 감점합니다.
> 수식 가중치: `(최대 오차 / 평균 반지름) * 40` 만큼 페널티

### 시작점-끝점 틈새 감점 (gapPenalty)
첫 번째 좌표와 마지막 좌표 사이의 유클리드 직선거리(Gap)를 측정합니다.
> 수식 가중치: `(벌어진 거리 / 평균 반지름) * 25` 만큼 감점

---

## 🎯 최종 점수 산출 공식

```
최종 스코어 = shapeScore - gapPenalty - maxErrorPenalty - smoothnessPenalty
```

최종 결과는 0점 ~ 100점 사이로 보정되며, 소수점 첫째 자리까지 반올림하여 표기하고 랭킹 데이터베이스에 업로드됩니다.

---