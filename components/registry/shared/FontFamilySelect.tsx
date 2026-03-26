'use client'

import { useState, useEffect, useRef } from 'react'
import { fontRegistry, FONT_CATEGORIES, loadFont, findFontEntry } from '@/lib/fonts/font-registry'

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '7px 10px', fontSize: '13px',
  border: '1px solid var(--border)', borderRadius: '8px',
  background: 'var(--bg-primary)', color: 'var(--text-primary)',
  outline: 'none',
}

/**
 * 모든 폰트(시스템 + 로컬 + 클로바 손글씨)를 카테고리별로 검색/선택할 수 있는 드롭다운.
 * 호버 시 해당 폰트를 미리 로드, 선택 시 loadFont() 호출.
 */
export function FontFamilySelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const currentEntry = findFontEntry(value)
  const currentLabel = currentEntry?.label || '기본 (상속)'

  useEffect(() => { if (value) loadFont(value) }, [value])

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const filtered = search
    ? fontRegistry.filter(f => f.label.toLowerCase().includes(search.toLowerCase()) || f.family.toLowerCase().includes(search.toLowerCase()))
    : fontRegistry

  const grouped = FONT_CATEGORIES.map(cat => ({
    ...cat,
    fonts: filtered.filter(f => f.category === cat.id),
  })).filter(g => g.fonts.length > 0)

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          ...inputStyle,
          cursor: 'pointer', textAlign: 'left',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          fontFamily: value !== 'inherit' ? value : undefined,
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{currentLabel}</span>
        <span style={{ fontSize: '10px', opacity: 0.5 }}>{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
          background: 'var(--bg-primary)', border: '1px solid var(--border)',
          borderRadius: '8px', marginTop: '4px', boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
          maxHeight: '320px', display: 'flex', flexDirection: 'column',
        }}>
          <div style={{ padding: '6px' }}>
            <input
              style={{ ...inputStyle, fontSize: '12px', padding: '5px 8px' }}
              placeholder="폰트 검색..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              autoFocus
            />
          </div>
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {grouped.map(g => (
              <div key={g.id}>
                <div style={{
                  padding: '4px 10px', fontSize: '10px', fontWeight: 700,
                  color: 'var(--text-muted)', textTransform: 'uppercase',
                  letterSpacing: '0.08em', position: 'sticky', top: 0,
                  background: 'var(--bg-primary)', borderBottom: '1px solid var(--border)',
                }}>
                  {g.label} ({g.fonts.length})
                </div>
                {g.fonts.map(f => {
                  const isActive = f.family === value
                  return (
                    <button
                      key={f.family}
                      onClick={() => { loadFont(f.family); onChange(f.family); setOpen(false); setSearch('') }}
                      onMouseEnter={() => loadFont(f.family)}
                      style={{
                        display: 'block', width: '100%', textAlign: 'left',
                        padding: '5px 10px', fontSize: '12px',
                        fontFamily: f.files.length > 0 ? f.family : undefined,
                        background: isActive ? 'var(--accent)' : 'transparent',
                        color: isActive ? 'white' : 'var(--text-primary)',
                        border: 'none', cursor: 'pointer',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}
                    >
                      {f.label}
                    </button>
                  )
                })}
              </div>
            ))}
            {grouped.length === 0 && (
              <div style={{ padding: '12px', textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)' }}>
                검색 결과 없음
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
