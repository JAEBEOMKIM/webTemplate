'use client'

import { useState, useRef, type CSSProperties } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { ComponentProps, ConfigFormProps } from '../types'
import { ImageGalleryComponent } from '../image-gallery/ImageGalleryComponent'
import { KakaoMapComponent } from '../kakaomap/KakaoMapComponent'
import { ShareComponent } from '../share/ShareComponent'

// ── 타입 ──────────────────────────────────────────────────────
interface PhotoItem {
  url: string
  alt?: string
}

interface InfoItem {
  id: string
  icon: string  // material icons name
  primary: string
  secondary?: string
}

interface PlaceDetailConfig {
  // Header
  title?: string
  description?: string

  // Photo strip (built-in horizontal scroll)
  show_photos?: boolean
  photos?: PhotoItem[]

  // Quick info cards
  show_info?: boolean
  info_items?: InfoItem[]

  // Image gallery (embeds ImageGalleryComponent)
  show_gallery?: boolean
  gallery_section_title?: string
  gallery_config?: Record<string, unknown>

  // Map (embeds KakaoMapComponent)
  show_map?: boolean
  map_section_title?: string
  map_config?: Record<string, unknown>

  // Share (embeds ShareComponent)
  show_share?: boolean
  share_section_title?: string
  share_config?: Record<string, unknown>
}

// 모듈 레벨 상수 — 빈 객체를 매 렌더마다 새로 만들지 않도록 호이스트
// (rerender-memo-with-default-value)
const EMPTY_CONFIG: Record<string, unknown> = Object.freeze({})

// ── 메인 컴포넌트 ─────────────────────────────────────────────
export function PlaceDetailComponent({ componentId, pageId, config, isAdmin }: ComponentProps) {
  const cfg = config as unknown as PlaceDetailConfig

  const showPhotos = cfg.show_photos !== false && (cfg.photos?.length ?? 0) > 0
  const showInfo = cfg.show_info !== false && (cfg.info_items?.length ?? 0) > 0
  const showGallery = cfg.show_gallery !== false && cfg.gallery_config != null
  const showMap = cfg.show_map !== false && cfg.map_config != null
  const showShare = cfg.show_share !== false && cfg.share_config != null

  return (
    <div className="pd-root" style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '24px', color: 'var(--text-primary)' }}>
      {/* Header */}
      {(cfg.title || cfg.description) && (
        <header style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {cfg.title && (
            <h1 style={{ fontSize: '30px', lineHeight: '38px', letterSpacing: '-0.02em', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
              {cfg.title}
            </h1>
          )}
          {cfg.description && (
            <p style={{ fontSize: '16px', lineHeight: '24px', color: 'var(--text-muted)', margin: 0, whiteSpace: 'pre-wrap' }}>
              {cfg.description}
            </p>
          )}
        </header>
      )}

      {/* Photo strip — horizontal scroll */}
      {showPhotos && <PhotoStrip photos={cfg.photos!} />}

      {/* Quick info */}
      {showInfo && <QuickInfo items={cfg.info_items!} />}

      {/* Embedded ImageGallery */}
      {showGallery && (
        <section style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {cfg.gallery_section_title && (
            <SectionTitle>{cfg.gallery_section_title}</SectionTitle>
          )}
          <div style={{
            position: 'relative',
            height: `${(cfg.gallery_config as { height?: number })?.height ?? 320}px`,
            borderRadius: '12px',
            overflow: 'hidden',
          }}>
            <ImageGalleryComponent
              componentId={`${componentId}-gallery`}
              pageId={pageId}
              config={cfg.gallery_config ?? EMPTY_CONFIG}
              isAdmin={isAdmin}
            />
          </div>
        </section>
      )}

      {/* Embedded KakaoMap */}
      {showMap && (
        <section style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {cfg.map_section_title && (
            <SectionTitle>{cfg.map_section_title}</SectionTitle>
          )}
          {/* 명시적 높이 wrapper — KakaoMap의 height:100% 캐스케이드를 위해 부모에 고정 픽셀 높이 필요 */}
          <div style={{
            position: 'relative',
            height: `${(cfg.map_config as { height?: number })?.height ?? 240}px`,
            borderRadius: '12px',
            overflow: 'hidden',
          }}>
            <KakaoMapComponent
              componentId={`${componentId}-map`}
              pageId={pageId}
              config={cfg.map_config ?? EMPTY_CONFIG}
              isAdmin={isAdmin}
            />
          </div>
        </section>
      )}

      {/* Embedded Share */}
      {showShare && (
        <section style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {cfg.share_section_title && (
            <SectionTitle>{cfg.share_section_title}</SectionTitle>
          )}
          <div style={{ position: 'relative' }}>
            <ShareComponent
              componentId={`${componentId}-share`}
              pageId={pageId}
              config={cfg.share_config ?? EMPTY_CONFIG}
              isAdmin={isAdmin}
            />
          </div>
        </section>
      )}
    </div>
  )
}

// ── Sub-components (모듈 레벨 — rendering-hoist-jsx) ──────────
function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 style={{ fontSize: '20px', lineHeight: '28px', fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>
      {children}
    </h3>
  )
}

function PhotoStrip({ photos }: { photos: PhotoItem[] }) {
  return (
    <section
      style={{
        display: 'flex',
        gap: '8px',
        overflowX: 'auto',
        overflowY: 'hidden',
        paddingBottom: '8px',
        scrollSnapType: 'x mandatory',
        WebkitOverflowScrolling: 'touch',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
      }}
      className="pd-photo-strip"
    >
      {photos.map((photo, i) => (
        <div
          key={i}
          style={{
            flex: '0 0 auto',
            width: '256px',
            height: '192px',
            borderRadius: '12px',
            overflow: 'hidden',
            background: 'var(--bg-secondary)',
            scrollSnapAlign: 'start',
          }}
        >
          <img
            src={photo.url}
            alt={photo.alt || ''}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            loading="lazy"
          />
        </div>
      ))}
      <style>{`.pd-photo-strip::-webkit-scrollbar { display: none; }`}</style>
    </section>
  )
}

function QuickInfo({ items }: { items: InfoItem[] }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    // 첫 번째 항목을 제외한 나머지 항목들의 primary + secondary 를 줄바꿈으로 결합
    const text = items
      .slice(1)
      .map(it => [it.primary, it.secondary].filter(Boolean).join('\n'))
      .filter(Boolean)
      .join('\n')
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // fallback (오래된 브라우저용)
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      try { document.execCommand('copy') } catch {}
      document.body.removeChild(ta)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    }
  }

  // 복사 가능한 텍스트가 실제로 있는지 (2번째 항목 이후 텍스트 존재 여부)
  const hasCopyContent = items
    .slice(1)
    .some(it => (it.primary || it.secondary || '').trim().length > 0)

  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {items.map((item, idx) => {
        const isFirst = idx === 0
        const isLast = idx === items.length - 1
        return (
          <div
            key={item.id}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '16px',
              paddingBottom: isLast ? '0' : '16px',
              borderBottom: isLast ? 'none' : '1px solid var(--border)',
            }}
          >
            <div
              style={{
                background: 'var(--bg-secondary)',
                padding: '8px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <span
                className="material-symbols-outlined"
                style={{ color: 'var(--accent)', fontSize: '24px', lineHeight: 1 }}
                aria-hidden="true"
              >
                {item.icon}
              </span>
            </div>
            <div style={{ flex: 1, minWidth: 0, paddingTop: '2px' }}>
              <p style={{
                margin: 0,
                fontSize: '16px',
                lineHeight: '24px',
                fontWeight: isFirst ? 700 : 400,
                color: 'var(--text-primary)',
                wordBreak: 'break-word',
              }}>
                {item.primary}
              </p>
              {item.secondary && (
                <p style={{ margin: '2px 0 0 0', fontSize: '14px', lineHeight: '20px', color: 'var(--text-muted)', wordBreak: 'break-word' }}>
                  {item.secondary}
                </p>
              )}
            </div>
            {/* 첫 번째 항목 우측에 복사 버튼 — 2번째 이후 모든 항목의 텍스트를 클립보드에 복사 */}
            {isFirst && hasCopyContent && (
              <button
                type="button"
                onClick={handleCopy}
                aria-label={copied ? '복사됨' : '정보 복사'}
                title={copied ? '복사됨' : '아래 정보 복사하기'}
                style={{
                  flexShrink: 0,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '6px 10px',
                  borderRadius: '999px',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: copied ? 'var(--accent)' : 'var(--text-muted)',
                  background: copied ? 'rgba(59,130,246,0.1)' : 'var(--bg-secondary)',
                  border: '1px solid var(--border)',
                  cursor: 'pointer',
                  transition: 'background 0.2s ease, color 0.2s ease, transform 0.15s ease',
                  whiteSpace: 'nowrap',
                  alignSelf: 'flex-start',
                  marginTop: '2px',
                }}
                onMouseDown={e => e.currentTarget.style.transform = 'scale(0.96)'}
                onMouseUp={e => e.currentTarget.style.transform = ''}
                onMouseLeave={e => e.currentTarget.style.transform = ''}
              >
                <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: '16px', lineHeight: 1 }}>
                  {copied ? 'check' : 'content_copy'}
                </span>
                {copied ? '복사됨' : '복사'}
              </button>
            )}
          </div>
        )
      })}
    </section>
  )
}

// ──────────────────────────────────────────────────────────────
// Config Form
// ──────────────────────────────────────────────────────────────

const labelStyle: CSSProperties = {
  fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)',
  textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px', display: 'block',
}
const miniLabelStyle: CSSProperties = {
  fontSize: '10px', color: 'var(--text-muted)', marginBottom: '3px', display: 'block',
}
const sectionStyle: CSSProperties = {
  padding: '12px', borderRadius: '10px', background: 'var(--bg-secondary)',
  border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '8px',
}

export function PlaceDetailConfigForm({ config, onChange }: ConfigFormProps) {
  const cfg = config as unknown as PlaceDetailConfig

  const set = (patch: Partial<PlaceDetailConfig>) =>
    onChange({ ...config, ...patch } as Record<string, unknown>)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', padding: '12px' }}>
      {/* 헤더 */}
      <div style={sectionStyle}>
        <SectionLabel>① 헤더 (제목 + 설명)</SectionLabel>
        <div>
          <label style={miniLabelStyle}>제목</label>
          <input className="input" value={cfg.title ?? ''} onChange={e => set({ title: e.target.value })} placeholder="예: Creative Hub" />
        </div>
        <div>
          <label style={miniLabelStyle}>설명</label>
          <textarea className="input" rows={3} value={cfg.description ?? ''} onChange={e => set({ description: e.target.value })} placeholder="장소나 시설에 대한 설명" />
        </div>
      </div>

      {/* 사진 스트립 */}
      <PhotosSection cfg={cfg} set={set} />

      {/* 빠른 정보 */}
      <InfoSection cfg={cfg} set={set} />

      {/* 이미지 갤러리 */}
      <EmbeddedSection
        title="④ 이미지 갤러리 (ImageGallery 컴포넌트)"
        showKey="show_gallery"
        configKey="gallery_config"
        titleKey="gallery_section_title"
        defaultTitle="갤러리"
        cfg={cfg}
        set={set}
      >
        <GalleryConfigEditor
          value={cfg.gallery_config ?? {}}
          onChange={(v) => set({ gallery_config: v })}
        />
      </EmbeddedSection>

      {/* 카카오맵 */}
      <EmbeddedSection
        title="⑤ 위치 (KakaoMap 컴포넌트)"
        showKey="show_map"
        configKey="map_config"
        titleKey="map_section_title"
        defaultTitle="위치"
        cfg={cfg}
        set={set}
      >
        <MapConfigEditor
          value={cfg.map_config ?? {}}
          onChange={(v) => set({ map_config: v })}
        />
      </EmbeddedSection>

      {/* 공유하기 */}
      <EmbeddedSection
        title="⑥ 공유하기 (Share 컴포넌트)"
        showKey="show_share"
        configKey="share_config"
        titleKey="share_section_title"
        defaultTitle="공유하기"
        cfg={cfg}
        set={set}
      >
        <ShareConfigEditor
          value={cfg.share_config ?? {}}
          onChange={(v) => set({ share_config: v })}
        />
      </EmbeddedSection>
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <label style={{ ...labelStyle, marginBottom: 0 }}>{children}</label>
}

// ── 사진 스트립 편집 ──────────────────────────────────────────
function PhotosSection({ cfg, set }: {
  cfg: PlaceDetailConfig
  set: (patch: Partial<PlaceDetailConfig>) => void
}) {
  const photos = cfg.photos ?? []
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return
    setUploading(true)
    setUploadError(null)
    try {
      const supabase = createClient()
      const uploaded: PhotoItem[] = []
      for (const file of files) {
        const ext = (file.name.split('.').pop() || 'jpg').toLowerCase()
        const path = `place-detail/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
        const { error } = await supabase.storage
          .from('gallery-images')
          .upload(path, file, { cacheControl: '3600', upsert: false })
        if (error) {
          setUploadError(`업로드 실패: ${error.message}`)
          continue
        }
        const { data } = supabase.storage.from('gallery-images').getPublicUrl(path)
        uploaded.push({ url: data.publicUrl, alt: '' })
      }
      if (uploaded.length > 0) set({ photos: [...photos, ...uploaded] })
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const removePhoto = async (idx: number) => {
    const photo = photos[idx]
    if (photo.url.includes('/gallery-images/')) {
      try {
        const supabase = createClient()
        const path = photo.url.split('/gallery-images/')[1]
        if (path) await supabase.storage.from('gallery-images').remove([decodeURIComponent(path)])
      } catch {}
    }
    set({ photos: photos.filter((_, i) => i !== idx) })
  }

  return (
    <div style={sectionStyle}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
        <SectionLabel>② 사진 스트립 (가로 스크롤)</SectionLabel>
        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>
          <input type="checkbox" checked={cfg.show_photos !== false} onChange={e => set({ show_photos: e.target.checked })} />
          표시
        </label>
      </div>

      <div style={{ display: 'flex', gap: '6px' }}>
        <button
          type="button"
          className="btn-secondary"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          style={{ fontSize: '12px', padding: '6px 12px' }}
        >
          {uploading ? '업로드중...' : '📷 사진 추가 (다중)'}
        </button>
        <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleUpload} style={{ display: 'none' }} />
      </div>

      {uploadError && (
        <div style={{ fontSize: '11px', color: 'var(--danger, #ef4444)', padding: '4px 8px', background: 'rgba(239,68,68,0.08)', borderRadius: '6px' }}>
          {uploadError}
        </div>
      )}

      {photos.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '6px' }}>
          {photos.map((photo, idx) => (
            <div key={idx} style={{ position: 'relative', aspectRatio: '4/3', borderRadius: '6px', overflow: 'hidden', border: '1px solid var(--border)' }}>
              <img src={photo.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <button
                type="button"
                onClick={() => removePhoto(idx)}
                aria-label="삭제"
                style={{
                  position: 'absolute', top: '2px', right: '2px',
                  width: '20px', height: '20px', borderRadius: '50%',
                  background: 'rgba(0,0,0,0.65)', color: '#fff', border: 'none',
                  fontSize: '12px', cursor: 'pointer', lineHeight: 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >×</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── 빠른 정보 편집 ────────────────────────────────────────────
function InfoSection({ cfg, set }: {
  cfg: PlaceDetailConfig
  set: (patch: Partial<PlaceDetailConfig>) => void
}) {
  const items = cfg.info_items ?? []

  const update = (id: string, patch: Partial<InfoItem>) => {
    set({ info_items: items.map(it => it.id === id ? { ...it, ...patch } : it) })
  }
  const remove = (id: string) => {
    set({ info_items: items.filter(it => it.id !== id) })
  }
  const add = () => {
    set({
      info_items: [
        ...items,
        { id: `info-${Date.now()}`, icon: 'location_on', primary: '', secondary: '' },
      ],
    })
  }

  return (
    <div style={sectionStyle}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
        <SectionLabel>③ 빠른 정보 (아이콘 + 텍스트)</SectionLabel>
        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>
          <input type="checkbox" checked={cfg.show_info !== false} onChange={e => set({ show_info: e.target.checked })} />
          표시
        </label>
      </div>

      {items.map(item => (
        <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '90px 1fr 1fr auto', gap: '6px', alignItems: 'center' }}>
          <input
            className="input"
            value={item.icon}
            onChange={e => update(item.id, { icon: e.target.value })}
            placeholder="icon"
            title="Material Icons name (예: location_on, call, mail, schedule)"
          />
          <input
            className="input"
            value={item.primary}
            onChange={e => update(item.id, { primary: e.target.value })}
            placeholder="주 텍스트"
          />
          <input
            className="input"
            value={item.secondary ?? ''}
            onChange={e => update(item.id, { secondary: e.target.value })}
            placeholder="보조 텍스트 (선택)"
          />
          <button type="button" className="btn-danger" onClick={() => remove(item.id)} style={{ padding: '4px 10px', fontSize: '11px' }}>
            삭제
          </button>
        </div>
      ))}

      <button type="button" className="btn-secondary" onClick={add} style={{ fontSize: '12px', padding: '6px 12px', alignSelf: 'flex-start' }}>
        + 정보 추가
      </button>

      <div style={{ fontSize: '10px', color: 'var(--text-muted)', lineHeight: 1.4 }}>
        아이콘은 <a href="https://fonts.google.com/icons" target="_blank" rel="noreferrer" style={{ color: 'var(--accent)' }}>Material Icons</a> 이름 사용. 자주 쓰는 값: <code>location_on</code>, <code>call</code>, <code>mail</code>, <code>schedule</code>, <code>language</code>
      </div>
    </div>
  )
}

// ── 임베디드 컴포넌트 섹션 (collapsible) ───────────────────────
function EmbeddedSection({ title, showKey, titleKey, defaultTitle, cfg, set, children }: {
  title: string
  showKey: 'show_gallery' | 'show_map' | 'show_share'
  configKey: 'gallery_config' | 'map_config' | 'share_config'
  titleKey: 'gallery_section_title' | 'map_section_title' | 'share_section_title'
  defaultTitle: string
  cfg: PlaceDetailConfig
  set: (patch: Partial<PlaceDetailConfig>) => void
  children: React.ReactNode
}) {
  const [expanded, setExpanded] = useState(false)
  const enabled = cfg[showKey] !== false

  return (
    <div style={sectionStyle}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
        <SectionLabel>{title}</SectionLabel>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button type="button" className="btn-secondary" onClick={() => setExpanded(!expanded)} style={{ fontSize: '11px', padding: '4px 10px' }}>
            {expanded ? '접기' : '편집'}
          </button>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>
            <input type="checkbox" checked={enabled} onChange={e => set({ [showKey]: e.target.checked } as Partial<PlaceDetailConfig>)} />
            표시
          </label>
        </div>
      </div>

      <div>
        <label style={miniLabelStyle}>섹션 제목</label>
        <input
          className="input"
          value={(cfg[titleKey] as string) ?? ''}
          onChange={e => set({ [titleKey]: e.target.value } as Partial<PlaceDetailConfig>)}
          placeholder={defaultTitle}
        />
      </div>

      {expanded && (
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {children}
        </div>
      )}
    </div>
  )
}

// ── ImageGallery 설정 편집 ────────────────────────────────────
function GalleryConfigEditor({ value, onChange }: {
  value: Record<string, unknown>
  onChange: (v: Record<string, unknown>) => void
}) {
  const v = value as {
    images?: Array<{ url: string; caption?: string }>
    autoplay?: boolean
    interval?: number
    image_fit?: 'contain' | 'cover'
    transition_effect?: 'none' | 'fade' | 'slide' | 'zoom'
    show_thumbnails?: boolean
  }
  const images = v.images ?? []
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const update = (patch: Partial<typeof v>) => onChange({ ...value, ...patch })

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return
    setUploading(true)
    try {
      const supabase = createClient()
      const uploaded: Array<{ url: string; caption: string }> = []
      for (const file of files) {
        const ext = (file.name.split('.').pop() || 'jpg').toLowerCase()
        const path = `place-detail-gallery/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
        const { error } = await supabase.storage.from('gallery-images').upload(path, file, { cacheControl: '3600', upsert: false })
        if (error) continue
        const { data } = supabase.storage.from('gallery-images').getPublicUrl(path)
        uploaded.push({ url: data.publicUrl, caption: '' })
      }
      if (uploaded.length > 0) update({ images: [...images, ...uploaded] })
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        <div>
          <label style={miniLabelStyle}>전환 효과</label>
          <select className="input" value={v.transition_effect ?? 'fade'} onChange={e => update({ transition_effect: e.target.value as 'none' | 'fade' | 'slide' | 'zoom' })}>
            <option value="none">없음</option>
            <option value="fade">페이드</option>
            <option value="slide">슬라이드</option>
            <option value="zoom">줌</option>
          </select>
        </div>
        <div>
          <label style={miniLabelStyle}>이미지 맞춤</label>
          <select className="input" value={v.image_fit ?? 'cover'} onChange={e => update({ image_fit: e.target.value as 'contain' | 'cover' })}>
            <option value="cover">cover (꽉 채움)</option>
            <option value="contain">contain (전체 보기)</option>
          </select>
        </div>
        <div>
          <label style={miniLabelStyle}>자동 재생</label>
          <select className="input" value={String(v.autoplay !== false)} onChange={e => update({ autoplay: e.target.value === 'true' })}>
            <option value="true">켜짐</option>
            <option value="false">꺼짐</option>
          </select>
        </div>
        <div>
          <label style={miniLabelStyle}>전환 간격(ms)</label>
          <input className="input" type="number" min={1000} max={20000} step={500} value={v.interval ?? 3000} onChange={e => update({ interval: Number(e.target.value) })} />
        </div>
      </div>
      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>
        <input type="checkbox" checked={v.show_thumbnails !== false} onChange={e => update({ show_thumbnails: e.target.checked })} />
        썸네일 표시
      </label>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
        <label style={miniLabelStyle}>이미지 ({images.length}장)</label>
        <button type="button" className="btn-secondary" onClick={() => fileInputRef.current?.click()} disabled={uploading} style={{ fontSize: '11px', padding: '4px 10px' }}>
          {uploading ? '업로드중' : '+ 이미지'}
        </button>
        <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleUpload} style={{ display: 'none' }} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(70px, 1fr))', gap: '4px' }}>
        {images.map((img, idx) => (
          <div key={idx} style={{ position: 'relative', aspectRatio: '4/3', borderRadius: '4px', overflow: 'hidden', border: '1px solid var(--border)' }}>
            <img src={img.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <button
              type="button"
              onClick={() => update({ images: images.filter((_, i) => i !== idx) })}
              aria-label="삭제"
              style={{
                position: 'absolute', top: '1px', right: '1px',
                width: '18px', height: '18px', borderRadius: '50%',
                background: 'rgba(0,0,0,0.65)', color: '#fff', border: 'none',
                fontSize: '10px', cursor: 'pointer', lineHeight: 1,
              }}
            >×</button>
          </div>
        ))}
      </div>
    </>
  )
}

// ── KakaoMap 설정 편집 ────────────────────────────────────────
function MapConfigEditor({ value, onChange }: {
  value: Record<string, unknown>
  onChange: (v: Record<string, unknown>) => void
}) {
  const v = value as {
    app_key?: string
    center_lat?: number
    center_lng?: number
    zoom?: number
    height?: number
    map_type?: 'ROADMAP' | 'SKYVIEW' | 'HYBRID'
    show_controls?: boolean
    is_fixed?: boolean
    markers?: Array<{ id: string; lat: number; lng: number; title: string; description?: string }>
  }
  const markers = v.markers ?? []

  const update = (patch: Partial<typeof v>) => onChange({ ...value, ...patch })
  const updateMarker = (id: string, patch: Partial<typeof markers[number]>) => {
    update({ markers: markers.map(m => m.id === id ? { ...m, ...patch } : m) })
  }
  const addMarker = () => {
    update({
      markers: [
        ...markers,
        { id: `mk-${Date.now()}`, lat: v.center_lat ?? 37.5665, lng: v.center_lng ?? 126.978, title: '새 마커', description: '' },
      ],
    })
  }

  return (
    <>
      <div>
        <label style={miniLabelStyle}>Kakao Maps JS App Key</label>
        <input className="input" value={v.app_key ?? ''} onChange={e => update({ app_key: e.target.value })} placeholder="kakaomaps JS API key" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
        <div>
          <label style={miniLabelStyle}>중심 위도</label>
          <input className="input" type="number" step="0.0001" value={v.center_lat ?? 37.5665} onChange={e => update({ center_lat: Number(e.target.value) })} />
        </div>
        <div>
          <label style={miniLabelStyle}>중심 경도</label>
          <input className="input" type="number" step="0.0001" value={v.center_lng ?? 126.978} onChange={e => update({ center_lng: Number(e.target.value) })} />
        </div>
        <div>
          <label style={miniLabelStyle}>줌 레벨</label>
          <input className="input" type="number" min={1} max={14} value={v.zoom ?? 3} onChange={e => update({ zoom: Number(e.target.value) })} />
        </div>
        <div>
          <label style={miniLabelStyle}>높이(px)</label>
          <input className="input" type="number" min={150} max={800} value={v.height ?? 300} onChange={e => update({ height: Number(e.target.value) })} />
        </div>
        <div>
          <label style={miniLabelStyle}>지도 종류</label>
          <select className="input" value={v.map_type ?? 'ROADMAP'} onChange={e => update({ map_type: e.target.value as 'ROADMAP' | 'SKYVIEW' | 'HYBRID' })}>
            <option value="ROADMAP">로드맵</option>
            <option value="SKYVIEW">스카이뷰</option>
            <option value="HYBRID">하이브리드</option>
          </select>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: '4px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>
            <input type="checkbox" checked={v.show_controls !== false} onChange={e => update({ show_controls: e.target.checked })} />
            컨트롤 표시
          </label>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: '4px', gridColumn: '1 / -1' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)' }} title="활성화 시 드래그/스크롤 휠/더블클릭 줌이 모두 비활성됩니다">
            <input type="checkbox" checked={v.is_fixed === true} onChange={e => update({ is_fixed: e.target.checked })} />
            🔒 위치 고정 (드래그/스크롤 휠/줌 비활성)
          </label>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <label style={miniLabelStyle}>마커 ({markers.length}개)</label>
        <button type="button" className="btn-secondary" onClick={addMarker} style={{ fontSize: '11px', padding: '4px 10px' }}>+ 마커</button>
      </div>
      {markers.map(m => (
        <div key={m.id} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 2fr auto', gap: '4px', alignItems: 'center' }}>
          <input className="input" type="number" step="0.0001" value={m.lat} onChange={e => updateMarker(m.id, { lat: Number(e.target.value) })} placeholder="lat" />
          <input className="input" type="number" step="0.0001" value={m.lng} onChange={e => updateMarker(m.id, { lng: Number(e.target.value) })} placeholder="lng" />
          <input className="input" value={m.title} onChange={e => updateMarker(m.id, { title: e.target.value })} placeholder="이름" />
          <input className="input" value={m.description ?? ''} onChange={e => updateMarker(m.id, { description: e.target.value })} placeholder="설명" />
          <button type="button" className="btn-danger" onClick={() => update({ markers: markers.filter(x => x.id !== m.id) })} style={{ fontSize: '10px', padding: '4px 8px' }}>×</button>
        </div>
      ))}
    </>
  )
}

// ── Share 설정 편집 ───────────────────────────────────────────
function ShareConfigEditor({ value, onChange }: {
  value: Record<string, unknown>
  onChange: (v: Record<string, unknown>) => void
}) {
  const v = value as {
    title?: string
    description?: string
    kakao_app_key?: string
    show_kakao?: boolean
    show_sms?: boolean
    show_copy?: boolean
    show_qr?: boolean
  }
  const update = (patch: Partial<typeof v>) => onChange({ ...value, ...patch })

  return (
    <>
      <div>
        <label style={miniLabelStyle}>공유 제목</label>
        <input className="input" value={v.title ?? ''} onChange={e => update({ title: e.target.value })} placeholder="공유 시 표시될 제목" />
      </div>
      <div>
        <label style={miniLabelStyle}>공유 설명</label>
        <input className="input" value={v.description ?? ''} onChange={e => update({ description: e.target.value })} placeholder="공유 시 표시될 설명" />
      </div>
      <div>
        <label style={miniLabelStyle}>Kakao JS App Key (카카오 공유용)</label>
        <input className="input" value={v.kakao_app_key ?? ''} onChange={e => update({ kakao_app_key: e.target.value })} placeholder="kakao JS app key" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '8px' }}>
        {([
          ['show_kakao', '카카오톡'],
          ['show_sms', 'SMS'],
          ['show_copy', '링크 복사'],
          ['show_qr', 'QR 코드'],
        ] as const).map(([key, label]) => (
          <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--text-secondary)' }}>
            <input
              type="checkbox"
              checked={key === 'show_qr' ? !!v[key] : v[key] !== false}
              onChange={e => update({ [key]: e.target.checked } as Partial<typeof v>)}
            />
            {label}
          </label>
        ))}
      </div>
    </>
  )
}
