# 배포 가이드

## 1. Supabase 스키마 적용

Supabase 대시보드 → SQL Editor에서 `supabase/schema.sql` 전체 내용을 실행하세요.

## 2. .env.local 생성 (로컬 개발용)

```bash
cp .env.example .env.local
```

`.env.local`에 실제 값을 입력하세요:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
SESSION_PASSWORD=<32자 이상 랜덤 문자열>
VIMEO_VIDEO_ID=<실제 Vimeo 영상 ID>
ADMIN_SEED_EMAIL=admin@example.com
ADMIN_SEED_PASSWORD=<강력한 비밀번호>
```

SESSION_PASSWORD 생성:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 3. 관리자 초기 계정 생성

```bash
npx tsx supabase/seed-admin.ts
```

## 4. 로컬 실행

```bash
npm run dev
```

## 5. Vercel 배포

### 방법 A: Vercel CLI

```bash
npm i -g vercel
vercel --prod
```

### 방법 B: GitHub 연동

1. GitHub에 레포 푸시
2. vercel.com에서 레포 임포트
3. 환경변수 설정 (아래 참조)

### Vercel 환경변수 설정 (필수)

Vercel 대시보드 → Settings → Environment Variables에 아래 항목을 추가하세요:

| 변수명 | 값 |
|--------|-----|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service_role key |
| `SESSION_PASSWORD` | 32자 이상 랜덤 문자열 |
| `VIMEO_VIDEO_ID` | Vimeo 영상 ID (fallback용) |

> ⚠️ `SUPABASE_SERVICE_ROLE_KEY`는 절대 공개 노출 금지

## 6. Vimeo iframe 허용 도메인 설정

Vimeo 대시보드 → 영상 설정 → Privacy → Specific domains에 배포 도메인을 추가하세요.

## 7. 배포 체크리스트

- [ ] Supabase schema.sql 실행 완료
- [ ] RLS 정책 적용 확인 (anon 접근 차단)
- [ ] 관리자 초기 계정 생성 완료
- [ ] Vercel 환경변수 모두 설정
- [ ] ADMIN_SEED_EMAIL/PASSWORD를 Vercel env에서 제거
- [ ] Vimeo 영상 ID를 Supabase event_settings에서 설정
- [ ] 배포 후 등록 → 로그인 → 영상 시청 흐름 테스트
- [ ] 어드민 로그인 → 대시보드 통계 확인

## 8. 로컬 개발 Node.js 버전

현재 프로젝트는 Node.js 20+ 필요합니다.
로컬 개발 환경도 Node.js 20 이상을 사용하세요.

```bash
node --version  # v20.x.x 이상이어야 함
```
