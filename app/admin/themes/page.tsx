'use client'

import { themes } from '@/lib/themes'
import type { ThemeDefinition } from '@/lib/themes'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

function ThemePreviewCard({ theme, isDark }: { theme: ThemeDefinition; isDark: boolean }) {
  const colors = isDark ? theme.previewDark : theme.preview

  return (
    <div style={{
      border: '1px solid var(--border)',
      borderRadius: '14px',
      overflow: 'hidden',
      background: 'var(--bg-primary)',
    }}>
      {/* Preview mock page */}
      <div style={{
        background: colors.bg,
        padding: '16px',
        minHeight: '180px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
      }}>
        {/* Mock header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: colors.text }}>Sample Page</div>
          <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: colors.accent }} />
        </div>
        {/* Mock card */}
        <div style={{
          background: colors.card,
          borderRadius: '8px',
          padding: '12px',
          border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
          flex: 1,
        }}>
          <div style={{ width: '60%', height: '8px', borderRadius: '4px', background: colors.text, opacity: 0.7, marginBottom: '8px' }} />
          <div style={{ width: '80%', height: '6px', borderRadius: '3px', background: colors.text, opacity: 0.25, marginBottom: '6px' }} />
          <div style={{ width: '50%', height: '6px', borderRadius: '3px', background: colors.text, opacity: 0.25, marginBottom: '10px' }} />
          <div style={{ display: 'inline-block', padding: '4px 12px', borderRadius: '6px', background: colors.accent, fontSize: '10px', color: '#fff', fontWeight: 600 }}>
            Button
          </div>
        </div>
      </div>

      {/* Info section */}
      <div style={{ padding: '14px 16px', borderTop: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
          <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>{theme.name}</span>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{theme.id}</span>
        </div>
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '8px' }}>{theme.description}</p>
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Font:</span>
          <span style={{ fontSize: '11px', color: 'var(--text-primary)', fontWeight: 500 }}>{theme.fontLabel}</span>
        </div>
        {/* Color swatches */}
        <div style={{ display: 'flex', gap: '4px', marginTop: '8px' }}>
          {Object.entries(colors).map(([key, val]) => (
            <div key={key} title={`${key}: ${val}`} style={{
              width: '20px', height: '20px', borderRadius: '5px',
              background: val, border: '1px solid var(--border)',
              cursor: 'default',
            }} />
          ))}
        </div>
      </div>
    </div>
  )
}

export default function ThemesPage() {
  const { theme: colorMode } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [previewMode, setPreviewMode] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    setMounted(true)
    setPreviewMode(colorMode === 'dark' ? 'dark' : 'light')
  }, [colorMode])

  if (!mounted) return null

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>테마 관리</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>페이지별로 적용할 수 있는 테마 목록입니다. ({themes.length}개)</p>
        </div>
        <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-secondary)', borderRadius: '8px', padding: '3px' }}>
          <button
            onClick={() => setPreviewMode('light')}
            className={previewMode === 'light' ? 'btn-primary' : 'btn-ghost'}
            style={{ padding: '5px 12px', fontSize: '12px', borderRadius: '6px' }}
          >
            Light
          </button>
          <button
            onClick={() => setPreviewMode('dark')}
            className={previewMode === 'dark' ? 'btn-primary' : 'btn-ghost'}
            style={{ padding: '5px 12px', fontSize: '12px', borderRadius: '6px' }}
          >
            Dark
          </button>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '16px',
      }}>
        {themes.map(t => (
          <ThemePreviewCard key={t.id} theme={t} isDark={previewMode === 'dark'} />
        ))}
      </div>
    </div>
  )
}
