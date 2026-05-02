'use client'

import { useState, useEffect, useRef } from 'react'
import { componentRegistry } from '@/components/registry'
import type { PageData, PageComponentData, ComponentDefinition } from '@/components/registry/types'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import PopupOverlay from '@/components/ui/popup/PopupOverlay'
import { usePopupTriggers } from '@/components/ui/popup/usePopupTrigger'
import type { PopupConfig } from '@/components/ui/popup/types'

interface UserProfile {
  id: string
  email?: string
  full_name?: string
  avatar_url?: string
  provider?: string
}

interface Props {
  page: PageData
  components: PageComponentData[]
  requiresPassword?: boolean
  requiresInviteCode?: boolean
  user?: UserProfile
  isAdmin?: boolean
}

const PROVIDER_LABELS: Record<string, string> = {
  naver: '네이버',
  kakao: '카카오',
  google: 'Google',
}

function UserAvatar({ user, size = 28 }: { user: UserProfile; size?: number }) {
  const [imgError, setImgError] = useState(false)
  const displayName = user.full_name || user.email || ''
  const initials = displayName.charAt(0).toUpperCase()

  if (user.avatar_url && !imgError) {
    return (
      <img
        src={user.avatar_url}
        alt={displayName}
        onError={() => setImgError(true)}
        style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
      />
    )
  }

  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: 'var(--accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.42, fontWeight: 700, flexShrink: 0 }}>
      {initials}
    </div>
  )
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

function InviteCodeGate({ page, user, onUnlock }: { page: PageData; user: UserProfile; onUnlock: () => void }) {
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

  const providerLabel = user.provider ? PROVIDER_LABELS[user.provider] : ''

  return (
    <GateLayout title={page.title} subtitle="초대코드를 입력하세요" icon="🔑">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* User info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: 'var(--bg-secondary)', borderRadius: '10px', border: '1px solid var(--border)' }}>
          <UserAvatar user={user} size={32} />
          <div style={{ flex: 1, minWidth: 0 }}>
            {user.full_name && (
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.full_name}
              </div>
            )}
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user.email}
            </div>
          </div>
          {providerLabel && (
            <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '6px', padding: '2px 7px', whiteSpace: 'nowrap' }}>
              {providerLabel}
            </div>
          )}
        </div>

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

// ── 팝업 래퍼 ─────────────────────────────────────────────────
function ComponentCell({ comp, def, page, isAdmin, showBorder }: {
  comp: PageComponentData; def: ComponentDefinition;
  page: PageData; isAdmin?: boolean; showBorder: boolean
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const popups = (comp.config.popups as PopupConfig[] | undefined)
  const { activePopup, close } = usePopupTriggers(comp.id, popups, containerRef)

  const x = comp.grid_x ?? 0
  const y = comp.grid_y ?? 0
  const w = comp.grid_w ?? 10
  const h = comp.grid_h ?? 6

  // 공통 옵션
  const lockHeight = (comp.config.lock_height as boolean) === true
  const adminOnly = (comp.config.admin_only as boolean) === true
  const collapsible = (comp.config.collapsible as boolean) === true

  // 접기/펼치기 상태 — 세션에 영구 저장
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    if (!collapsible || typeof window === 'undefined') return false
    try {
      return window.sessionStorage.getItem(`component-collapsed-${comp.id}`) === '1'
    } catch {
      return false
    }
  })

  const toggleCollapsed = () => {
    setCollapsed(prev => {
      const next = !prev
      try {
        if (next) window.sessionStorage.setItem(`component-collapsed-${comp.id}`, '1')
        else window.sessionStorage.removeItem(`component-collapsed-${comp.id}`)
      } catch {}
      return next
    })
  }

  // lock_height 모드: 그리드 셀 최대 높이 (h * row_height + (h-1) * gap)
  const cellMaxHeight = h * GRID_ROW_HEIGHT + (h - 1) * GRID_GAP

  // 셀 스타일 결정
  const cellStyle: React.CSSProperties = {
    gridColumn: `${x + 1} / span ${w}`,
    gridRow: `${y + 1} / span ${h}`,
    minWidth: 0, minHeight: 0,
    position: 'relative',
    ...(showBorder ? {} : { background: 'transparent' }),
  }

  if (collapsed) {
    // 접힘: 콘텐츠 숨기고 셀을 최소 높이로 축소 (alignSelf:start 로 다른 셀 영향 없음)
    cellStyle.overflow = 'hidden'
    cellStyle.alignSelf = 'start'
    cellStyle.height = 'fit-content'
  } else if (lockHeight) {
    // 높이 고정: 스크롤 안 생김, 콘텐츠 작으면 축소, 크면 grid 사이즈로 캡
    cellStyle.overflow = 'hidden'
    cellStyle.alignSelf = 'start'
    cellStyle.maxHeight = `${cellMaxHeight}px`
  } else {
    cellStyle.overflow = 'auto'
  }

  return (
    <>
      <div
        ref={containerRef}
        className={showBorder ? 'card' : undefined}
        style={cellStyle}
      >
        {/* 관리자 전용 표시 — 관리자에게만 노출 */}
        {adminOnly && isAdmin && (
          <div style={{
            position: 'absolute', top: '6px', left: '6px', zIndex: 5,
            fontSize: '10px', fontWeight: 600,
            background: 'rgba(239, 68, 68, 0.92)', color: '#fff',
            padding: '2px 8px', borderRadius: '6px',
            letterSpacing: '0.02em',
            pointerEvents: 'none',
            boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
          }}>
            🔒 관리자 전용
          </div>
        )}

        {/* 접기/펼치기 토글 버튼 */}
        {collapsible && (
          <button
            type="button"
            onClick={toggleCollapsed}
            aria-label={collapsed ? '펼치기' : '접기'}
            title={collapsed ? '펼치기' : '접기'}
            style={{
              position: 'absolute', top: '6px', right: '6px', zIndex: 5,
              width: '22px', height: '22px',
              borderRadius: '50%',
              border: '1px solid var(--border)',
              background: 'var(--bg-primary)',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              fontSize: '12px', fontWeight: 700, lineHeight: 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background 0.15s, color 0.15s, transform 0.15s',
              boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
              padding: 0,
            }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.background = 'var(--bg-secondary)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'var(--bg-primary)' }}
          >
            {collapsed ? '+' : '−'}
          </button>
        )}

        {/* 콘텐츠 (접힘 상태에서는 숨김) */}
        {!collapsed ? (
          <def.Component componentId={comp.id} config={comp.config} pageId={page.id} isAdmin={isAdmin} />
        ) : (
          <div style={{
            padding: '10px 36px 10px 14px',
            fontSize: '12px', color: 'var(--text-muted)',
            display: 'flex', alignItems: 'center',
            minHeight: '34px',
            opacity: 0.7,
          }}>
            접힘
          </div>
        )}
      </div>
      {activePopup && !collapsed && (
        <PopupOverlay open config={activePopup} parentComponentId={comp.id} pageId={page.id} onClose={close} />
      )}
    </>
  )
}

function FullPageCell({ comp, def, page, isAdmin }: {
  comp: PageComponentData; def: ComponentDefinition;
  page: PageData; isAdmin?: boolean
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const popups = (comp.config.popups as PopupConfig[] | undefined)
  const { activePopup, close } = usePopupTriggers(comp.id, popups, containerRef)

  const adminOnly = (comp.config.admin_only as boolean) === true

  return (
    <>
      <div ref={containerRef} style={{ width: '100%', minHeight: '100vh', position: 'relative' }}>
        {adminOnly && isAdmin && (
          <div style={{
            position: 'fixed', top: '12px', left: '12px', zIndex: 100,
            fontSize: '11px', fontWeight: 600,
            background: 'rgba(239, 68, 68, 0.92)', color: '#fff',
            padding: '4px 10px', borderRadius: '6px',
            letterSpacing: '0.02em',
            pointerEvents: 'none',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          }}>
            🔒 관리자 전용
          </div>
        )}
        <def.Component componentId={comp.id} config={comp.config} pageId={page.id} isAdmin={isAdmin} />
      </div>
      {activePopup && (
        <PopupOverlay open config={activePopup} parentComponentId={comp.id} pageId={page.id} onClose={close} />
      )}
    </>
  )
}

// 빌더와 동일한 그리드 상수
const GRID_COLS = 10
const GRID_ROW_HEIGHT = 60 // px
const GRID_GAP = 8 // px

function PageContent({ page, components, user, isAdmin }: { page: PageData; components: PageComponentData[]; user?: UserProfile; isAdmin?: boolean }) {
  // 관리자 전용 컴포넌트는 비관리자에게서 제외
  const visibleComponents = components.filter(c => !((c.config.admin_only as boolean) === true && !isAdmin))

  // 전체 페이지 단독 표시 컴포넌트 확인
  const fullPageComp = visibleComponents.find(c => c.config.full_page === true)
  if (fullPageComp) {
    const def = componentRegistry.get(fullPageComp.component_type)
    if (def) {
      return <FullPageCell comp={fullPageComp} def={def} page={page} isAdmin={isAdmin} />
    }
  }

  // 그리드 전체 높이 계산 (빈 공간 없이 딱 맞게)
  const gridRows = visibleComponents.length > 0
    ? Math.max(...visibleComponents.map(c => (c.grid_y ?? 0) + (c.grid_h ?? 6)))
    : 0

  const showHeader = page.show_header !== false
  const pt = page.padding_top ?? 20
  const pr = page.padding_right ?? 20
  const pb = page.padding_bottom ?? 20
  const pl = page.padding_left ?? 20

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {/* Page header */}
      {showHeader && (
        <div style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-primary)', position: 'sticky', top: 0, zIndex: 10, backdropFilter: 'blur(12px)' }}>
          <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 20px', height: '52px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h1 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>{page.title}</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {user && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <UserAvatar user={user} size={26} />
                  {user.full_name && (
                    <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {user.full_name}
                    </span>
                  )}
                  {user.provider && PROVIDER_LABELS[user.provider] && (
                    <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '6px', padding: '1px 6px' }}>
                      {PROVIDER_LABELS[user.provider]}
                    </span>
                  )}
                </div>
              )}
              <ThemeToggle />
            </div>
          </div>
        </div>
      )}

      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: `${pt}px ${pr}px ${pb}px ${pl}px` }}>
        {visibleComponents.length === 0 ? (
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
            minHeight: gridRows > 0 ? `${gridRows * (GRID_ROW_HEIGHT + GRID_GAP) - GRID_GAP}px` : 'auto',
          }}>
            {visibleComponents.map(comp => {
              const def = componentRegistry.get(comp.component_type)
              if (!def) return null
              const showBorder = (comp.config.show_border as boolean) !== false
              return (
                <ComponentCell key={comp.id} comp={comp} def={def} page={page} isAdmin={isAdmin} showBorder={showBorder} />
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export function DynamicPage({ page, components, requiresPassword, requiresInviteCode, user, isAdmin }: Props) {
  const [unlocked, setUnlocked] = useState(false)

  useEffect(() => {
    if (sessionStorage.getItem(`page-access-${page.id}`) === '1') {
      setUnlocked(true)
    }
  }, [page.id])

  const themeClass = page.theme && page.theme !== 'default' ? `theme-${page.theme}` : ''

  const content = (() => {
    if (requiresPassword && !unlocked) return <PasswordGate page={page} onUnlock={() => setUnlocked(true)} />
    if (requiresInviteCode && !unlocked && user) return <InviteCodeGate page={page} user={user} onUnlock={() => setUnlocked(true)} />
    return <PageContent page={page} components={components} user={user} isAdmin={isAdmin} />
  })()

  return themeClass
    ? <div className={themeClass}>{content}</div>
    : content
}
