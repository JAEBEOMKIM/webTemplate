'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { ComponentProps, ConfigFormProps } from '../types'

interface GalleryImage {
  url: string
  caption: string
}

export function ImageGalleryComponent({ config }: ComponentProps) {
  const [current, setCurrent] = useState(0)

  const title = (config.title as string) || '갤러리'
  const autoplay = (config.autoplay as boolean) !== false
  const interval = (config.interval as number) || 3000
  const images = (config.images as GalleryImage[]) || []

  const next = useCallback(() => setCurrent(c => (c + 1) % images.length), [images.length])
  const prev = () => setCurrent(c => (c - 1 + images.length) % images.length)

  useEffect(() => {
    if (!autoplay || images.length === 0) return
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

  return (
    <div style={{ padding: '16px' }}>
      <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '12px', color: 'var(--text-primary)' }}>{title}</h2>

      <div style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', background: '#000', aspectRatio: '16/9' }}>
        <img
          src={images[current]?.url}
          alt={images[current]?.caption || ''}
          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
        />
        {images[current]?.caption && (
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.6)', color: 'white', fontSize: '13px', padding: '8px 12px', textAlign: 'center' }}>
            {images[current].caption}
          </div>
        )}
        {images.length > 1 && (
          <>
            <button onClick={prev} style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', fontSize: '12px' }}>◀</button>
            <button onClick={next} style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', fontSize: '12px' }}>▶</button>
          </>
        )}
      </div>

      {images.length > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginTop: '10px' }}>
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              style={{ width: '8px', height: '8px', borderRadius: '50%', border: 'none', cursor: 'pointer', background: i === current ? 'var(--accent)' : 'var(--border)', padding: 0, transition: 'background 0.2s' }}
            />
          ))}
        </div>
      )}

      {images.length > 1 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '6px', marginTop: '10px' }}>
          {images.map((img, i) => (
            <img
              key={i}
              src={img.url}
              alt={img.caption || ''}
              onClick={() => setCurrent(i)}
              style={{
                width: '100%', height: '60px', objectFit: 'cover', borderRadius: '6px', cursor: 'pointer',
                outline: i === current ? `2px solid var(--accent)` : 'none',
                opacity: i === current ? 1 : 0.6,
                transition: 'opacity 0.15s',
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function ImageGalleryConfigForm({ config, onChange }: ConfigFormProps) {
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')

  const images = (config.images as GalleryImage[]) || []

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    setUploading(true)
    setUploadError('')

    const newImages: GalleryImage[] = []
    for (const file of files) {
      const ext = file.name.split('.').pop()
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error } = await supabase.storage
        .from('gallery-images')
        .upload(path, file, { cacheControl: '3600', upsert: false })

      if (error) {
        setUploadError(`업로드 실패: ${error.message}`)
        continue
      }
      const { data: urlData } = supabase.storage.from('gallery-images').getPublicUrl(path)
      newImages.push({ url: urlData.publicUrl, caption: '' })
    }

    if (newImages.length > 0) {
      onChange({ ...config, images: [...images, ...newImages] })
    }
    setUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleRemoveImage = async (idx: number) => {
    const img = images[idx]
    // Optionally delete from storage
    try {
      const path = img.url.split('/gallery-images/')[1]
      if (path) await supabase.storage.from('gallery-images').remove([path])
    } catch {}
    onChange({ ...config, images: images.filter((_, i) => i !== idx) })
  }

  const handleCaptionChange = (idx: number, caption: string) => {
    const updated = images.map((img, i) => i === idx ? { ...img, caption } : img)
    onChange({ ...config, images: updated })
  }

  const handleMoveImage = (idx: number, dir: -1 | 1) => {
    const newIdx = idx + dir
    if (newIdx < 0 || newIdx >= images.length) return
    const updated = [...images]
    ;[updated[idx], updated[newIdx]] = [updated[newIdx], updated[idx]]
    onChange({ ...config, images: updated })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Title */}
      <div>
        <label className="label">갤러리 제목</label>
        <input
          className="input"
          value={(config.title as string) || ''}
          onChange={e => onChange({ ...config, title: e.target.value })}
          style={{ fontSize: '13px' }}
        />
      </div>

      {/* Autoplay */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <input
          type="checkbox"
          id="autoplay-toggle"
          checked={(config.autoplay as boolean) !== false}
          onChange={e => onChange({ ...config, autoplay: e.target.checked })}
          style={{ width: '14px', height: '14px', accentColor: 'var(--accent)' }}
        />
        <label htmlFor="autoplay-toggle" style={{ fontSize: '13px', color: 'var(--text-primary)', cursor: 'pointer' }}>자동 슬라이드</label>
      </div>

      {(config.autoplay as boolean) !== false && (
        <div>
          <label className="label">슬라이드 간격 (ms)</label>
          <input
            type="number"
            className="input"
            value={(config.interval as number) || 3000}
            min={500}
            step={500}
            onChange={e => onChange({ ...config, interval: parseInt(e.target.value) })}
            style={{ fontSize: '13px' }}
          />
        </div>
      )}

      {/* Image upload */}
      <div>
        <label className="label">이미지 업로드</label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          onChange={handleFileUpload}
          style={{ display: 'none' }}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="btn-secondary"
          style={{ width: '100%', justifyContent: 'center', fontSize: '13px' }}
        >
          {uploading ? '업로드 중...' : '📁 이미지 파일 선택'}
        </button>
        {uploadError && (
          <p style={{ fontSize: '11px', color: 'var(--danger)', marginTop: '4px' }}>{uploadError}</p>
        )}
        <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
          JPG, PNG, WebP, GIF · 최대 5MB · 여러 파일 선택 가능
        </p>
      </div>

      {/* Image list */}
      {images.length > 0 && (
        <div>
          <label className="label">이미지 목록 ({images.length}장)</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {images.map((img, idx) => (
              <div key={idx} style={{ border: '1px solid var(--border)', borderRadius: '10px', overflow: 'hidden', background: 'var(--bg-secondary)' }}>
                <img
                  src={img.url}
                  alt={img.caption}
                  style={{ width: '100%', height: '80px', objectFit: 'cover', display: 'block' }}
                />
                <div style={{ padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <input
                    className="input"
                    placeholder="캡션 (선택)"
                    value={img.caption}
                    onChange={e => handleCaptionChange(idx, e.target.value)}
                    style={{ fontSize: '12px', padding: '6px 8px' }}
                  />
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
