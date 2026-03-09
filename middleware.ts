import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // @supabase/ssr 공식 패턴: response를 먼저 생성 후 쿠키 동기화
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // 요청 쿠키 갱신
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          // 응답 객체 재생성 + 쿠키 설정 (토큰 갱신 시 브라우저에 전달)
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: getUser()는 서버에서 JWT를 검증 — 세션 토큰 갱신도 여기서 발생
  // 이 호출 전후에 다른 Supabase 호출을 넣지 말 것 (@supabase/ssr 요구사항)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl
  const adminEmail =
    process.env.ADMIN_EMAIL || process.env.NEXT_PUBLIC_ADMIN_EMAIL || ''

  // ── 루트(/) 처리 ────────────────────────────────────────────────────────
  if (pathname === '/') {
    if (!user) {
      // 비로그인 → 로그인 페이지
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }
    if (adminEmail && user.email !== adminEmail) {
      // 로그인 됐지만 관리자 아님 → 권한없음 페이지
      const url = new URL('/unauthorized', request.url)
      url.searchParams.set('email', user.email ?? '')
      return NextResponse.redirect(url)
    }
    // 관리자 → 어드민으로
    return NextResponse.redirect(new URL('/admin', request.url))
  }

  // ── /admin/* 보호 ────────────────────────────────────────────────────────
  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    if (!user) {
      // 비로그인 → 로그인 페이지 (원래 경로 기억)
      const url = new URL('/auth/login', request.url)
      url.searchParams.set('redirect', pathname)
      return NextResponse.redirect(url)
    }
    if (adminEmail && user.email !== adminEmail) {
      // 로그인 됐지만 관리자 아님 → 권한없음 페이지
      const url = new URL('/unauthorized', request.url)
      url.searchParams.set('email', user.email ?? '')
      return NextResponse.redirect(url)
    }
  }

  // 그 외 경로: 세션 쿠키 갱신 후 통과
  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * 아래 경로 제외 후 모든 요청에 적용:
     * - _next/static  (정적 파일)
     * - _next/image   (이미지 최적화)
     * - favicon.ico
     * - 이미지 파일 (svg, png, jpg …)
     */
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
