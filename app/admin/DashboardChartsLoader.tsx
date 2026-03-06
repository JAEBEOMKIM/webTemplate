'use client'

import dynamic from 'next/dynamic'

interface PageStat  { id: string; title: string; views: number }
interface ImageStat { id: string; title: string; image_count: number }
export interface DashboardStats {
  total_views: PageStat[]
  daily_views:  PageStat[]
  image_usage:  ImageStat[]
}

const DashboardCharts = dynamic(() => import('./DashboardCharts'), {
  ssr: false,
  loading: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {[1, 2, 3].map(i => (
        <div key={i} className="card" style={{ padding: '20px', height: '260px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>차트 로딩 중...</span>
        </div>
      ))}
    </div>
  ),
})

export default function DashboardChartsLoader({ stats }: { stats: DashboardStats }) {
  return <DashboardCharts stats={stats} />
}
