import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import DashboardChartsLoader, { type DashboardStats } from './DashboardChartsLoader'

export default async function AdminDashboard() {
  const supabase = await createClient()

  const [
    { count: pageCount },
    { count: publishedCount },
    { data: statsRaw },
  ] = await Promise.all([
    supabase.from('pages').select('*', { count: 'exact', head: true }),
    supabase.from('pages').select('*', { count: 'exact', head: true }).eq('is_published', true),
    supabase.rpc('get_dashboard_stats'),
  ])

  const stats: DashboardStats = statsRaw ?? { total_views: [], daily_views: [], image_usage: [] }

  const totalViews = (stats.total_views ?? []).reduce((s, p) => s + (p.views ?? 0), 0)

  const summaryCards = [
    { label: '전체 페이지',   value: pageCount ?? 0,    sub: '생성된 모든 페이지', icon: '📄' },
    { label: '발행된 페이지', value: publishedCount ?? 0, sub: '현재 공개 중',       icon: '🌐' },
    { label: '누적 방문',     value: totalViews,          sub: '전체 페이지 합계',   icon: '👁️' },
  ]

  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text-primary)', marginBottom: '6px' }}>대시보드</h1>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>페이지 빌더 현황을 확인하세요</p>
      </div>

      {/* 요약 카드 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        {summaryCards.map(s => (
          <div key={s.label} className="card" style={{ padding: '22px' }}>
            <div style={{ width: '38px', height: '38px', background: 'var(--accent-subtle)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', marginBottom: '14px' }}>{s.icon}</div>
            <div style={{ fontSize: '30px', fontWeight: 800, letterSpacing: '-0.04em', color: 'var(--accent)', marginBottom: '4px' }}>{s.value.toLocaleString()}</div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '2px' }}>{s.label}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* 차트 섹션 */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>통계</h2>
        <DashboardChartsLoader stats={stats} />
      </div>

      {/* 빠른 시작 */}
      <div>
        <h2 style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>빠른 시작</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
          <Link href="/admin/pages/new" style={{ textDecoration: 'none' }}>
            <div className="quick-action-accent">
              <div style={{ width: '36px', height: '36px', background: 'var(--accent)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', color: 'white', fontWeight: 700, fontSize: '20px' }}>+</div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--accent)' }}>새 페이지 만들기</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>컴포넌트를 조합해 새 페이지를 생성합니다</div>
            </div>
          </Link>
          <Link href="/admin/pages" style={{ textDecoration: 'none' }}>
            <div className="quick-action-default">
              <div style={{ width: '36px', height: '36px', background: 'var(--bg-secondary)', border: '1.5px solid var(--border)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', fontSize: '16px' }}>📋</div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)' }}>페이지 목록 보기</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>생성된 모든 페이지를 관리합니다</div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}
