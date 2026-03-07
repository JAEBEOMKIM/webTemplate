'use client'

import { themes } from '@/lib/themes'
import type { ThemeDefinition } from '@/lib/themes'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

interface Props {
  value: string | null
  onChange: (themeId: string | null) => void
}

function Swatch({ theme, selected, isDark, onClick }: { theme: ThemeDefinition; selected: boolean; isDark: boolean; onClick: () => void }) {
  const colors = isDark ? theme.previewDark : theme.preview
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: '10px',
        border: `2px solid ${selected ? 'var(--accent)' : 'var(--border)'}`,
        borderRadius: '10px',
        background: selected ? 'var(--accent-subtle)' : 'var(--bg-secondary)',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'border-color 0.12s',
      }}
    >
      {/* Color swatches */}
      <div style={{ display: 'flex', gap: '3px', marginBottom: '6px' }}>
        {[colors.bg, colors.card, colors.accent, colors.text].map((c, i) => (
          <div key={i} style={{ width: '16px', height: '16px', borderRadius: '4px', background: c, border: '1px solid var(--border)' }} />
        ))}
      </div>
      <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>{theme.name}</div>
      <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>{theme.fontLabel}</div>
    </button>
  )
}

export function ThemeSelector({ value, onChange }: Props) {
  const { theme: colorMode } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const isDark = mounted && colorMode === 'dark'

  return (
    <div>
      <label className="label">페이지 테마</label>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '8px' }}>
        {themes.map(t => (
          <Swatch
            key={t.id}
            theme={t}
            selected={(value ?? 'default') === t.id}
            isDark={isDark}
            onClick={() => onChange(t.id === 'default' ? null : t.id)}
          />
        ))}
      </div>
    </div>
  )
}
