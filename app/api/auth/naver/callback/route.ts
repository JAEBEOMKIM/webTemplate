import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (!code) {
    return NextResponse.redirect(`${origin}/auth/login?error=no_code`)
  }

  // 쿠키에서 redirect 경로 복원 (없으면 state 파라미터로 폴백)
  const cookieRedirect = request.cookies.get('oauth_redirect')?.value
  const stateRedirect = searchParams.get('state') || '/'
  const redirectPath = cookieRedirect || stateRedirect

  try {
    // 1. 네이버 토큰 요청
    const tokenRes = await fetch('https://nid.naver.com/oauth2.0/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: process.env.NAVER_CLIENT_ID!,
        client_secret: process.env.NAVER_CLIENT_SECRET!,
        code,
        state: stateRedirect,
      }),
    })

    const tokenData = await tokenRes.json()
    if (!tokenData.access_token) {
      console.error('[Naver] Token exchange failed:', tokenData)
      throw new Error(`Token exchange failed: ${tokenData.error_description || tokenData.error || 'unknown'}`)
    }

    // 2. 네이버 사용자 정보 요청
    const profileRes = await fetch('https://openapi.naver.com/v1/nid/me', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    })

    const profileData = await profileRes.json()
    const naverUser = profileData.response

    if (!naverUser?.email) {
      console.error('[Naver] No email in profile:', profileData)
      throw new Error('No email from Naver')
    }

    // 3. Supabase Admin API로 사용자 upsert
    const adminClient = await createAdminClient()

    // 이메일로 기존 사용자 조회 (페이지네이션 고려)
    let existingUser: { id: string; email?: string; user_metadata?: Record<string, unknown> } | undefined
    let page = 1
    while (!existingUser) {
      const { data } = await adminClient.auth.admin.listUsers({ page, perPage: 100 })
      if (!data?.users?.length) break
      existingUser = data.users.find(u => u.email === naverUser.email)
      if (data.users.length < 100) break
      page++
    }

    if (existingUser) {
      await adminClient.auth.admin.updateUserById(existingUser.id, {
        user_metadata: {
          ...existingUser.user_metadata,
          full_name: naverUser.name || existingUser.user_metadata?.full_name,
          avatar_url: naverUser.profile_image || existingUser.user_metadata?.avatar_url,
          provider: 'naver',
          naver_id: naverUser.id,
        },
      })
    } else {
      const { data: newUser, error } = await adminClient.auth.admin.createUser({
        email: naverUser.email,
        email_confirm: true,
        user_metadata: {
          full_name: naverUser.name,
          avatar_url: naverUser.profile_image,
          provider: 'naver',
          naver_id: naverUser.id,
        },
      })
      if (error || !newUser.user) {
        console.error('[Naver] createUser error:', error)
        throw error
      }
    }

    // 4. 매직링크 방식으로 세션 생성
    // redirectTo 에는 쿼리 파라미터 없이 순수 경로만 — Supabase 허용 URL 목록 매칭 용이
    const { data: otpData, error: otpError } = await adminClient.auth.admin.generateLink({
      type: 'magiclink',
      email: naverUser.email,
      options: {
        redirectTo: `${origin}/auth/callback`,
      },
    })

    if (otpError || !otpData.properties?.action_link) {
      console.error('[Naver] generateLink error:', otpError)
      throw otpError || new Error('Failed to generate magic link')
    }

    // 쿠키(oauth_redirect)를 유지한 채로 매직링크로 이동
    const response = NextResponse.redirect(otpData.properties.action_link)
    // 쿠키 갱신 (브라우저가 외부 Supabase 도메인 거쳐 오는 동안 유지)
    response.cookies.set('oauth_redirect', redirectPath, {
      httpOnly: true,
      maxAge: 600,
      sameSite: 'lax',
      path: '/',
      secure: process.env.NODE_ENV === 'production',
    })
    return response
  } catch (error) {
    console.error('[Naver] OAuth callback error:', error)
    return NextResponse.redirect(`${origin}/auth/login?error=naver_auth_failed`)
  }
}
