'use client'

import { useState } from 'react'
import { componentRegistry } from '@/components/registry'
import type { PageData, PageComponentData } from '@/components/registry/types'
import { ThemeToggle } from '@/components/ui/ThemeToggle'

interface Props {
  page: PageData
  components: PageComponentData[]
  requiresPassword?: boolean
  requiresInviteCode?: boolean
  user?: { id: string; email?: string }
}

function GateLayout({ title, subtitle, icon, children }: { title: string; subtitle: string; icon: string; children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
      <div className="glow-blob" style={{ top: '-100px', left: '50%', transform: 'translateX(-50%)' }} />
      <div style={{ padding: '16px 24px', display: 'flex', justifyContent: 'flex-end', position: 'relative', zIndex: 1 }}>
        <ThemeToggle />
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', position: 'relative', zIndex: 1 }}>
        <div style={{ width: '100%', maxWidth: '360px' }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{ width: '52px', height: '52px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '24px' }}>
              {icon}
            </div>
            <h1 style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text-primary)', marginBottom: '6px' }}>{title}</h1>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{subtitle}</p>
          </div>
          <div className="card" style={{ padding: '24px' }}>
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}

function PasswordGate({ page, onUnlock }: { page: PageData; onUnlock: () => void }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError('')
    const res = await fetch('/api/pages/verify-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pageId: page.id, password }),
    })
    if (res.ok) {
      sessionStorage.setItem(`page-access-${page.id}`, '1')
      onUnlock()
    } else {
      setError('비밀번호가 올바르지 않습니다.')
    }
    setLoading(false)
  }

  return (
    <GateLayout title={page.title} subtitle="비밀번호를 입력하세요" icon="🔒">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <input
          type="password"
          className="input"
          placeholder="비밀번호"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          autoFocus
        />
        {error && <p style={{ fontSize: '12px', color: 'var(--danger)' }}>{error}</p>}
        <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '10px' }}>
          {loading ? '확인 중...' : '입장하기'}
        </button>
      </form>
    </GateLayout>
  )
}

function InviteCodeGate({ page, user, onUnlock }: { page: PageData; user: { id: string; email?: string }; onUnlock: () => void }) {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError('')
    const res = await fetch('/api/invite/redeem', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pageId: page.id, code: code.toUpperCase() }),
    })
    if (res.ok) {
      onUnlock()
    } else {
      const data = await res.json()
      setError(data.error || '유효하지 않은 코드입니다.')
    }
    setLoading(false)
  }

  return (
    <GateLayout title={page.title} subtitle="초대코드를 입력하세요" icon="🔑">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center' }}>{user.email}</div>
        <input
          className="input"
          placeholder="XXXXXX"
          value={code}
          onChange={e => setCode(e.target.value.toUpperCase())}
          maxLength={10}
          required
          autoFocus
          style={{ textAlign: 'center', fontFamily: 'monospace', fontSize: '18px', letterSpacing: '0.15em', fontWeight: 700 }}
        />
        {error && <p style={{ fontSize: '12px', color: 'var(--danger)' }}>{error}</p>}
        <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '10px' }}>
          {loading ? '확인 중...' : '입장하기'}
        </button>
      </form>
    </GateLayout>
  )
}

// 빌더와 동일한 그리드 상수
const GRID_COLS = 10
const GRID_ROW_HEIGHT = 60 // px
const GRID_GAP = 8 // px

function PageContent({ page, components }: { page: PageData; components: PageComponentData[] }) {
  // 그리드 전체 높이 계산 (빈 공간 없이 딱 맞게)
  const gridRows = components.length > 0
    ? Math.max(...components.map(c => (c.grid_y ?? 0) + (c.grid_h ?? 6)))
    : 0

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {/* Page header */}
      <div style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-primary)', position: 'sticky', top: 0, zIndex: 10, backdropFilter: 'blur(12px)' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 20px', height: '52px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h1 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>{page.title}</h1>
          <ThemeToggle />
        </div>
      </div>

      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '20px' }}>
        {page.description && (
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: 1.6 }}>{page.description}</p>
        )}

        {components.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>🧩</div>
            <p>아직 컨텐츠가 없습니다</p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${GRID_COLS}, 1fr)`,
            gridAutoRows: `${GRID_ROW_HEIGHT}px`,
            gap: `${GRID_GAP}px`,
            // 빌더의 최대 행 수까지 공간 확보
            minHeight: gridRows > 0 ? `${gridRows * (GRID_ROW_HEIGHT + GRID_GAP) - GRID_GAP}px` : 'auto',
          }}>
            {components.map(comp => {
              const def = componentRegistry.get(comp.component_type)
              if (!def) return null
              const x = comp.grid_x ?? 0
              const y = comp.grid_y ?? 0
              const w = comp.grid_w ?? GRID_COLS
              const h = comp.grid_h ?? 6
              return (
                <div
                  key={comp.id}
                  className="card"
                  style={{
                    gridColumn: `${x + 1} / span ${w}`,
                    gridRow: `${y + 1} / span ${h}`,
                    overflow: 'auto',
                    minWidth: 0,
                    minHeight: 0,
                  }}
                >
                  <def.Component
                    componentId={comp.id}
                    config={comp.config}
                    pageId={page.id}
                  />
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export function DynamicPage({ page, components, requiresPassword, requiresInviteCode, user }: Props) {
  const [unlocked, setUnlocked] = useState(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem(`page-access-${page.id}`) === '1'
    }
    return false
  })

  if (requiresPassword && !unlocked) return <PasswordGate page={page} onUnlock={() => setUnlocked(true)} />
  if (requiresInviteCode && !unlocked && user) return <InviteCodeGate page={page} user={user} onUnlock={() => setUnlocked(true)} />
  return <PageContent page={page} components={components} />
}
