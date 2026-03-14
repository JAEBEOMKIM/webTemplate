import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { pageId, access_type, password } = await request.json()
  if (!pageId || !access_type) {
    return NextResponse.json({ error: '필수 파라미터 누락' }, { status: 400 })
  }

  const update: Record<string, unknown> = { access_type }
  if (access_type === 'password') {
    if (!password) return NextResponse.json({ error: '비밀번호를 입력하세요' }, { status: 400 })
    update.password_hash = await bcrypt.hash(password, 10)
  } else {
    update.password_hash = null
  }

  const { error } = await supabase
    .from('pages')
    .update(update)
    .eq('id', pageId)
    .eq('created_by', user.id)  // owner-only

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
