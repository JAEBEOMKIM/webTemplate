'use client'

import { useState, useRef, useEffect } from 'react'
import type { ComponentProps, ConfigFormProps } from '../types'
import { loadFont } from '@/lib/fonts/font-registry'
import { FontFamilySelect } from '../shared/FontFamilySelect'

// ── Types ────────────────────────────────────────────────────
interface CardItem {
  id: string
  variant?: 'guide' | 'announcement' | 'feature'
  tag?: string
  title: string
  description?: string
  meta?: string          // e.g. "Released 2 hours ago"
  bullets?: string[]     // bullet list (feature variant)
  linkUrl?: string
  linkLabel?: string
  buttonLabel?: string   // CTA button (announcement variant)
  buttonUrl?: string
  badge?: string         // pill badge (feature variant)
  color?: string
}

interface CardBannerConfig {
  heading?: string
  subtitle?: string
  layout?: 'stack' | 'grid' | 'carousel'
  columns?: number
  gap?: number
  fontFamily?: string
  paddingLeft?: number
  paddingRight?: number
  cards: CardItem[]
}

// ── MD3-inspired palette ─────────────────────────────────────
const PALETTE = [
  { id: 'primary',  accent: '#455e8f', accentDim: '#385283', surface: '#f1f4f6', container: '#d8e2ff', onContainer: '#385182', text: '#2b3437' },
  { id: 'emerald',  accent: '#3d7a5f', accentDim: '#2d6a4f', surface: '#ecfdf5', container: '#d1fae5', onContainer: '#064e3b', text: '#2b3437' },
  { id: 'amber',    accent: '#92400e', accentDim: '#78350f', surface: '#fffbeb', container: '#fef3c7', onContainer: '#78350f', text: '#2b3437' },
  { id: 'rose',     accent: '#9f1239', accentDim: '#881337', surface: '#fff1f2', container: '#ffe4e6', onContainer: '#881337', text: '#2b3437' },
  { id: 'tertiary', accent: '#5d5d78', accentDim: '#51516c', surface: '#f5f3ff', container: '#d9d7f8', onContainer: '#4a4a65', text: '#2b3437' },
  { id: 'sky',      accent: '#0369a1', accentDim: '#075985', surface: '#f0f9ff', container: '#bae6fd', onContainer: '#075985', text: '#2b3437' },
  { id: 'secondary',accent: '#546073', accentDim: '#485466', surface: '#f1f4f6', container: '#d7e3fa', onContainer: '#475265', text: '#2b3437' },
  { id: 'slate',    accent: '#475569', accentDim: '#334155', surface: '#f8fafc', container: '#e2e8f0', onContainer: '#1e293b', text: '#2b3437' },
]

function getPal(id?: string) {
  return PALETTE.find(c => c.id === id) ?? PALETTE[0]
}

// ── Display Component ────────────────────────────────────────
export function TextCardBannerComponent({ config }: ComponentProps) {
  const c = config as unknown as CardBannerConfig
  const cards = c.cards || []
  const layout = c.layout || 'stack'
  const columns = c.columns || 2
  const gap = c.gap ?? 24

  const fontFamily = c.fontFamily || undefined
  const pl = c.paddingLeft ?? 28
  const pr = c.paddingRight ?? 28

  const carouselRef = useRef<HTMLDivElement>(null)
  const [carouselIdx, setCarouselIdx] = useState(0)

  useEffect(() => { if (fontFamily) loadFont(fontFamily) }, [fontFamily])
  useEffect(() => { setCarouselIdx(0) }, [cards.length])

  if (cards.length === 0) {
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <div style={{ fontSize: '14px', fontWeight: 500, marginBottom: '6px' }}>No cards yet</div>
        <p style={{ fontSize: '12px', opacity: 0.7 }}>Add cards from the admin panel</p>
      </div>
    )
  }

  // ─── Guide variant ───
  const renderGuide = (card: CardItem) => {
    const pal = getPal(card.color)
    return (
      <section
        key={card.id}
        className="tcb-card"
        style={{
          background: pal.surface,
          borderRadius: '16px',
          padding: '32px',
          display: 'flex', flexDirection: 'column', gap: '16px',
          boxShadow: '0 12px 40px rgba(43,52,55,0.06)',
          transition: 'box-shadow 0.3s ease, transform 0.3s ease',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {card.tag && (
            <span style={{
              fontSize: '10px', fontWeight: 700, letterSpacing: '0.12em',
              textTransform: 'uppercase', color: pal.accent,
            }}>
              {card.tag}
            </span>
          )}
          <h2 style={{
            fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)',
            letterSpacing: '-0.02em', lineHeight: 1.2, margin: 0,
          }}>
            {card.title}
          </h2>
        </div>
        {card.description && (
          <p style={{
            fontSize: '13.5px', lineHeight: 1.7, color: 'var(--text-secondary)',
            margin: 0, opacity: 0.9,
          }}>
            {card.description}
          </p>
        )}
        {card.linkLabel && (
          <a
            href={card.linkUrl || '#'}
            target={card.linkUrl ? '_blank' : undefined}
            rel="noopener noreferrer"
            className="tcb-link"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              fontSize: '13px', fontWeight: 600, color: pal.accent,
              textDecoration: 'none', marginTop: '4px',
            }}
          >
            {card.linkLabel}
            <span className="tcb-arrow" style={{ fontSize: '16px', transition: 'transform 0.2s ease' }}>&rarr;</span>
          </a>
        )}
      </section>
    )
  }

  // ─── Announcement variant ───
  const renderAnnouncement = (card: CardItem) => {
    const pal = getPal(card.color)
    return (
      <section
        key={card.id}
        className="tcb-card"
        style={{
          background: 'var(--bg-card, #ffffff)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          padding: '32px',
          display: 'flex', flexDirection: 'column', gap: '20px',
          transition: 'box-shadow 0.3s ease, transform 0.3s ease',
        }}
      >
        {/* Header: Title + Meta */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <h2 style={{
            fontSize: '19px', fontWeight: 800, color: 'var(--text-primary)',
            letterSpacing: '-0.02em', lineHeight: 1.25, margin: 0,
          }}>
            {card.title}
          </h2>
          {card.meta && (
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', opacity: 0.7 }}>
              {card.meta}
            </span>
          )}
        </div>

        {/* Tag badge */}
        {card.tag && (
          <div style={{
            display: 'inline-flex', alignSelf: 'flex-start', alignItems: 'center',
            gap: '6px', padding: '4px 12px',
            background: `${pal.container}66`, borderRadius: '8px',
          }}>
            <span style={{ fontSize: '10px', fontWeight: 700, color: pal.onContainer, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              {card.tag}
            </span>
          </div>
        )}

        {card.description && (
          <p style={{
            fontSize: '13.5px', lineHeight: 1.7, color: 'var(--text-secondary)',
            margin: 0,
          }}>
            {card.description}
          </p>
        )}

        {/* CTA Button */}
        {card.buttonLabel && (
          <a
            href={card.buttonUrl || '#'}
            target={card.buttonUrl ? '_blank' : undefined}
            rel="noopener noreferrer"
            style={{
              display: 'flex', justifyContent: 'center', alignItems: 'center',
              width: '100%', padding: '13px 0',
              background: `linear-gradient(135deg, ${pal.accent}, ${pal.accentDim})`,
              color: '#ffffff', fontSize: '13px', fontWeight: 600,
              borderRadius: '12px', textDecoration: 'none',
              transition: 'opacity 0.2s ease, transform 0.15s ease',
              cursor: 'pointer',
            }}
            className="tcb-btn"
          >
            {card.buttonLabel}
          </a>
        )}

        {/* Fallback arrow link */}
        {!card.buttonLabel && card.linkLabel && (
          <a
            href={card.linkUrl || '#'}
            target={card.linkUrl ? '_blank' : undefined}
            rel="noopener noreferrer"
            className="tcb-link"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              fontSize: '13px', fontWeight: 600, color: pal.accent,
              textDecoration: 'none',
            }}
          >
            {card.linkLabel}
            <span className="tcb-arrow" style={{ fontSize: '16px', transition: 'transform 0.2s ease' }}>&rarr;</span>
          </a>
        )}
      </section>
    )
  }

  // ─── Feature variant ───
  const renderFeature = (card: CardItem) => {
    const pal = getPal(card.color)
    const bullets = card.bullets || []
    return (
      <section
        key={card.id}
        className="tcb-card"
        style={{
          position: 'relative',
          overflow: 'hidden',
          background: 'var(--bg-secondary)',
          borderRadius: '16px',
          transition: 'box-shadow 0.3s ease, transform 0.3s ease',
        }}
      >
        <div style={{ position: 'relative', zIndex: 1, padding: '32px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Large headline */}
          <h2 style={{
            fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)',
            letterSpacing: '-0.02em', lineHeight: 1.2, margin: 0,
            maxWidth: '75%',
          }}>
            {card.title}
          </h2>

          {/* Description + Bullets */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {card.description && (
              <p style={{ fontSize: '13.5px', lineHeight: 1.7, color: 'var(--text-secondary)', margin: 0 }}>
                {card.description}
              </p>
            )}

            {bullets.length > 0 && (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {bullets.map((b, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <div style={{
                      marginTop: '6px', width: '5px', height: '5px',
                      borderRadius: '50%', background: pal.accent, flexShrink: 0,
                    }} />
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500, lineHeight: 1.5 }}>
                      {b}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Badge pill */}
          {card.badge && (
            <div style={{ paddingTop: '4px' }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                padding: '6px 14px',
                background: 'var(--bg-card, rgba(255,255,255,0.6))',
                backdropFilter: 'blur(12px)',
                borderRadius: '9999px',
                border: '1px solid var(--border)',
                boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
              }}>
                <span style={{
                  width: '5px', height: '5px', borderRadius: '50%',
                  background: pal.accent,
                }} />
                <span style={{ fontSize: '10px', fontWeight: 700, color: pal.onContainer, letterSpacing: '0.06em' }}>
                  {card.badge}
                </span>
              </span>
            </div>
          )}

          {/* Optional link */}
          {card.linkLabel && (
            <a
              href={card.linkUrl || '#'}
              target={card.linkUrl ? '_blank' : undefined}
              rel="noopener noreferrer"
              className="tcb-link"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                fontSize: '13px', fontWeight: 600, color: pal.accent,
                textDecoration: 'none',
              }}
            >
              {card.linkLabel}
              <span className="tcb-arrow" style={{ fontSize: '16px', transition: 'transform 0.2s ease' }}>&rarr;</span>
            </a>
          )}
        </div>
      </section>
    )
  }

  const renderCard = (card: CardItem) => {
    switch (card.variant) {
      case 'announcement': return renderAnnouncement(card)
      case 'feature':      return renderFeature(card)
      case 'guide':
      default:             return renderGuide(card)
    }
  }

  return (
    <div className="tcb-root" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', background: 'var(--bg-primary)', fontFamily }}>
      {/* Header */}
      {(c.heading || c.subtitle) && (
        <div style={{ padding: `28px ${pr}px 0 ${pl}px`, flexShrink: 0 }}>
          {c.heading && (
            <h1 style={{
              fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)',
              letterSpacing: '-0.03em', lineHeight: 1.1, margin: 0,
              marginBottom: c.subtitle ? '8px' : '0',
            }}>
              {c.heading}
            </h1>
          )}
          {c.subtitle && (
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
              {c.subtitle}
            </p>
          )}
        </div>
      )}

      {/* Cards area */}
      <div style={{ flex: 1, overflow: layout === 'carousel' ? 'hidden' : 'auto', padding: `20px ${pr}px 28px ${pl}px` }}>
        {layout === 'stack' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: `${gap}px` }}>
            {cards.map(card => renderCard(card))}
          </div>
        )}

        {layout === 'grid' && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${columns}, 1fr)`,
            gap: `${gap}px`,
            alignItems: 'start',
          }}>
            {cards.map(card => renderCard(card))}
          </div>
        )}

        {layout === 'carousel' && (
          <div style={{ position: 'relative' }}>
            <div
              ref={carouselRef}
              className="tcb-carousel"
              style={{
                display: 'flex', gap: `${gap}px`,
                overflowX: 'auto', scrollSnapType: 'x mandatory',
                scrollBehavior: 'smooth', paddingBottom: '8px',
              }}
            >
              {cards.map(card => (
                <div key={card.id} style={{ scrollSnapAlign: 'start', minWidth: '300px', flex: '0 0 85%' }}>
                  {renderCard(card)}
                </div>
              ))}
            </div>
            {cards.length > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginTop: '14px' }}>
                {cards.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setCarouselIdx(idx)
                      carouselRef.current?.children[idx]?.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' })
                    }}
                    style={{
                      width: carouselIdx === idx ? '20px' : '6px',
                      height: '6px', borderRadius: '3px',
                      background: carouselIdx === idx ? 'var(--accent)' : 'var(--border)',
                      border: 'none', cursor: 'pointer', padding: 0,
                      transition: 'all 0.3s ease',
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        .tcb-card:hover {
          transform: translateY(-1px);
          box-shadow: 0 16px 48px rgba(43,52,55,0.09) !important;
        }
        .tcb-link:hover .tcb-arrow { transform: translateX(4px); }
        .tcb-btn:hover { opacity: 0.92; }
        .tcb-btn:active { transform: scale(0.97); }
        .tcb-carousel::-webkit-scrollbar { height: 3px; }
        .tcb-carousel::-webkit-scrollbar-track { background: transparent; }
        .tcb-carousel::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }
        .tcb-root ::-webkit-scrollbar { width: 4px; }
        .tcb-root ::-webkit-scrollbar-track { background: transparent; }
        .tcb-root ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }
      `}</style>
    </div>
  )
}

// ── Config Form ──────────────────────────────────────────────
export function TextCardBannerConfigForm({ config, onChange }: ConfigFormProps) {
  const c = config as unknown as CardBannerConfig
  const cards = c.cards || []

  const set = (patch: Partial<CardBannerConfig>) => onChange({ ...config, ...patch } as Record<string, unknown>)

  const labelStyle: React.CSSProperties = {
    fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)',
    textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px', display: 'block',
  }
  const miniLabel: React.CSSProperties = {
    fontSize: '10px', color: 'var(--text-muted)', marginBottom: '3px', display: 'block',
  }
  const cardFormStyle: React.CSSProperties = {
    padding: '12px', borderRadius: '10px', background: 'var(--bg-secondary)',
    border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '8px',
  }

  const addCard = (variant: CardItem['variant'] = 'guide') => {
    const id = `card-${Date.now()}`
    const base: CardItem = {
      id, variant, tag: '', title: 'New Card', description: '',
      color: PALETTE[cards.length % PALETTE.length].id,
    }
    if (variant === 'guide') {
      base.linkLabel = 'Read more'
    } else if (variant === 'announcement') {
      base.buttonLabel = 'Learn More'
    } else if (variant === 'feature') {
      base.bullets = ['Feature point one', 'Feature point two']
      base.badge = 'V1.0 RELEASE'
    }
    set({ cards: [...cards, base] })
  }

  const updateCard = (id: string, patch: Partial<CardItem>) => {
    set({ cards: cards.map(c => c.id === id ? { ...c, ...patch } : c) })
  }

  const removeCard = (id: string) => {
    set({ cards: cards.filter(c => c.id !== id) })
  }

  const moveCard = (idx: number, dir: -1 | 1) => {
    const arr = [...cards]
    const target = idx + dir
    if (target < 0 || target >= arr.length) return
    ;[arr[idx], arr[target]] = [arr[target], arr[idx]]
    set({ cards: arr })
  }

  const updateBullet = (cardId: string, bulletIdx: number, value: string) => {
    const card = cards.find(c => c.id === cardId)
    if (!card) return
    const bullets = [...(card.bullets || [])]
    bullets[bulletIdx] = value
    updateCard(cardId, { bullets })
  }

  const addBullet = (cardId: string) => {
    const card = cards.find(c => c.id === cardId)
    if (!card) return
    updateCard(cardId, { bullets: [...(card.bullets || []), ''] })
  }

  const removeBullet = (cardId: string, bulletIdx: number) => {
    const card = cards.find(c => c.id === cardId)
    if (!card) return
    updateCard(cardId, { bullets: (card.bullets || []).filter((_, i) => i !== bulletIdx) })
  }

  const VARIANT_LABELS: Record<string, string> = {
    guide: 'Guide',
    announcement: 'Announce',
    feature: 'Feature',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Heading */}
      <div>
        <label style={labelStyle}>Heading</label>
        <input className="input" value={c.heading || ''} placeholder="Section title"
          onChange={e => set({ heading: e.target.value })} style={{ fontSize: '13px' }} />
      </div>
      <div>
        <label style={labelStyle}>Subtitle</label>
        <input className="input" value={c.subtitle || ''} placeholder="Optional subtitle"
          onChange={e => set({ subtitle: e.target.value })} style={{ fontSize: '13px' }} />
      </div>

      {/* Layout */}
      <div>
        <label style={labelStyle}>Layout</label>
        <div style={{ display: 'flex', gap: '6px' }}>
          {(['stack', 'grid', 'carousel'] as const).map(l => (
            <button key={l} onClick={() => set({ layout: l })}
              style={{
                flex: 1, padding: '6px', fontSize: '12px', fontWeight: 600,
                borderRadius: '8px', border: '1px solid var(--border)', cursor: 'pointer',
                background: (c.layout || 'stack') === l ? 'var(--accent)' : 'var(--bg-secondary)',
                color: (c.layout || 'stack') === l ? 'white' : 'var(--text-primary)',
                transition: 'all 0.15s',
              }}>
              {l === 'stack' ? 'Stack' : l === 'grid' ? 'Grid' : 'Carousel'}
            </button>
          ))}
        </div>
      </div>

      {/* Columns (grid only) */}
      {(c.layout) === 'grid' && (
        <div>
          <label style={labelStyle}>Columns</label>
          <div style={{ display: 'flex', gap: '6px' }}>
            {[1, 2, 3].map(n => (
              <button key={n} onClick={() => set({ columns: n })}
                style={{
                  flex: 1, padding: '6px', fontSize: '12px', fontWeight: 600,
                  borderRadius: '8px', border: '1px solid var(--border)', cursor: 'pointer',
                  background: (c.columns || 2) === n ? 'var(--accent)' : 'var(--bg-secondary)',
                  color: (c.columns || 2) === n ? 'white' : 'var(--text-primary)',
                }}>
                {n}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Gap */}
      <div>
        <label style={labelStyle}>Gap (px)</label>
        <input type="number" className="input" value={c.gap ?? 24} min={8} max={48}
          onChange={e => set({ gap: parseInt(e.target.value) || 24 })} style={{ fontSize: '12px' }} />
      </div>

      {/* Font Family */}
      <div>
        <label style={labelStyle}>글꼴</label>
        <FontFamilySelect
          value={c.fontFamily || 'inherit'}
          onChange={v => set({ fontFamily: v === 'inherit' ? undefined : v })}
        />
      </div>

      {/* Horizontal Padding */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Left Padding (px)</label>
          <input type="number" className="input" value={c.paddingLeft ?? 28} min={0} max={100}
            onChange={e => set({ paddingLeft: parseInt(e.target.value) ?? 28 })} style={{ fontSize: '12px' }} />
        </div>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Right Padding (px)</label>
          <input type="number" className="input" value={c.paddingRight ?? 28} min={0} max={100}
            onChange={e => set({ paddingRight: parseInt(e.target.value) ?? 28 })} style={{ fontSize: '12px' }} />
        </div>
      </div>

      {/* Cards */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <label style={{ ...labelStyle, marginBottom: 0 }}>Cards ({cards.length})</label>
        </div>

        {/* Add card buttons by variant */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
          {(['guide', 'announcement', 'feature'] as const).map(v => (
            <button key={v} onClick={() => addCard(v)}
              style={{
                flex: 1, padding: '6px 4px', fontSize: '10px', fontWeight: 600,
                borderRadius: '8px', border: '1px solid var(--border)', cursor: 'pointer',
                background: 'var(--bg-secondary)', color: 'var(--text-primary)',
                transition: 'all 0.15s',
              }}>
              + {VARIANT_LABELS[v]}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {cards.map((card, idx) => {
            const variant = card.variant || 'guide'
            return (
              <div key={card.id} style={cardFormStyle}>
                {/* Header: Variant badge + Move/Delete */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button onClick={() => moveCard(idx, -1)} disabled={idx === 0}
                        style={{ padding: '2px 6px', fontSize: '10px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '4px', cursor: 'pointer', opacity: idx === 0 ? 0.3 : 1 }}>&#9650;</button>
                      <button onClick={() => moveCard(idx, 1)} disabled={idx === cards.length - 1}
                        style={{ padding: '2px 6px', fontSize: '10px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '4px', cursor: 'pointer', opacity: idx === cards.length - 1 ? 0.3 : 1 }}>&#9660;</button>
                    </div>
                    <span style={{
                      fontSize: '9px', fontWeight: 700, color: 'var(--accent)',
                      background: 'var(--bg-card)', padding: '2px 8px',
                      borderRadius: '6px', border: '1px solid var(--border)',
                      textTransform: 'uppercase', letterSpacing: '0.06em',
                    }}>
                      {VARIANT_LABELS[variant]}
                    </span>
                  </div>
                  <button onClick={() => removeCard(card.id)}
                    style={{ padding: '2px 8px', fontSize: '11px', color: 'var(--danger)', background: 'none', border: '1px solid var(--border)', borderRadius: '4px', cursor: 'pointer' }}>
                    삭제
                  </button>
                </div>

                {/* Variant selector */}
                <div>
                  <label style={miniLabel}>Variant</label>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {(['guide', 'announcement', 'feature'] as const).map(v => (
                      <button key={v} onClick={() => updateCard(card.id, { variant: v })}
                        style={{
                          flex: 1, padding: '4px', fontSize: '10px', fontWeight: 600,
                          borderRadius: '6px', border: '1px solid var(--border)', cursor: 'pointer',
                          background: variant === v ? 'var(--accent)' : 'var(--bg-card)',
                          color: variant === v ? 'white' : 'var(--text-primary)',
                        }}>
                        {VARIANT_LABELS[v]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tag */}
                <div>
                  <label style={miniLabel}>Tag</label>
                  <input className="input" value={card.tag || ''} placeholder="e.g. NEW GUIDE"
                    onChange={e => updateCard(card.id, { tag: e.target.value })} style={{ fontSize: '12px' }} />
                </div>

                {/* Title */}
                <div>
                  <label style={miniLabel}>Title</label>
                  <input className="input" value={card.title}
                    onChange={e => updateCard(card.id, { title: e.target.value })} style={{ fontSize: '12px' }} />
                </div>

                {/* Meta (announcement) */}
                {variant === 'announcement' && (
                  <div>
                    <label style={miniLabel}>Meta text</label>
                    <input className="input" value={card.meta || ''} placeholder="e.g. Released 2 hours ago"
                      onChange={e => updateCard(card.id, { meta: e.target.value })} style={{ fontSize: '12px' }} />
                  </div>
                )}

                {/* Description */}
                <div>
                  <label style={miniLabel}>Description</label>
                  <textarea className="input" value={card.description || ''} rows={2}
                    onChange={e => updateCard(card.id, { description: e.target.value })} style={{ fontSize: '12px', resize: 'vertical' }} />
                </div>

                {/* Bullets (feature) */}
                {variant === 'feature' && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <label style={miniLabel}>Bullet points</label>
                      <button onClick={() => addBullet(card.id)}
                        style={{ padding: '1px 8px', fontSize: '10px', fontWeight: 600, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '4px', cursor: 'pointer' }}>+</button>
                    </div>
                    {(card.bullets || []).map((b, bi) => (
                      <div key={bi} style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
                        <input className="input" value={b} style={{ fontSize: '11px', flex: 1 }}
                          onChange={e => updateBullet(card.id, bi, e.target.value)} />
                        <button onClick={() => removeBullet(card.id, bi)}
                          style={{ padding: '2px 6px', fontSize: '10px', color: 'var(--danger)', background: 'none', border: '1px solid var(--border)', borderRadius: '4px', cursor: 'pointer' }}>×</button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Badge (feature) */}
                {variant === 'feature' && (
                  <div>
                    <label style={miniLabel}>Badge</label>
                    <input className="input" value={card.badge || ''} placeholder="e.g. V2.4 STABLE RELEASE"
                      onChange={e => updateCard(card.id, { badge: e.target.value })} style={{ fontSize: '12px' }} />
                  </div>
                )}

                {/* Link (guide, feature) */}
                {(variant === 'guide' || variant === 'feature') && (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <div style={{ flex: 2 }}>
                      <label style={miniLabel}>Link URL</label>
                      <input className="input" value={card.linkUrl || ''} placeholder="https://..."
                        onChange={e => updateCard(card.id, { linkUrl: e.target.value })} style={{ fontSize: '12px' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={miniLabel}>Link Label</label>
                      <input className="input" value={card.linkLabel || ''} placeholder="Read more"
                        onChange={e => updateCard(card.id, { linkLabel: e.target.value })} style={{ fontSize: '12px' }} />
                    </div>
                  </div>
                )}

                {/* Button (announcement) */}
                {variant === 'announcement' && (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <div style={{ flex: 2 }}>
                      <label style={miniLabel}>Button URL</label>
                      <input className="input" value={card.buttonUrl || ''} placeholder="https://..."
                        onChange={e => updateCard(card.id, { buttonUrl: e.target.value })} style={{ fontSize: '12px' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={miniLabel}>Button Label</label>
                      <input className="input" value={card.buttonLabel || ''} placeholder="Confirm"
                        onChange={e => updateCard(card.id, { buttonLabel: e.target.value })} style={{ fontSize: '12px' }} />
                    </div>
                  </div>
                )}

                {/* Color */}
                <div>
                  <label style={miniLabel}>Color</label>
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                    {PALETTE.map(p => (
                      <button key={p.id} onClick={() => updateCard(card.id, { color: p.id })}
                        style={{
                          width: '22px', height: '22px', borderRadius: '6px',
                          background: p.accent,
                          border: card.color === p.id ? '2px solid var(--text-primary)' : '2px solid transparent',
                          cursor: 'pointer', padding: 0, transition: 'border 0.15s',
                        }} />
                    ))}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
