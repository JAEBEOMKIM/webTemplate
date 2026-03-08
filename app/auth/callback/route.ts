import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  // redirect 우선순위: 쿠키(소셜 로그인) > 쿼리파람(매직링크 직접) > 기본
  const cookieRedirect = request.cookies.get('oauth_redirect')?.value
  const queryRedirect = searchParams.get('redirect')
  const redirectTo = cookieRedirect || queryRedirect || '/'

  if (code) {
    const supabase = await createClient()
    await supabase.auth.exchangeCodeForSession(code)
  }

  const response = NextResponse.redirect(`${origin}${redirectTo}`)
  // 사용 후 쿠키 삭제
  if (cookieRedirect) {
    response.cookies.delete('oauth_redirect')
  }
  return response
}
