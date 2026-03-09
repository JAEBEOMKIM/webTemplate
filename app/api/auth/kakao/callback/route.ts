import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

function errRedirect(origin: string, step: string, message: string) {
  console.error(`[Kakao OAuth] step=${step} error=${message}`)
  return NextResponse.redirect(
    `${origin}/auth/login?error=kakao_auth_failed&step=${encodeURIComponent(step)}&detail=${encodeURIComponent(message)}`
  )
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const kakaoError = searchParams.get('error')

  // 카카오가 에러를 리턴한 경우 (사용자 거부 등)
  if (kakaoError) {
    return errRedirect(origin, 'kakao_auth', `카카오 인증 거부: ${searchParams.get('error_description') || kakaoError}`)
  }

  if (!code) {
    return errRedirect(origin, 'code', 'code 파라미터 없음')
  }

  // 쿠키에서 redirect 경로 복원
  const cookieRedirect = request.cookies.get('oauth_redirect')?.value
  const stateRedirect = searchParams.get('state') || '/'
  const redirectPath = cookieRedirect || stateRedirect

  // redirectTo 에 사용할 앱 베이스 URL
  // request.url 의 origin 을 사용 (Vercel 에서 자동으로 올바른 도메인으로 설정됨)
  // NEXT_PUBLIC_APP_URL 은 브라우저용이므로 서버사이드 redirectTo 에 사용하지 않음
  const appUrl = origin

  try {
    // ── Step 1: 카카오 액세스 토큰 요청 ──────────────────────────
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
    console.log('[Kakao] token response:', JSON.stringify({ ...tokenData, access_token: tokenData.access_token ? '[REDACTED]' : undefined }))

    if (!tokenData.access_token) {
      return errRedirect(origin, 'token', `${tokenData.error_description || tokenData.error || 'access_token 없음'} (redirect_uri: ${process.env.KAKAO_REDIRECT_URI})`)
    }

    // ── Step 2: 사용자 정보 요청 ──────────────────────────────────
    const profileRes = await fetch('https://kapi.kakao.com/v2/user/me', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    })

    const profileData = await profileRes.json()
    console.log('[Kakao] profile:', JSON.stringify({ id: profileData.id, has_email: !!profileData.kakao_account?.email, email_needs_agreement: profileData.kakao_account?.email_needs_agreement }))

    const kakaoAccount = profileData.kakao_account
    const kakaoProfile = kakaoAccount?.profile

    if (!kakaoAccount?.email) {
      const needsAgreement = kakaoAccount?.email_needs_agreement
      return NextResponse.redirect(
        `${origin}/auth/login?error=kakao_no_email&hint=${encodeURIComponent(
          needsAgreement
            ? '카카오 로그인 시 이메일 제공에 동의해 주세요'
            : '카카오 계정에 이메일이 없거나 비공개 상태입니다'
        )}`
      )
    }

    const email = kakaoAccount.email
    const fullName = kakaoProfile?.nickname || ''
    const avatarUrl = kakaoProfile?.profile_image_url || kakaoProfile?.thumbnail_image_url || ''
    const kakaoId = String(profileData.id || '')

    // ── Step 3: Supabase 사용자 upsert ───────────────────────────
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return errRedirect(origin, 'env', 'SUPABASE_SERVICE_ROLE_KEY 환경변수가 설정되지 않았습니다')
    }
    const adminClient = await createAdminClient()

    let existingUser: { id: string; email?: string; user_metadata?: Record<string, unknown> } | undefined
    let page = 1
    while (!existingUser) {
      const { data, error: listError } = await adminClient.auth.admin.listUsers({ page, perPage: 100 })
      if (listError) return errRedirect(origin, 'listUsers', listError.message)
      if (!data?.users?.length) break
      existingUser = data.users.find(u => u.email === email)
      if (data.users.length < 100) break
      page++
    }

    if (existingUser) {
      const { error: updateError } = await adminClient.auth.admin.updateUserById(existingUser.id, {
        user_metadata: {
          ...existingUser.user_metadata,
          full_name: fullName || existingUser.user_metadata?.full_name,
          avatar_url: avatarUrl || existingUser.user_metadata?.avatar_url,
          provider: 'kakao',
          kakao_id: kakaoId,
        },
      })
      if (updateError) return errRedirect(origin, 'updateUser', updateError.message)
    } else {
      const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: { full_name: fullName, avatar_url: avatarUrl, provider: 'kakao', kakao_id: kakaoId },
      })
      if (createError || !newUser.user) {
        return errRedirect(origin, 'createUser', createError?.message || '사용자 생성 실패')
      }
    }

    // ── Step 4: 매직링크 세션 생성 ────────────────────────────────
    // ?next= 에 목적지를 포함 → 클라이언트 페이지(/auth/callback)가 읽어 이동
    const { data: otpData, error: otpError } = await adminClient.auth.admin.generateLink({
      type: 'magiclink',
      email,
      options: { redirectTo: `${appUrl}/auth/callback` },
    })

    if (otpError) {
      return errRedirect(origin, 'generateLink', `${otpError.message} | redirectTo=${appUrl}/auth/callback?next=...`)
    }
    if (!otpData.properties?.action_link) {
      return errRedirect(origin, 'generateLink', 'action_link 없음')
    }

    // oauth_redirect 쿠키를 유지한 채로 매직링크로 이동
    const response = NextResponse.redirect(otpData.properties.action_link)
    // httpOnly: false → 클라이언트(/auth/callback page)에서 document.cookie로 읽어 이동 경로 복원
    response.cookies.set('oauth_redirect', redirectPath, {
      httpOnly: false,
      maxAge: 600,
      sameSite: 'lax',
      path: '/',
      secure: process.env.NODE_ENV === 'production',
    })
    return response

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return errRedirect(origin, 'unknown', msg)
  }
}
