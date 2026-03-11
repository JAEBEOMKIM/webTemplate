'use client'

import React, { useEffect, useRef, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import type { ComponentProps, ConfigFormProps } from '../types'
import { createClient } from '@/lib/supabase/client'

/* ─── Types ─── */

interface MediaItem {
  id: string
  type: 'image' | 'video'
  title: string
  desc: string
  url: string
  span: string
  sourceType?: 'url' | 'upload'
}

/* ─── YouTube URL 감지 및 embed URL 변환 ─── */

function getYouTubeEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url)
    let videoId: string | null = null

    if (u.hostname === 'youtu.be') {
      videoId = u.pathname.slice(1).split('?')[0]
    } else if (u.hostname.includes('youtube.com')) {
      if (u.pathname.startsWith('/watch')) {
        videoId = u.searchParams.get('v')
      } else if (u.pathname.startsWith('/embed/')) {
        videoId = u.pathname.split('/embed/')[1].split('?')[0]
      } else if (u.pathname.startsWith('/shorts/')) {
        videoId = u.pathname.split('/shorts/')[1].split('?')[0]
      }
    }

    if (!videoId) return null
    // loop=1 은 playlist=videoId 없이는 동작 안 함 (YouTube 정책)
    return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&playsinline=1`
  } catch {
    return null
  }
}

/* ─── Span presets ─── */

const SPAN_PRESETS = [
  { label: '세로 큰', value: 'md:col-span-1 md:row-span-3 sm:col-span-1 sm:row-span-2' },
  { label: '가로 중', value: 'md:col-span-2 md:row-span-2 sm:col-span-2 sm:row-span-2' },
  { label: '작은', value: 'md:col-span-1 md:row-span-2 sm:col-span-1 sm:row-span-2' },
  { label: '가로 큰', value: 'md:col-span-2 md:row-span-3 sm:col-span-2 sm:row-span-2' },
]

/* ─── MediaItemView ─── */

function MediaItemView({ item, className, onClick }: { item: MediaItem; className?: string; onClick?: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isInView, setIsInView] = useState(false)
  const [isBuffering, setIsBuffering] = useState(true)

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => entries.forEach(e => setIsInView(e.isIntersecting)),
      { rootMargin: '50px', threshold: 0.1 }
    )
    if (videoRef.current) observer.observe(videoRef.current)
    return () => { if (videoRef.current) observer.unobserve(videoRef.current) }
  }, [])

  useEffect(() => {
    let mounted = true
    const video = videoRef.current
    if (!video) return

    if (isInView) {
      const play = async () => {
        try {
          if (video.readyState >= 3) {
            setIsBuffering(false)
            await video.play()
          } else {
            setIsBuffering(true)
            await new Promise<void>(resolve => { video.oncanplay = () => resolve() })
            if (mounted) { setIsBuffering(false); await video.play() }
          }
        } catch { /* autoplay blocked */ }
      }
      play()
    } else {
      video.pause()
    }

    return () => {
      mounted = false
      video.pause()
    }
  }, [isInView])

  if (item.type === 'video') {
    const youtubeEmbedUrl = getYouTubeEmbedUrl(item.url)

    if (youtubeEmbedUrl) {
      return (
        <div className={`${className ?? ''} relative overflow-hidden`} onClick={onClick}>
          <iframe
            src={youtubeEmbedUrl}
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
            title={item.title}
            style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
          />
        </div>
      )
    }

    // 일반 mp4 URL
    return (
      <div className={`${className ?? ''} relative overflow-hidden`}>
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          onClick={onClick}
          playsInline muted loop preload="auto"
          style={{ opacity: isBuffering ? 0.8 : 1, transition: 'opacity 0.2s', transform: 'translateZ(0)', willChange: 'transform' }}
        >
          <source src={item.url} type="video/mp4" />
        </video>
        {isBuffering && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/10">
            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          </div>
        )}
      </div>
    )
  }

  return (
    <img
      src={item.url} alt={item.title}
      className={`${className ?? ''} object-cover cursor-pointer`}
      onClick={onClick} loading="lazy" decoding="async"
    />
  )
}

/* ─── Modal ─── */

function GalleryModal({
  selectedItem, onClose, setSelectedItem, mediaItems,
}: {
  selectedItem: MediaItem
  onClose: () => void
  setSelectedItem: (item: MediaItem) => void
  mediaItems: MediaItem[]
}) {
  const [dockPos, setDockPos] = useState({ x: 0, y: 0 })

  return (
    <>
      <motion.div
        initial={{ scale: 0.98 }} animate={{ scale: 1 }} exit={{ scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className="fixed inset-0 w-full min-h-screen sm:h-[90vh] md:h-[600px] backdrop-blur-lg rounded-none sm:rounded-lg md:rounded-xl overflow-hidden z-10"
      >
        <div className="h-full flex flex-col">
          <div className="flex-1 p-2 sm:p-3 md:p-4 flex items-center justify-center bg-gray-50/50">
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedItem.id}
                className="relative w-full aspect-video max-w-[95%] sm:max-w-[85%] md:max-w-3xl h-auto max-h-[70vh] rounded-lg overflow-hidden shadow-md"
                initial={{ y: 20, scale: 0.97 }}
                animate={{ y: 0, scale: 1, transition: { type: 'spring', stiffness: 500, damping: 30, mass: 0.5 } }}
                exit={{ y: 20, scale: 0.97, transition: { duration: 0.15 } }}
                onClick={onClose}
              >
                <MediaItemView item={selectedItem} className="w-full h-full object-contain bg-gray-900/20" onClick={onClose} />
                <div className="absolute bottom-0 left-0 right-0 p-2 sm:p-3 md:p-4 bg-gradient-to-t from-black/50 to-transparent">
                  <h3 className="text-white text-base sm:text-lg md:text-xl font-semibold">{selectedItem.title}</h3>
                  <p className="text-white/80 text-xs sm:text-sm mt-1">{selectedItem.desc}</p>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        <motion.button
          className="absolute top-2 sm:top-2.5 md:top-3 right-2 sm:right-2.5 md:right-3 p-2 rounded-full bg-gray-200/80 text-gray-700 hover:bg-gray-300/80 backdrop-blur-sm"
          onClick={onClose} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
        >
          <X className="w-3 h-3" />
        </motion.button>
      </motion.div>

      {/* Draggable dock */}
      <motion.div
        drag dragMomentum={false} dragElastic={0.1}
        animate={{ x: dockPos.x, y: dockPos.y }}
        onDragEnd={(_, info) => setDockPos(prev => ({ x: prev.x + info.offset.x, y: prev.y + info.offset.y }))}
        className="fixed z-50 left-1/2 bottom-4 -translate-x-1/2 touch-none"
      >
        <div className="relative rounded-xl bg-sky-400/20 backdrop-blur-xl border border-blue-400/30 shadow-lg cursor-grab active:cursor-grabbing">
          <div className="flex items-center -space-x-2 px-3 py-2">
            {mediaItems.map((item, index) => (
              <motion.div
                key={item.id}
                onClick={e => { e.stopPropagation(); setSelectedItem(item) }}
                style={{ zIndex: selectedItem.id === item.id ? 30 : mediaItems.length - index }}
                className={`relative group w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 flex-shrink-0 rounded-lg overflow-hidden cursor-pointer hover:z-20 ${selectedItem.id === item.id ? 'ring-2 ring-white/70 shadow-lg' : 'hover:ring-2 hover:ring-white/30'}`}
                initial={{ rotate: index % 2 === 0 ? -15 : 15 }}
                animate={{ scale: selectedItem.id === item.id ? 1.2 : 1, rotate: selectedItem.id === item.id ? 0 : index % 2 === 0 ? -15 : 15, y: selectedItem.id === item.id ? -8 : 0 }}
                whileHover={{ scale: 1.3, rotate: 0, y: -10, transition: { type: 'spring', stiffness: 400, damping: 25 } }}
              >
                <MediaItemView item={item} className="w-full h-full" onClick={() => setSelectedItem(item)} />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-white/20" />
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </>
  )
}

/* ─── Registry Component ─── */

export function BentoGalleryComponent({ config }: ComponentProps) {
  const title = (config.title as string) || ''
  const description = (config.description as string) || ''

  // Stable reference: only changes when content changes (avoids infinite loop)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const configItems = useMemo<MediaItem[]>(() => (config.items as MediaItem[]) || [], [JSON.stringify(config.items)])

  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null)
  const [orderedItems, setOrderedItems] = useState<MediaItem[]>(configItems)
  const [isDragging, setIsDragging] = useState(false)

  // Render-phase sync: when admin edits config, reset drag order
  const prevConfigRef = useRef(configItems)
  if (prevConfigRef.current !== configItems) {
    prevConfigRef.current = configItems
    setOrderedItems(configItems)
  }

  const items = configItems

  if (items.length === 0) {
    return (
      <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <div style={{ fontSize: '32px', marginBottom: '8px' }}>🖼️</div>
        <p style={{ fontSize: '13px' }}>이미지/영상이 없습니다. 설정 패널에서 추가해주세요.</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {(title || description) && (
        <div className="mb-8 text-center">
          {title && (
            <motion.h1
              className="text-2xl sm:text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 dark:from-white dark:via-gray-200 dark:to-white"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
            >
              {title}
            </motion.h1>
          )}
          {description && (
            <motion.p
              className="mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-400"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
            >
              {description}
            </motion.p>
          )}
        </div>
      )}

      <AnimatePresence mode="wait">
        {selectedItem ? (
          <GalleryModal
            key="modal"
            selectedItem={selectedItem}
            onClose={() => setSelectedItem(null)}
            setSelectedItem={setSelectedItem}
            mediaItems={orderedItems}
          />
        ) : (
          <motion.div
            key="grid"
            className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-3 auto-rows-[60px]"
            initial="hidden" animate="visible" exit="hidden"
            variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.08 } } }}
          >
            {orderedItems.map((item, index) => (
              <motion.div
                key={item.id}
                className={`relative overflow-hidden rounded-xl cursor-move ${item.span}`}
                onClick={() => !isDragging && setSelectedItem(item)}
                variants={{ hidden: { y: 50, scale: 0.9, opacity: 0 }, visible: { y: 0, scale: 1, opacity: 1, transition: { type: 'spring', stiffness: 350, damping: 25, delay: index * 0.05 } } }}
                whileHover={{ scale: 1.02 }}
                drag
                dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                dragElastic={1}
                onDragStart={() => setIsDragging(true)}
                onDragEnd={(_, info) => {
                  setIsDragging(false)
                  if (Math.abs(info.offset.x + info.offset.y) > 50) {
                    const next = [...orderedItems]
                    const dragged = next.splice(index, 1)[0]
                    const target = info.offset.x + info.offset.y > 0
                      ? Math.min(index + 1, next.length)
                      : Math.max(index - 1, 0)
                    next.splice(target, 0, dragged)
                    setOrderedItems(next)
                  }
                }}
              >
                <MediaItemView item={item} className="absolute inset-0 w-full h-full" />
                <motion.div
                  className="absolute inset-0 flex flex-col justify-end p-2 sm:p-3 md:p-4"
                  initial={{ opacity: 0 }} whileHover={{ opacity: 1 }} transition={{ duration: 0.2 }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                  <h3 className="relative text-white text-xs sm:text-sm md:text-base font-medium line-clamp-1">{item.title}</h3>
                  <p className="relative text-white/70 text-[10px] sm:text-xs mt-0.5 line-clamp-2">{item.desc}</p>
                </motion.div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ─── Config Form ─── */

const labelStyle: React.CSSProperties = {
  fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)',
  textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px', display: 'block',
}

export function BentoGalleryConfigForm({ config, onChange }: ConfigFormProps) {
  const supabase = createClient()
  const title = (config.title as string) || ''
  const description = (config.description as string) || ''
  const items = (config.items as MediaItem[]) || []
  const [expanded, setExpanded] = useState<string | null>(null)
  const [uploadingIds, setUploadingIds] = useState<Set<string>>(new Set())
  const [uploadErrors, setUploadErrors] = useState<Record<string, string>>({})
  const fileInputRefs = useRef<Map<string, HTMLInputElement>>(new Map())

  const addItem = () => {
    const id = `item-${Date.now()}`
    const newItem: MediaItem = { id, type: 'image', title: '새 항목', desc: '', url: '', span: SPAN_PRESETS[0].value, sourceType: 'url' }
    onChange({ ...config, items: [...items, newItem] })
    setExpanded(id)
  }

  const update = (idx: number, updates: Partial<MediaItem>) => {
    onChange({ ...config, items: items.map((it, i) => i === idx ? { ...it, ...updates } : it) })
  }

  const remove = async (idx: number) => {
    const item = items[idx]
    // Clean up uploaded file from storage if applicable
    if (item.sourceType === 'upload' && item.url) {
      try {
        const path = item.url.split('/gallery-images/')[1]
        if (path) await supabase.storage.from('gallery-images').remove([path])
      } catch {}
    }
    onChange({ ...config, items: items.filter((_, i) => i !== idx) })
    setExpanded(null)
  }

  const handleFileUpload = async (itemId: string, idx: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingIds(prev => new Set(prev).add(itemId))
    setUploadErrors(prev => ({ ...prev, [itemId]: '' }))

    const ext = file.name.split('.').pop()
    const path = `bento-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const { error } = await supabase.storage.from('gallery-images').upload(path, file, { cacheControl: '3600', upsert: false })

    if (error) {
      setUploadErrors(prev => ({ ...prev, [itemId]: `업로드 실패: ${error.message}` }))
    } else {
      const { data: urlData } = supabase.storage.from('gallery-images').getPublicUrl(path)
      update(idx, { url: urlData.publicUrl, sourceType: 'upload' })
    }

    setUploadingIds(prev => { const next = new Set(prev); next.delete(itemId); return next })
    if (fileInputRefs.current.get(itemId)) fileInputRefs.current.get(itemId)!.value = ''
  }

  const switchSourceType = (idx: number, item: MediaItem, newSourceType: 'url' | 'upload') => {
    // When switching away from upload, remove the stored file
    if (item.sourceType === 'upload' && newSourceType === 'url' && item.url) {
      try {
        const path = item.url.split('/gallery-images/')[1]
        if (path) supabase.storage.from('gallery-images').remove([path])
      } catch {}
    }
    update(idx, { sourceType: newSourceType, url: '' })
    setUploadErrors(prev => ({ ...prev, [item.id]: '' }))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div>
        <label style={labelStyle}>제목</label>
        <input className="input" value={title} onChange={e => onChange({ ...config, title: e.target.value })} placeholder="갤러리 제목 (선택)" style={{ fontSize: '13px' }} />
      </div>
      <div>
        <label style={labelStyle}>설명</label>
        <input className="input" value={description} onChange={e => onChange({ ...config, description: e.target.value })} placeholder="갤러리 설명 (선택)" style={{ fontSize: '13px' }} />
      </div>

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <label style={{ ...labelStyle, marginBottom: 0 }}>미디어 항목 ({items.length})</label>
          <button type="button" onClick={addItem} className="btn-primary" style={{ padding: '4px 10px', fontSize: '12px' }}>
            + 추가
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {items.map((item, idx) => {
            const sourceType = item.sourceType ?? 'url'
            const isUploading = uploadingIds.has(item.id)
            const uploadError = uploadErrors[item.id] || ''
            return (
              <div key={item.id} style={{ border: '1px solid var(--border)', borderRadius: '10px', overflow: 'hidden' }}>
                {/* Header */}
                <div
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 12px', cursor: 'pointer', background: expanded === item.id ? 'var(--bg-secondary)' : 'var(--bg-card)' }}
                  onClick={() => setExpanded(expanded === item.id ? null : item.id)}
                >
                  <span style={{ fontSize: '12px' }}>{item.type === 'video' ? '🎬' : '🖼️'}</span>
                  <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-primary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.title || '(제목 없음)'}
                  </span>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{expanded === item.id ? '▲' : '▼'}</span>
                </div>

                {expanded === item.id && (
                  <div style={{ borderTop: '1px solid var(--border)', padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px', background: 'var(--bg-secondary)' }}>
                    {/* Type */}
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {(['image', 'video'] as const).map(t => (
                        <button
                          key={t} type="button"
                          onClick={() => update(idx, { type: t, sourceType: t === 'video' ? 'url' : sourceType })}
                          className={item.type === t ? 'btn-primary' : 'btn-secondary'}
                          style={{ padding: '4px 12px', fontSize: '12px' }}
                        >
                          {t === 'image' ? '🖼️ 이미지' : '🎬 영상'}
                        </button>
                      ))}
                    </div>

                    <div>
                      <label style={labelStyle}>제목</label>
                      <input className="input" value={item.title} onChange={e => update(idx, { title: e.target.value })} placeholder="항목 제목" style={{ fontSize: '12px' }} />
                    </div>
                    <div>
                      <label style={labelStyle}>설명</label>
                      <input className="input" value={item.desc} onChange={e => update(idx, { desc: e.target.value })} placeholder="항목 설명" style={{ fontSize: '12px' }} />
                    </div>

                    {/* Source type toggle — upload only available for images */}
                    {item.type === 'image' && (
                      <div>
                        <label style={labelStyle}>이미지 소스</label>
                        <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
                          {(['url', 'upload'] as const).map(st => (
                            <button
                              key={st} type="button"
                              onClick={() => switchSourceType(idx, item, st)}
                              className={sourceType === st ? 'btn-primary' : 'btn-secondary'}
                              style={{ padding: '4px 12px', fontSize: '12px' }}
                            >
                              {st === 'url' ? '🔗 URL 입력' : '📁 파일 업로드'}
                            </button>
                          ))}
                        </div>

                        {sourceType === 'url' ? (
                          <input
                            className="input"
                            value={item.url}
                            onChange={e => update(idx, { url: e.target.value })}
                            placeholder="https://images.unsplash.com/..."
                            style={{ fontSize: '11px', fontFamily: 'monospace' }}
                          />
                        ) : (
                          <div>
                            {item.url && (
                              <div style={{ marginBottom: '8px', borderRadius: '8px', overflow: 'hidden', maxHeight: '120px' }}>
                                <img src={item.url} alt="preview" style={{ width: '100%', height: '120px', objectFit: 'cover' }} />
                              </div>
                            )}
                            <input
                              type="file"
                              accept="image/*"
                              style={{ display: 'none' }}
                              ref={el => { if (el) fileInputRefs.current.set(item.id, el) }}
                              onChange={e => handleFileUpload(item.id, idx, e)}
                            />
                            <button
                              type="button"
                              disabled={isUploading}
                              onClick={() => fileInputRefs.current.get(item.id)?.click()}
                              className="btn-secondary"
                              style={{ width: '100%', justifyContent: 'center', fontSize: '12px' }}
                            >
                              {isUploading ? '업로드 중...' : item.url ? '🔄 이미지 교체' : '📁 이미지 선택'}
                            </button>
                            {uploadError && (
                              <p style={{ fontSize: '11px', color: 'var(--danger)', marginTop: '4px' }}>{uploadError}</p>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Video always uses URL */}
                    {item.type === 'video' && (
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                          <label style={{ ...labelStyle, marginBottom: 0 }}>영상 URL</label>
                          {getYouTubeEmbedUrl(item.url) && (
                            <span style={{ fontSize: '10px', fontWeight: 600, color: '#ff0000', background: '#fff0f0', border: '1px solid #ffcccc', borderRadius: '4px', padding: '1px 6px' }}>
                              ▶ YouTube
                            </span>
                          )}
                        </div>
                        <input className="input" value={item.url} onChange={e => update(idx, { url: e.target.value })} placeholder="mp4 URL 또는 YouTube 링크" style={{ fontSize: '11px', fontFamily: 'monospace' }} />
                      </div>
                    )}

                    <div>
                      <label style={labelStyle}>크기</label>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {SPAN_PRESETS.map(preset => (
                          <button
                            key={preset.label} type="button"
                            onClick={() => update(idx, { span: preset.value })}
                            className={item.span === preset.value ? 'btn-primary' : 'btn-secondary'}
                            style={{ padding: '4px 10px', fontSize: '11px' }}
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <button type="button" onClick={() => remove(idx)} className="btn-danger" style={{ fontSize: '12px' }}>
                        삭제
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
          {items.length === 0 && (
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', padding: '16px' }}>
              항목을 추가해주세요
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
