import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  // 개발/테스트 모드에서만 허용
  if (process.env.ALLOW_DEV_LOGIN !== 'true') {
    return NextResponse.json({ error: 'Dev login is disabled' }, { status: 403 })
  }

  const { email, redirect: redirectTo = '/admin' } = await request.json()

  if (!email) {
    return NextResponse.json({ error: 'Email required' }, { status: 400 })
  }

  const adminClient = await createAdminClient()

  // 사용자가 없으면 생성
  const { data: listData } = await adminClient.auth.admin.listUsers()
  const existing = listData?.users.find(u => u.email === email)

  if (!existing) {
    const { error } = await adminClient.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: { full_name: 'Dev User' },
    })
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  }

  // 매직링크 생성 (OTP 로그인 링크)
  const { data, error } = await adminClient.auth.admin.generateLink({
    type: 'magiclink',
    email,
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?redirect=${encodeURIComponent(redirectTo)}`,
    },
  })

  if (error || !data.properties?.action_link) {
    return NextResponse.json({ error: error?.message || 'Failed' }, { status: 500 })
  }

  return NextResponse.json({ url: data.properties.action_link })
}
