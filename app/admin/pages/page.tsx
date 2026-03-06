import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function AdminPagesPage() {
  const supabase = await createClient()
  const { data: pages } = await supabase
    .from('pages')
    .select('id, slug, title, access_type, is_published, created_at')
    .order('created_at', { ascending: false })

  const accessConfig: Record<string, { label: string; color: string }> = {
    public: { label: '공개', color: 'var(--success)' },
    password: { label: '비밀번호', color: 'var(--warning)' },
    oauth: { label: 'OAuth', color: 'var(--accent-text)' },
  }

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

      {pages && pages.length > 0 ? (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 100px 80px 160px', borderBottom: '1px solid var(--border)', padding: '10px 20px' }}>
            {['제목', 'URL', '권한', '상태', '관리'].map(h => (
              <div key={h} style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</div>
            ))}
          </div>

          {pages.map(page => {
            const ac = accessConfig[page.access_type] || { label: page.access_type, color: 'var(--text-muted)' }
            return (
              <div key={page.id} className="table-row-hover" style={{ display: 'grid', gridTemplateColumns: '1fr 120px 100px 80px 160px', padding: '14px 20px', borderBottom: '1px solid var(--border-subtle)' }}>
                <div style={{ fontWeight: 500, fontSize: '14px', color: 'var(--text-primary)', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{page.title}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'monospace', alignSelf: 'center' }}>/{page.slug}</div>
                <div style={{ alignSelf: 'center' }}>
                  <span style={{ fontSize: '11px', fontWeight: 500, color: ac.color, background: `${ac.color}18`, padding: '2px 8px', borderRadius: '20px' }}>
                    {ac.label}
                  </span>
                </div>
                <div style={{ alignSelf: 'center' }}>
                  {page.is_published
                    ? <span className="badge-success">발행됨</span>
                    : <span className="badge-draft">초안</span>
                  }
                </div>
                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                  <Link href={`/admin/pages/${page.id}/edit`}>
                    <button className="btn-ghost" style={{ padding: '5px 10px', fontSize: '12px' }}>편집</button>
                  </Link>
                  <Link href={`/admin/pages/${page.id}/invites`}>
                    <button className="btn-ghost" style={{ padding: '5px 10px', fontSize: '12px', color: 'var(--accent-text)' }}>초대코드</button>
                  </Link>
                  <Link href={`/${page.slug}`} target="_blank">
                    <button className="btn-ghost" style={{ padding: '5px 8px' }}>
                      <svg width="12" height="12" viewBox="0 0 15 15" fill="none"><path d="M3 2C2.44772 2 2 2.44772 2 3V12C2 12.5523 2.44772 13 3 13H12C12.5523 13 13 12.5523 13 12V8.5C13 8.22386 12.7761 8 12.5 8C12.2239 8 12 8.22386 12 8.5V12H3V3L6.5 3C6.77614 3 7 2.77614 7 2.5C7 2.22386 6.77614 2 6.5 2H3ZM12.8536 2.14645C12.9015 2.19439 12.9377 2.24964 12.9621 2.30861C12.9861 2.36669 12.9996 2.4303 13 2.497L13 2.5V2.50049V5.5C13 5.77614 12.7761 6 12.5 6C12.2239 6 12 5.77614 12 5.5V3.70711L6.85355 8.85355C6.65829 9.04882 6.34171 9.04882 6.14645 8.85355C5.95118 8.65829 5.95118 8.34171 6.14645 8.14645L11.2929 3H9.5C9.22386 3 9 2.77614 9 2.5C9 2.22386 9.22386 2 9.5 2H12.4999H12.5C12.5678 2 12.6324 2.01349 12.6914 2.03794C12.7504 2.06234 12.8058 2.09851 12.8536 2.14645Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"/></svg>
                    </button>
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="card" style={{ padding: '60px 20px', textAlign: 'center' }}>
          <div style={{ width: '52px', height: '52px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '22px' }}>📄</div>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>페이지가 없습니다</p>
          <Link href="/admin/pages/new">
            <button className="btn-primary">첫 번째 페이지 만들기</button>
          </Link>
        </div>
      )}
    </div>
  )
}
