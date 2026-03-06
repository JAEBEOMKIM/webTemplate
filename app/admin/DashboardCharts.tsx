'use client'

import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts'

interface PageStat {
  id: string
  title: string
  views: number
}

interface ImageStat {
  id: string
  title: string
  image_count: number
}

interface DashboardStats {
  total_views: PageStat[]
  daily_views:  PageStat[]
  image_usage:  ImageStat[]
}

// 긴 제목 말줄임
function shortTitle(title: string, max = 14) {
  return title.length > max ? title.slice(0, max) + '…' : title
}

const COLORS = {
  total:  '#2563eb',
  daily:  '#7c3aed',
  image:  '#059669',
}

const CustomTooltip = ({
  active, payload, label, unit,
}: {
  active?: boolean
  payload?: { value: number }[]
  label?: string
  unit: string
}) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'var(--bg-primary)',
      border: '1px solid var(--border)',
      borderRadius: '8px',
      padding: '8px 12px',
      fontSize: '12px',
      boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
    }}>
      <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '2px' }}>{label}</p>
      <p style={{ color: 'var(--text-secondary)' }}>
        {payload[0].value.toLocaleString()} {unit}
      </p>
    </div>
  )
}

function ChartSection({
  title,
  dataKey,
  data,
  color,
  unit,
  emptyText,
}: {
  title: string
  dataKey: string
  data: { name: string; [k: string]: number | string }[]
  color: string
  unit: string
  emptyText: string
}) {
  return (
    <div className="card" style={{ padding: '20px 20px 16px' }}>
      {/* 헤더 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{title}</h3>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>상위 10개 페이지</p>
        </div>
        <button
          className="btn-ghost"
          style={{ fontSize: '11px', padding: '4px 10px', color: 'var(--text-muted)', cursor: 'not-allowed', opacity: 0.5 }}
          disabled
          title="준비 중"
        >
          더보기 →
        </button>
      </div>

      {data.length === 0 ? (
        <div style={{ height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '13px', flexDirection: 'column', gap: '8px' }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.4 }}>
            <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
          </svg>
          {emptyText}
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={Math.max(180, data.length * 36)}>
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 0, right: 40, bottom: 0, left: 0 }}
            barCategoryGap="28%"
          >
            <XAxis
              type="number"
              tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={96}
              tick={{ fontSize: 11, fill: 'var(--text-secondary)' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              content={<CustomTooltip unit={unit} />}
              cursor={{ fill: 'var(--bg-secondary)', radius: 4 }}
            />
            <Bar dataKey={dataKey} radius={[0, 4, 4, 0]} maxBarSize={20}>
              {data.map((_, i) => (
                <Cell
                  key={i}
                  fill={color}
                  fillOpacity={1 - i * 0.06}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}

export default function DashboardCharts({ stats }: { stats: DashboardStats }) {
  const totalData = (stats.total_views ?? []).map(d => ({
    name: shortTitle(d.title),
    fullName: d.title,
    views: d.views,
  }))

  const dailyData = (stats.daily_views ?? []).map(d => ({
    name: shortTitle(d.title),
    fullName: d.title,
    views: d.views,
  }))

  const imageData = (stats.image_usage ?? []).map(d => ({
    name: shortTitle(d.title),
    fullName: d.title,
    image_count: d.image_count,
  }))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <ChartSection
        title="페이지별 총 접속량"
        dataKey="views"
        data={totalData}
        color={COLORS.total}
        unit="회"
        emptyText="아직 방문 기록이 없습니다"
      />
      <ChartSection
        title="페이지별 오늘 접속량"
        dataKey="views"
        data={dailyData}
        color={COLORS.daily}
        unit="회"
        emptyText="오늘 방문 기록이 없습니다"
      />
      <ChartSection
        title="페이지별 이미지 사용량"
        dataKey="image_count"
        data={imageData}
        color={COLORS.image}
        unit="장"
        emptyText="등록된 이미지가 없습니다"
      />
    </div>
  )
}
