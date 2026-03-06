'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { ComponentProps } from '../types'

interface CalendarEvent {
  id: string
  title: string
  start_date: string
  end_date: string | null
  description: string | null
  color: string
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay()
}

export function CalendarComponent({ componentId, config }: ComponentProps) {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [currentDate, setCurrentDate] = useState(new Date())
  const [showForm, setShowForm] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [form, setForm] = useState({ title: '', description: '', start_date: '', color: '#3B82F6' })
  const supabase = createClient()

  const title = (config.title as string) || '일정'
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = getFirstDayOfMonth(year, month)

  const fetchEvents = useCallback(async () => {
    const startOf = `${year}-${String(month + 1).padStart(2, '0')}-01`
    const endOf = `${year}-${String(month + 1).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`
    const { data } = await supabase
      .from('calendar_events')
      .select('*')
      .eq('component_id', componentId)
      .gte('start_date', startOf)
      .lte('start_date', endOf)
    setEvents(data || [])
  }, [componentId, year, month, daysInMonth, supabase])

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('calendar_events').insert({
      component_id: componentId,
      title: form.title,
      description: form.description,
      start_date: selectedDate || form.start_date,
      color: form.color,
      created_by: user?.id || null,
    })
    setShowForm(false)
    setForm({ title: '', description: '', start_date: '', color: '#3B82F6' })
    fetchEvents()
  }

  const getEventsForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return events.filter(e => e.start_date === dateStr)
  }

  const monthNames = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월']
  const dayNames = ['일', '월', '화', '수', '목', '금', '토']

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">{title}</h2>
        <div className="flex items-center gap-3">
          <button onClick={() => setCurrentDate(new Date(year, month - 1))} className="p-1 hover:bg-gray-100 rounded">◀</button>
          <span className="font-medium">{year}년 {monthNames[month]}</span>
          <button onClick={() => setCurrentDate(new Date(year, month + 1))} className="p-1 hover:bg-gray-100 rounded">▶</button>
        </div>
      </div>

      <div className="grid grid-cols-7 mb-1">
        {dayNames.map(d => (
          <div key={d} className="text-center text-xs font-medium text-gray-500 py-1">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-px bg-gray-200">
        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`empty-${i}`} className="bg-white min-h-[60px]" />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1
          const dayEvents = getEventsForDay(day)
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          const isToday = new Date().toDateString() === new Date(year, month, day).toDateString()
          return (
            <div
              key={day}
              className="bg-white min-h-[60px] p-1 cursor-pointer hover:bg-blue-50"
              onClick={() => { setSelectedDate(dateStr); setShowForm(true) }}
            >
              <div className={`text-xs w-6 h-6 flex items-center justify-center rounded-full mb-1 ${isToday ? 'bg-blue-600 text-white' : ''}`}>
                {day}
              </div>
              {dayEvents.slice(0, 2).map(ev => (
                <div key={ev.id} className="text-xs truncate rounded px-1 text-white" style={{ backgroundColor: ev.color }}>
                  {ev.title}
                </div>
              ))}
              {dayEvents.length > 2 && <div className="text-xs text-gray-400">+{dayEvents.length - 2}</div>}
            </div>
          )
        })}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <form onSubmit={handleAddEvent} className="bg-white rounded-lg p-6 w-96 shadow-xl">
            <h3 className="font-bold mb-4">일정 추가 ({selectedDate})</h3>
            <input
              className="w-full border rounded px-3 py-2 mb-3 text-sm"
              placeholder="일정 제목 *"
              required
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            />
            <textarea
              className="w-full border rounded px-3 py-2 mb-3 text-sm"
              placeholder="설명"
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            />
            <div className="mb-3">
              <label className="text-sm">색상</label>
              <input type="color" value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} className="ml-2" />
            </div>
            <div className="flex gap-2">
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">추가</button>
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border rounded text-sm">취소</button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

export function CalendarConfigForm({ config, onChange }: { config: Record<string, unknown>, onChange: (c: Record<string, unknown>) => void }) {
  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm font-medium mb-1">캘린더 제목</label>
        <input
          className="w-full border rounded px-3 py-2 text-sm"
          value={(config.title as string) || ''}
          onChange={e => onChange({ ...config, title: e.target.value })}
        />
      </div>
    </div>
  )
}
