'use client'

import { useState } from 'react'
import type { ComponentProps, ConfigFormProps } from '../types'

interface TimetableEvent {
  id: string
  start_time: string
  end_time: string
  title: string
  description?: string
  color: string
}

const EVENT_COLORS = [
  '#6366f1', '#22c55e', '#f59e0b', '#ef4444',
  '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6',
  '#f97316', '#64748b',
]

// 15분 단위 슬롯, 슬롯당 16px
const SLOT_MIN = 15
const SLOT_PX  = 16
const HOUR_PX  = (60 / SLOT_MIN) * SLOT_PX   // 64px per hour

function pad(n: number) { return String(n).padStart(2, '0') }

function timeToMin(t: string): number {
  if (!t || !t.includes(':')) return 0
  const [h, m] = t.split(':').map(Number)
  return (isNaN(h) ? 0 : h) * 60 + (isNaN(m) ? 0 : m)
}

function formatKo(t: string): string {
  if (!t || !t.includes(':')) return ''
  const [h, m] = t.split(':').map(Number)
  return `${h >= 12 ? '오후' : '오전'} ${h % 12 || 12}:${pad(m || 0)}`
}

// ──────────────────────────────────────────────
// Display component
// ──────────────────────────────────────────────
export function TimetableComponent({ config }: ComponentProps) {
  const title       = (config.title as string) || '하루 일정'
  const events      = (config.events as TimetableEvent[]) || []
  const startHour   = typeof config.start_hour === 'number' ? config.start_hour : 8
  const endHour     = typeof config.end_hour   === 'number' ? config.end_hour   : 22
  const showTimeline = (config.show_timeline as boolean) !== false
  const showLegend   = (config.show_legend   as boolean) !== false

  const rangeStart  = startHour * 60
  const rangeEnd    = endHour   * 60
  const totalSlots  = Math.round((rangeEnd - rangeStart) / SLOT_MIN)
  const totalHeight = totalSlots * SLOT_PX

  // slot index is 1-based (CSS grid)
  const toSlot = (minutes: number) =>
    Math.round((Math.max(rangeStart, Math.min(rangeEnd, minutes)) - rangeStart) / SLOT_MIN) + 1

  const hours = Array.from({ length: endHour - startHour + 1 }, (_, i) => startHour + i)

  // Accept events that have valid, non-overlapping (end > start) times
  const visible = events
    .filter(ev => {
      if (!ev.start_time || !ev.end_time) return false
      const s = timeToMin(ev.start_time)
      const e = timeToMin(ev.end_time)
      return e > s && e > rangeStart && s < rangeEnd
    })
    .map(ev => {
      const startMin = timeToMin(ev.start_time)
      const endMin   = timeToMin(ev.end_time)
      const startSlot = toSlot(startMin)
      const endSlot   = toSlot(endMin)
      return { ...ev, startSlot, endSlot, durationMin: endMin - startMin }
    })
    .sort((a, b) => a.startSlot - b.startSlot)

  if (events.length === 0) {
    return (
      <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <div style={{ fontSize: '32px', marginBottom: '8px' }}>🗓️</div>
        <p style={{ fontSize: '13px' }}>일정이 없습니다. 관리자 패널에서 일정을 추가해주세요.</p>
      </div>
    )
  }

  // 마지막으로 렌더되는 섹션이 어느 것인지 판단
  const legendVisible = showLegend && visible.length > 0
  const timelineIsLast = showTimeline && !legendVisible

  return (
    <div style={{ padding: '12px 12px 0 0' }}>
      <h2 style={{
        fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)',
        paddingLeft: '8px',
        marginBottom: (showTimeline || legendVisible) ? '10px' : '0',
      }}>
        {title}
      </h2>

      {/* ── Timeline ── */}
      {showTimeline && (
        <div style={{
          display: 'flex', alignItems: 'flex-start',
          paddingBottom: timelineIsLast ? '12px' : '0',
        }}>
          {/* Time axis */}
          <div style={{ width: '36px', flexShrink: 0, position: 'relative', height: `${totalHeight}px` }}>
            {hours.map(h => (
              <div
                key={h}
                style={{
                  position: 'absolute',
                  top:        `${(h - startHour) * HOUR_PX}px`,
                  right:      '4px',
                  fontSize:   '10px',
                  lineHeight: 1,
                  color:      'var(--text-muted)',
                  transform:  'translateY(-50%)',
                  whiteSpace: 'nowrap',
                }}
              >
                {pad(h)}
              </div>
            ))}
          </div>

          {/* Events grid */}
          <div
            style={{
              flex: 1,
              display: 'grid',
              gridTemplateColumns: '1fr',
              gridTemplateRows: `repeat(${totalSlots}, ${SLOT_PX}px)`,
              backgroundImage: `repeating-linear-gradient(
                to bottom,
                var(--border) 0px, var(--border) 1px,
                transparent 1px, transparent ${HOUR_PX}px
              )`,
            }}
          >
            {visible.map(ev => (
              <div
                key={ev.id}
                style={{
                  gridColumn:   1,
                  gridRow:      `${ev.startSlot} / ${ev.endSlot}`,
                  background:   `${ev.color}22`,
                  borderLeft:   `3px solid ${ev.color}`,
                  borderRadius: '0 5px 5px 0',
                  margin:       '1px 3px 1px 0',
                  padding:      '2px 6px',
                  overflow:     'hidden',
                  minHeight:    0,
                  alignSelf:    'stretch',
                  justifySelf:  'stretch',
                }}
              >
                <div style={{
                  fontSize: '11px', fontWeight: 700,
                  color: ev.color || 'var(--accent-text)',
                  lineHeight: 1.3,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {ev.title || '(제목 없음)'}
                </div>
                {ev.durationMin >= 20 && (
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '1px' }}>
                    {ev.start_time} – {ev.end_time}
                  </div>
                )}
                {ev.durationMin >= 45 && ev.description && (
                  <div style={{
                    fontSize: '10px', color: 'var(--text-secondary)', marginTop: '1px',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {ev.description}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Legend ── */}
      {legendVisible && (
        <div style={{
          marginTop:    showTimeline ? '12px' : '0',
          paddingTop:   showTimeline ? '10px' : '0',
          borderTop:    showTimeline ? '1px solid var(--border-subtle)' : 'none',
          paddingLeft:  '8px',
          paddingBottom: '12px',
          display: 'flex', flexDirection: 'column', gap: '5px',
        }}>
          {visible.map(ev => (
            <div key={ev.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '7px' }}>
              <div style={{ width: '9px', height: '9px', borderRadius: '2px', background: ev.color, flexShrink: 0, marginTop: '3px' }} />
              <div>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {ev.title || '(제목 없음)'}
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '6px' }}>
                  {formatKo(ev.start_time)} – {formatKo(ev.end_time)}
                </span>
                {ev.description && (
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{ev.description}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ──────────────────────────────────────────────
// Config form
// ──────────────────────────────────────────────
export function TimetableConfigForm({ config, onChange }: ConfigFormProps) {
  const events = (config.events as TimetableEvent[]) || []
  const [colorPickerIdx, setColorPickerIdx] = useState<number | null>(null)

  const labelStyle: React.CSSProperties = {
    fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)',
    textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '5px', display: 'block',
  }

  const addEvent = () => {
    const prev = events[events.length - 1]
    const newStart = prev?.end_time || '09:00'
    const [h, m]   = newStart.split(':').map(Number)
    const endTotal = (isNaN(h) ? 9 : h) * 60 + (isNaN(m) ? 0 : m) + 60
    const newEnd   = `${pad(Math.min(Math.floor(endTotal / 60), 23))}:${pad(endTotal % 60)}`
    const color    = EVENT_COLORS[events.length % EVENT_COLORS.length]
    onChange({
      ...config,
      events: [
        ...events,
        { id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, start_time: newStart, end_time: newEnd, title: '', description: '', color },
      ],
    })
  }

  const updateEvent = (idx: number, updates: Partial<TimetableEvent>) =>
    onChange({ ...config, events: events.map((e, i) => i === idx ? { ...e, ...updates } : e) })

  const removeEvent = (idx: number) => {
    onChange({ ...config, events: events.filter((_, i) => i !== idx) })
    if (colorPickerIdx === idx) setColorPickerIdx(null)
  }

  const moveEvent = (idx: number, dir: -1 | 1) => {
    const ni = idx + dir
    if (ni < 0 || ni >= events.length) return
    const upd = [...events];
    [upd[idx], upd[ni]] = [upd[ni], upd[idx]]
    onChange({ ...config, events: upd })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div>
        <label style={labelStyle}>제목</label>
        <input className="input" value={(config.title as string) || ''} onChange={e => onChange({ ...config, title: e.target.value })} style={{ fontSize: '13px' }} />
      </div>

      {/* 표시 옵션 */}
      <div>
        <label style={labelStyle}>표시 옵션</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
          {[
            { key: 'show_timeline', label: '타임테이블 (시간 그리드)' },
            { key: 'show_legend',   label: '일정 요약 목록' },
          ].map(({ key, label }) => (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="checkbox"
                id={`tt-${key}`}
                checked={(config[key] as boolean) !== false}
                onChange={e => onChange({ ...config, [key]: e.target.checked })}
                style={{ width: '14px', height: '14px', accentColor: 'var(--accent)' }}
              />
              <label htmlFor={`tt-${key}`} style={{ fontSize: '13px', color: 'var(--text-primary)', cursor: 'pointer' }}>{label}</label>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px' }}>
        {(['start_hour', 'end_hour'] as const).map((key, ki) => (
          <div key={key} style={{ flex: 1 }}>
            <label style={labelStyle}>{ki === 0 ? '시작 시간' : '종료 시간'}</label>
            <select className="input" value={typeof config[key] === 'number' ? (config[key] as number) : (ki === 0 ? 8 : 22)}
              onChange={e => onChange({ ...config, [key]: Number(e.target.value) })} style={{ fontSize: '13px' }}>
              {Array.from({ length: 24 }, (_, i) => <option key={i} value={i}>{pad(i)}:00</option>)}
            </select>
          </div>
        ))}
      </div>

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <label style={{ ...labelStyle, marginBottom: 0 }}>일정 ({events.length}개)</label>
          <button onClick={addEvent} className="btn-primary" style={{ padding: '4px 10px', fontSize: '12px' }}>+ 일정 추가</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {events.map((ev, idx) => (
            <div key={ev.id || idx} style={{ border: '1px solid var(--border)', borderRadius: '10px', padding: '10px', background: 'var(--bg-secondary)', borderLeft: `3px solid ${ev.color || '#6366f1'}` }}>
              <div style={{ display: 'flex', gap: '6px', marginBottom: '7px', alignItems: 'center' }}>
                <div style={{ position: 'relative' }}>
                  <button type="button" onClick={() => setColorPickerIdx(colorPickerIdx === idx ? null : idx)}
                    style={{ width: '26px', height: '26px', borderRadius: '6px', background: ev.color || '#6366f1', border: '2px solid var(--border)', cursor: 'pointer', flexShrink: 0 }} />
                  {colorPickerIdx === idx && (
                    <div style={{ position: 'absolute', top: '30px', left: 0, zIndex: 20, background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: '10px', padding: '8px', display: 'grid', gridTemplateColumns: 'repeat(5, 20px)', gap: '4px', boxShadow: '0 4px 16px rgba(0,0,0,0.15)' }}>
                      {EVENT_COLORS.map(c => (
                        <button key={c} type="button" onClick={() => { updateEvent(idx, { color: c }); setColorPickerIdx(null) }}
                          style={{ width: '20px', height: '20px', borderRadius: '4px', background: c, border: (ev.color || '') === c ? '2px solid var(--text-primary)' : '2px solid transparent', cursor: 'pointer' }} />
                      ))}
                    </div>
                  )}
                </div>
                <input className="input" placeholder="일정 제목" value={ev.title} onChange={e => updateEvent(idx, { title: e.target.value })} style={{ flex: 1, fontSize: '13px' }} />
                <button onClick={() => moveEvent(idx, -1)} className="btn-ghost" style={{ padding: '3px 6px', fontSize: '11px' }} disabled={idx === 0}>↑</button>
                <button onClick={() => moveEvent(idx, 1)} className="btn-ghost" style={{ padding: '3px 6px', fontSize: '11px' }} disabled={idx === events.length - 1}>↓</button>
                <button onClick={() => removeEvent(idx)} className="btn-danger" style={{ padding: '3px 7px', fontSize: '12px' }}>✕</button>
              </div>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '6px' }}>
                <input type="time" className="input" value={ev.start_time} onChange={e => updateEvent(idx, { start_time: e.target.value })} style={{ flex: 1, fontSize: '13px' }} />
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', flexShrink: 0 }}>~</span>
                <input type="time" className="input" value={ev.end_time} onChange={e => updateEvent(idx, { end_time: e.target.value })} style={{ flex: 1, fontSize: '13px' }} />
              </div>
              <input className="input" placeholder="설명 (선택사항)" value={ev.description || ''} onChange={e => updateEvent(idx, { description: e.target.value })} style={{ fontSize: '12px', padding: '5px 8px' }} />
            </div>
          ))}
          {events.length === 0 && (
            <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: '13px', border: '1px dashed var(--border)', borderRadius: '10px' }}>
              + 일정 추가 버튼으로 일정을 등록하세요
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
