import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import PagesManager from './PagesManager'

export default async function AdminPagesPage() {
  const supabase = await createClient()
  const { data: pages } = await supabase
    .from('pages')
    .select('id, slug, title, access_type, is_published, created_at')
    .order('created_at', { ascending: false })

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text-primary)', marginBottom: '2px' }}>페이지 관리</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{pages?.length ?? 0}개의 페이지</p>
        </div>
        <Link href="/admin/pages/new">
          <button className="btn-primary">+ 새 페이지</button>
        </Link>
      </div>

      <PagesManager initialPages={pages ?? []} />
    </div>
  )
}
