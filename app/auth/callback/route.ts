import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

/** /admin 또는 루트(/) 경로는 관리자 전용으로 간주 */
function isAdminPath(path: string) {
  return path === '/' || path === '/admin' || path.startsWith('/admin/')
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  // redirect 우선순위: 쿠키(소셜 로그인) > 쿼리파람 > 기본
  const cookieRedirect = request.cookies.get('oauth_redirect')?.value
  const queryRedirect = searchParams.get('redirect')
  const raw = cookieRedirect || queryRedirect || '/admin'
  const redirectTo = !raw || raw === 'null' || !raw.startsWith('/') ? '/admin' : raw

  if (!code) {
    // code 없이 콜백에 도달한 경우 (이미 처리된 링크 등)
    return NextResponse.redirect(`${origin}${redirectTo}`)
  }

  // ── 세션 쿠키를 나중에 응답에 적용하기 위해 수집 ──────────────────
  type CookieEntry = { name: string; value: string; options: Record<string, unknown> }
  const pendingCookies: CookieEntry[] = []

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // 즉시 적용하지 않고 수집 → 관리자 여부 확인 후 조건부 적용
          cookiesToSet.forEach(c => pendingCookies.push(c as CookieEntry))
        },
      },
    }
  )

  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    console.error('[Auth Callback] exchangeCodeForSession error:', error.message)
    return NextResponse.redirect(
      `${origin}/auth/login?error=callback_failed&detail=${encodeURIComponent(error.message)}`
    )
  }

  const userEmail = data.user?.email ?? ''

  // ── 관리자 경로 접근 시: 등록된 관리자 계정인지 확인 ─────────────────
  if (isAdminPath(redirectTo)) {
    const adminEmail = process.env.ADMIN_EMAIL || process.env.NEXT_PUBLIC_ADMIN_EMAIL || ''

    if (!adminEmail) {
      console.error('[Auth Callback] ADMIN_EMAIL 환경변수가 설정되지 않았습니다')
      return NextResponse.redirect(`${origin}/auth/login?error=not_admin&detail=${encodeURIComponent('서버 설정 오류: 관리자 이메일이 설정되지 않았습니다')}`)
    }

    if (userEmail !== adminEmail) {
      console.warn(`[Auth Callback] 관리자 아님: ${userEmail} (expected: ${adminEmail})`)
      // 세션 쿠키를 적용하지 않고(= 로그인 상태 안 만들고) 에러로 이동
      return NextResponse.redirect(
        `${origin}/auth/login?error=not_admin&email=${encodeURIComponent(userEmail)}`
      )
    }
  }

  // ── 세션 쿠키를 최종 응답에 적용 ──────────────────────────────────────
  const response = NextResponse.redirect(`${origin}${redirectTo}`)
  response.cookies.delete('oauth_redirect')
  pendingCookies.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options)
  })

  return response
}
