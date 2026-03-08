import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const redirect = searchParams.get('redirect') || '/'

  const kakaoAuthUrl = new URL('https://kauth.kakao.com/oauth/authorize')
  kakaoAuthUrl.searchParams.set('response_type', 'code')
  kakaoAuthUrl.searchParams.set('client_id', process.env.KAKAO_CLIENT_ID!)
  kakaoAuthUrl.searchParams.set('redirect_uri', process.env.KAKAO_REDIRECT_URI!)
  kakaoAuthUrl.searchParams.set('state', encodeURIComponent(redirect))

  return NextResponse.redirect(kakaoAuthUrl.toString())
}
