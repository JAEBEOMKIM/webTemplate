import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const redirect = searchParams.get('redirect') || '/'

  const naverAuthUrl = new URL('https://nid.naver.com/oauth2.0/authorize')
  naverAuthUrl.searchParams.set('response_type', 'code')
  naverAuthUrl.searchParams.set('client_id', process.env.NAVER_CLIENT_ID!)
  naverAuthUrl.searchParams.set('redirect_uri', process.env.NAVER_CALLBACK_URL!)
  // URLSearchParams.set() 이 자체적으로 인코딩하므로 encodeURIComponent 불필요
  naverAuthUrl.searchParams.set('state', redirect)

  const response = NextResponse.redirect(naverAuthUrl.toString())
  // 로그인 후 돌아갈 경로를 쿠키에 저장 (generateLink redirectTo에 쿼리파람 없이 사용)
  response.cookies.set('oauth_redirect', redirect, {
    httpOnly: true,
    maxAge: 600,
    sameSite: 'lax',
    path: '/',
    secure: process.env.NODE_ENV === 'production',
  })
  return response
}
