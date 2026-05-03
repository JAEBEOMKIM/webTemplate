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
function ComponentCell({ comp, def, page, isAdmin, showBorder, effectiveY, collapsed, onToggleCollapsed }: {
  comp: PageComponentData; def: ComponentDefinition;
  page: PageData; isAdmin?: boolean; showBorder: boolean
  effectiveY: number
  collapsed: boolean
  onToggleCollapsed: () => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const popups = (comp.config.popups as PopupConfig[] | undefined)
  const { activePopup, close } = usePopupTriggers(comp.id, popups, containerRef)

  const x = comp.grid_x ?? 0
  const w = comp.grid_w ?? 10
  const h = comp.grid_h ?? 6

  // 공통 옵션 (admin_only 는 PageContent 에서 이미 필터링됨)
  const lockHeight = (comp.config.lock_height as boolean) === true
  const collapsible = (comp.config.collapsible as boolean) === true

  // lock_height 모드: 그리드 셀 최대 높이 (h * row_height + (h-1) * gap)
  const cellMaxHeight = h * GRID_ROW_HEIGHT + (h - 1) * GRID_GAP

  // 셀 스타일 결정
  // 접힘 상태: gridRow span = 1 (1 그리드 행만 차지) → 다른 컴포넌트들이 위로 올라옴
  //           컴포넌트 자체는 렌더하지 않고 헤더 바(제목 + 토글 버튼)만 표시
  const effectiveSpan = collapsed ? 1 : h

  const cellStyle: React.CSSProperties = {
    gridColumn: `${x + 1} / span ${w}`,
    gridRow: `${effectiveY + 1} / span ${effectiveSpan}`,
    minWidth: 0, minHeight: 0,
    position: 'relative',
    ...(showBorder ? {} : { background: 'transparent' }),
  }

  if (collapsed) {
    cellStyle.overflow = 'hidden'
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
        {/* 접기/펼치기 토글 버튼 */}
        {collapsible && (
          <button
            type="button"
            onClick={onToggleCollapsed}
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

        {/* 접힘: 컴포넌트 자체는 렌더하지 않고, 토글 버튼이 있는 헤더 라인만 표시
             펼침: 컴포넌트 정상 렌더 */}
        {collapsed ? (
          <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            padding: '0 40px 0 16px',  // 우측 padding은 toggle 버튼 영역 확보
            overflow: 'hidden',
          }}>
            <span style={{
              flex: 1,
              minWidth: 0,
              fontSize: '14px',
              fontWeight: 600,
              color: 'var(--text-primary)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {(comp.config.title as string) || (comp.config.heading as string) || (comp.config.section_title as string) || ''}
            </span>
          </div>
        ) : (
          <def.Component componentId={comp.id} config={comp.config} pageId={page.id} isAdmin={isAdmin} />
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

  return (
    <>
      <div ref={containerRef} style={{ width: '100%', minHeight: '100vh' }}>
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
  // 숨김(admin_only) 컴포넌트는 모든 사용자(관리자 포함)에게 페이지에서 비표시
  // — 관리자가 미리보기/편집 시에는 빌더 화면에서 확인 가능
  const isHidden = (c: PageComponentData) => (c.config.admin_only as boolean) === true
  const visibleComponents = components.filter(c => !isHidden(c))

  // ── 접기/펼치기 상태 (전역 관리 — 레이아웃 압축을 위해) ─────────────
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set())

  // 마운트 시 sessionStorage 에서 복구
  const visibleIdKey = visibleComponents.map(c => c.id).join(',')
  useEffect(() => {
    const ids = new Set<string>()
    for (const c of visibleComponents) {
      if ((c.config.collapsible as boolean) === true) {
        try {
          if (window.sessionStorage.getItem(`component-collapsed-${c.id}`) === '1') {
            ids.add(c.id)
          }
        } catch {}
      }
    }
    setCollapsedIds(ids)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleIdKey])

  const toggleCollapsed = (id: string) => {
    setCollapsedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
        try { window.sessionStorage.removeItem(`component-collapsed-${id}`) } catch {}
      } else {
        next.add(id)
        try { window.sessionStorage.setItem(`component-collapsed-${id}`, '1') } catch {}
      }
      return next
    })
  }

  // 전체 페이지 단독 표시 컴포넌트 확인 (숨김된 것은 visibleComponents 에서 이미 제외됨)
  const fullPageComp = visibleComponents.find(c => c.config.full_page === true)
  if (fullPageComp) {
    const def = componentRegistry.get(fullPageComp.component_type)
    if (def) {
      return <FullPageCell comp={fullPageComp} def={def} page={page} isAdmin={isAdmin} />
    }
  }

  // ── 레이아웃 압축 — 숨김/접힘 컴포넌트가 차지한 공간만큼 아래 컴포넌트들을 위로 끌어올림 ─
  // 압축 알고리즘은 ALL components 를 그룹화한다 (숨김 컴포넌트가 차지했던 row 도 회수해야 하므로):
  //   - 숨김(admin_only): row 에서 effective_h = 0 으로 취급 → 전체 영역 회수
  //   - 접힘(collapsed): effective_h = 1 (같은 row 에 접힘 안 된 컴포넌트 없을 때만)
  //   - 일반: effective_h = grid_h
  const yOffsetById = new Map<string, number>()
  const rowGroups = new Map<number, PageComponentData[]>()
  for (const c of components) {  // ALL — 숨김도 포함하여 그룹화
    const y = c.grid_y ?? 0
    if (!rowGroups.has(y)) rowGroups.set(y, [])
    rowGroups.get(y)!.push(c)
  }
  let cumulativeSavings = 0
  for (const [, comps] of [...rowGroups.entries()].sort(([a], [b]) => a - b)) {
    // 가시 컴포넌트들에만 yOffset 적용 (숨김은 어차피 렌더 안됨)
    for (const c of comps) {
      if (!isHidden(c)) yOffsetById.set(c.id, cumulativeSavings)
    }

    // row effective height 계산
    const visibleNonCollapsed = comps.filter(c => !isHidden(c) && !collapsedIds.has(c.id))
    let rowEffectiveH: number
    if (visibleNonCollapsed.length > 0) {
      rowEffectiveH = Math.max(...visibleNonCollapsed.map(c => c.grid_h ?? 6))
    } else {
      // 가시 + 접힘 안 된 컴포넌트가 0 → 접힘된 가시 컴포넌트 있으면 1, 모두 숨김이면 0
      const visibleCollapsed = comps.filter(c => !isHidden(c) && collapsedIds.has(c.id))
      rowEffectiveH = visibleCollapsed.length > 0 ? 1 : 0
    }

    const rowOriginalH = Math.max(...comps.map(c => c.grid_h ?? 6))
    cumulativeSavings += Math.max(0, rowOriginalH - rowEffectiveH)
  }

  // 그리드 전체 높이 — 압축 반영 (숨김 영역 제외, 접힘 1행으로 카운트)
  const gridRows = visibleComponents.length > 0
    ? Math.max(...visibleComponents.map(c => {
        const effY = (c.grid_y ?? 0) - (yOffsetById.get(c.id) ?? 0)
        const effH = collapsedIds.has(c.id) ? 1 : (c.grid_h ?? 6)
        return effY + effH
      }))
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
              const effectiveY = (comp.grid_y ?? 0) - (yOffsetById.get(comp.id) ?? 0)
              const collapsed = collapsedIds.has(comp.id)
              return (
                <ComponentCell
                  key={comp.id}
                  comp={comp}
                  def={def}
                  page={page}
                  isAdmin={isAdmin}
                  showBorder={showBorder}
                  effectiveY={effectiveY}
                  collapsed={collapsed}
                  onToggleCollapsed={() => toggleCollapsed(comp.id)}
                />
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
