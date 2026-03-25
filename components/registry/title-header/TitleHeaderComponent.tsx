'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, type Variants } from 'framer-motion'
import type { ComponentProps, ConfigFormProps } from '../types'

// ── Types ──────────────────────────────────────────────────────────────────

interface TitleHeaderConfig {
  variant: 'typewriter' | 'shiny'
  texts: string[]
  prefix: string
  // Typewriter specific
  typingSpeed: number
  deletingSpeed: number
  pauseDuration: number
  cursorChar: string
  cursorColor: string
  // Shiny specific
  gradientColors: string
  gradientSpeed: number
  hoverGlow: boolean
  // Common
  fontSize: number
  fontFamily: string
  fontWeight: number
  italic: boolean
  align: 'left' | 'center' | 'right'
  textColor: string
  subtitle: string
  subtitleColor: string
  link: string
}

// ── Font Presets ───────────────────────────────────────────────────────────

const FONT_PRESETS = [
  { id: 'inherit', label: '기본', value: 'inherit' },
  { id: 'sans', label: '고딕 (Sans)', value: '-apple-system, "Segoe UI", sans-serif' },
  { id: 'serif', label: '명조 (Serif)', value: 'Georgia, "Times New Roman", serif' },
  { id: 'mono', label: '고정폭 (Mono)', value: '"JetBrains Mono", "Fira Code", monospace' },
  { id: 'noto-sans', label: 'Noto Sans KR', value: '"Noto Sans KR", sans-serif' },
  { id: 'nanum-gothic', label: '나눔고딕', value: '"NanumGothic", sans-serif' },
  { id: 'pretendard', label: 'Pretendard', value: '"Pretendard", sans-serif' },
] as const

const WEIGHT_PRESETS = [
  { value: 100, label: 'Thin' },
  { value: 300, label: 'Light' },
  { value: 400, label: 'Regular' },
  { value: 500, label: 'Medium' },
  { value: 600, label: 'SemiBold' },
  { value: 700, label: 'Bold' },
  { value: 800, label: 'ExtraBold' },
  { value: 900, label: 'Black' },
] as const

const GRADIENT_PRESETS = [
  { id: 'silver', label: '실버', value: 'linear-gradient(90deg, #999, #fff, #999)' },
  { id: 'gold', label: '골드', value: 'linear-gradient(90deg, #b8860b, #ffd700, #b8860b)' },
  { id: 'ocean', label: '오션', value: 'linear-gradient(90deg, #0077b6, #90e0ef, #0077b6)' },
  { id: 'sunset', label: '선셋', value: 'linear-gradient(90deg, #ff6b6b, #feca57, #ff6b6b)' },
  { id: 'neon', label: '네온', value: 'linear-gradient(90deg, #a855f7, #06b6d4, #a855f7)' },
  { id: 'rose', label: '로즈', value: 'linear-gradient(90deg, #be185d, #f9a8d4, #be185d)' },
  { id: 'emerald', label: '에메랄드', value: 'linear-gradient(90deg, #065f46, #6ee7b7, #065f46)' },
  { id: 'fire', label: '파이어', value: 'linear-gradient(90deg, #dc2626, #fbbf24, #dc2626)' },
] as const

// ── Typewriter Hook ────────────────────────────────────────────────────────

function useTypewriter(
  texts: string[],
  typingSpeed: number,
  deletingSpeed: number,
  pauseDuration: number,
) {
  const [displayed, setDisplayed] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const indexRef = useRef(0)
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null)

  useEffect(() => {
    if (texts.length === 0) return
    const currentText = texts[indexRef.current % texts.length]

    const tick = () => {
      if (!isDeleting) {
        if (displayed.length < currentText.length) {
          setDisplayed(currentText.slice(0, displayed.length + 1))
          timeoutRef.current = setTimeout(tick, typingSpeed)
        } else {
          if (texts.length > 1) {
            timeoutRef.current = setTimeout(() => {
              setIsDeleting(true)
              tick()
            }, pauseDuration)
          }
        }
      } else {
        if (displayed.length > 0) {
          setDisplayed(displayed.slice(0, -1))
          timeoutRef.current = setTimeout(tick, deletingSpeed)
        } else {
          setIsDeleting(false)
          indexRef.current = (indexRef.current + 1) % texts.length
        }
      }
    }

    timeoutRef.current = setTimeout(tick, isDeleting ? deletingSpeed : typingSpeed)
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current) }
  }, [displayed, isDeleting, texts, typingSpeed, deletingSpeed, pauseDuration])

  useEffect(() => {
    setDisplayed('')
    setIsDeleting(false)
    indexRef.current = 0
  }, [JSON.stringify(texts)])

  return displayed
}

// ── Shared font style builder ──────────────────────────────────────────────

function buildFontStyle(cfg: TitleHeaderConfig): React.CSSProperties {
  return {
    fontSize: `${cfg.fontSize || 32}px`,
    fontWeight: cfg.fontWeight || 800,
    fontStyle: cfg.italic ? 'italic' : 'normal',
    fontFamily: cfg.fontFamily || 'inherit',
    letterSpacing: '-0.02em',
    lineHeight: 1.3,
    margin: 0,
  }
}

// ── Typewriter Renderer ────────────────────────────────────────────────────

function TypewriterRenderer({ cfg }: { cfg: TitleHeaderConfig }) {
  const texts = cfg.texts?.length ? cfg.texts : ['Hello World']
  const displayed = useTypewriter(
    texts,
    cfg.typingSpeed || 80,
    cfg.deletingSpeed || 40,
    cfg.pauseDuration || 2000,
  )
  const cursorColor = cfg.cursorColor || 'var(--accent, #6366f1)'
  const cursorChar = cfg.cursorChar || '|'

  return (
    <h1 style={{
      ...buildFontStyle(cfg),
      color: cfg.textColor || 'var(--text-primary)',
    }}>
      {cfg.prefix && <span>{cfg.prefix} </span>}
      <span>{displayed}</span>
      <motion.span
        animate={{ opacity: [1, 0] }}
        transition={{ duration: 0.6, repeat: Infinity, repeatType: 'reverse' }}
        style={{ color: cursorColor, fontWeight: 300, marginLeft: '2px' }}
      >
        {cursorChar}
      </motion.span>
    </h1>
  )
}

// ── Shiny Text Renderer ────────────────────────────────────────────────────

function ShinyRenderer({ cfg }: { cfg: TitleHeaderConfig }) {
  const [isHovered, setIsHovered] = useState(false)
  const text = cfg.texts?.length ? cfg.texts.join(' ') : 'Shiny Text'
  const gradient = cfg.gradientColors || GRADIENT_PRESETS[0].value
  const speed = cfg.gradientSpeed || 2

  const variants: Variants = {
    initial: { backgroundPosition: '0% 50%' },
    animate: {
      backgroundPosition: '200% 50%',
      transition: { duration: speed, repeat: Infinity, repeatType: 'reverse', ease: 'linear' },
    },
  }

  return (
    <motion.h1
      style={{
        ...buildFontStyle(cfg),
        background: gradient,
        backgroundSize: '200% auto',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        textShadow: isHovered && cfg.hoverGlow ? '0 0 20px rgba(255,255,255,0.4)' : 'none',
        transition: 'text-shadow 0.3s',
      }}
      variants={variants}
      initial="initial"
      animate="animate"
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      {cfg.prefix && (
        <span style={{
          WebkitTextFillColor: cfg.textColor || 'var(--text-primary)',
          background: 'none',
          WebkitBackgroundClip: 'unset',
        }}>
          {cfg.prefix}{' '}
        </span>
      )}
      {text}
    </motion.h1>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────

export function TitleHeaderComponent({ config }: ComponentProps) {
  const cfg = config as unknown as TitleHeaderConfig
  const variant = cfg.variant || 'typewriter'
  const align = cfg.align || 'center'
  const link = cfg.link || ''
  const subtitle = cfg.subtitle || ''
  const subtitleColor = cfg.subtitleColor || 'var(--text-muted)'
  const fontSize = cfg.fontSize || 32

  return (
    <div
      style={{
        padding: '24px 16px',
        textAlign: align,
        cursor: link ? 'pointer' : 'default',
      }}
      onClick={() => { if (link) window.open(link, '_blank', 'noopener') }}
    >
      {variant === 'shiny' ? <ShinyRenderer cfg={cfg} /> : <TypewriterRenderer cfg={cfg} />}

      {subtitle && (
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          style={{
            fontSize: `${Math.max(12, fontSize * 0.4)}px`,
            color: subtitleColor,
            marginTop: '8px',
            fontWeight: 400,
            fontFamily: cfg.fontFamily || 'inherit',
            fontStyle: cfg.italic ? 'italic' : 'normal',
            letterSpacing: '0.02em',
          }}
        >
          {subtitle}
        </motion.p>
      )}
    </div>
  )
}

// ── Config Form ────────────────────────────────────────────────────────────

const labelStyle: React.CSSProperties = {
  fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)',
  textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px', display: 'block',
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '7px 10px', fontSize: '13px',
  border: '1px solid var(--border)', borderRadius: '8px',
  background: 'var(--bg-primary)', color: 'var(--text-primary)',
  outline: 'none',
}

const btnStyle: React.CSSProperties = {
  padding: '5px 10px', fontSize: '11px', fontWeight: 600,
  border: '1px solid var(--border)', borderRadius: '6px',
  background: 'var(--bg-secondary)', color: 'var(--text-primary)',
  cursor: 'pointer',
}

function ActiveBtn({ active, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { active: boolean }) {
  return (
    <button
      {...props}
      style={{
        ...btnStyle,
        ...(props.style || {}),
        background: active ? 'var(--accent)' : 'var(--bg-secondary)',
        color: active ? 'white' : 'var(--text-primary)',
        border: active ? 'none' : '1px solid var(--border)',
      }}
    />
  )
}

export function TitleHeaderConfigForm({ config, onChange }: ConfigFormProps) {
  const cfg = config as unknown as TitleHeaderConfig
  const texts: string[] = cfg.texts || ['Hello World']
  const variant = cfg.variant || 'typewriter'

  const update = (patch: Partial<TitleHeaderConfig>) => {
    onChange({ ...config, ...patch })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* ── Variant ── */}
      <div>
        <label style={labelStyle}>유형</label>
        <select
          style={{ ...inputStyle, cursor: 'pointer' }}
          value={variant}
          onChange={e => update({ variant: e.target.value as TitleHeaderConfig['variant'] })}
        >
          <option value="typewriter">Typewriter (타이프라이터)</option>
          <option value="shiny">Shiny Text (빛나는 텍스트)</option>
        </select>
      </div>

      {/* ── Prefix ── */}
      <div>
        <label style={labelStyle}>고정 접두어</label>
        <input
          style={inputStyle}
          value={cfg.prefix || ''}
          onChange={e => update({ prefix: e.target.value })}
          placeholder="예: We build"
        />
      </div>

      {/* ── Texts ── */}
      <div>
        <label style={labelStyle}>
          {variant === 'typewriter' ? '타이핑 텍스트 (순환)' : '표시 텍스트'}
        </label>
        {texts.map((t, i) => (
          <div key={i} style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
            <input
              style={{ ...inputStyle, flex: 1 }}
              value={t}
              onChange={e => {
                const next = [...texts]
                next[i] = e.target.value
                update({ texts: next })
              }}
              placeholder={`텍스트 ${i + 1}`}
            />
            {texts.length > 1 && (
              <button
                style={{ ...btnStyle, color: '#ef4444', padding: '5px 8px' }}
                onClick={() => update({ texts: texts.filter((_, j) => j !== i) })}
              >×</button>
            )}
          </div>
        ))}
        {variant === 'typewriter' && (
          <button style={btnStyle} onClick={() => update({ texts: [...texts, ''] })}>
            + 텍스트 추가
          </button>
        )}
        {variant === 'shiny' && texts.length <= 1 && (
          <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', marginTop: '2px' }}>
            여러 텍스트를 입력하면 공백으로 이어서 표시됩니다
          </span>
        )}
      </div>

      {/* ── Subtitle ── */}
      <div>
        <label style={labelStyle}>서브타이틀</label>
        <input
          style={inputStyle}
          value={cfg.subtitle || ''}
          onChange={e => update({ subtitle: e.target.value })}
          placeholder="부제목 (선택사항)"
        />
      </div>

      {/* ── Link ── */}
      <div>
        <label style={labelStyle}>링크 URL</label>
        <input
          style={inputStyle}
          value={cfg.link || ''}
          onChange={e => update({ link: e.target.value })}
          placeholder="https://example.com"
        />
      </div>

      {/* ════════ Font Settings ════════ */}
      <div style={{
        border: '1px solid var(--border)', borderRadius: '10px',
        padding: '12px', background: 'var(--bg-primary)',
        display: 'flex', flexDirection: 'column', gap: '10px',
      }}>
        <label style={{ ...labelStyle, marginBottom: 0, fontSize: '11px' }}>폰트 설정</label>

        {/* Font Family */}
        <div>
          <label style={{ ...labelStyle, fontSize: '10px' }}>글꼴</label>
          <select
            style={{ ...inputStyle, cursor: 'pointer' }}
            value={cfg.fontFamily || 'inherit'}
            onChange={e => update({ fontFamily: e.target.value })}
          >
            {FONT_PRESETS.map(f => (
              <option key={f.id} value={f.value}>{f.label}</option>
            ))}
          </select>
        </div>

        {/* Font Weight */}
        <div>
          <label style={{ ...labelStyle, fontSize: '10px' }}>굵기</label>
          <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap' }}>
            {WEIGHT_PRESETS.map(w => (
              <ActiveBtn
                key={w.value}
                active={(cfg.fontWeight || 800) === w.value}
                onClick={() => update({ fontWeight: w.value })}
                style={{ fontSize: '10px', padding: '4px 6px' }}
              >
                {w.label}
              </ActiveBtn>
            ))}
          </div>
        </div>

        {/* Italic */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ ...labelStyle, fontSize: '10px', marginBottom: 0 }}>이탤릭</label>
          <button
            onClick={() => update({ italic: !cfg.italic })}
            style={{
              ...btnStyle,
              fontStyle: 'italic',
              background: cfg.italic ? 'var(--accent)' : 'var(--bg-secondary)',
              color: cfg.italic ? 'white' : 'var(--text-primary)',
              border: cfg.italic ? 'none' : '1px solid var(--border)',
              width: '32px', padding: '4px',
            }}
          >I</button>
        </div>

        {/* Font Size */}
        <div>
          <label style={{ ...labelStyle, fontSize: '10px' }}>글자 크기</label>
          <input
            type="range"
            min={16} max={80} step={2}
            value={cfg.fontSize || 32}
            onChange={e => update({ fontSize: parseInt(e.target.value) })}
            style={{ width: '100%' }}
          />
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{cfg.fontSize || 32}px</span>
        </div>
      </div>

      {/* ── Align ── */}
      <div>
        <label style={labelStyle}>정렬</label>
        <div style={{ display: 'flex', gap: '4px' }}>
          {(['left', 'center', 'right'] as const).map(a => (
            <ActiveBtn
              key={a}
              active={(cfg.align || 'center') === a}
              onClick={() => update({ align: a })}
              style={{ flex: 1 }}
            >
              {{ left: '왼쪽', center: '가운데', right: '오른쪽' }[a]}
            </ActiveBtn>
          ))}
        </div>
      </div>

      {/* ════════ Variant-specific settings ════════ */}

      {variant === 'typewriter' && (
        <div style={{
          border: '1px solid var(--border)', borderRadius: '10px',
          padding: '12px', background: 'var(--bg-primary)',
          display: 'flex', flexDirection: 'column', gap: '10px',
        }}>
          <label style={{ ...labelStyle, marginBottom: 0 }}>타이프라이터 설정</label>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div>
              <label style={{ ...labelStyle, fontSize: '10px' }}>타이핑 속도 (ms)</label>
              <input type="number" style={inputStyle}
                value={cfg.typingSpeed || 80}
                onChange={e => update({ typingSpeed: Math.max(10, parseInt(e.target.value) || 80) })}
                min={10} max={500} step={10}
              />
            </div>
            <div>
              <label style={{ ...labelStyle, fontSize: '10px' }}>삭제 속도 (ms)</label>
              <input type="number" style={inputStyle}
                value={cfg.deletingSpeed || 40}
                onChange={e => update({ deletingSpeed: Math.max(10, parseInt(e.target.value) || 40) })}
                min={10} max={300} step={10}
              />
            </div>
          </div>

          <div>
            <label style={{ ...labelStyle, fontSize: '10px' }}>대기 시간 (ms)</label>
            <input type="number" style={inputStyle}
              value={cfg.pauseDuration || 2000}
              onChange={e => update({ pauseDuration: Math.max(500, parseInt(e.target.value) || 2000) })}
              min={500} max={10000} step={100}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div>
              <label style={{ ...labelStyle, fontSize: '10px' }}>텍스트 색상</label>
              <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                <input type="color" value={cfg.textColor || '#000000'}
                  onChange={e => update({ textColor: e.target.value })}
                  style={{ width: '32px', height: '28px', border: 'none', cursor: 'pointer', borderRadius: '4px' }}
                />
                <button style={{ ...btnStyle, fontSize: '10px' }} onClick={() => update({ textColor: '' })}>기본값</button>
              </div>
            </div>
            <div>
              <label style={{ ...labelStyle, fontSize: '10px' }}>커서 색상</label>
              <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                <input type="color" value={cfg.cursorColor || '#6366f1'}
                  onChange={e => update({ cursorColor: e.target.value })}
                  style={{ width: '32px', height: '28px', border: 'none', cursor: 'pointer', borderRadius: '4px' }}
                />
                <button style={{ ...btnStyle, fontSize: '10px' }} onClick={() => update({ cursorColor: '' })}>기본값</button>
              </div>
            </div>
          </div>

          <div>
            <label style={{ ...labelStyle, fontSize: '10px' }}>커서 문자</label>
            <div style={{ display: 'flex', gap: '4px' }}>
              {['|', '▎', '█', '_', '▏'].map(c => (
                <ActiveBtn key={c} active={(cfg.cursorChar || '|') === c}
                  onClick={() => update({ cursorChar: c })}
                  style={{ width: '32px', fontSize: '14px' }}
                >{c}</ActiveBtn>
              ))}
            </div>
          </div>
        </div>
      )}

      {variant === 'shiny' && (
        <div style={{
          border: '1px solid var(--border)', borderRadius: '10px',
          padding: '12px', background: 'var(--bg-primary)',
          display: 'flex', flexDirection: 'column', gap: '10px',
        }}>
          <label style={{ ...labelStyle, marginBottom: 0 }}>빛나는 텍스트 설정</label>

          {/* Gradient Presets */}
          <div>
            <label style={{ ...labelStyle, fontSize: '10px' }}>그라디언트 프리셋</label>
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
              {GRADIENT_PRESETS.map(g => (
                <button
                  key={g.id}
                  onClick={() => update({ gradientColors: g.value })}
                  title={g.label}
                  style={{
                    width: '36px', height: '24px', borderRadius: '6px',
                    background: g.value, backgroundSize: '200% auto',
                    border: (cfg.gradientColors || GRADIENT_PRESETS[0].value) === g.value
                      ? '2px solid var(--accent)' : '2px solid transparent',
                    cursor: 'pointer',
                  }}
                />
              ))}
            </div>
          </div>

          {/* Custom Gradient */}
          <div>
            <label style={{ ...labelStyle, fontSize: '10px' }}>커스텀 그라디언트 CSS</label>
            <input
              style={{ ...inputStyle, fontFamily: 'monospace', fontSize: '11px' }}
              value={cfg.gradientColors || GRADIENT_PRESETS[0].value}
              onChange={e => update({ gradientColors: e.target.value })}
              placeholder="linear-gradient(90deg, #000, #fff, #000)"
            />
          </div>

          {/* Animation Speed */}
          <div>
            <label style={{ ...labelStyle, fontSize: '10px' }}>애니메이션 속도 (초)</label>
            <input type="range" min={0.5} max={8} step={0.5}
              value={cfg.gradientSpeed || 2}
              onChange={e => update({ gradientSpeed: parseFloat(e.target.value) })}
              style={{ width: '100%' }}
            />
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{cfg.gradientSpeed || 2}s</span>
          </div>

          {/* Hover Glow */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ ...labelStyle, fontSize: '10px', marginBottom: 0 }}>호버 글로우</label>
            <button
              onClick={() => update({ hoverGlow: !cfg.hoverGlow })}
              style={{
                ...btnStyle,
                background: cfg.hoverGlow ? 'var(--accent)' : 'var(--bg-secondary)',
                color: cfg.hoverGlow ? 'white' : 'var(--text-primary)',
                border: cfg.hoverGlow ? 'none' : '1px solid var(--border)',
                padding: '4px 10px', fontSize: '10px',
              }}
            >{cfg.hoverGlow ? 'ON' : 'OFF'}</button>
          </div>
        </div>
      )}
    </div>
  )
}
