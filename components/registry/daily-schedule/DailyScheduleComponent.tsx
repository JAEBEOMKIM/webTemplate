'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import type { ComponentProps, ConfigFormProps } from '../types'

// ── 타입 ─────────────────────────────────────────────────────
interface ScheduleEvent {
  id: string
  time: string      // "HH:MM"
  endTime?: string   // "HH:MM"
  title: string
  description?: string
  color?: string
}

// ── 상수 ─────────────────────────────────────────────────────
const COLORS = [
  { id: 'blue',   value: '#6366f1', light: '#eef2ff', text: '#4338ca' },
  { id: 'green',  value: '#22c55e', light: '#f0fdf4', text: '#15803d' },
  { id: 'orange', value: '#f97316', light: '#fff7ed', text: '#c2410c' },
  { id: 'purple', value: '#a855f7', light: '#faf5ff', text: '#7e22ce' },
  { id: 'rose',   value: '#f43f5e', light: '#fff1f2', text: '#be123c' },
  { id: 'teal',   value: '#14b8a6', light: '#f0fdfa', text: '#0f766e' },
  { id: 'amber',  value: '#f59e0b', light: '#fffbeb', text: '#b45309' },
  { id: 'slate',  value: '#64748b', light: '#f8fafc', text: '#334155' },
]

function getColor(id?: string) {
  return COLORS.find(c => c.id === id) ?? COLORS[0]
}

function parseMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return (h || 0) * 60 + (m || 0)
}

function formatTime(time: string): string {
  const [h, m] = time.split(':').map(Number)
  const period = (h || 0) < 12 ? 'AM' : 'PM'
  const h12 = (h || 0) % 12 || 12
  return `${h12}:${String(m || 0).padStart(2, '0')} ${period}`
}

function formatTimeShort(time: string): string {
  const [h, m] = time.split(':').map(Number)
  const h12 = (h || 0) % 12 || 12
  return `${h12}:${String(m || 0).padStart(2, '0')}`
}

function getTimePeriod(time: string): string {
  const [h] = time.split(':').map(Number)
  if ((h || 0) < 12) return 'Morning'
  if ((h || 0) < 17) return 'Afternoon'
  return 'Evening'
}

function getAmPm(time: string): string {
  const [h] = time.split(':').map(Number)
  return (h || 0) < 12 ? 'AM' : 'PM'
}

function getNowMinutes(): number {
  const d = new Date()
  return d.getHours() * 60 + d.getMinutes()
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

// ── Display Component ────────────────────────────────────────
export function DailyScheduleComponent({ config }: ComponentProps) {
  const title = (config.title as string) || ''
  const events = (config.events as ScheduleEvent[]) || []
  const showCurrentTime = config.show_current_time !== false
  const autoScroll = config.auto_scroll !== false
  const compactMode = config.compact_mode === true

  const containerRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(-1)
  const [hoveredIndex, setHoveredIndex] = useState(-1)
  const [nowMinutes, setNowMinutes] = useState(getNowMinutes)
  const itemRefs = useRef<Map<number, HTMLDivElement>>(new Map())
  const hasAutoScrolled = useRef(false)

  const sorted = useMemo(() =>
    [...events].sort((a, b) => parseMinutes(a.time) - parseMinutes(b.time)),
    [events]
  )

  // 현재 시간 업데이트
  useEffect(() => {
    if (!showCurrentTime) return
    const id = setInterval(() => setNowMinutes(getNowMinutes()), 60_000)
    return () => clearInterval(id)
  }, [showCurrentTime])

  // 현재/다음 이벤트 계산
  const currentEventIndex = useMemo(() => {
    if (sorted.length === 0) return -1
    for (let i = sorted.length - 1; i >= 0; i--) {
      const end = sorted[i].endTime ? parseMinutes(sorted[i].endTime!) : parseMinutes(sorted[i].time) + 60
      if (nowMinutes >= parseMinutes(sorted[i].time) && nowMinutes < end) return i
    }
    for (let i = 0; i < sorted.length; i++) {
      if (parseMinutes(sorted[i].time) > nowMinutes) return i
    }
    return sorted.length - 1
  }, [sorted, nowMinutes])

  // 자동 스크롤
  useEffect(() => {
    if (!autoScroll || hasAutoScrolled.current || currentEventIndex < 0) return
    hasAutoScrolled.current = true
    const el = itemRefs.current.get(currentEventIndex)
    if (el && containerRef.current) {
      requestAnimationFrame(() => {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      })
    }
  }, [autoScroll, currentEventIndex])

  // 스크롤 기반 활성화 (rAF 디바운스)
  const scrollRaf = useRef(0)
  const handleScroll = useCallback(() => {
    if (scrollRaf.current) return
    scrollRaf.current = requestAnimationFrame(() => {
      scrollRaf.current = 0
      const container = containerRef.current
      if (!container || sorted.length === 0) return

      // 스크롤이 끝에 도달했는지 확인 (2px 여유)
      const atBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 2
      if (atBottom) {
        setActiveIndex(sorted.length - 1)
        return
      }

      const containerRect = container.getBoundingClientRect()
      const centerY = containerRect.top + containerRect.height * 0.4

      let closest = 0
      let minDist = Infinity
      itemRefs.current.forEach((el, idx) => {
        const rect = el.getBoundingClientRect()
        const dist = Math.abs(rect.top + rect.height / 2 - centerY)
        if (dist < minDist) {
          minDist = dist
          closest = idx
        }
      })
      setActiveIndex(closest)
    })
  }, [sorted.length])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    el.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => {
      el.removeEventListener('scroll', handleScroll)
      if (scrollRaf.current) cancelAnimationFrame(scrollRaf.current)
    }
  }, [handleScroll])

  if (events.length === 0) {
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <div style={{ fontSize: '14px', fontWeight: 500, marginBottom: '6px' }}>No events scheduled</div>
        <p style={{ fontSize: '12px', opacity: 0.7 }}>Add events from the admin panel</p>
      </div>
    )
  }

  const today = new Date()
  const dayName = DAYS[today.getDay()]
  const monthName = MONTHS[today.getMonth()]
  const dateStr = `${monthName} ${today.getDate()}, ${today.getFullYear()}`

  // 시간대별 그룹 분리용: 이전 이벤트와 시간대가 다르면 구분선 표시
  const getPeriodLabel = (idx: number): string | null => {
    const period = getTimePeriod(sorted[idx].time)
    if (idx === 0) return period
    const prevPeriod = getTimePeriod(sorted[idx - 1].time)
    return period !== prevPeriod ? period : null
  }

  return (
    <div className="ds-root" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', background: 'var(--bg-primary)' }}>
      {/* Header */}
      <div style={{
        padding: compactMode ? '16px 20px' : '24px 28px',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            {title ? (
              <div style={{ fontSize: compactMode ? '18px' : '22px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.03em', lineHeight: 1.2, marginBottom: '4px' }}>
                {title}
              </div>
            ) : (
              <div style={{ fontSize: compactMode ? '18px' : '22px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.03em', lineHeight: 1.2, marginBottom: '4px' }}>
                {dayName}
              </div>
            )}
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 400 }}>
              {dateStr}
            </div>
          </div>
          <div style={{
            fontSize: '11px', fontWeight: 500, color: 'var(--text-muted)',
            background: 'var(--bg-secondary)', padding: '4px 10px',
            borderRadius: '20px', border: '1px solid var(--border)',
          }}>
            {sorted.length} event{sorted.length !== 1 ? 's' : ''}
          </div>
        </div>

        {showCurrentTime && (
          <div style={{
            marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px',
          }}>
            <span style={{
              width: '6px', height: '6px', borderRadius: '50%',
              background: 'var(--accent)',
              animation: 'dsPulse 2s ease-in-out infinite',
              flexShrink: 0,
            }} />
            <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--accent)', fontVariantNumeric: 'tabular-nums' }}>
              {formatTime(`${Math.floor(nowMinutes / 60)}:${nowMinutes % 60}`)}
            </span>
          </div>
        )}
      </div>

      {/* Divider */}
      <div style={{ height: '1px', background: 'var(--border)', marginLeft: '28px', marginRight: '28px', opacity: 0.6 }} />

      {/* Timeline */}
      <div
        ref={containerRef}
        style={{
          flex: 1, overflowY: 'auto', overflowX: 'hidden',
          padding: compactMode ? '16px 16px 16px 20px' : '20px 24px 20px 28px',
          scrollBehavior: 'smooth',
        }}
      >
        <div style={{ position: 'relative', paddingLeft: compactMode ? '68px' : '80px' }}>
          {/* Thin timeline line */}
          <div style={{
            position: 'absolute',
            left: compactMode ? '30px' : '36px',
            top: '6px', bottom: '6px',
            width: '1px',
            background: 'var(--border)',
            opacity: 0.5,
          }} />

          {sorted.map((ev, idx) => {
            const isActive = idx === activeIndex
            const isCurrent = idx === currentEventIndex && showCurrentTime
            const isPast = parseMinutes(ev.endTime || ev.time) < nowMinutes && showCurrentTime
            const isHovered = idx === hoveredIndex
            const col = getColor(ev.color)
            const periodLabel = getPeriodLabel(idx)

            return (
              <div key={ev.id}>
                {/* Period label */}
                {periodLabel && (
                  <div style={{
                    fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)',
                    textTransform: 'uppercase', letterSpacing: '0.08em',
                    marginBottom: '12px',
                    marginTop: idx === 0 ? '0' : '20px',
                    paddingLeft: '2px',
                  }}>
                    {periodLabel}
                  </div>
                )}

                <div
                  ref={el => { if (el) itemRefs.current.set(idx, el); else itemRefs.current.delete(idx) }}
                  onMouseEnter={() => setHoveredIndex(idx)}
                  onMouseLeave={() => setHoveredIndex(-1)}
                  style={{
                    position: 'relative',
                    marginBottom: compactMode ? '12px' : '16px',
                    transition: 'opacity 0.4s ease',
                    opacity: isPast && !isActive ? 0.5 : 1,
                    willChange: 'opacity',
                  }}
                >
                  {/* Timeline dot */}
                  <div style={{
                    position: 'absolute',
                    left: `${-(compactMode ? 68 : 80) + (compactMode ? 30 : 36) - 4}px`,
                    top: compactMode ? '16px' : '20px',
                    width: '9px', height: '9px',
                    borderRadius: '50%',
                    background: isActive || isCurrent ? col.value : 'var(--bg-primary)',
                    border: isActive || isCurrent ? `2px solid ${col.value}` : '2px solid var(--border)',
                    transition: 'background 0.4s ease, border-color 0.4s ease, box-shadow 0.4s ease',
                    boxShadow: isActive ? `0 0 0 4px ${col.light}` : '0 0 0 0px transparent',
                    zIndex: 2,
                  }} />

                  {/* Time label (left of timeline) */}
                  <div style={{
                    position: 'absolute',
                    left: `${-(compactMode ? 68 : 80)}px`,
                    top: compactMode ? '10px' : '14px',
                    width: compactMode ? '24px' : '28px',
                    textAlign: 'right',
                    transition: 'color 0.4s ease',
                  }}>
                    <div style={{
                      fontSize: compactMode ? '13px' : '14px',
                      fontWeight: 700,
                      color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                      fontVariantNumeric: 'tabular-nums',
                      lineHeight: 1.1,
                    }}>
                      {formatTimeShort(ev.time)}
                    </div>
                    <div style={{
                      fontSize: '9px', fontWeight: 500,
                      color: isActive ? col.value : 'var(--text-muted)',
                      opacity: isActive ? 1 : 0.6,
                      marginTop: '2px',
                    }}>
                      {getAmPm(ev.time)}
                    </div>
                  </div>

                  {/* Event card */}
                  <div style={{
                    padding: compactMode ? '12px 16px' : '16px 20px',
                    borderRadius: '14px',
                    background: isActive
                      ? 'var(--bg-card, var(--bg-primary))'
                      : isHovered
                        ? 'var(--bg-secondary)'
                        : 'transparent',
                    border: `1px solid ${isActive ? 'var(--border)' : 'transparent'}`,
                    borderBottom: isActive ? `2px solid ${col.value}` : '2px solid transparent',
                    transition: 'background 0.4s ease, border-color 0.4s ease, box-shadow 0.4s ease',
                    cursor: 'default',
                    boxShadow: isActive ? '0 2px 12px rgba(0,0,0,0.06)' : '0 0 0 rgba(0,0,0,0)',
                  }}>
                    {/* Title row */}
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      marginBottom: (ev.description || ev.endTime) ? '6px' : '0',
                    }}>
                      <span style={{
                        fontSize: compactMode ? '14px' : '15px',
                        fontWeight: 600,
                        color: isActive ? 'var(--text-primary)' : isPast ? 'var(--text-muted)' : 'var(--text-primary)',
                        letterSpacing: '-0.01em',
                        transition: 'color 0.4s ease',
                        flex: 1,
                      }}>{ev.title}</span>

                      {isCurrent && (
                        <span style={{
                          fontSize: '9px', fontWeight: 700,
                          color: col.value,
                          background: col.light,
                          padding: '2px 8px',
                          borderRadius: '10px',
                          letterSpacing: '0.05em',
                          textTransform: 'uppercase',
                          flexShrink: 0,
                          border: `1px solid ${col.value}20`,
                        }}>NOW</span>
                      )}
                    </div>

                    {/* Time range */}
                    {ev.endTime && (
                      <div style={{
                        fontSize: '11px', color: 'var(--text-muted)',
                        marginBottom: ev.description ? '6px' : '0',
                        fontVariantNumeric: 'tabular-nums',
                        fontWeight: 400,
                      }}>
                        {formatTime(ev.time)} — {formatTime(ev.endTime)}
                      </div>
                    )}

                    {/* Description */}
                    {ev.description && (
                      <p style={{
                        fontSize: '12px', lineHeight: 1.6,
                        color: isActive ? 'var(--text-secondary)' : 'var(--text-muted)',
                        margin: 0, transition: 'color 0.4s ease',
                        overflow: 'hidden',
                        display: '-webkit-box',
                        WebkitLineClamp: isActive ? 10 : 2,
                        WebkitBoxOrient: 'vertical',
                      }}>{ev.description}</p>
                    )}

                    {/* Color accent bar at bottom for active */}
                    {isActive && (
                      <div style={{
                        width: '24px', height: '2px',
                        background: col.value,
                        borderRadius: '1px',
                        marginTop: '10px',
                        opacity: 0.6,
                      }} />
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <style>{`
        @keyframes dsPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        .ds-root ::-webkit-scrollbar { width: 4px; }
        .ds-root ::-webkit-scrollbar-track { background: transparent; }
        .ds-root ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }
      `}</style>
    </div>
  )
}

// ── Config Form ──────────────────────────────────────────────
export function DailyScheduleConfigForm({ config, onChange }: ConfigFormProps) {
  const events = (config.events as ScheduleEvent[]) || []

  const labelStyle: React.CSSProperties = {
    fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)',
    textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px', display: 'block',
  }
  const miniLabelStyle: React.CSSProperties = {
    fontSize: '10px', color: 'var(--text-muted)', marginBottom: '3px', display: 'block',
  }
  const cardStyle: React.CSSProperties = {
    padding: '12px', borderRadius: '10px', background: 'var(--bg-secondary)',
    border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '8px',
  }

  const addEvent = () => {
    const id = `ev-${Date.now()}`
    onChange({
      ...config,
      events: [...events, { id, time: '09:00', endTime: '10:00', title: '새 일정', description: '', color: COLORS[events.length % COLORS.length].id }],
    })
  }

  const updateEvent = (id: string, patch: Partial<ScheduleEvent>) => {
    onChange({
      ...config,
      events: events.map(e => e.id === id ? { ...e, ...patch } : e),
    })
  }

  const removeEvent = (id: string) => {
    onChange({ ...config, events: events.filter(e => e.id !== id) })
  }

  const moveEvent = (idx: number, dir: -1 | 1) => {
    const arr = [...events]
    const target = idx + dir
    if (target < 0 || target >= arr.length) return
    ;[arr[idx], arr[target]] = [arr[target], arr[idx]]
    onChange({ ...config, events: arr })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* 제목 */}
      <div>
        <label style={labelStyle}>제목</label>
        <input
          className="input"
          value={(config.title as string) || ''}
          onChange={e => onChange({ ...config, title: e.target.value })}
          placeholder="하루 일정"
          style={{ fontSize: '13px' }}
        />
      </div>

      {/* 옵션 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <label style={labelStyle}>옵션</label>
        {[
          { key: 'show_current_time', label: '현재 시간 표시', defaultVal: true },
          { key: 'auto_scroll', label: '현재 일정으로 자동 스크롤', defaultVal: true },
          { key: 'compact_mode', label: '컴팩트 모드', defaultVal: false },
        ].map(opt => (
          <div key={opt.key} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              checked={(config[opt.key] as boolean) ?? opt.defaultVal}
              onChange={e => onChange({ ...config, [opt.key]: e.target.checked })}
              style={{ width: '14px', height: '14px', accentColor: 'var(--accent)' }}
            />
            <span style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{opt.label}</span>
          </div>
        ))}
      </div>

      {/* 일정 목록 */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <label style={{ ...labelStyle, marginBottom: 0 }}>일정 ({events.length})</label>
          <button
            onClick={addEvent}
            style={{
              padding: '4px 10px', fontSize: '11px', fontWeight: 600,
              background: 'var(--accent)', color: 'white',
              border: 'none', borderRadius: '6px', cursor: 'pointer',
            }}
          >+ 추가</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {events.map((ev, idx) => (
            <div key={ev.id} style={cardStyle}>
              {/* 상단: 순서/삭제 */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button onClick={() => moveEvent(idx, -1)} disabled={idx === 0}
                    style={{ padding: '2px 6px', fontSize: '10px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '4px', cursor: 'pointer', opacity: idx === 0 ? 0.3 : 1 }}>▲</button>
                  <button onClick={() => moveEvent(idx, 1)} disabled={idx === events.length - 1}
                    style={{ padding: '2px 6px', fontSize: '10px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '4px', cursor: 'pointer', opacity: idx === events.length - 1 ? 0.3 : 1 }}>▼</button>
                </div>
                <button onClick={() => removeEvent(ev.id)}
                  style={{ padding: '2px 8px', fontSize: '11px', color: 'var(--danger)', background: 'none', border: '1px solid var(--border)', borderRadius: '4px', cursor: 'pointer' }}>삭제</button>
              </div>

              {/* 시간 */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <div style={{ flex: 1 }}>
                  <label style={miniLabelStyle}>시작</label>
                  <input type="time" className="input" value={ev.time}
                    onChange={e => updateEvent(ev.id, { time: e.target.value })}
                    style={{ fontSize: '12px', width: '100%' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={miniLabelStyle}>종료</label>
                  <input type="time" className="input" value={ev.endTime || ''}
                    onChange={e => updateEvent(ev.id, { endTime: e.target.value })}
                    style={{ fontSize: '12px', width: '100%' }} />
                </div>
              </div>

              {/* 제목 */}
              <div>
                <label style={miniLabelStyle}>제목</label>
                <input className="input" value={ev.title}
                  onChange={e => updateEvent(ev.id, { title: e.target.value })}
                  style={{ fontSize: '12px' }} />
              </div>

              {/* 설명 */}
              <div>
                <label style={miniLabelStyle}>설명 (선택)</label>
                <textarea className="input" value={ev.description || ''} rows={2}
                  onChange={e => updateEvent(ev.id, { description: e.target.value })}
                  style={{ fontSize: '12px', resize: 'vertical' }} />
              </div>

              {/* 색상 */}
              <div>
                <label style={miniLabelStyle}>색상</label>
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                  {COLORS.map(c => (
                    <button key={c.id} onClick={() => updateEvent(ev.id, { color: c.id })}
                      style={{
                        width: '22px', height: '22px', borderRadius: '6px',
                        background: c.value, border: ev.color === c.id ? '2px solid var(--text-primary)' : '2px solid transparent',
                        cursor: 'pointer', padding: 0, transition: 'border 0.15s',
                      }} />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
