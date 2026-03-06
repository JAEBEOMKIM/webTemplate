'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { ComponentProps, ConfigFormProps } from '../types'

interface GalleryImage {
  url: string
  caption: string
}

type TransitionEffect = 'none' | 'fade' | 'slide' | 'zoom'

// Inject keyframes once into document head
function useGalleryKeyframes() {
  useEffect(() => {
    if (document.getElementById('gallery-keyframes')) return
    const style = document.createElement('style')
    style.id = 'gallery-keyframes'
    style.textContent = `
      @keyframes glFadeIn    { from { opacity: 0 }                          to { opacity: 1 } }
      @keyframes glSlideInR  { from { transform: translateX(100%) }         to { transform: translateX(0) } }
      @keyframes glSlideInL  { from { transform: translateX(-100%) }        to { transform: translateX(0) } }
      @keyframes glZoomIn    { from { transform: scale(1.08); opacity: 0 }  to { transform: scale(1); opacity: 1 } }
    `
    document.head.appendChild(style)
  }, [])
}

function getAnimation(effect: TransitionEffect, dir: number): string {
  const t = '0.45s cubic-bezier(0.4,0,0.2,1)'
  switch (effect) {
    case 'fade':  return `glFadeIn ${t}`
    case 'slide': return dir >= 0 ? `glSlideInR ${t}` : `glSlideInL ${t}`
    case 'zoom':  return `glZoomIn ${t}`
    default:      return 'none'
  }
}

// ──────────────────────────────────────────────
// Display component
// ──────────────────────────────────────────────
export function ImageGalleryComponent({ config }: ComponentProps) {
  const [current, setCurrent] = useState(0)
  const [dir, setDir] = useState(1)   // +1 = forward, -1 = backward
  const [imgKey, setImgKey] = useState(0) // force re-mount to replay animation

  useGalleryKeyframes()

  const title       = (config.title as string) || '갤러리'
  const autoplay    = (config.autoplay as boolean) !== false
  const interval    = (config.interval as number) || 3000
  const images      = (config.images as GalleryImage[]) || []
  const showThumbnails = (config.show_thumbnails as boolean) !== false
  const imageFit    = (config.image_fit as 'contain' | 'cover') || 'contain'
  const effect      = (config.transition_effect as TransitionEffect) || 'fade'

  const go = useCallback((nextIdx: number, direction: number) => {
    setDir(direction)
    setCurrent(nextIdx)
    setImgKey(k => k + 1)
  }, [])

  const next = useCallback(() => go((current + 1) % images.length, 1), [current, images.length, go])
  const prev = useCallback(() => go((current - 1 + images.length) % images.length, -1), [current, images.length, go])

  useEffect(() => {
    if (!autoplay || images.length <= 1) return
    const timer = setInterval(next, interval)
    return () => clearInterval(timer)
  }, [autoplay, interval, images.length, next])

  if (images.length === 0) {
    return (
      <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <div style={{ fontSize: '40px', marginBottom: '8px' }}>🖼️</div>
        <p style={{ fontWeight: 600, marginBottom: '4px' }}>{title}</p>
        <p style={{ fontSize: '13px' }}>이미지가 없습니다. 관리자 패널에서 이미지를 추가하세요.</p>
      </div>
    )
  }

  const animation = images.length > 1 ? getAnimation(effect, dir) : 'none'

  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', height: '100%', boxSizing: 'border-box' }}>
      <h2 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '10px', color: 'var(--text-primary)', flexShrink: 0 }}>{title}</h2>

      {/* Slide area */}
      <div style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', background: '#000', flex: 1, minHeight: 0 }}>
        <img
          key={imgKey}
          src={images[current]?.url}
          alt={images[current]?.caption || ''}
          style={{
            width: '100%', height: '100%',
            objectFit: imageFit,
            display: 'block',
            animation,
          }}
        />
        {images[current]?.caption && (
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.6)', color: 'white', fontSize: '12px', padding: '6px 12px', textAlign: 'center' }}>
            {images[current].caption}
          </div>
        )}
        {images.length > 1 && (
          <>
            <button
              onClick={prev}
              style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.45)', color: 'white', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.15s' }}
              onMouseOver={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.7)')}
              onMouseOut={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.45)')}
            >◀</button>
            <button
              onClick={next}
              style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.45)', color: 'white', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.15s' }}
              onMouseOver={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.7)')}
              onMouseOut={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.45)')}
            >▶</button>
          </>
        )}
      </div>

      {/* Dot indicators */}
      {images.length > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginTop: '8px', flexShrink: 0 }}>
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => go(i, i >= current ? 1 : -1)}
              style={{ width: i === current ? '18px' : '8px', height: '8px', borderRadius: '4px', border: 'none', cursor: 'pointer', background: i === current ? 'var(--accent)' : 'var(--border)', padding: 0, transition: 'all 0.25s' }}
            />
          ))}
        </div>
      )}

      {/* Thumbnail strip */}
      {images.length > 1 && showThumbnails && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(72px, 1fr))', gap: '5px', marginTop: '8px', flexShrink: 0 }}>
          {images.map((img, i) => (
            <img
              key={i}
              src={img.url}
              alt={img.caption || ''}
              onClick={() => go(i, i >= current ? 1 : -1)}
              style={{
                width: '100%', height: '52px', objectFit: 'cover', borderRadius: '6px', cursor: 'pointer',
                outline: i === current ? `2px solid var(--accent)` : 'none',
                opacity: i === current ? 1 : 0.55,
                transition: 'opacity 0.15s, outline 0.15s',
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ──────────────────────────────────────────────
// Config form
// ──────────────────────────────────────────────
export function ImageGalleryConfigForm({ config, onChange }: ConfigFormProps) {
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')

  const images    = (config.images as GalleryImage[]) || []
  const autoplay  = (config.autoplay as boolean) !== false
  const effect    = (config.transition_effect as TransitionEffect) || 'fade'
  const imageFit  = (config.image_fit as string) || 'contain'

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return
    setUploading(true); setUploadError('')
    const newImages: GalleryImage[] = []
    for (const file of files) {
      const ext = file.name.split('.').pop()
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error } = await supabase.storage.from('gallery-images').upload(path, file, { cacheControl: '3600', upsert: false })
      if (error) { setUploadError(`업로드 실패: ${error.message}`); continue }
      const { data: urlData } = supabase.storage.from('gallery-images').getPublicUrl(path)
      newImages.push({ url: urlData.publicUrl, caption: '' })
    }
    if (newImages.length > 0) onChange({ ...config, images: [...images, ...newImages] })
    setUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleRemoveImage = async (idx: number) => {
    const img = images[idx]
    try {
      const path = img.url.split('/gallery-images/')[1]
      if (path) await supabase.storage.from('gallery-images').remove([path])
    } catch {}
    onChange({ ...config, images: images.filter((_, i) => i !== idx) })
  }

  const handleCaptionChange = (idx: number, caption: string) => {
    onChange({ ...config, images: images.map((img, i) => i === idx ? { ...img, caption } : img) })
  }

  const handleMoveImage = (idx: number, dir: -1 | 1) => {
    const newIdx = idx + dir
    if (newIdx < 0 || newIdx >= images.length) return
    const updated = [...images]
    ;[updated[idx], updated[newIdx]] = [updated[newIdx], updated[idx]]
    onChange({ ...config, images: updated })
  }

  const labelStyle: React.CSSProperties = {
    fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)',
    textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px', display: 'block',
  }
  const rowStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '8px' }

  const EFFECTS: { value: TransitionEffect; label: string }[] = [
    { value: 'none',  label: '없음' },
    { value: 'fade',  label: '페이드' },
    { value: 'slide', label: '슬라이드' },
    { value: 'zoom',  label: '줌인' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Title */}
      <div>
        <label style={labelStyle}>갤러리 제목</label>
        <input className="input" value={(config.title as string) || ''} onChange={e => onChange({ ...config, title: e.target.value })} style={{ fontSize: '13px' }} />
      </div>

      {/* Autoplay */}
      <div style={rowStyle}>
        <input type="checkbox" id="autoplay-toggle" checked={autoplay}
          onChange={e => onChange({ ...config, autoplay: e.target.checked })}
          style={{ width: '14px', height: '14px', accentColor: 'var(--accent)' }} />
        <label htmlFor="autoplay-toggle" style={{ fontSize: '13px', color: 'var(--text-primary)', cursor: 'pointer' }}>자동 슬라이드</label>
      </div>

      {/* Interval — shown as seconds */}
      {autoplay && (
        <div>
          <label style={labelStyle}>
            이미지 변경 시간&nbsp;
            <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: 'var(--accent-text)' }}>
              {((config.interval as number) || 3000) / 1000}초
            </span>
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input
              type="range"
              min={500} max={10000} step={500}
              value={(config.interval as number) || 3000}
              onChange={e => onChange({ ...config, interval: parseInt(e.target.value) })}
              style={{ flex: 1, accentColor: 'var(--accent)' }}
            />
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', minWidth: '36px', textAlign: 'right' }}>
              {((config.interval as number) || 3000) / 1000}s
            </span>
          </div>
        </div>
      )}

      {/* Transition effect */}
      <div>
        <label style={labelStyle}>이미지 전환 효과</label>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {EFFECTS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => onChange({ ...config, transition_effect: value })}
              className={effect === value ? 'btn-primary' : 'btn-secondary'}
              style={{ padding: '4px 12px', fontSize: '12px' }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Image fit */}
      <div>
        <label style={labelStyle}>이미지 크기 맞춤</label>
        <div style={{ display: 'flex', gap: '6px' }}>
          {[
            { value: 'contain', label: '축소 맞춤', desc: '이미지 전체 표시 (여백 생길 수 있음)' },
            { value: 'cover',   label: '꽉 채우기', desc: '컴포넌트에 꽉 채움 (이미지 잘릴 수 있음)' },
          ].map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange({ ...config, image_fit: opt.value })}
              className={imageFit === opt.value ? 'btn-primary' : 'btn-secondary'}
              style={{ padding: '4px 12px', fontSize: '12px', flex: 1 }}
              title={opt.desc}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
          {imageFit === 'contain' ? '이미지 전체가 표시되며 빈 공간이 생길 수 있습니다.' : '컴포넌트를 꽉 채우며 이미지 가장자리가 잘릴 수 있습니다.'}
        </p>
      </div>

      {/* Thumbnails */}
      <div style={rowStyle}>
        <input type="checkbox" id="show-thumbnails-toggle"
          checked={(config.show_thumbnails as boolean) !== false}
          onChange={e => onChange({ ...config, show_thumbnails: e.target.checked })}
          style={{ width: '14px', height: '14px', accentColor: 'var(--accent)' }} />
        <label htmlFor="show-thumbnails-toggle" style={{ fontSize: '13px', color: 'var(--text-primary)', cursor: 'pointer' }}>하단 이미지 목록 표시</label>
      </div>

      {/* Image upload */}
      <div>
        <label style={labelStyle}>이미지 업로드</label>
        <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple onChange={handleFileUpload} style={{ display: 'none' }} />
        <button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="btn-secondary" style={{ width: '100%', justifyContent: 'center', fontSize: '13px' }}>
          {uploading ? '업로드 중...' : '📁 이미지 파일 선택'}
        </button>
        {uploadError && <p style={{ fontSize: '11px', color: 'var(--danger)', marginTop: '4px' }}>{uploadError}</p>}
        <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>JPG, PNG, WebP, GIF · 최대 5MB · 여러 파일 선택 가능</p>
      </div>

      {/* Image list */}
      {images.length > 0 && (
        <div>
          <label style={labelStyle}>이미지 목록 ({images.length}장)</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {images.map((img, idx) => (
              <div key={idx} style={{ border: '1px solid var(--border)', borderRadius: '10px', overflow: 'hidden', background: 'var(--bg-secondary)' }}>
                <img src={img.url} alt={img.caption} style={{ width: '100%', height: '80px', objectFit: 'cover', display: 'block' }} />
                <div style={{ padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <input className="input" placeholder="캡션 (선택)" value={img.caption} onChange={e => handleCaptionChange(idx, e.target.value)} style={{ fontSize: '12px', padding: '6px 8px' }} />
                  <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                    <button onClick={() => handleMoveImage(idx, -1)} className="btn-ghost" style={{ padding: '3px 7px', fontSize: '11px' }} disabled={idx === 0}>↑</button>
                    <button onClick={() => handleMoveImage(idx, 1)} className="btn-ghost" style={{ padding: '3px 7px', fontSize: '11px' }} disabled={idx === images.length - 1}>↓</button>
                    <button onClick={() => handleRemoveImage(idx)} className="btn-danger" style={{ padding: '3px 7px', fontSize: '11px' }}>삭제</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
