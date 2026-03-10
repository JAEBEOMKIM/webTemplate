'use client'

import { useState, useEffect, useCallback, useMemo, memo } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { ComponentProps } from '../types'

// ── Types ─────────────────────────────────────────────────────────────────
interface CalendarEvent {
  id: string
  title: string
  start_date: string
  end_date: string | null
  description: string | null
  color: string
}

// ── Date Utils ────────────────────────────────────────────────────────────
function parseDate(str: string): Date {
  const [y, m, d] = str.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function formatDateStr(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function addDays(date: Date, n: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

// ── Event slot assignment ─────────────────────────────────────────────────
// Assigns each event a vertical slot (row) within a week to avoid overlap
interface SlottedEvent {
  event: CalendarEvent
  slot: number
  startCol: number  // 0–6 within this week
  endCol: number    // 0–6 within this week
  roundLeft: boolean  // true if event actually starts here (not clipped by week boundary)
  roundRight: boolean // true if event actually ends here (not clipped by week boundary)
}

function assignWeekSlots(events: CalendarEvent[], weekStart: Date): SlottedEvent[] {
  const weekEnd = addDays(weekStart, 6)
  const wsStr = formatDateStr(weekStart)
  const weStr = formatDateStr(weekEnd)

  // Only events active during this week, sorted longest-first for better slot packing
  const active = events
    .filter(e => {
      const endStr = e.end_date ?? e.start_date
      return e.start_date <= weStr && endStr >= wsStr
    })
    .sort((a, b) => {
      const aEnd = a.end_date ?? a.start_date
      const bEnd = b.end_date ?? b.start_date
      const aLen = parseDate(aEnd).getTime() - parseDate(a.start_date).getTime()
      const bLen = parseDate(bEnd).getTime() - parseDate(b.start_date).getTime()
      if (bLen !== aLen) return bLen - aLen
      return a.start_date < b.start_date ? -1 : 1
    })

  const slotted: SlottedEvent[] = []
  const occupied: boolean[][] = [] // occupied[slot][col 0-6]

  for (const event of active) {
    const eStart = parseDate(event.start_date)
    const eEnd = event.end_date ? parseDate(event.end_date) : eStart

    const startCol = Math.max(0, Math.round((eStart.getTime() - weekStart.getTime()) / 86400000))
    const endCol = Math.min(6, Math.round((eEnd.getTime() - weekStart.getTime()) / 86400000))

    // Find first slot where this event fits
    let slot = 0
    for (;;) {
      if (!occupied[slot]) occupied[slot] = Array(7).fill(false)
      const conflict = occupied[slot].slice(startCol, endCol + 1).some(Boolean)
      if (!conflict) {
        for (let c = startCol; c <= endCol; c++) occupied[slot][c] = true
        break
      }
      slot++
    }

    slotted.push({
      event,
      slot,
      startCol,
      endCol,
      roundLeft: eStart >= weekStart,
      roundRight: eEnd <= weekEnd,
    })
  }
  return slotted
}

// ── Constants ─────────────────────────────────────────────────────────────
const DAY_CELL_H = 34   // height of day-number row
const EVENT_H = 18      // height of each event bar
const EVENT_GAP = 2     // gap between bars
const MAX_SLOTS = 3     // max visible event rows per week
const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토']
const MONTH_NAMES = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월']
const COLOR_PRESETS = ['#3B82F6','#EF4444','#10B981','#F59E0B','#8B5CF6','#EC4899','#06B6D4','#F97316']

// ── Week Row ─────────────────────────────────────────────────────────────
const WeekRow = memo(function WeekRow({
  weekDays,
  events,
  today,
  currentMonth,
  isAdmin,
  onDayClick,
  onEventClick,
}: {
  weekDays: Date[]
  events: CalendarEvent[]
  today: string
  currentMonth: number
  isAdmin: boolean
  onDayClick: (date: Date, dayEvents: CalendarEvent[]) => void
  onEventClick: (event: CalendarEvent) => void
}) {
  const weekStart = weekDays[0]

  // Derive slots — only recomputes when events or week changes
  const slotted = useMemo(() => assignWeekSlots(events, weekStart), [events, weekStart])
  const maxSlot = slotted.length > 0 ? Math.max(...slotted.map(s => s.slot)) : -1
  const visibleSlots = Math.min(maxSlot + 1, MAX_SLOTS)

  // Count hidden events per day (slot >= MAX_SLOTS)
  const hiddenByDay = useMemo(() => {
    const map = new Map<string, number>()
    for (const s of slotted) {
      if (s.slot >= MAX_SLOTS) {
        for (let c = s.startCol; c <= s.endCol; c++) {
          const ds = formatDateStr(weekDays[c])
          map.set(ds, (map.get(ds) ?? 0) + 1)
        }
      }
    }
    return map
  }, [slotted, weekDays])

  const eventsAreaH = visibleSlots * (EVENT_H + EVENT_GAP)

  return (
    <div style={{ position: 'relative', borderBottom: '1px solid var(--border)' }}>
      {/* Day number cells */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', height: `${DAY_CELL_H}px` }}>
        {weekDays.map((date, col) => {
          const dateStr = formatDateStr(date)
          const isToday = dateStr === today
          const isCurrentMonth = date.getMonth() === currentMonth
          const hidden = hiddenByDay.get(dateStr) ?? 0
          const dayEvents = events.filter(e => {
            const endStr = e.end_date ?? e.start_date
            return e.start_date <= dateStr && endStr >= dateStr
          })

          return (
            <div
              key={col}
              onClick={() => onDayClick(date, dayEvents)}
              style={{
                padding: '4px 4px 2px',
                cursor: isAdmin || dayEvents.length > 0 ? 'pointer' : 'default',
                borderRight: col < 6 ? '1px solid var(--border)' : undefined,
              }}
            >
              <div style={{
                width: '24px', height: '24px',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: '50%',
                fontSize: '12px',
                fontWeight: isToday ? 700 : 400,
                background: isToday ? 'var(--accent)' : 'transparent',
                color: isToday
                  ? 'white'
                  : !isCurrentMonth
                    ? 'var(--text-muted)'
                    : col === 0
                      ? '#EF4444'
                      : col === 6
                        ? '#3B82F6'
                        : 'var(--text-primary)',
              }}>
                {date.getDate()}
              </div>
              {hidden > 0 && (
                <span style={{ fontSize: '9px', color: 'var(--text-muted)', marginLeft: '2px' }}>
                  +{hidden}
                </span>
              )}
            </div>
          )
        })}
      </div>

      {/* Event bars layer */}
      {visibleSlots > 0 && (
        <div style={{ position: 'relative', height: `${eventsAreaH + 4}px` }}>
          {slotted
            .filter(s => s.slot < MAX_SLOTS)
            .map(({ event, slot, startCol, endCol, roundLeft, roundRight }) => {
              const colW = 100 / 7
              const left = startCol * colW
              const width = (endCol - startCol + 1) * colW
              const top = 2 + slot * (EVENT_H + EVENT_GAP)
              const br = `${roundLeft ? 4 : 0}px ${roundRight ? 4 : 0}px ${roundRight ? 4 : 0}px ${roundLeft ? 4 : 0}px`

              return (
                <div
                  key={`${event.id}-w${startCol}`}
                  onClick={e => { e.stopPropagation(); onEventClick(event) }}
                  title={event.title}
                  style={{
                    position: 'absolute',
                    left: `calc(${left}% + ${roundLeft ? 2 : 0}px)`,
                    width: `calc(${width}% - ${(roundLeft ? 2 : 0) + (roundRight ? 2 : 0)}px)`,
                    top: `${top}px`,
                    height: `${EVENT_H}px`,
                    background: event.color,
                    borderRadius: br,
                    display: 'flex',
                    alignItems: 'center',
                    paddingLeft: roundLeft ? '6px' : '2px',
                    cursor: 'pointer',
                    overflow: 'hidden',
                    zIndex: 1,
                    userSelect: 'none',
                  }}
                >
                  {roundLeft && (
                    <span style={{
                      fontSize: '10px', color: 'white', fontWeight: 600,
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>
                      {event.title}
                    </span>
                  )}
                </div>
              )
            })}
        </div>
      )}
    </div>
  )
})

// ── Day Events Modal (public: list of events on a day) ────────────────────
function DayEventsModal({
  date,
  events,
  onSelectEvent,
  onClose,
}: {
  date: string
  events: CalendarEvent[]
  onSelectEvent: (e: CalendarEvent) => void
  onClose: () => void
}) {
  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ background: 'var(--bg-primary)', borderRadius: '16px', padding: '20px', width: '340px', maxWidth: '90vw', boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>{date} 일정</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '20px', lineHeight: 1 }}>×</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {events.map(ev => (
            <button
              key={ev.id}
              onClick={() => onSelectEvent(ev)}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '10px 12px', borderRadius: '10px',
                background: 'var(--bg-secondary)', border: 'none', cursor: 'pointer', textAlign: 'left', width: '100%',
              }}
            >
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: ev.color, flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.title}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  {ev.end_date && ev.end_date !== ev.start_date ? `${ev.start_date} ~ ${ev.end_date}` : ev.start_date}
                </div>
              </div>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>›</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Event Detail Modal (public: read-only view) ───────────────────────────
function EventDetailModal({
  event,
  onClose,
  onBack,
}: {
  event: CalendarEvent
  onClose: () => void
  onBack?: () => void
}) {
  const dateLabel = event.end_date && event.end_date !== event.start_date
    ? `${event.start_date} ~ ${event.end_date}`
    : event.start_date

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1001 }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ background: 'var(--bg-primary)', borderRadius: '16px', padding: '24px', width: '360px', maxWidth: '90vw', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}
      >
        {/* Color bar accent */}
        <div style={{ height: '4px', borderRadius: '4px', background: event.color, marginBottom: '16px' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>{event.title}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span>📅</span> {dateLabel}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '20px', lineHeight: 1, marginLeft: '8px' }}>×</button>
        </div>

        {event.description && (
          <div style={{
            marginTop: '12px', fontSize: '13px', color: 'var(--text-secondary)',
            lineHeight: 1.65, whiteSpace: 'pre-wrap',
            padding: '12px', background: 'var(--bg-secondary)', borderRadius: '8px',
          }}>
            {event.description}
          </div>
        )}

        <div style={{ display: 'flex', gap: '8px', marginTop: '20px' }}>
          {onBack && (
            <button
              onClick={onBack}
              style={{ flex: 1, padding: '10px', background: 'var(--bg-secondary)', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', color: 'var(--text-primary)', fontWeight: 600 }}
            >
              ← 목록
            </button>
          )}
          <button
            onClick={onClose}
            style={{ flex: 1, padding: '10px', background: 'var(--accent)', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', color: 'white', fontWeight: 600 }}
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Event Form Modal (admin: add / edit) ──────────────────────────────────
function EventFormModal({
  initialDate,
  editEvent,
  componentId,
  onSave,
  onDelete,
  onClose,
}: {
  initialDate: string | null
  editEvent: CalendarEvent | null
  componentId: string
  onSave: () => void
  onDelete: (id: string) => void
  onClose: () => void
}) {
  const supabase = createClient()
  const [form, setForm] = useState({
    title: editEvent?.title ?? '',
    description: editEvent?.description ?? '',
    start_date: editEvent?.start_date ?? initialDate ?? '',
    end_date: editEvent?.end_date ?? initialDate ?? '',
    color: editEvent?.color ?? '#3B82F6',
  })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim() || !form.start_date) return
    setSaving(true)

    const endDate = form.end_date && form.end_date >= form.start_date ? form.end_date : null

    if (editEvent) {
      await supabase.from('calendar_events').update({
        title: form.title.trim(),
        description: form.description.trim() || null,
        start_date: form.start_date,
        end_date: endDate,
        color: form.color,
      }).eq('id', editEvent.id)
    } else {
      const { data: { user } } = await supabase.auth.getUser()
      await supabase.from('calendar_events').insert({
        component_id: componentId,
        title: form.title.trim(),
        description: form.description.trim() || null,
        start_date: form.start_date,
        end_date: endDate,
        color: form.color,
        created_by: user?.id ?? null,
      })
    }
    setSaving(false)
    onSave()
  }

  const set = <K extends keyof typeof form>(key: K, val: string) =>
    setForm(f => ({ ...f, [key]: val }))

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
      onClick={onClose}
    >
      <form
        onSubmit={handleSubmit}
        onClick={e => e.stopPropagation()}
        style={{ background: 'var(--bg-primary)', borderRadius: '16px', padding: '24px', width: '420px', maxWidth: '92vw', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column', gap: '14px' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
            {editEvent ? '일정 수정' : '일정 추가'}
          </h3>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '22px', lineHeight: 1 }}>×</button>
        </div>

        <input
          required
          placeholder="일정 제목 *"
          value={form.title}
          onChange={e => set('title', e.target.value)}
          style={inputStyle}
        />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <label style={fieldWrapStyle}>
            <span style={labelStyle}>시작일 *</span>
            <input
              type="date"
              required
              value={form.start_date}
              onChange={e => {
                set('start_date', e.target.value)
                // Auto-adjust end_date if it's before new start
                if (form.end_date && form.end_date < e.target.value) {
                  set('end_date', e.target.value)
                }
              }}
              style={inputStyle}
            />
          </label>
          <label style={fieldWrapStyle}>
            <span style={labelStyle}>종료일</span>
            <input
              type="date"
              value={form.end_date}
              min={form.start_date}
              onChange={e => set('end_date', e.target.value)}
              style={inputStyle}
            />
          </label>
        </div>

        <textarea
          placeholder="설명 (선택)"
          value={form.description}
          onChange={e => set('description', e.target.value)}
          rows={3}
          style={{ ...inputStyle, resize: 'vertical' }}
        />

        <div>
          <span style={labelStyle}>색상</span>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px', alignItems: 'center' }}>
            {COLOR_PRESETS.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => set('color', c)}
                style={{
                  width: '26px', height: '26px', borderRadius: '50%', background: c,
                  border: 'none', cursor: 'pointer', flexShrink: 0,
                  outline: form.color === c ? `3px solid ${c}` : 'none',
                  outlineOffset: '2px',
                  transition: 'outline 0.1s',
                }}
              />
            ))}
            <input
              type="color"
              value={form.color}
              onChange={e => set('color', e.target.value)}
              style={{ width: '26px', height: '26px', border: '2px solid var(--border)', padding: 0, cursor: 'pointer', borderRadius: '50%', background: 'transparent' }}
              title="직접 선택"
            />
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>직접 선택</span>
          </div>
        </div>

        {/* Preview */}
        {form.start_date && (
          <div style={{ padding: '8px 12px', background: form.color + '22', borderLeft: `3px solid ${form.color}`, borderRadius: '0 6px 6px 0', fontSize: '12px', color: 'var(--text-primary)' }}>
            <strong>{form.title || '(제목 없음)'}</strong>
            <span style={{ color: 'var(--text-muted)', marginLeft: '8px' }}>
              {form.start_date}{form.end_date && form.end_date !== form.start_date ? ` ~ ${form.end_date}` : ''}
            </span>
          </div>
        )}

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="submit"
            disabled={saving}
            style={{ flex: 1, padding: '10px', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: '8px', cursor: saving ? 'default' : 'pointer', fontSize: '14px', fontWeight: 600, opacity: saving ? 0.7 : 1 }}
          >
            {saving ? '저장 중...' : editEvent ? '수정 저장' : '일정 추가'}
          </button>
          {editEvent && (
            <button
              type="button"
              onClick={() => onDelete(editEvent.id)}
              style={{ padding: '10px 14px', background: 'transparent', color: '#EF4444', border: '1px solid #EF4444', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 600 }}
            >
              삭제
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            style={{ padding: '10px 14px', background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' }}
          >
            취소
          </button>
        </div>
      </form>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '9px 12px', borderRadius: '8px',
  border: '1px solid var(--border)', background: 'var(--bg-secondary)',
  color: 'var(--text-primary)', fontSize: '13px', boxSizing: 'border-box',
  outline: 'none',
}
const labelStyle: React.CSSProperties = {
  fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)',
  textTransform: 'uppercase', letterSpacing: '0.05em',
}
const fieldWrapStyle: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', gap: '4px',
}

// ── Main CalendarComponent ────────────────────────────────────────────────
export function CalendarComponent({ componentId, config, isAdmin }: ComponentProps) {
  const supabase = createClient()

  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [currentDate, setCurrentDate] = useState(() => {
    const n = new Date()
    return new Date(n.getFullYear(), n.getMonth(), 1)
  })

  // Public modal state
  const [dayModal, setDayModal] = useState<{ date: string; events: CalendarEvent[] } | null>(null)
  const [detailEvent, setDetailEvent] = useState<CalendarEvent | null>(null)
  // Tracks whether detailEvent was opened from a day list (for back navigation)
  const [detailFromDay, setDetailFromDay] = useState<string | null>(null)

  // Admin modal state
  const [showForm, setShowForm] = useState(false)
  const [formDate, setFormDate] = useState<string | null>(null)
  const [editEvent, setEditEvent] = useState<CalendarEvent | null>(null)

  const title = (config.title as string) || '일정'
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const today = useMemo(() => formatDateStr(new Date()), [])

  // Fetch events overlapping current month view
  const fetchEvents = useCallback(async () => {
    const monthStart = new Date(year, month, 1)
    const monthEnd = new Date(year, month + 1, 0)
    const monthStartStr = formatDateStr(monthStart)
    const monthEndStr = formatDateStr(monthEnd)
    // Fetch broadly (events starting up to 60 days before month) to catch long multi-day events
    const fetchFromStr = formatDateStr(addDays(monthStart, -60))

    const { data } = await supabase
      .from('calendar_events')
      .select('id, title, start_date, end_date, description, color')
      .eq('component_id', componentId)
      .lte('start_date', monthEndStr)
      .gte('start_date', fetchFromStr)

    // Client-side filter: only events that actually overlap this month
    setEvents((data ?? []).filter(e => {
      const endStr = e.end_date ?? e.start_date
      return e.start_date <= monthEndStr && endStr >= monthStartStr
    }))
  }, [componentId, year, month, supabase])

  useEffect(() => { fetchEvents() }, [fetchEvents])

  // Build week arrays for the calendar grid
  const calendarWeeks = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7
    const weeks: Date[][] = []
    for (let i = 0; i < totalCells; i += 7) {
      const week: Date[] = []
      for (let d = 0; d < 7; d++) {
        week.push(new Date(year, month, 1 - firstDay + i + d))
      }
      weeks.push(week)
    }
    return weeks
  }, [year, month])

  // ── Event handlers ─────────────────────────────────────────────────────
  const handleDayClick = useCallback((date: Date, dayEvents: CalendarEvent[]) => {
    if (isAdmin) {
      setFormDate(formatDateStr(date))
      setEditEvent(null)
      setShowForm(true)
    } else if (dayEvents.length === 1) {
      setDetailEvent(dayEvents[0])
    } else if (dayEvents.length > 1) {
      setDayModal({ date: formatDateStr(date), events: dayEvents })
    }
  }, [isAdmin])

  const handleEventClick = useCallback((event: CalendarEvent) => {
    if (isAdmin) {
      setEditEvent(event)
      setFormDate(null)
      setShowForm(true)
    } else {
      setDetailFromDay(null) // opened directly from calendar bar, no back navigation
      setDetailEvent(event)
    }
  }, [isAdmin])

  const handleSave = useCallback(() => {
    setShowForm(false)
    setEditEvent(null)
    fetchEvents()
  }, [fetchEvents])

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm('이 일정을 삭제할까요?')) return
    await supabase.from('calendar_events').delete().eq('id', id)
    setShowForm(false)
    setEditEvent(null)
    fetchEvents()
  }, [supabase, fetchEvents])

  const prevMonth = useCallback(() => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1)), [])
  const nextMonth = useCallback(() => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1)), [])
  const goToday = useCallback(() => {
    const n = new Date()
    setCurrentDate(new Date(n.getFullYear(), n.getMonth(), 1))
  }, [])

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div style={{ padding: '14px', height: '100%', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
        <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>{title}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button onClick={prevMonth} style={navBtnStyle}>◀</button>
          <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', minWidth: '90px', textAlign: 'center' }}>
            {year}년 {MONTH_NAMES[month]}
          </span>
          <button onClick={nextMonth} style={navBtnStyle}>▶</button>
          <button onClick={goToday} style={{ ...navBtnStyle, width: 'auto', padding: '0 10px', fontSize: '11px' }}>오늘</button>
        </div>
      </div>

      {/* Day-of-week header */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '2px solid var(--border)', marginBottom: '0' }}>
        {DAY_NAMES.map((d, i) => (
          <div key={d} style={{
            textAlign: 'center', fontSize: '11px', fontWeight: 700, padding: '5px 0',
            color: i === 0 ? '#EF4444' : i === 6 ? '#3B82F6' : 'var(--text-muted)',
          }}>{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div style={{
        flex: 1, border: '1px solid var(--border)', borderTop: 'none',
        borderRadius: '0 0 10px 10px', overflow: 'hidden',
        background: 'var(--bg-primary)',
      }}>
        {calendarWeeks.map((week, wi) => (
          <WeekRow
            key={wi}
            weekDays={week}
            events={events}
            today={today}
            currentMonth={month}
            isAdmin={!!isAdmin}
            onDayClick={handleDayClick}
            onEventClick={handleEventClick}
          />
        ))}
      </div>

      {isAdmin && (
        <div style={{ marginTop: '8px', fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center' }}>
          날짜 클릭 → 일정 추가 &nbsp;·&nbsp; 일정 바 클릭 → 수정/삭제
        </div>
      )}

      {/* ── Modals ── */}

      {/* Public: day events list */}
      {!isAdmin && dayModal && (
        <DayEventsModal
          date={dayModal.date}
          events={dayModal.events}
          onSelectEvent={ev => {
            setDetailFromDay(dayModal.date)
            setDayModal(null)
            setDetailEvent(ev)
          }}
          onClose={() => setDayModal(null)}
        />
      )}

      {/* Public: event detail */}
      {!isAdmin && detailEvent && (
        <EventDetailModal
          event={detailEvent}
          onClose={() => { setDetailEvent(null); setDetailFromDay(null) }}
          onBack={detailFromDay ? () => {
            const sourceDate = detailFromDay
            setDetailEvent(null)
            setDetailFromDay(null)
            const dayEvts = events.filter(e => {
              const end = e.end_date ?? e.start_date
              return e.start_date <= sourceDate && end >= sourceDate
            })
            setDayModal({ date: sourceDate, events: dayEvts })
          } : undefined}
        />
      )}

      {/* Admin: add / edit form */}
      {isAdmin && showForm && (
        <EventFormModal
          initialDate={formDate}
          editEvent={editEvent}
          componentId={componentId}
          onSave={handleSave}
          onDelete={handleDelete}
          onClose={() => { setShowForm(false); setEditEvent(null) }}
        />
      )}
    </div>
  )
}

const navBtnStyle: React.CSSProperties = {
  width: '28px', height: '28px', background: 'var(--bg-secondary)',
  border: 'none', borderRadius: '6px', cursor: 'pointer',
  color: 'var(--text-secondary)', fontSize: '12px',
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
}

// ── Config Form ───────────────────────────────────────────────────────────
export function CalendarConfigForm({
  config,
  onChange,
}: {
  config: Record<string, unknown>
  onChange: (c: Record<string, unknown>) => void
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <label style={fieldWrapStyle}>
        <span style={labelStyle}>캘린더 제목</span>
        <input
          style={inputStyle}
          value={(config.title as string) || ''}
          onChange={e => onChange({ ...config, title: e.target.value })}
          placeholder="일정"
        />
      </label>
    </div>
  )
}
