# SeDo — Security Operations Dashboard

보안 운영 관리 시스템(SOC) 포트폴리오 데모입니다.  
실제 회사 코드·API·데이터를 포함하지 않으며, 모든 API 호출은 MSW(Mock Service Worker)로 처리됩니다.

---

## 배포 주소

**[https://DevJamJam.github.io/SecurityDemoDashBoard/](https://DevJamJam.github.io/SecurityDemoDashBoard/)**

> `main` 브랜치 push → GitHub Actions CI/CD → GitHub Pages 자동 배포

---

## 데모 시작

```bash
npm install
npm run dev        # http://localhost:8080/SecurityDemoDashBoard/
```

**데모 계정**

| 역할 | 이메일 | 비밀번호 | 권한 범위 |
|------|--------|----------|----------|
| 관리자 | `admin@sedo.dev` | `Admin1234!` | 전사 조직 전체 |
| 부서장 | `user@sedo.dev` | `User1234!` | 배정 부서만 |

---

## 구현 화면 및 핵심 강점

### 1. 보안 운영 대시보드

- 재귀 트리 조직도 — 노드 클릭으로 부서 범위 전환, 하위 부서 KPI 합산 일치
- KPI 카드 6종 (고위험 취약점·미점검 자산·승인대기·조치대기·진행중 점검·명령 실패)
- **[KPI 클릭 → 요약 모달 → 자산 목록 → 자산 이슈 → 조치 이력]** 최대 4 depth 드릴다운
- CCE/CVE 운영 추이 매트릭스 테이블 (월별 컬럼, ▲▼ delta, 5단계 단계현황)
- Recharts LineChart 보안율·조치율 추이 시각화
- 관리자(role=1) / 부서장 권한별 조직 노드 선택 제한
- 부서별 Mock 데이터 완전 분리 — 드릴다운 자산 수와 운영 추이 카운트 정합성 보장
- **상태바 바로가기** — `결과 조회 →` 클릭 시 pending 필터 자동 적용, `실행 모니터 →` 클릭 시 running 탭 자동 활성화 (React Router `navigate state` 활용)

### 2. 점검 계획 (Inspection Plans)

- `CommonTable` 기반 30건 목록 — 페이지네이션(10건/페이지) 동작 확인 가능
- 상태·점검 유형 필터 검색 + 컬럼 정렬
- 행 클릭 → 상세 페이지 이동 (React Router 동적 라우팅)

### 3. 실행 모니터 (Execution Monitor)

- 실행 작업 카드 그리드 (`execution-grid`) — 진행률 ProgressBar 실시간 표시
- **상태 필터 탭** (전체/실행중/완료/예약/실패) — 로컬 필터로 API 재호출 없이 즉시 분류
- **running 작업 존재 시 10초 자동 갱신** — polling이 멈추면 자동 중단, 필터 상태 유지
- **시작/중단 버튼** → SweetAlert2 확인 다이얼로그 → Zustand 상태 업데이트 → localStorage 영속
- 새로고침 후에도 변경된 작업 상태가 유지되며 "상태 초기화" 버튼으로 원복 가능

### 4. 결과 조회 (Result Review)

- 점검 결과 목록 테이블 (24건) — `pending / in_review / approved` 검토 상태 필터
- **승인 버튼** → SweetAlert2 확인 → 인라인 상태 업데이트 (API re-fetch 없음)
- 행 클릭 → 상세 모달 (코멘트·검토자·점수 상세 조회)
- API 실패 시 에러 상태 표시 (무한 스피너 없음)

### 5. 자산 관리 (Asset Management)

- 35개 자산 목록 — 자산명·유형·상태 필터로 프론트엔드 로컬 검색
- 페이지네이션(10건/페이지) — 4페이지 분량 데이터 확인 가능
- server·db_server·network_device·cloud_instance·pc 5가지 유형, 활성/비활성 상태 배지
- **행 클릭 → 자산 상세 모달** — IP 주소·유형·OS·위치·상태·최근 점검일 조회

### 6. 네트워크 세그먼트 (Network Segments)

- 10개 세그먼트 카드 — 위험도(low·medium·high) 색상 배지, 취약점 수·오픈 포트 현황
- **편집 버튼** → 인라인 폼으로 전환 → 저장 시 SweetAlert2 확인 + 낙관적 UI 업데이트
- SVG 기반 네트워크 토폴로지 맵 — 세그먼트 노드 클릭 시 연결 관계 하이라이트
- **통신 매트릭스 탭** — 세그먼트×세그먼트 그리드, allow/partial/block/alert 상태 색상 구분, 행·열 크로스 하이라이트
- CIDR·IP 범위·자산 수·최근 점검일·설명·태그 표시

### 7. 공통 인프라

- CSS Variables 기반 다크/라이트 테마 전환 — `body.dark` 클래스 하나로 전체 컬러 전환
- Zustand 전역 상태 + 세션 복원 (`restoreSession`) + 5분 세션 만료 체크
- SweetAlert2 다국어 확인/오류 다이얼로그
- MSW v2 Service Worker — 실제 서버 없이 브라우저에서 완전한 API 동작
- `resolveEnvelope()` 유틸 — `{ RESULT, CODE }` / `{ data }` 등 4종 응답 형식을 단일 인터페이스로 흡수 (`src/lib/sedoApi.js`)
- Playwright e2e 35개 테스트 — 로그인·대시보드 드릴다운·페이지별 렌더링·에러 시뮬레이션·크로스 페이지 네비게이션 검증

---

## Tech Stack

| 구분 | 기술 |
|------|------|
| Framework | React 19 + Vite 6 |
| Routing | React Router v7 |
| State | Zustand v5 (persist + localStorage) |
| Mock API | MSW v2 (Service Worker, 브라우저 내 완전 동작) |
| HTTP | Axios (baseURL `/api`, timeout 10s) |
| Chart | Recharts (LineChart 보안율/조치율 추이) |
| Dialog | SweetAlert2 |
| Icons | React Icons |
| Style | CSS Variables — 라이트/다크 테마 토큰 시스템 |
| Test | Vitest + RTL (단위), Playwright (e2e) |
| Deploy | GitHub Actions → GitHub Pages |

---

## MSW 설계

```
브라우저 → axios GET("/api/inspection-plans")
        → MSW Service Worker 가로채기
        → handlers.js → mock 응답 반환
        → { items: [...], total: N }
```

모든 API는 MSW 핸들러에서 처리됩니다. 실제 백엔드 서버가 필요하지 않습니다.

**테스트 전용 엔드포인트**

| 엔드포인트 | 설명 |
|-----------|------|
| `POST /__test/error-flags` | e2e 테스트 전용 — MSW 핸들러에 에러 플래그를 설정/해제하여 API 500 시나리오 시뮬레이션 |

**API 규격 — 대시보드 (내부 API)**

응답 포맷: `{ RESULT: "OK" | "FAIL", CODE: {...} }` — 인증 실패는 HTTP 200 + `RESULT: "FAIL"` 반환

| 엔드포인트 | 설명 |
|-----------|------|
| `POST /api/auth/login` | 데모 계정 인증 (미등록 계정은 오류 메시지 반환) |
| `GET /api/auth/me` | 세션 유저 정보 반환 |
| `GET /api/org/tree` | 조직도 트리 (IT본부 > 개발팀/보안팀/인프라팀) |
| `POST /api/dashboard` | `dept_id` 기반 부서별 KPI 반환 |
| `POST /api/dashboard/alerts` | severity별 알림 목록 |
| `POST /api/dashboard/pending/*` | 승인/조치대기 드릴다운 |
| `POST /api/dashboard/trend/assets` | 월별 운영 추이 드릴다운 자산 목록 |
| `POST /api/dashboard/unchecked/*` | 미점검 자산 드릴다운 |

**API 규격 — 서브 페이지 (REST)**

| 엔드포인트 | 설명 |
|-----------|------|
| `GET /api/inspection-plans` | 점검 계획 목록 (30건, pagination 파라미터) |
| `GET /api/inspection-plans/:id` | 점검 계획 상세 |
| `GET /api/execution-jobs` | 실행 작업 목록 (16건, 상태 분류) |
| `PATCH /api/execution-jobs/:id/status` | 작업 상태 변경 (start/stop) |
| `GET /api/inspection-results` | 점검 결과 목록 (24건) |
| `PATCH /api/inspection-results/:id` | 결과 승인 처리 |
| `GET /api/assets` | 자산 목록 (35건, 유형·상태 포함) |
| `GET /api/network-segments` | 네트워크 세그먼트 목록 (10건, 위험도·취약점 포함) |
| `PATCH /api/network-segments/:id` | 세그먼트 정보 수정 |

**부서별 Mock 데이터 계층 구조**

```
전사 (root)               assets=45  high_risk=12
 └── IT본부 (dept-001)    assets=45  high_risk=12  ← 하위 합계와 일치
       ├── 개발팀 (dept-002)   assets=20  high_risk=5   completion=65%
       ├── 보안팀 (dept-003)   assets=18  high_risk=4   completion=80%
       └── 인프라팀 (dept-004) assets=7   high_risk=3   completion=55%
```

드릴다운 자산(ASSET_POOL 8개)은 부서별로 배분되며, 운영 추이 월별 카운트는 실제 드릴다운 결과 수와 정확히 일치합니다.

---

## 프로젝트 구조

```
src/
├── api/
│   ├── auth/auth.js              # login, logout, fetchLoginUser
│   ├── cce/                      # 대시보드 팝업 API (dashboardPopups, dashboardTrend)
│   └── securityDemoApi.js        # 서브 페이지 REST 호출 함수 모음 (axios 인스턴스 분리)
├── lib/
│   └── sedoApi.js                # axios 기본 인스턴스 + resolveEnvelope() 유틸
├── components/
│   ├── common/                   # Button, CommonTable, SearchMenu, Pagination, StatusBadge, ProgressBar
│   ├── layout/                   # PageHeader
│   ├── main/                     # Header, SideMenu, Breadcrumb (NAV_CONFIG 기반)
│   ├── network/                  # NetworkTopologyMap (SVG 토폴로지), NetworkConnectionMatrix (통신 매트릭스)
│   └── dashboard/                # 대시보드 전용 컴포넌트 (OrgTree, KPI, Modal, TrendTable ...)
├── config/
│   ├── navConfig.js              # 사이드메뉴 라우팅 설정
│   └── data/                     # 드릴다운 단계 메타 (adminHomeDrilldownMock)
├── layouts/
│   ├── MainLayout.jsx            # 헤더 + 사이드메뉴 + Breadcrumb + 콘텐츠
│   └── MainLayout.css
├── mocks/
│   ├── data/                     # auth.mock, org.mock, dashboard.mock, drilldown.mock
│   ├── handlers.js               # MSW 핸들러 (auth/org/dashboard/inspection/assets ...)
│   └── browser.js                # setupWorker
├── pages/
│   ├── login/Login.jsx           # 로그인 (고정 데모 계정)
│   ├── dashboard/                # AdminRoleHome (조직도 패널 + 대시보드 본체)
│   ├── InspectionPlanList.jsx    # 점검 계획 목록 + 페이지네이션
│   ├── InspectionPlanDetail.jsx  # 점검 계획 상세
│   ├── ExecutionMonitor.jsx      # 실행 작업 카드 그리드 + 시작/중단
│   ├── ResultReview.jsx          # 결과 검토 테이블 + 승인
│   ├── AssetManagement.jsx       # 자산 목록 + 페이지네이션
│   └── NetworkSegments.jsx       # 세그먼트 카드 + 인라인 편집 + 토폴로지 맵
├── store/
│   ├── auth/                     # 인증·세션 (useAuthStore)
│   ├── cce/                      # 대시보드 상태 (useDashboardStore, useDashboardDetailStore, useVulnMgmtUiStore)
│   ├── navigation/               # 탭 상태 (useMainTabStore)
│   ├── theme/                    # 다크/라이트 (useThemeStore)
│   ├── bookmark/                 # 즐겨찾기 (useBookmarkStore)
│   ├── useExecutionStore.js      # 실행 작업 상태 (localStorage persist)
│   ├── useInspectionPlanStore.js # 점검 계획 상태
│   └── useNetworkSegmentStore.js # 세그먼트 상태
├── routes/
│   └── Router.jsx                # React Router 라우팅 설정
└── styles/
    ├── variables.css             # CSS 디자인 토큰 (라이트/다크 전체)
    ├── base.css                  # 폰트, reset
    ├── layout.css                # app-shell, header, page-content 레이아웃
    └── components.css            # common-table, search-menu, btn, card, pagination 등
```

---

## e2e 테스트

```bash
# 단위 테스트 (Vitest + RTL)
npm run test:unit

# e2e 테스트 (Playwright)
npm run build && npx playwright test
```

### 단위 테스트 (Vitest + React Testing Library)

`src/test/unit/` — 61개 테스트, 5 파일

| 파일 | 범위 |
|------|------|
| `StatusBadge.test.jsx` | 12가지 status 한글 라벨, label prop 우선순위, dot 클래스, CSS 클래스 |
| `ProgressBar.test.jsx` | percent/current+total 계산, 클램프(0·100), 경계값, 색상 클래스 3단계, 레이블 |
| `Pagination.test.jsx` | 렌더링 조건(1페이지 숨김), 처음/이전/다음/마지막 비활성화, 클릭 이벤트 onChange |
| `CommonTable.test.jsx` | 헤더·데이터 렌더링, 빈 상태, render 함수, index 컬럼, 행 클릭, 정렬 toggle |
| `CrossPageNav.test.jsx` | `ExecutionMonitor` location.state → 필터 탭 초기화(4케이스), `ResultReview` autoFilter → 클라이언트 필터 적용(3케이스) |

### e2e 테스트 (Playwright)

`e2e/verify.spec.js` — 35개 테스트

| 범위 | 내용 |
|------|------|
| 로그인 화면 | 레이아웃, 빈 입력 경고, 잘못된 계정 오류·한글 인코딩, 정상 로그인 |
| 대시보드 | KPI 카드, 조직 트리, 주요 이슈 테이블, 드릴다운 모달, 행별 다른 자산명 검증 |
| 대시보드 KPI 칩 | 위험탐지·미처리·명령오류·점검범위 클릭 모달 |
| 대시보드 추이 | 월별 추이 테이블 보기, 취약점 상세 모달 |
| 대시보드 바로가기 | 상태바 nav 버튼 3개 렌더링, 결과 조회 이동+pending 필터 자동 적용, 실행 모니터 이동+running 탭 자동 활성화, 자산 관리 이동 |
| 점검 계획 | 목록 테이블, 행 클릭 → 상세 페이지 이동 |
| 실행 모니터 | 작업 목록 렌더링, 상태 필터 클릭 → 카드 수 변경 |
| 결과 조회 | 테이블 렌더링, 행 클릭 → 상세 모달, 승인 버튼 → SweetAlert2 |
| 자산 관리 | 테이블 렌더링, 행 클릭 → 상세 모달(IP 표시), 오버레이 클릭 닫힘 |
| 네트워크 세그먼트 | 토폴로지 렌더링, 통신 매트릭스 탭 전환, 세그먼트 목록 탭 전환 |
| 에러 시뮬레이션 | API 500 → 에러 메시지 표시, 플래그 해제 후 정상 복구 |

---

## CI/CD

```
git push origin main
  → GitHub Actions (.github/workflows/deploy.yml)
    → npm ci → npm run build
    → GitHub Pages (dist/ 디렉토리)
      → https://DevJamJam.github.io/SecurityDemoDashBoard/
```

SPA 라우팅 처리: `public/404.html` 리다이렉트 + `index.html` 경로 복원 스크립트로 GitHub Pages BrowserRouter 지원.

---

## 보안 원칙

1. 실제 API 엔드포인트·서버 IP·내부 시스템 정보 미포함
2. 실제 회사명·제품명·내부 식별자 미포함
3. 토큰·자격증명을 localStorage/sessionStorage에 저장하지 않음
4. 모든 Mock IP는 RFC 1918 사설 대역 사용 (10.x.x.x, 172.16.x.x, 192.168.x.x)

---

*This project is a portfolio demonstration only. No real security data, credentials, or company information is included.*
