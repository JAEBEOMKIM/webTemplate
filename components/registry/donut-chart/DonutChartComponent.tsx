'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { ComponentProps, ConfigFormProps } from '../types'

/* ─── Types ─── */

interface Segment {
  id: string
  label: string
  value: number
  color: string
}

/* ─── Core DonutChart ─── */

interface DonutChartProps {
  segments: Segment[]
  size?: number
  strokeWidth?: number
  centerContent?: React.ReactNode
  onSegmentHover?: (seg: Segment | null) => void
}

function DonutChart({ segments, size = 200, strokeWidth = 28, centerContent, onSegmentHover }: DonutChartProps) {
  const [hovered, setHovered] = useState<Segment | null>(null)
  const radius = size / 2 - strokeWidth / 2
  const circumference = 2 * Math.PI * radius
  const total = useMemo(() => segments.reduce((s, seg) => s + seg.value, 0), [segments])

  useEffect(() => { onSegmentHover?.(hovered) }, [hovered, onSegmentHover])

  let cumulative = 0
  return (
    <div
      style={{ position: 'relative', width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onMouseLeave={() => setHovered(null)}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ overflow: 'visible', transform: 'rotate(-90deg)' }}>
        {/* Background ring */}
        <circle cx={size / 2} cy={size / 2} r={radius} fill="transparent" stroke="var(--border)" strokeWidth={strokeWidth} />

        {segments.map((seg, idx) => {
          if (seg.value === 0) return null
          const pct = total === 0 ? 0 : (seg.value / total) * 100
          const dashArray = `${(pct / 100) * circumference} ${circumference}`
          const dashOffset = -(cumulative / 100) * circumference
          cumulative += pct
          const isActive = hovered?.id === seg.id

          return (
            <motion.circle
              key={seg.id}
              cx={size / 2} cy={size / 2} r={radius}
              fill="transparent"
              stroke={seg.color}
              strokeWidth={strokeWidth}
              strokeDasharray={dashArray}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: idx * 0.06, ease: 'easeOut' }}
              style={{
                cursor: 'pointer',
                filter: isActive ? `drop-shadow(0 0 6px ${seg.color})` : 'none',
                transform: isActive ? 'scale(1.04)' : 'scale(1)',
                transformOrigin: `${size / 2}px ${size / 2}px`,
                transition: 'filter 0.2s, transform 0.2s',
              }}
              onMouseEnter={() => setHovered(seg)}
            />
          )
        })}
      </svg>

      {centerContent && (
        <div style={{
          position: 'absolute',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          width: size - strokeWidth * 2.5,
          height: size - strokeWidth * 2.5,
          pointerEvents: 'none',
        }}>
          {centerContent}
        </div>
      )}
    </div>
  )
}

/* ─── Registry Component ─── */

const DEFAULT_COLORS = ['#3b82f6', '#22c55e', '#f97316', '#a855f7', '#ef4444', '#14b8a6', '#eab308', '#ec4899']

export function DonutChartComponent({ config }: ComponentProps) {
  const title = (config.title as string) || ''
  const segments = ((config.segments as Segment[]) || []).filter(s => s.value > 0)
  const [hovered, setHovered] = useState<Segment | null>(null)
  const total = useMemo(() => segments.reduce((s, seg) => s + seg.value, 0), [segments])

  if (segments.length === 0) {
    return (
      <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <div style={{ fontSize: '32px', marginBottom: '8px' }}>🍩</div>
        <p style={{ fontSize: '13px' }}>데이터가 없습니다. 설정 패널에서 항목을 추가해주세요.</p>
      </div>
    )
  }

  const active = hovered ?? null
  const displayValue = active ? active.value : total
  const displayLabel = active ? active.label : '합계'
  const displayPct = active && total > 0 ? ((active.value / total) * 100).toFixed(1) : null

  return (
    <div style={{ padding: '20px', width: '100%' }}>
      {title && (
        <h2 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '20px', letterSpacing: '-0.01em' }}>
          {title}
        </h2>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' }}>
        {/* Chart */}
        <DonutChart
          segments={segments}
          size={220}
          strokeWidth={30}
          onSegmentHover={setHovered}
          centerContent={
            <AnimatePresence mode="wait">
              <motion.div
                key={displayLabel}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.18 }}
                style={{ textAlign: 'center' }}
              >
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {displayLabel}
                </div>
                <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>
                  {displayValue.toLocaleString()}
                </div>
                {displayPct && (
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    {displayPct}%
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          }
        />

        {/* Legend */}
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '6px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
          {segments.map((seg, idx) => (
            <motion.div
              key={seg.id}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 + idx * 0.07, duration: 0.3 }}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '8px 10px', borderRadius: '8px', cursor: 'pointer',
                background: hovered?.id === seg.id ? 'var(--bg-secondary)' : 'transparent',
                transition: 'background 0.15s',
              }}
              onMouseEnter={() => setHovered(seg)}
              onMouseLeave={() => setHovered(null)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: seg.color, flexShrink: 0 }} />
                <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>{seg.label}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {total > 0 && (
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    {((seg.value / total) * 100).toFixed(1)}%
                  </span>
                )}
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  {seg.value.toLocaleString()}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ─── Config Form ─── */

export function DonutChartConfigForm({ config, onChange }: ConfigFormProps) {
  const title = (config.title as string) || ''
  const segments = (config.segments as Segment[]) || []

  const labelStyle: React.CSSProperties = {
    fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)',
    textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px', display: 'block',
  }

  const addSegment = () => {
    const newSeg: Segment = {
      id: `seg-${Date.now()}`,
      label: `항목 ${segments.length + 1}`,
      value: 10,
      color: DEFAULT_COLORS[segments.length % DEFAULT_COLORS.length],
    }
    onChange({ ...config, segments: [...segments, newSeg] })
  }

  const updateSegment = (idx: number, updates: Partial<Segment>) => {
    onChange({ ...config, segments: segments.map((s, i) => i === idx ? { ...s, ...updates } : s) })
  }

  const removeSegment = (idx: number) => {
    onChange({ ...config, segments: segments.filter((_, i) => i !== idx) })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div>
        <label style={labelStyle}>제목</label>
        <input
          className="input"
          value={title}
          onChange={e => onChange({ ...config, title: e.target.value })}
          placeholder="차트 제목 (선택)"
          style={{ fontSize: '13px' }}
        />
      </div>

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <label style={{ ...labelStyle, marginBottom: 0 }}>데이터 항목 ({segments.length})</label>
          <button type="button" onClick={addSegment} className="btn-primary" style={{ padding: '4px 10px', fontSize: '12px' }}>
            + 추가
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {segments.map((seg, idx) => (
            <div key={seg.id} style={{ display: 'flex', gap: '6px', alignItems: 'center', background: 'var(--bg-secondary)', borderRadius: '8px', padding: '8px 10px' }}>
              {/* Color picker */}
              <input
                type="color"
                value={seg.color}
                onChange={e => updateSegment(idx, { color: e.target.value })}
                style={{ width: '32px', height: '32px', border: 'none', borderRadius: '6px', cursor: 'pointer', padding: '2px', background: 'transparent', flexShrink: 0 }}
                title="색상 선택"
              />
              {/* Label */}
              <input
                className="input"
                value={seg.label}
                onChange={e => updateSegment(idx, { label: e.target.value })}
                placeholder="항목명"
                style={{ fontSize: '12px', flex: 2 }}
              />
              {/* Value */}
              <input
                className="input"
                type="number"
                min={0}
                value={seg.value}
                onChange={e => updateSegment(idx, { value: Number(e.target.value) })}
                placeholder="값"
                style={{ fontSize: '12px', flex: 1 }}
              />
              <button
                type="button"
                onClick={() => removeSegment(idx)}
                className="btn-danger"
                style={{ padding: '6px 8px', flexShrink: 0 }}
              >
                ✕
              </button>
            </div>
          ))}
          {segments.length === 0 && (
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', padding: '16px' }}>
              항목을 추가해주세요
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
