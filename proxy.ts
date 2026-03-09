import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
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
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Required by @supabase/ssr — JWT 검증 + 토큰 갱신
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl
  const adminEmail =
    process.env.ADMIN_EMAIL || process.env.NEXT_PUBLIC_ADMIN_EMAIL || ''

  // ── 루트(/) 처리 ────────────────────────────────────────────────────────
  // app/page.tsx 의 redirect('/admin') 보다 proxy 가 먼저 실행되므로 여기서 처리
  if (pathname === '/') {
    if (!user) {
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }
    if (adminEmail && user.email !== adminEmail) {
      const url = new URL('/unauthorized', request.url)
      url.searchParams.set('email', user.email ?? '')
      return NextResponse.redirect(url)
    }
    return NextResponse.redirect(new URL('/admin', request.url))
  }

  // ── /admin/* 보호 ────────────────────────────────────────────────────────
  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    if (!user) {
      const url = new URL('/auth/login', request.url)
      url.searchParams.set('redirect', pathname)
      return NextResponse.redirect(url)
    }
    if (adminEmail && user.email !== adminEmail) {
      // ❌ 기존: redirect('/') → app/page.tsx → redirect('/admin') → 무한루프
      // ✅ 수정: /unauthorized 로 직접 이동
      const url = new URL('/unauthorized', request.url)
      url.searchParams.set('email', user.email ?? '')
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
