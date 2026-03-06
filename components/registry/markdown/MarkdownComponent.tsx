'use client'

import { useState } from 'react'
import type { ComponentProps, ConfigFormProps } from '../types'

// Lightweight markdown → HTML converter (no external deps)
function mdToHtml(md: string): string {
  let html = md
    // Escape existing HTML to prevent injection
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  // Fenced code blocks (``` ... ```)
  html = html.replace(/```(\w*)\n?([\s\S]*?)```/g, (_, _lang, code) => {
    return `<pre style="background:var(--bg-secondary);border:1px solid var(--border);border-radius:8px;padding:12px 14px;overflow-x:auto;margin:12px 0"><code style="font-family:monospace;font-size:13px;line-height:1.6;color:var(--text-primary)">${code.trim()}</code></pre>`
  })

  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code style="font-family:monospace;font-size:12px;background:var(--bg-secondary);border:1px solid var(--border);border-radius:4px;padding:1px 5px;color:var(--accent-text)">$1</code>')

  // Headings
  html = html.replace(/^### (.+)$/gm, '<h3 style="font-size:15px;font-weight:700;color:var(--text-primary);margin:16px 0 6px">$1</h3>')
  html = html.replace(/^## (.+)$/gm, '<h2 style="font-size:17px;font-weight:700;color:var(--text-primary);margin:20px 0 8px">$1</h2>')
  html = html.replace(/^# (.+)$/gm, '<h1 style="font-size:20px;font-weight:700;color:var(--text-primary);margin:24px 0 10px">$1</h1>')

  // Horizontal rule
  html = html.replace(/^---$/gm, '<hr style="border:none;border-top:1px solid var(--border);margin:16px 0"/>')

  // Blockquote (already escaped, so &gt; instead of >)
  html = html.replace(/^&gt; (.+)$/gm, '<blockquote style="border-left:3px solid var(--accent);margin:10px 0;padding:6px 14px;color:var(--text-secondary);background:var(--bg-secondary);border-radius:0 6px 6px 0">$1</blockquote>')

  // Bold + italic
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>')

  // Strikethrough
  html = html.replace(/~~(.+?)~~/g, '<del>$1</del>')

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" style="color:var(--accent-text);text-decoration:underline">$1</a>')

  // Unordered lists
  html = html.replace(/((?:^- .+\n?)+)/gm, (match) => {
    const items = match.trim().split('\n').map(l => `<li style="margin:3px 0">${l.replace(/^- /, '')}</li>`).join('')
    return `<ul style="list-style:disc;padding-left:20px;margin:8px 0">${items}</ul>`
  })

  // Ordered lists
  html = html.replace(/((?:^\d+\. .+\n?)+)/gm, (match) => {
    const items = match.trim().split('\n').map(l => `<li style="margin:3px 0">${l.replace(/^\d+\. /, '')}</li>`).join('')
    return `<ol style="list-style:decimal;padding-left:20px;margin:8px 0">${items}</ol>`
  })

  // GFM Tables
  html = html.replace(/((?:^\|.+\|\n?)+)/gm, (match) => {
    const lines = match.trim().split('\n').filter(l => l.trim())
    if (lines.length < 2) return match
    // Second line must be separator (|---|---|)
    if (!/^\|[\s\-|:]+\|$/.test(lines[1].trim())) return match
    const parseRow = (line: string) =>
      line.replace(/^\||\|$/g, '').split('|').map(c => c.trim())
    const headers = parseRow(lines[0])
    const rows = lines.slice(2).map(parseRow)
    const thCells = headers.map(h =>
      `<th style="padding:7px 12px;text-align:left;font-weight:600;font-size:13px;color:var(--text-primary);border-bottom:2px solid var(--border);white-space:nowrap">${h}</th>`
    ).join('')
    const trRows = rows.map((cells, ri) => {
      const tds = cells.map(c =>
        `<td style="padding:6px 12px;font-size:13px;color:var(--text-secondary);border-bottom:1px solid var(--border)">${c}</td>`
      ).join('')
      const bg = ri % 2 === 1 ? 'background:var(--bg-secondary)' : ''
      return `<tr style="${bg}">${tds}</tr>`
    }).join('')
    return `<table style="width:100%;border-collapse:collapse;border:1px solid var(--border);border-radius:8px;overflow:hidden;margin:12px 0"><thead><tr style="background:var(--bg-secondary)">${thCells}</tr></thead><tbody>${trRows}</tbody></table>`
  })

  // Paragraphs: wrap double-newline separated blocks
  html = html
    .split(/\n{2,}/)
    .map(block => {
      const trimmed = block.trim()
      if (!trimmed) return ''
      if (/^<(h[1-6]|ul|ol|pre|hr|blockquote|table)/.test(trimmed)) return trimmed
      return `<p style="margin:0 0 10px;line-height:1.7;color:var(--text-primary)">${trimmed.replace(/\n/g, '<br/>')}</p>`
    })
    .join('\n')

  return html
}

export function MarkdownComponent({ config }: ComponentProps) {
  const content = (config.content as string) || ''

  if (!content.trim()) {
    return (
      <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <div style={{ fontSize: '32px', marginBottom: '8px' }}>📝</div>
        <p style={{ fontSize: '13px' }}>내용이 없습니다. 관리자 패널에서 마크다운을 입력해주세요.</p>
      </div>
    )
  }

  return (
    <div
      style={{ padding: '16px', width: '100%', height: '100%', boxSizing: 'border-box', fontSize: '14px' }}
      dangerouslySetInnerHTML={{ __html: mdToHtml(content) }}
      suppressHydrationWarning
    />
  )
}

export function MarkdownConfigForm({ config, onChange }: ConfigFormProps) {
  const content = (config.content as string) || ''
  const [preview, setPreview] = useState(false)

  const labelStyle: React.CSSProperties = {
    fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)',
    textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px', display: 'block',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <label style={{ ...labelStyle, marginBottom: 0 }}>마크다운 내용</label>
        <button
          type="button"
          onClick={() => setPreview(p => !p)}
          className={preview ? 'btn-primary' : 'btn-secondary'}
          style={{ padding: '3px 10px', fontSize: '12px' }}
        >
          {preview ? '편집' : '미리보기'}
        </button>
      </div>

      {!preview ? (
        <textarea
          className="input"
          value={content}
          onChange={e => onChange({ ...config, content: e.target.value })}
          rows={16}
          placeholder={'# 제목\n\n**굵게**, *기울임*, ~~취소선~~\n\n- 항목 1\n- 항목 2\n\n> 인용구\n\n`코드`'}
          style={{ fontFamily: 'monospace', fontSize: '12px', resize: 'vertical', width: '100%', lineHeight: 1.6 }}
          spellCheck={false}
        />
      ) : (
        <div
          style={{ border: '1px solid var(--border)', borderRadius: '8px', padding: '14px', minHeight: '200px', fontSize: '13px', background: 'var(--bg-primary)' }}
          dangerouslySetInnerHTML={{ __html: mdToHtml(content) || '<p style="color:var(--text-muted)">내용 없음</p>' }}
        />
      )}

      <p style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
        # 제목 &nbsp;·&nbsp; **굵게** &nbsp;·&nbsp; *기울임* &nbsp;·&nbsp; ~~취소선~~ &nbsp;·&nbsp; `코드` &nbsp;·&nbsp; - 목록 &nbsp;·&nbsp; &gt; 인용 &nbsp;·&nbsp; [링크](url) &nbsp;·&nbsp; | 표 |
      </p>
    </div>
  )
}
