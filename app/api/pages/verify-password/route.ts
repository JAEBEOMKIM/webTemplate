import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const { pageId, password } = await request.json()

  const supabase = await createClient()
  const { data: page } = await supabase
    .from('pages')
    .select('password_hash')
    .eq('id', pageId)
    .single()

  if (!page?.password_hash) {
    return NextResponse.json({ error: 'No password set' }, { status: 400 })
  }

  const valid = await bcrypt.compare(password, page.password_hash)
  if (!valid) {
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
  }

  return NextResponse.json({ ok: true })
}
