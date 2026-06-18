# SeDo — Security Operations Dashboard

포트폴리오용 보안 운영 관리 시스템 Demo입니다.  
실제 회사 코드·API·데이터를 포함하지 않으며, 모든 API 호출은 MSW(Mock Service Worker)로 처리됩니다.

---

## 배포 주소

**[https://DevJamJam.github.io/SecurityDemoDashBoard/](https://DevJamJam.github.io/SecurityDemoDashBoard/)**

> GitHub Actions CI/CD — `main` 브랜치에 push하면 자동으로 GitHub Pages에 배포됩니다.

---

## 데모 시작

```bash
npm install
npm run dev        # http://localhost:5173
```

**데모 계정 (아래 계정만 로그인 가능)**

| 역할 | 이메일 | 비밀번호 | 권한 |
|------|--------|--------|------|
| 관리자 | `admin@sedo.dev` | `Admin1234!` | 전사 범위 조회, 조직 관리 |
| 부서장 | `user@sedo.dev` | `User1234!` | 배정 부서 범위만 조회 |

등록되지 않은 계정으로 로그인을 시도하면 오류 메시지가 반환됩니다.

---

## 핵심 강점

### 1. 역할 기반 조직도 + KPI 대시보드

- 재귀 트리 구조의 조직도 (`AdminOrgTreeDesign4`) — 노드 클릭으로 부서 범위를 전환합니다.
- 조직도 선택과 연동된 KPI 카드 6종 (고위험 취약점·미점검 자산·승인/조치대기·진행중 점검·명령 실패·관리 자산).
- 관리자(role=1)는 전사 범위, 일반 사용자는 배정된 부서 범위만 조회 가능.
- **부서 전환 시 MSW가 dept_id를 수신해 해당 부서 전용 데이터를 반환** — 상위 부서 KPI는 하위 부서 합계와 일치.

### 2. CCE/CVE 운영 추이 매트릭스 테이블

- 월을 컬럼으로, 항목을 행으로 구성한 매트릭스 구조 (`TrendTable`).
- 발견 건수에 전월 대비 ▲▼ delta 표시 (`formatDelta`).
- 5단계 조치 워크플로우(조치계획등록 → 조치완료)를 단계현황 그룹 행으로 표시.
- Recharts LineChart를 활용한 보안율·조치율 추이 시각화 (`SecuritySummaryBoard`).

### 3. 모달 스택 드릴다운

- `[KPI 카드 클릭] → 요약 모달 → 자산 목록 → 자산 이슈 → 조치 이력` 최대 4 depth 드릴다운.
- `openWithLoading` 패턴: 로딩 상태를 모달 스택 내에서 인라인으로 처리.
- `backModal`, `closeModal`, `replaceTopModal`로 일관된 모달 lifecycle 관리.

### 4. 다크/라이트 모드

- CSS Variables 기반 디자인 토큰 시스템 — `body.dark` 클래스 하나로 모든 컬러 전환.
- Zustand `useThemeStore`에서 상태 관리, 새로고침 후에도 유지.
- 라이트/다크 모드 모두에서 동일한 정보 밀도와 가독성을 제공합니다.

### 5. 세션 관리 / 권한 제어

- 앱 마운트 시 `restoreSession()` 호출 → 세션 복원 또는 로그인 페이지 리다이렉트.
- 5분 간격으로 세션 체크, 만료 시 SweetAlert2 경고 후 자동 로그아웃.
- 조직 노드 선택 권한을 `orgPermissionUtils`로 분리해 관리자/부서장/일반 사용자를 구분.

### 6. 확인 필요 알림 패널

- 긴급/확인/안내 3개 severity 카드 클릭 → 인라인으로 알림 목록 expand.
- `useDashboardDetailStore` 슬롯 캐시로 재클릭 시 네트워크 요청 없이 목록 표시.

---

## Tech Stack

| 구분 | 기술 |
|------|------|
| Framework | React 19 + Vite 6 |
| Routing | React Router v7 |
| State | Zustand v5 (persist, sessionStorage) |
| Mock API | MSW v2 (모든 API 항상 mock) |
| HTTP | Axios (baseURL `/api`, withCredentials) |
| Chart | Recharts (보안율/조치율 LineChart) |
| Dialog | SweetAlert2 |
| Icons | React Icons |
| Style | CSS Variables — 라이트/다크 테마 |
| Deploy | GitHub Actions → GitHub Pages |

---

## 프로젝트 구조

```
src/
├── api/
│   ├── auth/auth.js           # login, logout, fetchLoginUser
│   ├── cce/
│   │   ├── dashboard.js       # getOrgDashboard (dept_id 전달)
│   │   ├── dashboardPopups.js # KPI 드릴다운 API
│   │   └── bookmark.js        # getBookmark, setBookmark
│   └── org/org.js             # fetchOrgTree, createOrg ...
├── assets/icons/index.js      # react-icons barrel export
├── components/
│   ├── common/                # Button, LoadingSpinner, ThemeToggle, ProgressBar ...
│   └── dashboard/
│       ├── AdminOrgTreeDesign4.jsx    # 재귀 트리 컴포넌트
│       ├── RealOrgTreePanel.jsx       # 조직도 패널 (권한 필터링)
│       ├── AdminSummaryCards.jsx      # KPI 카드 스트립 (6종)
│       ├── AdminAlertPanel.jsx        # 확인 필요 알림 패널
│       ├── AdminDetailModal.jsx       # 모달 스택 렌더러
│       ├── Design4MainBoard.jsx       # 메인 대시보드 보드 (운영추이 매트릭스/차트)
│       └── dashboardPopupBuilders.js  # 모달 데이터 빌더
├── config/
│   ├── clientFeatures.js      # 기능 플래그 (feature flags)
│   └── data/
│       ├── adminHomeDrilldownMock.js  # STEP_META (5단계 조치 워크플로우 정의)
│       └── dashboardPopupMeta.js      # getUncheckedCategoryLabel
├── layouts/
│   ├── MainLayout.jsx         # 헤더 + 사이드메뉴 + 콘텐츠 레이아웃 (Route에 연결)
│   └── MainLayout.css
├── components/main/           # 레이아웃 내부 컴포넌트
│   ├── Header.jsx             # 상단 헤더 (로고·테마 토글·비밀번호 변경)
│   ├── SideMenu.jsx           # 좌측 사이드 메뉴
│   ├── TopMenu.jsx            # 상단 탭 메뉴
│   └── TopMenuActions.jsx
├── lib/sedoApi.js             # Axios 인스턴스 (baseURL=/api, timeout=20s)
├── mocks/
│   ├── data/
│   │   ├── auth.mock.js       # 데모 계정 2개 (DEMO_ACCOUNTS)
│   │   ├── org.mock.js        # 조직도 트리 mock (IT본부 > 개발팀/보안팀/인프라팀)
│   │   ├── dashboard.mock.js  # 부서별 KPI mock (DEPT_DATASETS — 계층 합계 일치)
│   │   ├── assets.mock.js     # 자산 목록 mock
│   │   ├── inspectionPlans.mock.js    # CCE 점검 계획 mock
│   │   ├── inspectionPlanDetail.mock.js
│   │   ├── inspectionResults.mock.js
│   │   ├── networkSegments.mock.js
│   │   └── executionJobs.mock.js
│   ├── handlers.js            # MSW 핸들러 — auth/org/dashboard 전체
│   └── browser.js             # setupWorker
├── pages/
│   ├── login/Login.jsx               # 로그인 페이지 (고정 계정 인증)
│   ├── authLayout/
│   │   ├── AuthLayout.jsx            # 로그인 화면 레이아웃 (로고)
│   │   ├── SignUp.jsx                # 회원가입 stub
│   │   ├── FindId.jsx                # 아이디 찾기 stub
│   │   └── ResetPassword.jsx         # 비밀번호 재설정 stub
│   ├── dashboard/
│   │   ├── Dashboard.jsx             # 대시보드 외곽 레이아웃 (조직도 패널 포함)
│   │   ├── AdminRoleHome.jsx         # 메인 대시보드 (KPI + 운영추이 + 모달 흐름)
│   │   └── css/                      # 대시보드 전용 CSS (base/design4/modals/sidebar...)
│   └── stubs/                        # 구현 예정 페이지 (진입 가능한 빈 화면)
│       ├── HomeAssets.jsx            # 자산 관리
│       ├── HomeRouter.jsx            # CCE 취약점 관리
│       ├── HomeCve.jsx               # CVE 취약점 관리
│       ├── HomeVulnMgmt.jsx          # 취약점 조치 워크플로우
│       └── HomeCommand.jsx           # 명령 실행
├── routes/
│   ├── Router.jsx             # 전체 라우트 정의 (/sedo/* 하위)
│   └── ProtectedRoute.jsx     # 인증 미완료 시 루트로 리다이렉트
├── store/
│   ├── auth/useAuthStore.js           # 로그인·세션 복원·로그아웃
│   ├── org/useOrgStore.js             # 조직도 (sessionStorage persist)
│   ├── bookmark/useBookmarkStore.js
│   ├── cce/useDashboardStore.js       # KPI 데이터 + buildDetailFromCode
│   ├── cce/useDashboardDetailStore.js # 드릴다운 API 슬롯 캐시
│   ├── cce/useVulnMgmtUiStore.js
│   ├── common/useLayoutStore.js       # 사이드바 collapse
│   ├── navigation/useMainTabStore.js  # 현재 탭
│   └── theme/useThemeStore.js         # 다크/라이트 모드
├── styles/
│   ├── variables.css          # CSS 디자인 토큰 (라이트/다크 전체)
│   ├── base.css               # 폰트, reset
│   ├── components.css
│   ├── layout.css
│   └── responsive.css
└── utils/orgPermissionUtils.js  # 조직 접근 권한 헬퍼
```

---

## 구현 현황

| 섹션 | 상태 | 비고 |
|------|------|------|
| 로그인 / 세션 관리 | ✅ 완료 | 고정 데모 계정 인증, 5분 세션 체크, MSW 인증 오류 처리 |
| 보안 운영 대시보드 | ✅ 완료 | 조직도 + KPI 6종 + 모달 드릴다운 |
| CCE/CVE 운영추이 매트릭스 | ✅ 완료 | 월별 컬럼 구조, ▲▼ delta, 5단계 단계현황, 보안율/조치율 LineChart |
| 부서별 Mock API | ✅ 완료 | dept_id 기반 분기, IT본부 KPI = 하위 팀 합계 (계층 일관성) |
| CCE 취약점 관리 | 🔧 진행중 | UI stub — 목록·점검계획·조치 워크플로우 구현 예정 |
| CVE 취약점 관리 | 🔧 진행중 | UI stub — 스캔 결과·위험도 분류 화면 구현 예정 |
| 자산 관리 | 🔧 진행중 | UI stub — 자산 등록·그룹·조직 배정 화면 구현 예정 |
| 취약점 조치 워크플로우 | 🔧 진행중 | UI stub — 5단계 승인 플로우 구현 예정 |
| 명령 실행 | 🔧 진행중 | UI stub — 원격 명령 발행·결과 조회 화면 구현 예정 |

---

## MSW 설계

모든 API 호출은 MSW를 통해 처리됩니다. 실제 서버는 필요하지 않습니다.

```
브라우저 → axios POST("/api/auth/login")
        → MSW Service Worker 가로채기
        → handlers.js → mock 응답 반환
        → { RESULT: "OK", CODE: { ... } }
```

**API 응답 규격** — 모든 응답은 `{ RESULT: "OK" | "FAIL", CODE: {...} }` 형식을 따릅니다.  
로그인 인증 실패는 HTTP 400 대신 **HTTP 200 + `RESULT: "FAIL"`** 로 반환해 Axios catch 없이 메시지를 전달합니다.

| 엔드포인트 | 설명 |
|-----------|------|
| `POST /api/auth/login` | 등록된 데모 계정만 인증 성공, 미등록 계정은 오류 메시지 반환 |
| `POST /api/auth/logout` | 세션 종료 |
| `GET /api/auth/me` | 현재 로그인 사용자 정보 반환 |
| `GET /api/org/tree` | 조직도 트리 반환 (IT본부 > 개발팀/보안팀/인프라팀) |
| `POST /api/dashboard` | `dept_id`에 따라 부서별 KPI 반환 — `null`이면 전사 기준 |
| `POST /api/dashboard/alerts` | severity별 알림 목록 반환 |
| `POST /api/dashboard/pending/*` | 승인/조치대기 드릴다운 |
| `POST /api/dashboard/unchecked/*` | 미점검 자산 드릴다운 |

**부서별 Mock 데이터 계층 구조**

```
전사 (root)              assets=45  high_risk=12
 └── IT본부 (dept-001)   assets=45  high_risk=12  ← 하위 합계와 일치
       ├── 개발팀 (dept-002)  assets=20  high_risk=5   completion_rate=65%
       ├── 보안팀 (dept-003)  assets=18  high_risk=4   completion_rate=80%
       └── 인프라팀 (dept-004) assets=7   high_risk=3   completion_rate=55%
```

---

## CI/CD

```
git push origin main
  → GitHub Actions (.github/workflows/deploy.yml)
    → npm ci → npm run build
    → GitHub Pages (dist/ 디렉토리)
      → https://DevJamJam.github.io/SecurityDemoDashBoard/
```

SPA 라우팅 처리: GitHub Pages는 BrowserRouter 직접 URL을 지원하지 않으므로  
`public/404.html` 리다이렉트 + `index.html` 경로 복원 스크립트 패턴을 사용합니다.

---

## 다크모드 / 라이트모드

헤더 우측의 토글 스위치로 즉시 전환됩니다. `body.dark` 클래스와 CSS Variables 조합으로 구현되어 있습니다.

```css
:root { --mn-color: #ffffff; --text-color: #1f2937; }
body.dark { --mn-color: #152233; --text-color: #edf2f7; }
```

---

## 보안 원칙

1. 실제 API 엔드포인트, 서버 IP, 내부 시스템 정보 없음
2. 실제 회사명, 제품명, 내부 메뉴명 없음
3. 토큰·자격증명을 localStorage/sessionStorage에 저장하지 않음
4. sessionStorage에는 조직도 캐시와 북마크 목록만 저장
5. 모든 mock IP는 RFC 1918 사설 대역만 사용 (10.0.x.x)

---

## Available Scripts

```bash
npm run dev      # 개발 서버 시작
npm run build    # 프로덕션 빌드
npm run lint     # ESLint 검사
npm run preview  # 빌드 결과 미리보기
```

---

*This project is a portfolio demonstration only. No real security data, credentials, or company information is included.*
