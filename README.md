# SeDo — Security Operations Dashboard

포트폴리오용 보안 운영 관리 시스템 Demo입니다.  
실제 회사 코드·API·데이터를 포함하지 않으며, 모든 API 호출은 MSW(Mock Service Worker)로 처리됩니다.

---

## 데모 시작

```bash
npm install
npm run dev        # http://localhost:8080 (포트 충돌 시 자동 변경)
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

### 2. 모달 스택 드릴다운 (13+ depth flow)

- `[KPI 카드 클릭] → 요약 모달 → 자산 목록 → 자산 이슈 → 조치 이력` 최대 4 depth 드릴다운.
- `openWithLoading` 패턴: 로딩 상태를 모달 스택 내에서 인라인으로 처리.
- `backModal`, `closeModal`, `replaceTopModal`로 일관된 모달 lifecycle 관리.

### 3. 다크/라이트 모드

- CSS Variables 기반 디자인 토큰 시스템 — `body.dark` 클래스 하나로 모든 컬러 전환.
- Zustand `useThemeStore`에서 상태 관리, 새로고침 후에도 유지.
- 라이트/다크 모드 모두에서 동일한 정보 밀도와 가독성을 제공합니다.

### 4. 세션 관리 / 권한 제어

- 앱 마운트 시 `restoreSession()` 호출 → 세션 복원 또는 로그인 페이지 리다이렉트.
- 5분 간격으로 세션 체크, 만료 시 SweetAlert2 경고 후 자동 로그아웃.
- 조직 노드 선택 권한을 `orgPermissionUtils`로 분리해 관리자/부서장/일반 사용자를 구분.

### 5. 확인 필요 알림 패널

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
| Dialog | SweetAlert2 |
| Icons | React Icons |
| Style | CSS Variables — 라이트/다크 테마 |

---

## 프로젝트 구조

```
src/
├── api/
│   ├── auth/auth.js           # login, logout, fetchLoginUser
│   ├── org/org.js             # fetchOrgTree, createOrg ...
│   └── cce/
│       ├── dashboard.js       # getOrgDashboard
│       ├── dashboardPopups.js # KPI 드릴다운 API
│       └── bookmark.js        # getBookmark, setBookmark
├── assets/icons/index.js      # react-icons barrel export
├── components/
│   ├── common/                # LoadingSpinner, ThemeToggle, Button ...
│   └── dashboard/
│       ├── AdminOrgTreeDesign4.jsx    # 재귀 트리 컴포넌트
│       ├── RealOrgTreePanel.jsx       # 조직도 패널 (권한 필터링)
│       ├── AdminSummaryCards.jsx      # KPI 카드 스트립 (6종)
│       ├── AdminAlertPanel.jsx        # 확인 필요 알림 패널
│       ├── AdminDetailModal.jsx       # 모달 스택 렌더러
│       ├── Design4MainBoard.jsx       # 메인 대시보드 보드
│       └── dashboardPopupBuilders.js  # 모달 데이터 빌더 (builder pattern)
├── config/
│   ├── clientFeatures.js      # 기능 플래그 (feature flags)
│   └── data/
│       ├── adminHomeDrilldownMock.js  # STEP_META (조치 단계 정의)
│       └── dashboardPopupMeta.js      # getUncheckedCategoryLabel
├── layouts/
│   └── MainLayout.jsx         # 헤더 + 사이드메뉴 + 콘텐츠 레이아웃
├── lib/sedoApi.js             # Axios 인스턴스 (baseURL=/api)
├── mocks/
│   ├── data/
│   │   ├── auth.mock.js       # 사용자 mock 데이터
│   │   ├── org.mock.js        # 조직도 mock 데이터
│   │   └── dashboard.mock.js  # KPI / 보안 현황 mock 데이터
│   ├── handlers.js            # MSW 핸들러 (auth/org/dashboard 전체)
│   └── browser.js             # setupWorker
├── pages/
│   ├── login/Login.jsx
│   ├── authLayout/AuthLayout.jsx
│   └── dashboard/AdminRoleHome.jsx  # 880+ lines 메인 대시보드
├── routes/
│   ├── Router.jsx             # 모든 경로 /sedo/* 하위
│   └── ProtectedRoute.jsx
├── store/
│   ├── auth/useAuthStore.js   # 로그인·세션 복원·로그아웃
│   ├── org/useOrgStore.js     # 조직도 (sessionStorage persist)
│   ├── bookmark/useBookmarkStore.js
│   ├── cce/useDashboardStore.js       # KPI 데이터 + buildDetailFromCode
│   ├── cce/useDashboardDetailStore.js # 드릴다운 API 슬롯 캐시
│   ├── cce/useVulnMgmtUiStore.js
│   ├── common/useLayoutStore.js       # 사이드바 collapse
│   ├── navigation/useMainTabStore.js  # 현재 탭
│   └── theme/useThemeStore.js         # 다크/라이트 모드
├── styles/
│   ├── variables.css          # CSS 디자인 토큰 (라이트/다크)
│   └── base.css               # 폰트, reset
└── utils/orgPermissionUtils.js  # 조직 접근 권한 헬퍼
```

---

## 구현 현황

| 섹션 | 상태 | 비고 |
|------|------|------|
| 로그인 / 세션 관리 | ✅ 완료 | 고정 데모 계정 인증, 5분 세션 체크 |
| 보안 운영 대시보드 | ✅ 완료 | 조직도 + KPI 6종 + 모달 드릴다운 13+ flow |
| CCE 취약점 관리 | 🔧 진행중 | UI stub — 목록·점검계획·조치워크플로우 구현 예정 |
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

| 엔드포인트 | 설명 |
|-----------|------|
| `POST /api/auth/login` | 등록된 데모 계정만 인증 성공, 미등록 계정은 오류 반환 |
| `POST /api/auth/logout` | 세션 종료 |
| `GET /api/auth/me` | 현재 로그인 사용자 정보 반환 |
| `GET /api/org/tree` | 조직도 트리 반환 |
| `POST /api/dashboard` | 전체/부서별 KPI 대시보드 반환 |
| `POST /api/dashboard/alerts` | severity별 알림 목록 반환 |
| `POST /api/dashboard/pending/*` | 승인/조치대기 드릴다운 |
| `POST /api/dashboard/unchecked/*` | 미점검 자산 드릴다운 |

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
5. 모든 mock IP는 RFC 1918 사설 대역만 사용

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
