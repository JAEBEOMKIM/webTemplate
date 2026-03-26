'use client'

import { useEffect } from 'react'
import type { ComponentProps, ConfigFormProps } from '../types'
import { loadFont } from '@/lib/fonts/font-registry'
import { FontFamilySelect } from '../shared/FontFamilySelect'

export function HtmlComponent({ config }: ComponentProps) {
  const html = (config.html as string) || ''
  const fontFamily = (config.fontFamily as string) || ''

  useEffect(() => { if (fontFamily) loadFont(fontFamily) }, [fontFamily])

  if (!html.trim()) {
    return (
      <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <div style={{ fontSize: '32px', marginBottom: '8px' }}>{'</>'}</div>
        <p style={{ fontSize: '13px' }}>HTML 내용이 없습니다. 관리자 패널에서 HTML을 입력해주세요.</p>
      </div>
    )
  }

  return (
    <div
      style={{ padding: '16px', width: '100%', height: '100%', boxSizing: 'border-box', fontFamily: fontFamily || undefined }}
      dangerouslySetInnerHTML={{ __html: html }}
      suppressHydrationWarning
    />
  )
}

export function HtmlConfigForm({ config, onChange }: ConfigFormProps) {
  const html = (config.html as string) || ''

  const labelStyle: React.CSSProperties = {
    fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)',
    textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px', display: 'block',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div>
        <label style={labelStyle}>HTML 코드</label>
        <textarea
          className="input"
          value={html}
          onChange={e => onChange({ ...config, html: e.target.value })}
          rows={14}
          placeholder={'<h1>제목</h1>\n<p>내용을 입력하세요</p>'}
          style={{ fontFamily: 'monospace', fontSize: '12px', resize: 'vertical', width: '100%', lineHeight: 1.5 }}
          spellCheck={false}
        />
      </div>
      {/* Font */}
      <div>
        <label style={labelStyle}>폰트</label>
        <FontFamilySelect
          value={(config.fontFamily as string) || 'inherit'}
          onChange={v => onChange({ ...config, fontFamily: v })}
        />
      </div>
      <p style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
        입력한 HTML이 그대로 렌더링됩니다. script 태그는 보안상 실행되지 않을 수 있습니다.
      </p>
    </div>
  )
}
