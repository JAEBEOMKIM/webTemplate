import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { password, ...pageData } = await request.json()

  let password_hash: string | null = null
  if (password) {
    password_hash = await bcrypt.hash(password, 10)
  }

  const { data: page, error } = await supabase
    .from('pages')
    .insert({ ...pageData, password_hash, created_by: user.id })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ page })
}
