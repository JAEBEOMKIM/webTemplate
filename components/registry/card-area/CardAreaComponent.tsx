'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { ComponentProps, ConfigFormProps } from '../types'

// ── 타입 정의 ─────────────────────────────────────────────────
type ActionType = 'none' | 'link' | 'sheet' | 'modal' | 'popup'
type BackgroundType = 'color' | 'gradient' | 'image'
type HoverAnim = 'none' | 'lift' | 'zoom' | 'tilt' | 'shine' | 'glow'
type AspectRatio = 'auto' | '1/1' | '4/3' | '3/4' | '16/9' | '9/16' | '3/2' | '2/3'
type LayoutType = 'grid' | 'horizontal-scroll'

interface CardItem {
  id: string
  trigger_id?: string  // 외부 팝업 이벤트 바인딩용 식별자 (data-trigger-id 속성에 부착)
  title?: string
  subtitle?: string
  description?: string
  badge?: string
  bg_type: BackgroundType
  bg_color?: string
  bg_gradient?: string
  bg_image?: string
  overlay_opacity?: number
  text_color?: string
  align?: 'top' | 'center' | 'bottom'
  action_type: ActionType
  action_url?: string
  action_target?: '_self' | '_blank'
  action_label?: string  // 버튼 표시 텍스트 (비워두면 액션 타입별 기본값)
  sheet_content?: string
  hover_anim?: HoverAnim
  aspect_ratio?: AspectRatio
  span?: number
  // 카드 콘텐츠 영역 패딩 (px) — 비워두면 기본값 20 사용
  padding_top?: number
  padding_right?: number
  padding_bottom?: number
  padding_left?: number
}

interface CardAreaConfig {
  title?: string
  subtitle?: string
  layout?: LayoutType
  columns_desktop?: number
  columns_mobile?: number
  gap?: number
  card_radius?: number
  enable_entry_animation?: boolean
  trim_empty_space?: boolean  // 컴포넌트 영역보다 콘텐츠가 작을 때 빈 공백 제거
  cards: CardItem[]
}

// ── 메인 컴포넌트 ──────────────────────────────────────────────
export function CardAreaComponent({ config }: ComponentProps) {
  const cfg = config as unknown as CardAreaConfig
  const cards = cfg.cards ?? []
  const layout: LayoutType = cfg.layout ?? 'grid'
  const colsDesktop = Math.max(1, Math.min(8, cfg.columns_desktop ?? 3))
  const colsMobile = Math.max(1, Math.min(4, cfg.columns_mobile ?? 1))
  const gap = cfg.gap ?? 16
  const radius = cfg.card_radius ?? 16
  const entryAnim = cfg.enable_entry_animation !== false

  const [activeSheet, setActiveSheet] = useState<{ card: CardItem; mode: 'sheet' | 'modal' } | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const [visibleIds, setVisibleIds] = useState<Set<string>>(new Set())

  // Intersection observer for entry animation
  useEffect(() => {
    if (!entryAnim) {
      setVisibleIds(new Set(cards.map(c => c.id)))
      return
    }
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const id = (entry.target as HTMLElement).dataset.cardId
            if (id) {
              setVisibleIds(prev => {
                if (prev.has(id)) return prev
                const next = new Set(prev)
                next.add(id)
                return next
              })
            }
          }
        })
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    )
    cardRefs.current.forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [entryAnim, cards])

  // ESC 닫기
  useEffect(() => {
    if (!activeSheet) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setActiveSheet(null) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [activeSheet])

  // 빈 공백 trim — 부모 그리드 셀의 align-self를 start로 설정해 콘텐츠 높이로 축소
  const trimEmptySpace = cfg.trim_empty_space !== false
  useEffect(() => {
    const parent = containerRef.current?.parentElement
    if (!parent) return
    const prevAlignSelf = parent.style.alignSelf
    const prevHeight = parent.style.height
    if (trimEmptySpace) {
      parent.style.alignSelf = 'start'
      parent.style.height = 'fit-content'
    } else {
      parent.style.alignSelf = ''
      parent.style.height = ''
    }
    return () => {
      parent.style.alignSelf = prevAlignSelf
      parent.style.height = prevHeight
    }
  }, [trimEmptySpace])

  const renderCardInner = (card: CardItem, idx: number) => {
    const bgStyle = getBackgroundStyle(card)
    const textColor = card.text_color || (card.bg_type === 'image' ? '#ffffff' : 'var(--text-primary)')
    const alignItems = card.align === 'top' ? 'flex-start' : card.align === 'bottom' ? 'flex-end' : 'center'
    const isVisible = visibleIds.has(card.id)
    const aspect = card.aspect_ratio && card.aspect_ratio !== 'auto' ? card.aspect_ratio.replace('/', ' / ') : undefined

    return (
      <div
        className={`ca-card ca-hover-${card.hover_anim || 'lift'}`}
        data-card-id={card.id}
        ref={el => {
          if (el) cardRefs.current.set(card.id, el)
          else cardRefs.current.delete(card.id)
        }}
        style={{
          position: 'relative',
          borderRadius: `${radius}px`,
          overflow: 'hidden',
          minHeight: '120px',
          aspectRatio: aspect,
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'translateY(0)' : 'translateY(16px)',
          transition: `opacity 0.5s ease, transform 0.5s ease`,
          transitionDelay: `${Math.min(idx * 0.06, 0.3)}s`,
          willChange: 'transform, opacity',
          ...bgStyle,
        }}
      >
        {/* Image overlay (if image background) */}
        {card.bg_type === 'image' && (
          <div style={{
            position: 'absolute', inset: 0,
            background: `linear-gradient(180deg, rgba(0,0,0,${(card.overlay_opacity ?? 0.3) * 0.6}) 0%, rgba(0,0,0,${card.overlay_opacity ?? 0.3}) 100%)`,
            pointerEvents: 'none',
          }} />
        )}

        {/* Shine effect overlay */}
        {card.hover_anim === 'shine' && (
          <div className="ca-shine" style={{
            position: 'absolute',
            top: 0, left: '-50%',
            width: '50%', height: '100%',
            background: 'linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.25) 50%, transparent 70%)',
            transform: 'skewX(-20deg)',
            pointerEvents: 'none',
            transition: 'left 0.7s ease',
          }} />
        )}

        {/* Badge */}
        {card.badge && (
          <div style={{
            position: 'absolute', top: '12px', right: '12px',
            background: 'rgba(0,0,0,0.55)',
            color: '#fff',
            fontSize: '10px', fontWeight: 700,
            padding: '4px 10px',
            borderRadius: '999px',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            backdropFilter: 'blur(6px)',
            zIndex: 2,
          }}>
            {card.badge}
          </div>
        )}

        {/* Content */}
        <div style={{
          position: 'relative',
          height: '100%',
          minHeight: '120px',
          paddingTop: `${card.padding_top ?? 20}px`,
          paddingRight: `${card.padding_right ?? 20}px`,
          paddingBottom: `${card.padding_bottom ?? 20}px`,
          paddingLeft: `${card.padding_left ?? 20}px`,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: alignItems,
          gap: '6px',
          color: textColor,
          zIndex: 1,
        }}>
          {card.subtitle && (
            <div style={{
              fontSize: '11px', fontWeight: 600,
              opacity: 0.85,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}>
              {card.subtitle}
            </div>
          )}
          {card.title && (
            <div style={{
              fontSize: '18px', fontWeight: 700,
              letterSpacing: '-0.01em',
              lineHeight: 1.25,
            }}>
              {card.title}
            </div>
          )}
          {card.description && (
            <div style={{
              fontSize: '13px', fontWeight: 400,
              opacity: 0.85,
              lineHeight: 1.5,
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}>
              {card.description}
            </div>
          )}
          {card.action_type !== 'none' && (
            <ActionButton
              card={card}
              onSheetOpen={(mode) => setActiveSheet({ card, mode })}
            />
          )}
        </div>
      </div>
    )
  }

  const renderCard = (card: CardItem, idx: number) => {
    // 카드 자체는 클릭 이벤트 없음 — 액션은 카드 내부의 ActionButton 만 트리거
    return <div key={card.id} style={{ display: 'block' }}>{renderCardInner(card, idx)}</div>
  }

  const containerStyle: React.CSSProperties = layout === 'grid'
    ? {
        display: 'grid',
        gap: `${gap}px`,
        gridTemplateColumns: `repeat(var(--ca-cols, ${colsDesktop}), minmax(0, 1fr))`,
      }
    : {
        display: 'flex',
        gap: `${gap}px`,
        overflowX: 'auto',
        scrollSnapType: 'x mandatory',
        paddingBottom: '8px',
      }

  return (
    <div ref={containerRef} style={{ width: '100%', height: trimEmptySpace ? 'auto' : '100%', display: 'flex', flexDirection: 'column' }}>
      {(cfg.title || cfg.subtitle) && (
        <div style={{ marginBottom: '16px' }}>
          {cfg.title && (
            <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: '4px' }}>
              {cfg.title}
            </div>
          )}
          {cfg.subtitle && (
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 400 }}>
              {cfg.subtitle}
            </div>
          )}
        </div>
      )}

      {cards.length === 0 ? (
        <div style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '40px 20px', color: 'var(--text-muted)', fontSize: '13px',
          border: '1px dashed var(--border)', borderRadius: '12px',
        }}>
          카드를 추가해 주세요
        </div>
      ) : (
        <div className="ca-grid" style={containerStyle}>
          {cards.map((card, idx) => (
            <div
              key={card.id}
              style={layout === 'horizontal-scroll' ? {
                flex: `0 0 ${100 / colsDesktop}%`,
                minWidth: '220px',
                scrollSnapAlign: 'start',
              } : card.span && card.span > 1 ? {
                gridColumn: `span ${Math.min(card.span, colsDesktop)}`,
              } : undefined}
            >
              {renderCard(card, idx)}
            </div>
          ))}
        </div>
      )}

      {/* Bottom sheet / Modal overlay */}
      {activeSheet && (
        <CardSheet card={activeSheet.card} mode={activeSheet.mode} onClose={() => setActiveSheet(null)} />
      )}

      <style>{`
        .ca-card { transition: transform 0.35s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.35s ease; }
        .ca-hover-lift:hover { transform: translateY(-4px) !important; box-shadow: 0 18px 40px rgba(0,0,0,0.18); }
        .ca-hover-zoom:hover { transform: scale(1.03) !important; box-shadow: 0 14px 36px rgba(0,0,0,0.18); }
        .ca-hover-tilt:hover { transform: perspective(900px) rotateY(-3deg) rotateX(2deg) translateY(-2px) !important; box-shadow: 0 18px 40px rgba(0,0,0,0.2); }
        .ca-hover-glow:hover { box-shadow: 0 0 0 2px var(--accent), 0 12px 32px rgba(59,130,246,0.25); }
        .ca-hover-shine:hover .ca-shine { left: 150% !important; }
        .ca-btn:hover { transform: translateY(-1px); box-shadow: 0 8px 22px rgba(0,0,0,0.25) !important; background: #fff !important; }
        .ca-btn:hover .ca-arrow { transform: translateX(4px); }
        .ca-btn:active { transform: scale(0.96); }
        @media (max-width: 640px) {
          .ca-grid { --ca-cols: var(--ca-cols-mobile, 1) !important; }
        }
        @keyframes caSheetIn { from { transform: translateY(100%) } to { transform: translateY(0) } }
        @keyframes caModalIn { from { opacity: 0; transform: scale(0.94) } to { opacity: 1; transform: scale(1) } }
        @keyframes caBackdropIn { from { opacity: 0 } to { opacity: 1 } }
      `}</style>
      <style>{`.ca-grid { --ca-cols-mobile: ${colsMobile}; }`}</style>
    </div>
  )
}

// ── Background style helper ────────────────────────────────────
function getBackgroundStyle(card: CardItem): React.CSSProperties {
  if (card.bg_type === 'image' && card.bg_image) {
    return {
      background: `url("${card.bg_image}") center/cover no-repeat, var(--bg-secondary)`,
    }
  }
  if (card.bg_type === 'gradient' && card.bg_gradient) {
    return { background: card.bg_gradient }
  }
  return { background: card.bg_color || 'var(--bg-secondary)' }
}

// ── Action Button (카드 내부의 유일한 클릭 트리거) ──────────────
function ActionButton({ card, onSheetOpen }: {
  card: CardItem
  onSheetOpen: (mode: 'sheet' | 'modal') => void
}) {
  const defaultLabel =
    card.action_type === 'link' ? '바로가기'
    : card.action_type === 'popup' ? '열기'
    : card.action_type === 'sheet' ? '자세히 보기'
    : card.action_type === 'modal' ? '자세히 보기'
    : ''
  const label = (card.action_label && card.action_label.trim()) || defaultLabel

  const buttonStyle: React.CSSProperties = {
    marginTop: 'auto',
    alignSelf: 'flex-start',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 16px',
    borderRadius: '999px',
    fontSize: '12px',
    fontWeight: 700,
    background: 'rgba(255,255,255,0.95)',
    color: '#111',
    border: 'none',
    cursor: 'pointer',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    boxShadow: '0 4px 14px rgba(0,0,0,0.18)',
    textDecoration: 'none',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease',
    letterSpacing: '0.01em',
    whiteSpace: 'nowrap',
  }

  // 외부 팝업 시스템에서 셀렉터로 타겟팅 가능한 trigger_id (버튼에만 부착)
  const triggerId = card.trigger_id || undefined

  // Link 액션: <a> 태그
  if (card.action_type === 'link' && card.action_url) {
    return (
      <a
        className="ca-btn"
        href={card.action_url}
        target={card.action_target ?? '_self'}
        rel={card.action_target === '_blank' ? 'noopener noreferrer' : undefined}
        data-trigger-id={triggerId}
        onClick={e => e.stopPropagation()}
        style={buttonStyle}
      >
        {label}
        <span className="ca-arrow" style={{ display: 'inline-block', transition: 'transform 0.3s ease' }}>→</span>
      </a>
    )
  }

  // sheet / modal / popup
  return (
    <button
      className="ca-btn"
      type="button"
      data-trigger-id={triggerId}
      onClick={e => {
        e.stopPropagation()
        if (card.action_type === 'sheet' || card.action_type === 'modal') {
          onSheetOpen(card.action_type)
        }
        // 'popup' 액션: 외부 usePopupTriggers 가 data-trigger-id 셀렉터로 처리
      }}
      style={buttonStyle}
    >
      {label}
      <span className="ca-arrow" style={{ display: 'inline-block', transition: 'transform 0.3s ease' }}>→</span>
    </button>
  )
}

// ── Bottom Sheet / Modal ───────────────────────────────────────
function CardSheet({ card, mode, onClose }: { card: CardItem; mode: 'sheet' | 'modal'; onClose: () => void }) {
  const [closing, setClosing] = useState(false)
  const close = () => {
    setClosing(true)
    setTimeout(onClose, 220)
  }

  const isSheet = mode === 'sheet'
  const containerStyle: React.CSSProperties = isSheet ? {
    position: 'fixed', left: 0, right: 0, bottom: 0,
    background: 'var(--bg-primary)',
    borderTopLeftRadius: '20px', borderTopRightRadius: '20px',
    maxHeight: '80dvh', display: 'flex', flexDirection: 'column',
    animation: closing ? 'caSheetIn 0.22s ease reverse' : 'caSheetIn 0.32s cubic-bezier(0.2, 0.8, 0.2, 1)',
    zIndex: 10001, boxShadow: '0 -8px 40px rgba(0,0,0,0.25)',
  } : {
    position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
    background: 'var(--bg-primary)',
    borderRadius: '16px',
    width: 'min(92vw, 560px)', maxHeight: '80dvh', display: 'flex', flexDirection: 'column',
    animation: closing ? 'caModalIn 0.2s ease reverse' : 'caModalIn 0.28s cubic-bezier(0.2, 0.8, 0.2, 1)',
    zIndex: 10001, boxShadow: '0 24px 60px rgba(0,0,0,0.35)',
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
        zIndex: 10000,
        animation: closing ? 'caBackdropIn 0.22s ease reverse' : 'caBackdropIn 0.22s ease',
      }}
      onClick={close}
    >
      <div style={containerStyle} onClick={e => e.stopPropagation()}>
        {/* Drag handle (sheet only) */}
        {isSheet && (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '10px' }}>
            <div style={{ width: '40px', height: '4px', borderRadius: '2px', background: 'var(--border)' }} />
          </div>
        )}

        {/* Header */}
        <div style={{
          padding: '16px 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: '1px solid var(--border)',
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            {card.subtitle && (
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>
                {card.subtitle}
              </div>
            )}
            <div style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
              {card.title || '상세 정보'}
            </div>
          </div>
          <button
            onClick={close}
            aria-label="닫기"
            style={{
              width: '32px', height: '32px', borderRadius: '8px',
              background: 'transparent', border: 'none', color: 'var(--text-muted)',
              fontSize: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}
          >×</button>
        </div>

        {/* Body */}
        <div style={{
          flex: 1, overflowY: 'auto',
          padding: '20px',
          color: 'var(--text-primary)',
          fontSize: '14px', lineHeight: 1.65,
          whiteSpace: 'pre-wrap',
        }}>
          {card.sheet_content || card.description || '내용이 없습니다.'}
        </div>

        {/* Footer (link button if action_url provided) */}
        {card.action_url && (
          <div style={{ padding: '12px 20px 16px', borderTop: '1px solid var(--border)' }}>
            <a
              href={card.action_url}
              target={card.action_target ?? '_self'}
              rel={card.action_target === '_blank' ? 'noopener noreferrer' : undefined}
              style={{
                display: 'block', textAlign: 'center',
                padding: '12px', borderRadius: '10px',
                background: 'var(--accent)', color: '#fff',
                fontSize: '14px', fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              자세히 보러가기 →
            </a>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Config Form ──────────────────────────────────────────────────
const labelStyle: React.CSSProperties = {
  fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)',
  textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px', display: 'block',
}
const miniLabelStyle: React.CSSProperties = {
  fontSize: '10px', color: 'var(--text-muted)', marginBottom: '3px', display: 'block',
}
const cardFormStyle: React.CSSProperties = {
  padding: '12px', borderRadius: '10px', background: 'var(--bg-secondary)',
  border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '8px',
}

const PRESET_GRADIENTS: { name: string; value: string }[] = [
  { name: 'Sunset', value: 'linear-gradient(135deg, #ff7e5f 0%, #feb47b 100%)' },
  { name: 'Ocean', value: 'linear-gradient(135deg, #2193b0 0%, #6dd5ed 100%)' },
  { name: 'Purple', value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
  { name: 'Mint', value: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' },
  { name: 'Fire', value: 'linear-gradient(135deg, #f12711 0%, #f5af19 100%)' },
  { name: 'Night', value: 'linear-gradient(135deg, #232526 0%, #414345 100%)' },
  { name: 'Pink', value: 'linear-gradient(135deg, #ee9ca7 0%, #ffdde1 100%)' },
  { name: 'Sky', value: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
]

export function CardAreaConfigForm({ config, onChange }: ConfigFormProps) {
  const cfg = config as unknown as CardAreaConfig
  const cards = cfg.cards ?? []

  const set = (patch: Partial<CardAreaConfig>) =>
    onChange({ ...config, ...patch } as Record<string, unknown>)

  const updateCard = (id: string, patch: Partial<CardItem>) => {
    const next = cards.map(c => c.id === id ? { ...c, ...patch } : c)
    set({ cards: next })
  }

  const addCard = () => {
    const id = `card-${Date.now()}`
    const newCard: CardItem = {
      id,
      title: '새 카드',
      subtitle: '',
      description: '',
      bg_type: 'gradient',
      bg_gradient: PRESET_GRADIENTS[cards.length % PRESET_GRADIENTS.length].value,
      action_type: 'sheet',
      sheet_content: '여기에 상세 내용을 입력하세요.',
      hover_anim: 'lift',
      aspect_ratio: '4/3',
      align: 'bottom',
    }
    set({ cards: [...cards, newCard] })
  }

  const removeCard = (id: string) => {
    set({ cards: cards.filter(c => c.id !== id) })
  }

  const moveCard = (id: string, dir: -1 | 1) => {
    const idx = cards.findIndex(c => c.id === id)
    if (idx < 0) return
    const target = idx + dir
    if (target < 0 || target >= cards.length) return
    const next = [...cards]
    ;[next[idx], next[target]] = [next[target], next[idx]]
    set({ cards: next })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', padding: '12px' }}>
      {/* 섹션 1: 헤더 */}
      <div style={cardFormStyle}>
        <div>
          <label style={labelStyle}>섹션 제목</label>
          <input className="input" value={cfg.title ?? ''} onChange={e => set({ title: e.target.value })} placeholder="비워두면 표시 안됨" />
        </div>
        <div>
          <label style={labelStyle}>섹션 부제목</label>
          <input className="input" value={cfg.subtitle ?? ''} onChange={e => set({ subtitle: e.target.value })} placeholder="비워두면 표시 안됨" />
        </div>
      </div>

      {/* 섹션 2: 레이아웃 */}
      <div style={cardFormStyle}>
        <label style={labelStyle}>레이아웃</label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <div>
            <label style={miniLabelStyle}>레이아웃 종류</label>
            <select
              className="input"
              value={cfg.layout ?? 'grid'}
              onChange={e => set({ layout: e.target.value as LayoutType })}
            >
              <option value="grid">그리드</option>
              <option value="horizontal-scroll">가로 스크롤</option>
            </select>
          </div>
          <div>
            <label style={miniLabelStyle}>간격 (px)</label>
            <input className="input" type="number" min={0} max={64} value={cfg.gap ?? 16} onChange={e => set({ gap: Number(e.target.value) })} />
          </div>
          <div>
            <label style={miniLabelStyle}>데스크탑 열수</label>
            <input className="input" type="number" min={1} max={8} value={cfg.columns_desktop ?? 3} onChange={e => set({ columns_desktop: Number(e.target.value) })} />
          </div>
          <div>
            <label style={miniLabelStyle}>모바일 열수</label>
            <input className="input" type="number" min={1} max={4} value={cfg.columns_mobile ?? 1} onChange={e => set({ columns_mobile: Number(e.target.value) })} />
          </div>
          <div>
            <label style={miniLabelStyle}>카드 모서리(px)</label>
            <input className="input" type="number" min={0} max={32} value={cfg.card_radius ?? 16} onChange={e => set({ card_radius: Number(e.target.value) })} />
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: '4px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>
              <input
                type="checkbox"
                checked={cfg.enable_entry_animation !== false}
                onChange={e => set({ enable_entry_animation: e.target.checked })}
              />
              스크롤 등장 애니메이션
            </label>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: '4px', gridColumn: '1 / -1' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>
              <input
                type="checkbox"
                checked={cfg.trim_empty_space !== false}
                onChange={e => set({ trim_empty_space: e.target.checked })}
              />
              빈 공백 자동 제거 (콘텐츠 높이로 축소)
            </label>
          </div>
        </div>
      </div>

      {/* 섹션 3: 카드 목록 */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <label style={labelStyle}>카드 목록 ({cards.length})</label>
          <button onClick={addCard} className="btn-secondary" style={{ fontSize: '12px', padding: '6px 12px' }}>+ 카드 추가</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {cards.map((card, idx) => (
            <CardEditor
              key={card.id}
              card={card}
              index={idx}
              total={cards.length}
              onUpdate={(patch) => updateCard(card.id, patch)}
              onRemove={() => removeCard(card.id)}
              onMove={(dir) => moveCard(card.id, dir)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

// ── 개별 카드 에디터 ────────────────────────────────────────────
function CardEditor({ card, index, total, onUpdate, onRemove, onMove }: {
  card: CardItem
  index: number
  total: number
  onUpdate: (patch: Partial<CardItem>) => void
  onRemove: () => void
  onMove: (dir: -1 | 1) => void
}) {
  const [open, setOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setUploadError(null)
    try {
      const supabase = createClient()
      const ext = (file.name.split('.').pop() || 'jpg').toLowerCase()
      const path = `card-area/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error } = await supabase.storage
        .from('gallery-images')
        .upload(path, file, { cacheControl: '3600', upsert: false })
      if (error) {
        setUploadError(`업로드 실패: ${error.message}`)
        return
      }
      // 이전 업로드 이미지가 있으면 삭제
      if (card.bg_image && card.bg_image.includes('/gallery-images/')) {
        try {
          const oldPath = card.bg_image.split('/gallery-images/')[1]
          if (oldPath) await supabase.storage.from('gallery-images').remove([decodeURIComponent(oldPath)])
        } catch {}
      }
      const { data: urlData } = supabase.storage.from('gallery-images').getPublicUrl(path)
      onUpdate({ bg_image: urlData.publicUrl, bg_type: 'image' })
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : '업로드 실패')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const previewBg = card.bg_type === 'image' && card.bg_image
    ? `url("${card.bg_image}") center/cover, var(--bg-secondary)`
    : card.bg_type === 'gradient' && card.bg_gradient
      ? card.bg_gradient
      : (card.bg_color || 'var(--bg-secondary)')

  return (
    <div style={cardFormStyle}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ width: '44px', height: '44px', borderRadius: '8px', background: previewBg, flexShrink: 0, border: '1px solid var(--border)' }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {card.title || '(제목 없음)'}
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'flex', gap: '6px', marginTop: '2px' }}>
            <span>{card.bg_type}</span>
            <span>·</span>
            <span>{card.action_type}</span>
            <span>·</span>
            <span>{card.hover_anim || 'lift'}</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button onClick={() => onMove(-1)} disabled={index === 0} className="btn-secondary" style={{ padding: '4px 8px', fontSize: '11px' }}>↑</button>
          <button onClick={() => onMove(1)} disabled={index === total - 1} className="btn-secondary" style={{ padding: '4px 8px', fontSize: '11px' }}>↓</button>
          <button onClick={() => setOpen(!open)} className="btn-secondary" style={{ padding: '4px 10px', fontSize: '11px' }}>{open ? '접기' : '편집'}</button>
          <button onClick={onRemove} className="btn-danger" style={{ padding: '4px 10px', fontSize: '11px' }}>삭제</button>
        </div>
      </div>

      {open && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', borderTop: '1px solid var(--border)', paddingTop: '10px' }}>
          {/* 텍스트 */}
          <div>
            <label style={miniLabelStyle}>제목</label>
            <input className="input" value={card.title ?? ''} onChange={e => onUpdate({ title: e.target.value })} />
          </div>
          <div>
            <label style={miniLabelStyle}>부제목 (작은 텍스트)</label>
            <input className="input" value={card.subtitle ?? ''} onChange={e => onUpdate({ subtitle: e.target.value })} />
          </div>
          <div>
            <label style={miniLabelStyle}>설명 (카드 본문)</label>
            <textarea className="input" rows={2} value={card.description ?? ''} onChange={e => onUpdate({ description: e.target.value })} />
          </div>
          <div>
            <label style={miniLabelStyle}>배지 (우상단 라벨)</label>
            <input className="input" value={card.badge ?? ''} onChange={e => onUpdate({ badge: e.target.value })} placeholder="예: NEW, HOT" />
          </div>

          {/* 배경 */}
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '10px' }}>
            <label style={miniLabelStyle}>배경 종류</label>
            <select className="input" value={card.bg_type} onChange={e => onUpdate({ bg_type: e.target.value as BackgroundType })}>
              <option value="color">단색</option>
              <option value="gradient">그라디언트</option>
              <option value="image">이미지</option>
            </select>

            {card.bg_type === 'color' && (
              <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input type="color" value={card.bg_color || '#3b82f6'} onChange={e => onUpdate({ bg_color: e.target.value })} style={{ width: '40px', height: '32px', border: '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer' }} />
                <input className="input" value={card.bg_color ?? ''} onChange={e => onUpdate({ bg_color: e.target.value })} placeholder="#3b82f6" />
              </div>
            )}

            {card.bg_type === 'gradient' && (
              <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                  {PRESET_GRADIENTS.map(g => (
                    <button
                      key={g.name}
                      onClick={() => onUpdate({ bg_gradient: g.value })}
                      style={{
                        height: '32px', borderRadius: '6px',
                        background: g.value,
                        border: card.bg_gradient === g.value ? '2px solid var(--accent)' : '1px solid var(--border)',
                        cursor: 'pointer',
                        fontSize: '0',
                      }}
                      title={g.name}
                    />
                  ))}
                </div>
                <input className="input" value={card.bg_gradient ?? ''} onChange={e => onUpdate({ bg_gradient: e.target.value })} placeholder="linear-gradient(135deg, #... 0%, #... 100%)" />
              </div>
            )}

            {card.bg_type === 'image' && (
              <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {/* 업로드 + URL 입력 */}
                <div style={{ display: 'flex', gap: '6px' }}>
                  <input
                    className="input"
                    value={card.bg_image ?? ''}
                    onChange={e => onUpdate({ bg_image: e.target.value })}
                    placeholder="이미지 URL (또는 업로드)"
                    style={{ flex: 1 }}
                  />
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    style={{ padding: '6px 12px', fontSize: '12px', whiteSpace: 'nowrap' }}
                  >
                    {uploading ? '업로드중...' : '📷 업로드'}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={handleImageUpload}
                    style={{ display: 'none' }}
                  />
                </div>

                {uploadError && (
                  <div style={{ fontSize: '11px', color: 'var(--danger, #ef4444)', padding: '4px 8px', background: 'rgba(239,68,68,0.08)', borderRadius: '6px' }}>
                    {uploadError}
                  </div>
                )}

                {/* 미리보기 */}
                {card.bg_image && (
                  <div style={{
                    height: '90px', borderRadius: '8px',
                    background: `url("${card.bg_image}") center/cover, var(--bg-secondary)`,
                    border: '1px solid var(--border)',
                  }} />
                )}

                <div>
                  <label style={miniLabelStyle}>오버레이 농도 ({card.overlay_opacity ?? 0.3})</label>
                  <input type="range" min={0} max={1} step={0.05} value={card.overlay_opacity ?? 0.3} onChange={e => onUpdate({ overlay_opacity: Number(e.target.value) })} style={{ width: '100%' }} />
                </div>
              </div>
            )}

            <div style={{ marginTop: '8px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div>
                <label style={miniLabelStyle}>텍스트 색상</label>
                <input className="input" value={card.text_color ?? ''} onChange={e => onUpdate({ text_color: e.target.value })} placeholder="비워두면 자동" />
              </div>
              <div>
                <label style={miniLabelStyle}>텍스트 정렬</label>
                <select className="input" value={card.align ?? 'bottom'} onChange={e => onUpdate({ align: e.target.value as 'top' | 'center' | 'bottom' })}>
                  <option value="top">상단</option>
                  <option value="center">중앙</option>
                  <option value="bottom">하단</option>
                </select>
              </div>
            </div>
          </div>

          {/* 비율 + 호버 */}
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '10px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div>
              <label style={miniLabelStyle}>화면 비율</label>
              <select className="input" value={card.aspect_ratio ?? '4/3'} onChange={e => onUpdate({ aspect_ratio: e.target.value as AspectRatio })}>
                <option value="auto">자동</option>
                <option value="1/1">1:1 정사각형</option>
                <option value="4/3">4:3</option>
                <option value="3/4">3:4 (세로)</option>
                <option value="3/2">3:2</option>
                <option value="2/3">2:3 (세로)</option>
                <option value="16/9">16:9 (와이드)</option>
                <option value="9/16">9:16 (스토리)</option>
              </select>
            </div>
            <div>
              <label style={miniLabelStyle}>호버 애니메이션</label>
              <select className="input" value={card.hover_anim ?? 'lift'} onChange={e => onUpdate({ hover_anim: e.target.value as HoverAnim })}>
                <option value="none">없음</option>
                <option value="lift">떠오르기</option>
                <option value="zoom">확대</option>
                <option value="tilt">기울이기</option>
                <option value="shine">반짝임</option>
                <option value="glow">발광</option>
              </select>
            </div>
            <div>
              <label style={miniLabelStyle}>그리드 폭 (1~)</label>
              <input className="input" type="number" min={1} max={8} value={card.span ?? 1} onChange={e => onUpdate({ span: Number(e.target.value) })} />
            </div>
          </div>

          {/* 카드 내부 패딩 */}
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '10px' }}>
            <label style={miniLabelStyle}>카드 내부 패딩 (px)</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
              <div>
                <label style={miniLabelStyle}>상</label>
                <input className="input" type="number" min={0} max={120} value={card.padding_top ?? 20} onChange={e => onUpdate({ padding_top: Number(e.target.value) })} />
              </div>
              <div>
                <label style={miniLabelStyle}>우</label>
                <input className="input" type="number" min={0} max={120} value={card.padding_right ?? 20} onChange={e => onUpdate({ padding_right: Number(e.target.value) })} />
              </div>
              <div>
                <label style={miniLabelStyle}>하</label>
                <input className="input" type="number" min={0} max={120} value={card.padding_bottom ?? 20} onChange={e => onUpdate({ padding_bottom: Number(e.target.value) })} />
              </div>
              <div>
                <label style={miniLabelStyle}>좌</label>
                <input className="input" type="number" min={0} max={120} value={card.padding_left ?? 20} onChange={e => onUpdate({ padding_left: Number(e.target.value) })} />
              </div>
            </div>
            <div style={{ marginTop: '6px', display: 'flex', gap: '6px' }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => onUpdate({ padding_top: 20, padding_right: 20, padding_bottom: 20, padding_left: 20 })}
                style={{ fontSize: '10px', padding: '4px 8px', flex: 1 }}
              >
                기본(20)
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  const v = card.padding_top ?? 20
                  onUpdate({ padding_top: v, padding_right: v, padding_bottom: v, padding_left: v })
                }}
                style={{ fontSize: '10px', padding: '4px 8px', flex: 1 }}
              >
                상하좌우 동일
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => onUpdate({ padding_top: 0, padding_right: 0, padding_bottom: 0, padding_left: 0 })}
                style={{ fontSize: '10px', padding: '4px 8px', flex: 1 }}
              >
                여백 없음
              </button>
            </div>
          </div>

          {/* 액션 */}
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '10px' }}>
            <label style={miniLabelStyle}>클릭 시 동작</label>
            <select className="input" value={card.action_type} onChange={e => onUpdate({ action_type: e.target.value as ActionType })}>
              <option value="none">동작 없음 (버튼 숨김)</option>
              <option value="link">링크 이동</option>
              <option value="sheet">바텀시트로 상세 보기</option>
              <option value="modal">모달로 상세 보기</option>
              <option value="popup">외부 팝업 트리거 (ID 바인딩)</option>
            </select>

            {card.action_type !== 'none' && (
              <div style={{ marginTop: '8px' }}>
                <label style={miniLabelStyle}>버튼 텍스트 (선택)</label>
                <input
                  className="input"
                  value={card.action_label ?? ''}
                  onChange={e => onUpdate({ action_label: e.target.value })}
                  placeholder={
                    card.action_type === 'link' ? '예: 바로가기'
                    : card.action_type === 'popup' ? '예: 열기'
                    : '예: 자세히 보기'
                  }
                />
              </div>
            )}

            {card.action_type === 'link' && (
              <div style={{ marginTop: '8px', display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '8px' }}>
                <div>
                  <label style={miniLabelStyle}>URL</label>
                  <input className="input" value={card.action_url ?? ''} onChange={e => onUpdate({ action_url: e.target.value })} placeholder="https://... 또는 /page-slug" />
                </div>
                <div>
                  <label style={miniLabelStyle}>열기 방식</label>
                  <select className="input" value={card.action_target ?? '_self'} onChange={e => onUpdate({ action_target: e.target.value as '_self' | '_blank' })}>
                    <option value="_self">현재 창</option>
                    <option value="_blank">새 창</option>
                  </select>
                </div>
              </div>
            )}

            {(card.action_type === 'sheet' || card.action_type === 'modal') && (
              <div style={{ marginTop: '8px' }}>
                <label style={miniLabelStyle}>상세 내용</label>
                <textarea
                  className="input" rows={4}
                  value={card.sheet_content ?? ''}
                  onChange={e => onUpdate({ sheet_content: e.target.value })}
                  placeholder="바텀시트/모달에 표시할 상세 내용 (줄바꿈 가능)"
                />
                <div style={{ marginTop: '6px' }}>
                  <label style={miniLabelStyle}>(선택) 하단 버튼 링크</label>
                  <input className="input" value={card.action_url ?? ''} onChange={e => onUpdate({ action_url: e.target.value })} placeholder="https://... (입력 시 '자세히 보러가기' 버튼 표시)" />
                </div>
              </div>
            )}
          </div>

          {/* 팝업 트리거 ID — 버튼 영역에만 부착 (버튼 클릭 시에만 이벤트 발생) */}
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '10px' }}>
            <label style={miniLabelStyle}>팝업 트리거 ID (선택)</label>
            <input
              className="input"
              value={card.trigger_id ?? ''}
              onChange={e => onUpdate({ trigger_id: e.target.value.trim() })}
              placeholder="예: card-promo-1 (영문/숫자/하이픈)"
              disabled={card.action_type === 'none'}
            />
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px', lineHeight: 1.5 }}>
              값을 입력하면 <strong>버튼</strong>에 <code style={{ background: 'var(--bg-primary)', padding: '1px 4px', borderRadius: '3px' }}>data-trigger-id=&quot;값&quot;</code> 속성이 부착됩니다.<br />
              페이지 팝업 설정에서 <code style={{ background: 'var(--bg-primary)', padding: '1px 4px', borderRadius: '3px' }}>{`[data-trigger-id="값"]`}</code> 셀렉터로 <strong>버튼 클릭 시에만</strong> 이벤트가 발생합니다.
              {card.action_type === 'none' && <><br /><span style={{ color: 'var(--danger, #ef4444)' }}>※ 액션이 &quot;동작 없음&quot;이면 버튼이 표시되지 않아 트리거 ID도 사용되지 않습니다.</span></>}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
