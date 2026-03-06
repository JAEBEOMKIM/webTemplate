# Web Component Page Builder

모듈식 웹 컴포넌트를 조합해 페이지를 만드는 노코드 페이지 빌더 시스템.

## 기술 스택
- **Next.js 16** (App Router) + TypeScript + Tailwind CSS
- **Supabase** (PostgreSQL + Auth + Storage + RLS)
- **OAuth2**: Google (Supabase 내장), Naver (서버사이드 직접 구현)

## 시작하기

### 1. Supabase 설정

1. [supabase.com](https://supabase.com)에서 새 프로젝트 생성
2. **SQL Editor**에서 `supabase/migrations/001_init.sql` 실행
3. **Authentication > Providers**에서 Google OAuth 활성화:
   - Google Cloud Console에서 OAuth 앱 생성
   - Client ID/Secret을 Supabase에 입력
   - Callback URL: `https://your-project.supabase.co/auth/v1/callback`

### 2. 환경 변수 설정

`.env.local` 파일 수정:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciO...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciO...

ADMIN_EMAIL=your@email.com

NAVER_CLIENT_ID=your_naver_client_id
NAVER_CLIENT_SECRET=your_naver_client_secret
NAVER_CALLBACK_URL=http://localhost:3000/api/auth/naver/callback

NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. 네이버 OAuth 설정 (선택)

1. [네이버 개발자 센터](https://developers.naver.com/apps/)에서 앱 등록
2. 콜백 URL: `http://localhost:3000/api/auth/naver/callback`
3. 사용 API: 네이버 로그인

### 4. 실행

```bash
npm install
npm run dev
```

## 사용법

1. `/auth/login`에서 Google로 로그인 (ADMIN_EMAIL 계정)
2. `/admin`에서 페이지 생성 및 컴포넌트 조합
3. 발행 후 `/{slug}`로 접근

## 접근 권한

| 유형 | 설명 |
|------|------|
| 공개 | 누구나 접근 가능 |
| 비밀번호 | 비밀번호 입력 후 접근 |
| OAuth+초대코드 | 소셜 로그인 + 초대코드 필요 |

## 기본 컴포넌트

- 📋 **게시판** - 글 작성/댓글
- 📅 **달력/스케줄** - 일정 등록
- 📊 **설문조사** - 단일/다중선택, 텍스트, 별점
- 🖼️ **이미지 갤러리** - 슬라이드쇼

## 새 컴포넌트 추가

1. `components/registry/[이름]/` 폴더에 컴포넌트 구현
2. `components/registry/index.ts` 레지스트리에 등록
3. DB `component_definitions` 테이블에 INSERT
