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
    // 1. 카카오 액세스 토큰 요청
    const tokenBody = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: process.env.KAKAO_CLIENT_ID!,
      redirect_uri: process.env.KAKAO_REDIRECT_URI!,
      code,
    })
    if (process.env.KAKAO_CLIENT_SECRET) {
      tokenBody.set('client_secret', process.env.KAKAO_CLIENT_SECRET)
    }

    const tokenRes = await fetch('https://kauth.kakao.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: tokenBody,
    })

    const tokenData = await tokenRes.json()
    if (!tokenData.access_token) {
      console.error('[Kakao] Token exchange failed:', tokenData)
      throw new Error(`Token exchange failed: ${tokenData.error_description || tokenData.error || 'unknown'}`)
    }

    // 2. 카카오 사용자 정보 요청
    const profileRes = await fetch('https://kapi.kakao.com/v2/user/me', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    })

    const profileData = await profileRes.json()
    const kakaoAccount = profileData.kakao_account
    const kakaoProfile = kakaoAccount?.profile

    if (!kakaoAccount?.email) {
      const needsAgreement = kakaoAccount?.email_needs_agreement
      console.error('[Kakao] No email. needs_agreement:', needsAgreement, 'profile:', profileData)
      return NextResponse.redirect(
        `${origin}/auth/login?error=kakao_no_email&hint=${encodeURIComponent(
          needsAgreement
            ? '카카오 로그인 시 이메일 제공에 동의해 주세요'
            : '카카오 계정에 이메일이 없거나 비공개 상태입니다'
        )}`
      )
    }

    const email = kakaoAccount.email
    const fullName = kakaoProfile?.nickname || kakaoProfile?.profile_nickname || ''
    const avatarUrl = kakaoProfile?.profile_image_url || kakaoProfile?.thumbnail_image_url || ''
    const kakaoId = String(profileData.id || '')

    // 3. Supabase Admin API로 사용자 upsert
    const adminClient = await createAdminClient()

    // 이메일로 기존 사용자 조회 (페이지네이션 고려)
    let existingUser: { id: string; email?: string; user_metadata?: Record<string, unknown> } | undefined
    let page = 1
    while (!existingUser) {
      const { data } = await adminClient.auth.admin.listUsers({ page, perPage: 100 })
      if (!data?.users?.length) break
      existingUser = data.users.find(u => u.email === email)
      if (data.users.length < 100) break
      page++
    }

    if (existingUser) {
      await adminClient.auth.admin.updateUserById(existingUser.id, {
        user_metadata: {
          ...existingUser.user_metadata,
          full_name: fullName || existingUser.user_metadata?.full_name,
          avatar_url: avatarUrl || existingUser.user_metadata?.avatar_url,
          provider: 'kakao',
          kakao_id: kakaoId,
        },
      })
    } else {
      const { data: newUser, error } = await adminClient.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
          avatar_url: avatarUrl,
          provider: 'kakao',
          kakao_id: kakaoId,
        },
      })
      if (error || !newUser.user) {
        console.error('[Kakao] createUser error:', error)
        throw error
      }
    }

    // 4. 매직링크 방식으로 세션 생성
    // redirectTo 에는 쿼리 파라미터 없이 순수 경로만 — Supabase 허용 URL 목록 매칭 용이
    const { data: otpData, error: otpError } = await adminClient.auth.admin.generateLink({
      type: 'magiclink',
      email,
      options: {
        redirectTo: `${origin}/auth/callback`,
      },
    })

    if (otpError || !otpData.properties?.action_link) {
      console.error('[Kakao] generateLink error:', otpError)
      throw otpError || new Error('Failed to generate magic link')
    }

    // 쿠키(oauth_redirect)를 유지한 채로 매직링크로 이동
    const response = NextResponse.redirect(otpData.properties.action_link)
    response.cookies.set('oauth_redirect', redirectPath, {
      httpOnly: true,
      maxAge: 600,
      sameSite: 'lax',
      path: '/',
      secure: process.env.NODE_ENV === 'production',
    })
    return response
  } catch (error) {
    console.error('[Kakao] OAuth callback error:', error)
    return NextResponse.redirect(`${origin}/auth/login?error=kakao_auth_failed`)
  }
}
