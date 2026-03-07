'use client'

import { useState } from 'react'
import type { ComponentProps, ConfigFormProps } from '../types'

interface AccordionChild {
  id: string
  title: string
  content: string
}

interface AccordionItem {
  id: string
  title: string
  icon: string
  color: string
  children: AccordionChild[]
}

const COLOR_PRESETS: Record<string, { bg: string; text: string }> = {
  blue:   { bg: 'rgba(59,130,246,0.12)',  text: '#3b82f6' },
  orange: { bg: 'rgba(249,115,22,0.12)',  text: '#f97316' },
  teal:   { bg: 'rgba(20,184,166,0.12)',  text: '#14b8a6' },
  red:    { bg: 'rgba(239,68,68,0.12)',   text: '#ef4444' },
  green:  { bg: 'rgba(34,197,94,0.12)',   text: '#22c55e' },
  purple: { bg: 'rgba(168,85,247,0.12)',  text: '#a855f7' },
}

const COLOR_LABELS: Record<string, string> = {
  blue: '파랑', orange: '주황', teal: '청록', red: '빨강', green: '초록', purple: '보라',
}

const labelStyle: React.CSSProperties = {
  fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)',
  textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px', display: 'block',
}

export function AccordionComponent({ config }: ComponentProps) {
  const title = (config.title as string) || ''
  const items = (config.items as AccordionItem[]) || []

  const [openItems, setOpenItems] = useState<Set<string>>(
    () => new Set(items.length > 0 ? [items[0].id] : [])
  )
  const [openChildren, setOpenChildren] = useState<Set<string>>(new Set())

  const toggleItem = (id: string) => {
    setOpenItems(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleChild = (id: string) => {
    setOpenChildren(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  if (items.length === 0) {
    return (
      <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <div style={{ fontSize: '32px', marginBottom: '8px' }}>📂</div>
        <p style={{ fontSize: '13px' }}>항목이 없습니다. 설정 패널에서 항목을 추가해주세요.</p>
      </div>
    )
  }

  return (
    <div style={{ padding: '16px', width: '100%' }}>
      {title && (
        <h2 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '14px', letterSpacing: '-0.01em' }}>
          {title}
        </h2>
      )}
      <div style={{ border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
        {items.map((item, idx) => {
          const isOpen = openItems.has(item.id)
          const colors = COLOR_PRESETS[item.color] ?? COLOR_PRESETS.blue
          const isLast = idx === items.length - 1

          return (
            <div key={item.id} style={{ borderBottom: isLast ? 'none' : '1px solid var(--border)' }}>
              {/* Main accordion header */}
              <button
                onClick={() => toggleItem(item.id)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center',
                  justifyContent: 'space-between', padding: '14px 16px',
                  background: 'var(--bg-card)', border: 'none', cursor: 'pointer',
                  textAlign: 'left', gap: '12px',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-card-hover)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'var(--bg-card)')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
                    background: colors.bg, color: colors.text,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px',
                  }}>
                    {item.icon}
                  </div>
                  <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.title}
                  </span>
                </div>
                <span style={{ fontSize: '18px', fontWeight: 400, color: 'var(--text-muted)', flexShrink: 0, lineHeight: 1 }}>
                  {isOpen ? '−' : '+'}
                </span>
              </button>

              {/* Nested collapsible children */}
              {isOpen && item.children.length > 0 && (
                <div>
                  {item.children.map((child) => {
                    const childOpen = openChildren.has(child.id)
                    return (
                      <div key={child.id} style={{ borderTop: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
                        <button
                          onClick={() => toggleChild(child.id)}
                          style={{
                            width: '100%', display: 'flex', alignItems: 'center', gap: '8px',
                            padding: '11px 16px', background: 'transparent', border: 'none',
                            cursor: 'pointer', textAlign: 'left', color: 'var(--text-primary)',
                            fontSize: '13px', fontWeight: 600,
                          }}
                        >
                          <span style={{
                            display: 'inline-block', flexShrink: 0,
                            transition: 'transform 0.2s',
                            transform: childOpen ? 'rotate(0deg)' : 'rotate(-90deg)',
                            color: 'var(--text-muted)', fontSize: '12px',
                          }}>▾</span>
                          {child.title}
                        </button>
                        {childOpen && (
                          <div style={{
                            padding: '2px 16px 14px 34px',
                            fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.7,
                          }}>
                            {child.content}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}

              {isOpen && item.children.length === 0 && (
                <div style={{ borderTop: '1px solid var(--border)', padding: '16px', background: 'var(--bg-secondary)', color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center' }}>
                  하위 항목 없음
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function AccordionConfigForm({ config, onChange }: ConfigFormProps) {
  const title = (config.title as string) || ''
  const items = (config.items as AccordionItem[]) || []
  const [expandedItem, setExpandedItem] = useState<number | null>(null)

  const addItem = () => {
    const newItem: AccordionItem = {
      id: `item-${Date.now()}`,
      title: '새 항목',
      icon: '📁',
      color: 'blue',
      children: [],
    }
    onChange({ ...config, items: [...items, newItem] })
    setExpandedItem(items.length)
  }

  const updateItem = (idx: number, updates: Partial<AccordionItem>) => {
    onChange({ ...config, items: items.map((item, i) => i === idx ? { ...item, ...updates } : item) })
  }

  const removeItem = (idx: number) => {
    onChange({ ...config, items: items.filter((_, i) => i !== idx) })
    setExpandedItem(null)
  }

  const addChild = (itemIdx: number) => {
    const newChild: AccordionChild = { id: `child-${Date.now()}`, title: '소제목', content: '내용을 입력하세요.' }
    onChange({
      ...config,
      items: items.map((item, i) => i === itemIdx ? { ...item, children: [...item.children, newChild] } : item),
    })
  }

  const updateChild = (itemIdx: number, childIdx: number, updates: Partial<AccordionChild>) => {
    onChange({
      ...config,
      items: items.map((item, i) => i === itemIdx ? {
        ...item,
        children: item.children.map((child, ci) => ci === childIdx ? { ...child, ...updates } : child),
      } : item),
    })
  }

  const removeChild = (itemIdx: number, childIdx: number) => {
    onChange({
      ...config,
      items: items.map((item, i) => i === itemIdx ? {
        ...item,
        children: item.children.filter((_, ci) => ci !== childIdx),
      } : item),
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div>
        <label style={labelStyle}>제목</label>
        <input
          className="input"
          value={title}
          onChange={e => onChange({ ...config, title: e.target.value })}
          placeholder="아코디언 제목 (선택)"
          style={{ fontSize: '13px' }}
        />
      </div>

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <label style={{ ...labelStyle, marginBottom: 0 }}>항목 ({items.length})</label>
          <button type="button" onClick={addItem} className="btn-primary" style={{ padding: '4px 10px', fontSize: '12px' }}>
            + 항목 추가
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {items.map((item, idx) => (
            <div key={item.id} style={{ border: '1px solid var(--border)', borderRadius: '10px', overflow: 'hidden' }}>
              {/* Item header */}
              <div
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '10px 12px', cursor: 'pointer',
                  background: expandedItem === idx ? 'var(--bg-secondary)' : 'var(--bg-card)',
                }}
                onClick={() => setExpandedItem(expandedItem === idx ? null : idx)}
              >
                <span style={{ fontSize: '14px' }}>{item.icon}</span>
                <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {item.title}
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{item.children.length}개</span>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{expandedItem === idx ? '▲' : '▼'}</span>
              </div>

              {expandedItem === idx && (
                <div style={{ borderTop: '1px solid var(--border)', padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px', background: 'var(--bg-secondary)' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <div style={{ flex: 1 }}>
                      <label style={labelStyle}>아이콘 (이모지)</label>
                      <input
                        className="input"
                        value={item.icon}
                        onChange={e => updateItem(idx, { icon: e.target.value })}
                        placeholder="📁"
                        style={{ fontSize: '18px', textAlign: 'center' }}
                      />
                    </div>
                    <div style={{ flex: 2 }}>
                      <label style={labelStyle}>제목</label>
                      <input
                        className="input"
                        value={item.title}
                        onChange={e => updateItem(idx, { title: e.target.value })}
                        placeholder="항목 제목"
                      />
                    </div>
                  </div>

                  <div>
                    <label style={labelStyle}>색상</label>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {Object.entries(COLOR_PRESETS).map(([key, col]) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => updateItem(idx, { color: key })}
                          style={{
                            padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 600,
                            background: col.bg, color: col.text, border: `2px solid ${item.color === key ? col.text : 'transparent'}`,
                            cursor: 'pointer',
                          }}
                        >
                          {COLOR_LABELS[key]}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Children */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <label style={{ ...labelStyle, marginBottom: 0 }}>하위 항목</label>
                      <button type="button" onClick={() => addChild(idx)} className="btn-secondary" style={{ padding: '3px 8px', fontSize: '11px' }}>
                        + 추가
                      </button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {item.children.map((child, ci) => (
                        <div key={child.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px' }}>
                          <div style={{ display: 'flex', gap: '6px', marginBottom: '6px' }}>
                            <input
                              className="input"
                              value={child.title}
                              onChange={e => updateChild(idx, ci, { title: e.target.value })}
                              placeholder="소제목"
                              style={{ fontSize: '12px', flex: 1 }}
                            />
                            <button
                              type="button"
                              onClick={() => removeChild(idx, ci)}
                              className="btn-danger"
                              style={{ padding: '6px 8px', flexShrink: 0 }}
                            >
                              ✕
                            </button>
                          </div>
                          <textarea
                            className="input"
                            value={child.content}
                            onChange={e => updateChild(idx, ci, { content: e.target.value })}
                            placeholder="내용"
                            rows={2}
                            style={{ fontSize: '12px', resize: 'vertical' }}
                          />
                        </div>
                      ))}
                      {item.children.length === 0 && (
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', padding: '8px' }}>하위 항목이 없습니다</p>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button type="button" onClick={() => removeItem(idx)} className="btn-danger" style={{ fontSize: '12px' }}>
                      이 항목 삭제
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
          {items.length === 0 && (
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', padding: '16px' }}>
              항목을 추가해주세요
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
