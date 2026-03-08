import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const redirect = searchParams.get('redirect') || '/'

  const kakaoAuthUrl = new URL('https://kauth.kakao.com/oauth/authorize')
  kakaoAuthUrl.searchParams.set('response_type', 'code')
  kakaoAuthUrl.searchParams.set('client_id', process.env.KAKAO_CLIENT_ID!)
  kakaoAuthUrl.searchParams.set('redirect_uri', process.env.KAKAO_REDIRECT_URI!)
  // URLSearchParams.set() 이 자체적으로 인코딩하므로 encodeURIComponent 불필요
  kakaoAuthUrl.searchParams.set('state', redirect)
  // 카카오 이메일 + 닉네임 동의 요청
  kakaoAuthUrl.searchParams.set('scope', 'account_email profile_nickname')

  const response = NextResponse.redirect(kakaoAuthUrl.toString())
  // 로그인 후 돌아갈 경로를 쿠키에 저장
  response.cookies.set('oauth_redirect', redirect, {
    httpOnly: true,
    maxAge: 600,
    sameSite: 'lax',
    path: '/',
    secure: process.env.NODE_ENV === 'production',
  })
  return response
}
