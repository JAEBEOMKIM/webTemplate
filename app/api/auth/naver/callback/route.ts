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
    // 1. 네이버 토큰 요청
    const tokenRes = await fetch('https://nid.naver.com/oauth2.0/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: process.env.NAVER_CLIENT_ID!,
        client_secret: process.env.NAVER_CLIENT_SECRET!,
        code,
        state,
      }),
    })

    const tokenData = await tokenRes.json()
    if (!tokenData.access_token) {
      throw new Error('Failed to get access token')
    }

    // 2. 네이버 사용자 정보 요청
    const profileRes = await fetch('https://openapi.naver.com/v1/nid/me', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    })

    const profileData = await profileRes.json()
    const naverUser = profileData.response

    if (!naverUser?.email) {
      throw new Error('No email from Naver')
    }

    // 3. Supabase Admin API로 사용자 upsert
    const adminClient = await createAdminClient()

    // 이메일로 기존 사용자 조회
    const { data: existingUsers } = await adminClient.auth.admin.listUsers()
    const existingUser = existingUsers?.users.find(u => u.email === naverUser.email)

    let userId: string

    if (existingUser) {
      userId = existingUser.id
    } else {
      // 새 사용자 생성
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
      if (error || !newUser.user) throw error
      userId = newUser.user.id
    }

    // 4. 매직링크 방식으로 세션 생성 (OTP 사용)
    const { data: otpData, error: otpError } = await adminClient.auth.admin.generateLink({
      type: 'magiclink',
      email: naverUser.email,
      options: {
        redirectTo: `${origin}/auth/callback?redirect=${encodeURIComponent(decodeURIComponent(state))}`,
      },
    })

    if (otpError || !otpData.properties?.action_link) {
      throw otpError || new Error('Failed to generate link')
    }

    return NextResponse.redirect(otpData.properties.action_link)
  } catch (error) {
    console.error('Naver OAuth error:', error)
    return NextResponse.redirect(`${origin}/auth/login?error=naver_auth_failed`)
  }
}
