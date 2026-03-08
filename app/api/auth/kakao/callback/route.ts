import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state') || '/'

  if (!code) {
    return NextResponse.redirect(`${origin}/auth/login?error=no_code`)
  }

  try {
    // 1. 카카오 액세스 토큰 요청
    const tokenRes = await fetch('https://kauth.kakao.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: process.env.KAKAO_CLIENT_ID!,
        ...(process.env.KAKAO_CLIENT_SECRET ? { client_secret: process.env.KAKAO_CLIENT_SECRET } : {}),
        redirect_uri: process.env.KAKAO_REDIRECT_URI!,
        code,
      }),
    })

    const tokenData = await tokenRes.json()
    if (!tokenData.access_token) {
      throw new Error('Failed to get Kakao access token')
    }

    // 2. 카카오 사용자 정보 요청
    const profileRes = await fetch('https://kapi.kakao.com/v2/user/me', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    })

    const profileData = await profileRes.json()
    const kakaoAccount = profileData.kakao_account
    const kakaoProfile = kakaoAccount?.profile

    if (!kakaoAccount?.email) {
      return NextResponse.redirect(
        `${origin}/auth/login?error=kakao_no_email&hint=${encodeURIComponent('카카오 계정에서 이메일 제공 동의가 필요합니다')}`
      )
    }

    const email = kakaoAccount.email
    const fullName = kakaoProfile?.nickname || kakaoProfile?.profile_nickname || ''
    const avatarUrl = kakaoProfile?.profile_image_url || kakaoProfile?.thumbnail_image_url || ''
    const kakaoId = String(profileData.id || '')

    // 3. Supabase Admin API로 사용자 upsert
    const adminClient = await createAdminClient()

    const { data: existingUsers } = await adminClient.auth.admin.listUsers()
    const existingUser = existingUsers?.users.find(u => u.email === email)

    if (existingUser) {
      // 기존 사용자: 카카오 메타데이터 업데이트
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
      // 신규 사용자 생성
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
      if (error || !newUser.user) throw error
    }

    // 4. 매직링크로 세션 생성
    const { data: otpData, error: otpError } = await adminClient.auth.admin.generateLink({
      type: 'magiclink',
      email,
      options: {
        redirectTo: `${origin}/auth/callback?redirect=${encodeURIComponent(decodeURIComponent(state))}`,
      },
    })

    if (otpError || !otpData.properties?.action_link) {
      throw otpError || new Error('Failed to generate magic link')
    }

    return NextResponse.redirect(otpData.properties.action_link)
  } catch (error) {
    console.error('Kakao OAuth error:', error)
    return NextResponse.redirect(`${origin}/auth/login?error=kakao_auth_failed`)
  }
}
