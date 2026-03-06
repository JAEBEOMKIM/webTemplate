import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const redirect = searchParams.get('redirect') || '/'

  const naverAuthUrl = new URL('https://nid.naver.com/oauth2.0/authorize')
  naverAuthUrl.searchParams.set('response_type', 'code')
  naverAuthUrl.searchParams.set('client_id', process.env.NAVER_CLIENT_ID!)
  naverAuthUrl.searchParams.set('redirect_uri', process.env.NAVER_CALLBACK_URL!)
  naverAuthUrl.searchParams.set('state', encodeURIComponent(redirect))

  return NextResponse.redirect(naverAuthUrl.toString())
}
