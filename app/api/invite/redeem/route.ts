import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  // 사용자 인증은 일반 클라이언트 (세션 쿠키 검증)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
  }

  const { pageId, code } = await request.json()

  // DB 조회/쓰기는 admin 클라이언트로 RLS 우회
  // (invite_codes: 소유자만 SELECT, page_access_grants: INSERT 정책 없음)
  const admin = await createAdminClient()

  // 초대코드 조회
  const { data: inviteCode } = await admin
    .from('invite_codes')
    .select('*')
    .eq('page_id', pageId)
    .eq('code', code.toUpperCase())
    .single()

  if (!inviteCode) {
    return NextResponse.json({ error: '유효하지 않은 초대코드입니다.' }, { status: 400 })
  }

  // 만료 체크
  if (inviteCode.expires_at && new Date(inviteCode.expires_at) < new Date()) {
    return NextResponse.json({ error: '만료된 초대코드입니다.' }, { status: 400 })
  }

  // 사용 횟수 체크
  if (inviteCode.max_uses !== null && inviteCode.used_count >= inviteCode.max_uses) {
    return NextResponse.json({ error: '이미 소진된 초대코드입니다.' }, { status: 400 })
  }

  // 이미 권한 있는지 체크
  const { data: existing } = await admin
    .from('page_access_grants')
    .select('id')
    .eq('page_id', pageId)
    .eq('user_id', user.id)
    .single()

  if (existing) {
    return NextResponse.json({ ok: true, message: '이미 접근 권한이 있습니다.' })
  }

  // 권한 부여
  const { error: grantError } = await admin.from('page_access_grants').insert({
    page_id: pageId,
    user_id: user.id,
    invite_code_id: inviteCode.id,
  })

  if (grantError) {
    return NextResponse.json({ error: '권한 부여에 실패했습니다.' }, { status: 500 })
  }

  // 사용 횟수 증가
  await admin
    .from('invite_codes')
    .update({ used_count: inviteCode.used_count + 1 })
    .eq('id', inviteCode.id)

  return NextResponse.json({ ok: true })
}
