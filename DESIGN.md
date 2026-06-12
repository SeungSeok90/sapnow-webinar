# 온라인 영상 시청 플랫폼 — 전체 설계안

> 행사일: 2025년 7월 14일  
> 작성일: 2026-06-12  
> 최대 동시 접속: 약 2,000명  

---

## 서비스 개요

행사 참석자를 대상으로 온라인 영상 / 웨비나 콘텐츠를 제공하는 웹앱.  
참석자는 등록 후 로그인하여 영상 시청 페이지에 접근하고, 운영자는 어드민 페이지에서 등록 현황과 시청 현황을 확인한다.  
영상 트래픽은 Vimeo가 처리하고, 웹앱은 등록 / 로그인 / 시청 로그 / 통계 관리에 집중한다.

---

## 1. 전체 아키텍처

```
┌─────────────────────────────────────────────────────────┐
│                      Vercel Edge                        │
│                   Next.js Middleware                    │
│          (세션 검증 / 라우트 보호 / 권한 분기)              │
└──────────────────────┬──────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        ▼              ▼              ▼
  [사용자 페이지]  [관리자 페이지]  [API Routes]
  /register       /admin/*         /api/*
  /login                           (서버 전용)
  /watch
        │              │              │
        └──────────────┴──────────────┘
                       │
                       ▼
            ┌──────────────────┐
            │  Supabase Postgres│
            │  (service_role)   │
            │  RLS: 전체 차단   │
            └──────────────────┘
                       │
                       ▼
              [Vimeo CDN] (영상 트래픽 분리)
```

### 핵심 원칙

- 클라이언트 → Supabase 직접 접근 **전면 차단** (RLS로 anon/authenticated 모두 deny)
- 모든 DB 접근은 `SUPABASE_SERVICE_ROLE_KEY`를 사용하는 **Next.js API Route에서만** 처리
- 세션은 `iron-session` (서버사이드 암호화 쿠키) 사용
- 영상 트래픽은 Vimeo가 처리, 웹앱은 메타데이터 / 로그만 담당

---

## 2. 기술 스택

| 항목 | 선택 |
|------|------|
| 프레임워크 | Next.js 15 (App Router) |
| 언어 | TypeScript |
| DB | Supabase Postgres |
| 세션 | iron-session |
| 비밀번호 해시 | bcryptjs |
| 엑셀 | xlsx (SheetJS) |
| UI | Tailwind CSS + shadcn/ui |
| 아이콘 | lucide-react |
| 영상 임베드 | Vimeo iframe embed |
| 배포 | Vercel |

---

## 3. 프로젝트 폴더 구조

```
sapnow-webinar/
├── app/
│   ├── (user)/                         # 사용자 영역
│   │   ├── register/
│   │   │   ├── page.tsx                # 등록 페이지
│   │   │   └── complete/page.tsx       # 등록 완료 페이지
│   │   ├── login/page.tsx              # 사용자 로그인
│   │   └── watch/page.tsx              # 영상 시청 (보호됨)
│   │
│   ├── admin/                          # 관리자 영역
│   │   ├── login/page.tsx
│   │   ├── dashboard/page.tsx
│   │   ├── registrants/page.tsx
│   │   ├── viewers/page.tsx
│   │   ├── settings/page.tsx
│   │   └── users/page.tsx
│   │
│   ├── api/                            # API Routes
│   │   ├── register/route.ts
│   │   ├── auth/
│   │   │   ├── login/route.ts
│   │   │   └── logout/route.ts
│   │   ├── watch/
│   │   │   ├── access/route.ts
│   │   │   └── heartbeat/route.ts
│   │   └── admin/
│   │       ├── login/route.ts
│   │       ├── logout/route.ts
│   │       ├── stats/route.ts
│   │       ├── registrants/
│   │       │   ├── route.ts            # GET, POST
│   │       │   └── [id]/route.ts       # PATCH, DELETE
│   │       ├── viewers/route.ts
│   │       ├── export/
│   │       │   ├── registrants/route.ts
│   │       │   └── viewers/route.ts
│   │       ├── settings/route.ts       # GET, PATCH
│   │       └── users/
│   │           ├── route.ts            # GET, POST
│   │           └── [id]/route.ts       # PATCH, DELETE
│   │
│   ├── layout.tsx
│   ├── page.tsx                        # / → /register 리다이렉트
│   └── globals.css
│
├── components/
│   ├── user/
│   │   ├── RegisterForm.tsx
│   │   ├── LoginForm.tsx
│   │   └── VideoPlayer.tsx
│   ├── admin/
│   │   ├── AdminLayout.tsx
│   │   ├── StatCard.tsx
│   │   ├── DataTable.tsx
│   │   └── ExcelDownloadButton.tsx
│   └── ui/                             # 공통 UI (Button, Input, Modal 등)
│
├── lib/
│   ├── supabase/
│   │   ├── server.ts                   # createServerClient (service_role)
│   │   └── types.ts                    # Supabase generated types
│   ├── session/
│   │   ├── user.ts                     # iron-session user 설정
│   │   └── admin.ts                    # iron-session admin 설정
│   ├── auth/
│   │   └── admin-guard.ts              # 관리자 권한 체크 헬퍼
│   ├── excel/
│   │   └── export.ts                   # xlsx 생성 헬퍼
│   └── utils/
│       └── device.ts                   # user-agent 파싱
│
├── types/
│   ├── database.ts                     # DB 행 타입
│   ├── session.ts                      # 세션 타입
│   └── api.ts                          # API request/response 타입
│
├── middleware.ts                        # 라우트 보호
├── supabase/
│   └── schema.sql                      # 전체 DDL
├── .env.example
├── .env.local                          # gitignore
└── next.config.ts
```

---

## 4. Supabase 테이블 스키마

```sql
-- ──────────────────────────────────────
-- 1. 등록자
-- ──────────────────────────────────────
CREATE TABLE registrants (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                  TEXT NOT NULL,
  company               TEXT NOT NULL,
  email                 TEXT NOT NULL UNIQUE,
  phone                 TEXT NOT NULL,
  department            TEXT,
  title                 TEXT,
  privacy_agreed        BOOLEAN NOT NULL DEFAULT false,
  privacy_agreed_at     TIMESTAMPTZ,
  marketing_agreed      BOOLEAN NOT NULL DEFAULT false,
  marketing_agreed_at   TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_registrants_email   ON registrants (email);
CREATE INDEX idx_registrants_created ON registrants (created_at DESC);

-- ──────────────────────────────────────
-- 2. 로그인 로그
-- ──────────────────────────────────────
CREATE TABLE login_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registrant_id   UUID NOT NULL REFERENCES registrants (id) ON DELETE CASCADE,
  login_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip_address      TEXT,
  user_agent      TEXT
);

CREATE INDEX idx_login_logs_registrant ON login_logs (registrant_id);
CREATE INDEX idx_login_logs_at         ON login_logs (login_at DESC);

-- ──────────────────────────────────────
-- 3. 시청 로그 (등록자 1인 1행)
-- ──────────────────────────────────────
CREATE TABLE watch_logs (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registrant_id         UUID NOT NULL UNIQUE REFERENCES registrants (id) ON DELETE CASCADE,
  first_access_at       TIMESTAMPTZ,
  last_access_at        TIMESTAMPTZ,
  total_watch_seconds   INTEGER NOT NULL DEFAULT 0,
  ip_address            TEXT,
  user_agent            TEXT,
  device_type           TEXT CHECK (device_type IN ('desktop', 'mobile', 'tablet', 'unknown'))
);

CREATE INDEX idx_watch_logs_registrant ON watch_logs (registrant_id);
CREATE INDEX idx_watch_logs_first      ON watch_logs (first_access_at DESC);
CREATE INDEX idx_watch_logs_seconds    ON watch_logs (total_watch_seconds);

-- ──────────────────────────────────────
-- 4. 관리자 계정
-- ──────────────────────────────────────
CREATE TABLE admin_users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email           TEXT NOT NULL UNIQUE,
  password_hash   TEXT NOT NULL,
  name            TEXT NOT NULL,
  role            TEXT NOT NULL CHECK (role IN ('super_admin', 'manager')),
  is_active       BOOLEAN NOT NULL DEFAULT true,
  last_login_at   TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_admin_users_email ON admin_users (email);

-- ──────────────────────────────────────
-- 5. 행사 설정 (싱글 로우)
-- ──────────────────────────────────────
CREATE TABLE event_settings (
  id                    INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  event_name            TEXT NOT NULL DEFAULT '웨비나',
  event_date            DATE,
  vimeo_video_id        TEXT,
  video_open_at         TIMESTAMPTZ,
  survey_url            TEXT,
  material_url          TEXT,
  contact_email         TEXT,
  contact_phone         TEXT,
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO event_settings (id) VALUES (1);
```

---

## 5. RLS 정책

```sql
-- 모든 테이블 RLS 활성화
ALTER TABLE registrants    ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_logs     ENABLE ROW LEVEL SECURITY;
ALTER TABLE watch_logs     ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users    ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_settings ENABLE ROW LEVEL SECURITY;

-- anon / authenticated 역할 모두 전면 차단
-- service_role은 RLS를 bypass하므로 API Route에서 정상 접근 가능
CREATE POLICY "deny_all_registrants"    ON registrants    FOR ALL TO anon, authenticated USING (false);
CREATE POLICY "deny_all_login_logs"     ON login_logs     FOR ALL TO anon, authenticated USING (false);
CREATE POLICY "deny_all_watch_logs"     ON watch_logs     FOR ALL TO anon, authenticated USING (false);
CREATE POLICY "deny_all_admin_users"    ON admin_users    FOR ALL TO anon, authenticated USING (false);
CREATE POLICY "deny_all_event_settings" ON event_settings FOR ALL TO anon, authenticated USING (false);
```

---

## 6. 인증 및 세션 방식

**라이브러리: `iron-session`** (서버사이드 암호화 쿠키)

### 사용자 세션

```typescript
interface UserSession {
  registrantId: string;
  name: string;
  email: string;
}
```

| 항목 | 내용 |
|------|------|
| 쿠키명 | `user_session` |
| 유효기간 | 24시간 |
| httpOnly | true |
| secure | true (production) |
| sameSite | lax |

**로그인 흐름**

1. 이메일 + 휴대폰 뒤 4자리 입력
2. `POST /api/auth/login` → DB에서 email 조회
3. phone 끝 4자리 비교
4. 일치 시 iron-session에 `registrantId`, `name`, `email` 저장
5. `login_logs`에 기록
6. `/watch`로 리다이렉트

### 관리자 세션

```typescript
interface AdminSession {
  adminId: string;
  email: string;
  name: string;
  role: 'super_admin' | 'manager';
}
```

| 항목 | 내용 |
|------|------|
| 쿠키명 | `admin_session` |
| 유효기간 | 8시간 |
| 비밀번호 | bcrypt hash 비교 후 세션 발급 |

---

## 7. 관리자 권한 구조

```
┌─────────────┐
│ super_admin │  ← 전체 권한
└──────┬──────┘
       │ 포함
┌──────▼──────┐
│   manager   │  ← 조회 + 다운로드만
└─────────────┘
```

### API 권한 매트릭스

| API | super_admin | manager |
|-----|:-----------:|:-------:|
| GET /api/admin/stats | ✅ | ✅ |
| GET /api/admin/registrants | ✅ | ✅ |
| POST /api/admin/registrants | ✅ | ❌ |
| PATCH /api/admin/registrants/:id | ✅ | ❌ |
| DELETE /api/admin/registrants/:id | ✅ | ❌ |
| GET /api/admin/viewers | ✅ | ✅ |
| GET /api/admin/export/* | ✅ | ✅ |
| GET /api/admin/settings | ✅ | ❌ |
| PATCH /api/admin/settings | ✅ | ❌ |
| GET /api/admin/users | ✅ | ❌ |
| POST /api/admin/users | ✅ | ❌ |
| PATCH /api/admin/users/:id | ✅ | ❌ |
| DELETE /api/admin/users/:id | ✅ | ❌ |

권한 체크는 `lib/auth/admin-guard.ts`의 헬퍼 함수로 모든 API Route에서 일관되게 처리.

---

## 8. API Route 설계

### 사용자 API

#### `POST /api/register`
```
Request:  { name, company, email, phone, department?, title?,
            privacy_agreed, marketing_agreed }
Response: { success: true }
권한:     없음 (공개)
처리:     이메일 중복 체크 → registrants INSERT
          privacy_agreed_at, marketing_agreed_at 서버에서 now() 세팅
```

#### `POST /api/auth/login`
```
Request:  { email, phoneLast4 }
Response: { success: true, name: string }
권한:     없음 (공개)
처리:     email로 조회 → phone 끝 4자리 비교
          → iron-session 저장 → login_logs INSERT
```

#### `POST /api/auth/logout`
```
Response: { success: true }
권한:     로그인 사용자
처리:     세션 파기
```

#### `POST /api/watch/access`
```
Response: { success: true }
권한:     로그인 사용자
처리:     watch_logs UPSERT (registrant_id 기준)
          first_access_at이 null인 경우에만 now()로 설정
          last_access_at = now()
```

#### `POST /api/watch/heartbeat`
```
Request:  { elapsedSeconds: number }
Response: { success: true }
권한:     로그인 사용자
처리:     watch_logs UPDATE
          last_access_at = now()
          total_watch_seconds += elapsedSeconds
```

---

### 관리자 API

#### `POST /api/admin/login`
```
Request:  { email, password }
Response: { success: true, role: string }
처리:     bcrypt.compare → iron-session(admin) 저장
```

#### `GET /api/admin/stats`
```
Response: {
  totalRegistrants, todayRegistrants,
  loginCount, videoAccessCount,
  viewerCount, validViewerCount,
  nonAccessCount, viewRate
}
권한: super_admin | manager
```

#### `GET /api/admin/registrants`
```
Query:    ?search=&page=&limit=&dateFrom=&dateTo=
Response: { data: Registrant[], total: number }
권한:     super_admin | manager
```

#### `POST /api/admin/registrants`
```
Request:  { name, company, email, phone, department?, title? }
권한:     super_admin only
```

#### `PATCH /api/admin/registrants/:id`
```
Request:  Partial<Registrant>
권한:     super_admin only
```

#### `DELETE /api/admin/registrants/:id`
```
권한:     super_admin only
처리:     CASCADE → login_logs, watch_logs 함께 삭제
```

#### `GET /api/admin/viewers`
```
Query:    ?search=&status=&page=&limit=
Response: { data: ViewerRow[], total: number }
상태 필터: none | accessed | viewer | valid_viewer
권한:     super_admin | manager
```

#### `GET /api/admin/export/registrants`
```
Response: xlsx 파일 (Content-Disposition: attachment)
권한:     super_admin | manager
처리:     검색 쿼리 동일하게 적용, 전체 데이터 추출
```

#### `GET /api/admin/export/viewers`
```
Response: xlsx 파일
권한:     super_admin | manager
```

#### `GET /api/admin/settings`
```
Response: EventSettings
권한:     super_admin only
```

#### `PATCH /api/admin/settings`
```
Request:  Partial<EventSettings>
권한:     super_admin only
```

#### `GET /api/admin/users`
```
Response: AdminUser[] (password_hash 제외)
권한:     super_admin only
```

#### `POST /api/admin/users`
```
Request:  { email, password, name, role }
처리:     bcrypt hash 후 INSERT
권한:     super_admin only
```

#### `PATCH /api/admin/users/:id`
```
Request:  { name?, role?, password?, is_active? }
권한:     super_admin only
```

#### `DELETE /api/admin/users/:id`
```
권한:     super_admin only
처리:     자기 자신 삭제 불가 체크
```

---

## 9. 화면 구성

### 사용자 화면

#### 등록 페이지 `/register`
- 폼 상단: 행사 로고 + 행사명
- 필드: 성명, 회사명, 이메일, 휴대폰, 부서명(선택), 직함(선택)
- 하단 동의: 개인정보 수집·이용 동의(필수) + 마케팅 수신 동의(선택)
- 동의 내용은 아코디언(펼쳐보기) 형태
- 이메일 중복 시 인라인 에러 표시
- 제출 중 로딩 스피너

#### 등록 완료 페이지 `/register/complete`
- 완료 메시지 + 행사 일자 안내
- 로그인 페이지 이동 버튼

#### 로그인 페이지 `/login`
- 이메일 입력 필드
- 휴대폰 번호 뒤 4자리 입력 필드
- 로그인 버튼
- 실패 시 하단에 안내 문구 ("등록 정보와 일치하지 않습니다")
- 미등록자용 등록 페이지 링크

#### 영상 시청 페이지 `/watch`
- 상단: 행사 로고 + 사용자 이름 표시 + 로그아웃
- 중앙: Vimeo iframe (반응형, 16:9)
- 하단 안내 영역:
  - 시청 안내 문구
  - 문의처 (이메일 / 전화)
  - 설문 버튼 (survey_url 연결)
  - 자료 다운로드 버튼 (material_url 연결)
- `video_open_at` 이전 접속 시 "곧 시작됩니다" 안내

---

### 관리자 화면

#### 어드민 로그인 `/admin/login`
- 이메일 + 비밀번호

#### 대시보드 `/admin/dashboard`
- 상단 카드 8개: 전체 등록자 / 금일 등록 / 로그인 수 / 영상 접속자 / 시청자 / 유효 시청자 / 미접속자 / 시청률
- 최근 등록자 5건 테이블
- 최근 시청자 5건 테이블

#### 등록자 관리 `/admin/registrants`
- 검색창 (이름 / 회사 / 이메일 / 전화), 날짜 필터
- 테이블: 이름, 회사, 이메일, 전화, 부서, 직함, 등록일, 동의 여부
- 엑셀 다운로드 버튼
- `super_admin`만 행 우측에 수정 / 삭제 버튼 + 상단에 등록 버튼 노출
- 페이지네이션

#### 시청 현황 `/admin/viewers`
- 검색창, 상태 필터 (전체 / 미시청 / 접속 / 시청 / 유효시청)
- 테이블: 이름, 회사, 이메일, 전화, 최초접속, 최종접속, 누적(초→분:초), 상태 배지
- 엑셀 다운로드
- 페이지네이션

**시청 상태 기준**

| 상태 | 조건 |
|------|------|
| 미시청 | 영상 페이지 미접속 |
| 접속 | 영상 페이지 접속 (total_watch_seconds < 60) |
| 시청 | total_watch_seconds >= 60 |
| 유효 시청 | total_watch_seconds >= 600 |

#### 설정 `/admin/settings` (super_admin만)
- 폼: 행사명, 행사 일자, Vimeo ID, 영상 오픈시간, 설문 URL, 자료 URL, 문의 이메일/전화
- 저장 버튼

#### 관리자 계정 관리 `/admin/users` (super_admin만)
- 관리자 목록 테이블: 이름, 이메일, 역할, 활성여부, 마지막 로그인
- 계정 추가 버튼
- 수정 / 삭제 버튼 (본인 삭제 불가)

---

## 10. Heartbeat 및 시청 로그 수집 방식

```
페이지 진입
    │
    ▼
POST /api/watch/access         ← first_access_at 설정 (최초 1회)
    │
    ▼
┌─ 타이머 시작 (visibilityState === 'visible'일 때만 카운트)
│   elapsedSeconds 변수 로컬 누적
│
│  30초마다
│    └─ POST /api/watch/heartbeat { elapsedSeconds: N }
│       → total_watch_seconds += N
│       → last_access_at = now()
│       → elapsedSeconds = 0 (리셋)
│
│  visibilitychange (hidden)
│    └─ 타이머 일시정지, 즉시 heartbeat 전송
│
│  visibilitychange (visible)
│    └─ 타이머 재개
│
└─ 페이지 언로드 (beforeunload / pagehide)
       └─ navigator.sendBeacon('/api/watch/heartbeat', ...) 전송
```

### 프론트엔드 구현 핵심

- `useRef`로 `intervalId`, `elapsedSeconds`, `lastTick` 관리
- `document.addEventListener('visibilitychange', ...)` 로 탭 전환 감지
- `navigator.sendBeacon`으로 페이지 언로드 시 비동기 전송 보장
- heartbeat API는 멱등성 보장 (중복 호출 안전)

---

## 11. 대시보드 통계 기준

| 지표 | 집계 기준 |
|------|----------|
| 전체 등록자 수 | registrants 전체 COUNT |
| 금일 등록자 수 | created_at이 오늘인 COUNT |
| 로그인 수 | login_logs 기준 unique registrant_id COUNT |
| 영상 접속자 수 | watch_logs first_access_at IS NOT NULL COUNT |
| 시청자 수 | total_watch_seconds >= 60 COUNT |
| 유효 시청자 수 | total_watch_seconds >= 600 COUNT |
| 미접속자 수 | 전체 등록자 수 - 영상 접속자 수 |
| 시청률 | 시청자 수 / 전체 등록자 수 × 100 |

---

## 12. 엑셀 다운로드

- 라이브러리: `xlsx` (SheetJS)
- 등록자 리스트 / 시청 현황 리스트 각각 지원
- 검색 / 필터 조건이 적용된 상태로 전체 데이터 추출
- 휴대폰 번호 전체 포함 (마스킹 없음)
- 다운로드 권한: super_admin + manager 모두 가능
- 파일명 예시: `registrants_20250714.xlsx`, `viewers_20250714.xlsx`

---

## 13. 환경변수 (.env.example)

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Session (iron-session 암호화 키, 32자 이상 필수)
SESSION_PASSWORD=your-secret-session-password-at-least-32-chars

# 행사 기본 설정
VIMEO_VIDEO_ID=123456789

# 관리자 초기 계정 시딩용 (배포 후 삭제 권장)
ADMIN_SEED_EMAIL=admin@example.com
ADMIN_SEED_PASSWORD=ChangeMe123!

# 앱 기본 URL
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
```

---

## 14. 구현 단계별 로드맵

| 단계 | 내용 | 주요 산출물 |
|------|------|------------|
| **1단계** | 프로젝트 초기화 + 환경 설정 + Supabase 스키마 | `schema.sql`, `.env.example`, 기본 프로젝트 구조 |
| **2단계** | 등록 페이지 + 등록 API | `/register`, `POST /api/register` |
| **3단계** | 사용자 로그인 + 세션 + middleware | `/login`, iron-session, 라우트 보호 |
| **4단계** | 영상 시청 페이지 + Vimeo embed + heartbeat | `/watch`, `watch/access`, `watch/heartbeat` |
| **5단계** | 어드민 로그인 + 권한 구조 | `/admin/login`, admin-guard, admin session |
| **6단계** | 어드민 대시보드 | `/admin/dashboard`, `GET /api/admin/stats` |
| **7단계** | 등록자 관리 + 엑셀 다운로드 | `/admin/registrants`, CRUD API, xlsx export |
| **8단계** | 시청 현황 + 엑셀 다운로드 | `/admin/viewers`, export API |
| **9단계** | 설정 페이지 + 관리자 계정 관리 | `/admin/settings`, `/admin/users` |
| **10단계** | 테스트 + 보안 점검 + Vercel 배포 준비 | 환경변수 정리, 배포 체크리스트 |

---

## 15. 보안 체크리스트

- [ ] `SUPABASE_SERVICE_ROLE_KEY` 서버에서만 사용, 클라이언트 노출 없음
- [ ] RLS로 anon/authenticated 직접 접근 전면 차단
- [ ] 모든 관리자 API에서 세션 + 역할 이중 검증
- [ ] bcrypt 해시 저장 (관리자 비밀번호)
- [ ] 세션 쿠키 httpOnly + secure + sameSite 설정
- [ ] 자기 자신 삭제 방지 (관리자 계정 삭제 시)
- [ ] 입력값 서버 레벨 유효성 검사
- [ ] 이메일 중복 등록 방지 (DB unique constraint + API 체크)
