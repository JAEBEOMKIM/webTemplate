'use client'

import React, { useState, useRef, useCallback, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { createClient } from '@/lib/supabase/client'
import type { ComponentProps, ConfigFormProps } from '../types'
import {
  BannerConfig, Layer, ImageLayer, TextLayer, TextEffectType,
  DEFAULT_BANNER_CONFIG, CANVAS_PRESETS,
} from './types'
import { FONTS, loadAllFonts, getFontFamily } from './fonts'
import type { EditorCanvasRef, TextUpdateProps } from './EditorCanvas'

// ── Lazy-load Fabric.js only in editor (never in display component) ───────────
const EditorCanvas = dynamic(() => import('./EditorCanvas'), {
  ssr: false,
  loading: () => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, color: 'var(--text-muted)', fontSize: 13 }}>
      에디터 로딩 중...
    </div>
  ),
})

// ── Constants (outside component — stable refs) ───────────────────────────────

const ZOOM_LEVELS = [0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 2.0] as const

const TEXT_EFFECTS: { value: TextEffectType; label: string }[] = [
  { value: 'none', label: '없음' },
  { value: 'fade-in', label: '페이드인' },
  { value: 'slide-up', label: '슬라이드업' },
  { value: 'typewriter', label: '타이핑' },
  { value: 'glow', label: '빛남' },
]

// ── CSS style shorthands ──────────────────────────────────────────────────────

const S = {
  label: {
    fontSize: 11, fontWeight: 600, color: 'var(--text-muted)',
    textTransform: 'uppercase' as const, letterSpacing: '0.05em',
    marginBottom: 5, display: 'block',
  },
  row: { display: 'flex', alignItems: 'center', gap: 8 },
  section: { display: 'flex', flexDirection: 'column' as const, gap: 10, padding: '10px 12px', background: 'var(--bg-secondary)', borderRadius: 10, border: '1px solid var(--border)' },
  sectionTitle: { fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' as const, letterSpacing: '0.06em' },
  btn: (active: boolean): React.CSSProperties => ({
    padding: '4px 10px', fontSize: 11,
    background: active ? 'var(--accent)' : 'var(--bg-tertiary)',
    border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
    borderRadius: 5, cursor: 'pointer',
    color: active ? 'var(--accent-fg, #fff)' : 'var(--text-primary)',
  }),
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function uid() {
  return Math.random().toString(36).slice(2, 9)
}

function parseCfg(config: Record<string, unknown>): BannerConfig {
  return { ...DEFAULT_BANNER_CONFIG, ...(config as Partial<BannerConfig>) }
}

// ── ZoomControls — memoized to prevent re-renders on unrelated state changes ──
// Vercel guideline: rerender-memo-components

interface ZoomControlsProps {
  effectiveScale: number
  autoScale: number
  zoomLevel: number | null
  onZoom: (z: number | null) => void
}

const ZoomControls = React.memo(function ZoomControls({ effectiveScale, autoScale, zoomLevel, onZoom }: ZoomControlsProps) {
  const btnStyle: React.CSSProperties = {
    width: 28, height: 28, fontSize: 16, lineHeight: '1',
    border: '1px solid var(--border)', borderRadius: 5,
    background: 'var(--bg-secondary)', cursor: 'pointer',
    color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center',
  }
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5, justifyContent: 'center', padding: '4px 0' }}>
      <button
        type="button"
        style={btnStyle}
        title="축소"
        onClick={() => {
          const prev = [...ZOOM_LEVELS].reverse().find(z => z < effectiveScale - 0.01)
          if (prev !== undefined) onZoom(prev)
        }}
      >−</button>

      <select
        value={zoomLevel ?? 'auto'}
        onChange={e => onZoom(e.target.value === 'auto' ? null : Number(e.target.value))}
        style={{
          fontSize: 12, padding: '4px 6px',
          border: '1px solid var(--border)', borderRadius: 5,
          background: 'var(--bg-secondary)', color: 'var(--text-primary)', cursor: 'pointer',
        }}
      >
        <option value="auto">자동 ({Math.round(autoScale * 100)}%)</option>
        {ZOOM_LEVELS.map(z => (
          <option key={z} value={z}>{Math.round(z * 100)}%</option>
        ))}
      </select>

      <button
        type="button"
        style={btnStyle}
        title="확대"
        onClick={() => {
          const next = ZOOM_LEVELS.find(z => z > effectiveScale + 0.01)
          if (next !== undefined) onZoom(next)
        }}
      >+</button>

      {zoomLevel !== null && (
        <button
          type="button"
          onClick={() => onZoom(null)}
          style={{ fontSize: 11, padding: '3px 8px', border: '1px solid var(--border)', borderRadius: 5, background: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
        >자동</button>
      )}
    </div>
  )
})

// ═══════════════════════════════════════════════════════════════════════════════
// DISPLAY COMPONENT — visitor view (zero Fabric.js bundle)
// ═══════════════════════════════════════════════════════════════════════════════
export function BannerEditorComponent({ config }: ComponentProps) {
  const cfg = parseCfg(config)

  if (!cfg.exportedImageUrl) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 8, color: 'var(--text-muted)', padding: 24 }}>
        <div style={{ fontSize: 36 }}>🎨</div>
        <p style={{ fontWeight: 600, fontSize: 14 }}>배너 에디터</p>
        <p style={{ fontSize: 12, textAlign: 'center' }}>관리자 패널에서 배너를 디자인하고 저장하세요.</p>
      </div>
    )
  }

  return (
    <div style={{ width: '100%', height: '100%', overflow: 'hidden', borderRadius: 8 }}>
      <img
        src={cfg.exportedImageUrl}
        alt="배너"
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        loading="lazy"
      />
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIG FORM — admin editor
// ═══════════════════════════════════════════════════════════════════════════════
export function BannerEditorConfigForm({ config, onChange, componentId }: ConfigFormProps) {
  const supabase = createClient()
  const canvasRef = useRef<EditorCanvasRef>(null)
  const bgFileRef = useRef<HTMLInputElement>(null)
  const imgFileRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const cfg = parseCfg(config)
  const [layers, setLayers] = useState<Layer[]>(cfg.layers)
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null)
  const [selectedType, setSelectedType] = useState<'image' | 'text' | null>(null)
  const [canvasReady, setCanvasReady] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [saveOk, setSaveOk] = useState(false)
  const [activeTab, setActiveTab] = useState<'layers' | 'props' | 'bg' | 'size'>('bg')

  // ── Zoom state (Vercel: split auto-computed from user-controlled) ──────────
  const [autoScale, setAutoScale] = useState(1)
  const [zoomLevel, setZoomLevel] = useState<number | null>(null)
  const effectiveScale = zoomLevel ?? autoScale

  // ── Background removal modal state ────────────────────────────────────────
  const [bgRemovalModal, setBgRemovalModal] = useState<{ file: File; previewUrl: string } | null>(null)
  const [bgRemoving, setBgRemoving] = useState(false)

  // ── Text property panel state ─────────────────────────────────────────────
  const [txtFont, setTxtFont] = useState('noto-sans-kr')
  const [txtSize, setTxtSize] = useState(42)
  const [txtWeight, setTxtWeight] = useState(700)
  const [txtColor, setTxtColor] = useState('#ffffff')
  const [txtStroke, setTxtStroke] = useState('')
  const [txtStrokeW, setTxtStrokeW] = useState(1)
  const [txtShadow, setTxtShadow] = useState(false)
  const [txtEffect, setTxtEffect] = useState<TextEffectType>('none')

  // ── Scale canvas to fit container (ResizeObserver) ─────────────────────────
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const update = () => {
      const w = el.clientWidth
      if (w <= 0) return  // guard: layout not ready yet
      setAutoScale(Math.min(1, (w - 2) / cfg.canvasWidth))
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [cfg.canvasWidth])

  // ── Load fonts on mount ───────────────────────────────────────────────────
  useEffect(() => { loadAllFonts() }, [])

  // ── Initialize canvas with saved state ────────────────────────────────────
  const handleCanvasReady = useCallback(async () => {
    setCanvasReady(true)
    if (cfg.fabricJson) {
      await canvasRef.current?.loadJSON(cfg.fabricJson)
      // Backward compat: if old fabricJson had canvas.backgroundImage (non-selectable),
      // migrate it to a selectable layer object
      const hasBgLayer = cfg.layers.some(l => l.type === 'image' && (l as ImageLayer).isBackground)
      if (cfg.background.type === 'image' && cfg.background.imageUrl && !hasBgLayer) {
        const id = uid()
        await canvasRef.current?.migrateBackgroundImage(id)
        const migratedLayer: ImageLayer = {
          id, type: 'image', name: '배경 이미지',
          imageUrl: cfg.background.imageUrl, visible: true, opacity: 100, isBackground: true,
        }
        setLayers(prev => [migratedLayer, ...prev.filter(l => !(l.type === 'image' && (l as ImageLayer).isBackground))])
      }
    } else if (cfg.background.type === 'color') {
      canvasRef.current?.setBackgroundColor(cfg.background.color)
    } else if (cfg.background.imageUrl) {
      const existingBg = cfg.layers.find(l => l.type === 'image' && (l as ImageLayer).isBackground)
      const id = existingBg?.id ?? uid()
      await canvasRef.current?.setBackgroundImageAsLayer(cfg.background.imageUrl, id)
    }
  }, []) // eslint-disable-line

  // ── Sync canvas modifications back to config (debounced) ──────────────────
  const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const handleModified = useCallback(() => {
    if (syncTimer.current) clearTimeout(syncTimer.current)
    syncTimer.current = setTimeout(() => {
      const json = canvasRef.current?.getJSON() ?? ''
      onChange({ ...config, fabricJson: json, layers })
    }, 600)
  }, [config, onChange, layers]) // eslint-disable-line

  // ── Layer helpers ─────────────────────────────────────────────────────────
  const updateLayers = useCallback((next: Layer[]) => {
    setLayers(next)
    const json = canvasRef.current?.getJSON() ?? cfg.fabricJson
    onChange({ ...config, layers: next, fabricJson: json })
  }, [config, onChange, cfg.fabricJson]) // eslint-disable-line

  const selectedLayer = layers.find(l => l.id === selectedLayerId) ?? null

  // Read text props when text layer selected
  const handleSelect = useCallback((id: string | null, type: 'image' | 'text' | null) => {
    setSelectedLayerId(id)
    setSelectedType(type)
    if (type === 'text' && id) {
      const layer = layers.find(l => l.id === id) as TextLayer | undefined
      if (layer) {
        setTxtFont(FONTS.find(f => f.family === layer.fontFamily)?.key ?? 'noto-sans-kr')
        setTxtSize(layer.fontSize)
        setTxtWeight(layer.fontWeight)
        setTxtColor(layer.fill)
        setTxtStroke(layer.stroke)
        setTxtStrokeW(layer.strokeWidth)
        setTxtShadow(layer.hasShadow)
        setTxtEffect(layer.textEffect)
      }
      setActiveTab('props')
    }
    if (type === 'image') setActiveTab('props')
  }, [layers])

  // ── Zoom handlers (memoized — Vercel: rerender-callback-refs) ─────────────
  const handleZoom = useCallback((z: number | null) => setZoomLevel(z), [])

  // ── Background ────────────────────────────────────────────────────────────
  const handleBgColorChange = useCallback((color: string) => {
    canvasRef.current?.setBackgroundColor(color)
    onChange({ ...config, background: { type: 'color', color, imageUrl: '' }, fabricJson: canvasRef.current?.getJSON() ?? cfg.fabricJson })
  }, [config, onChange, cfg.fabricJson])

  const handleBgImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const ext = file.name.split('.').pop() ?? 'jpg'
    const path = `banners/bg-${uid()}.${ext}`
    const { error } = await supabase.storage.from('gallery-images').upload(path, file, { cacheControl: '3600', upsert: false })
    if (error) { alert('배경 이미지 업로드 실패: ' + error.message); return }
    const { data } = supabase.storage.from('gallery-images').getPublicUrl(path)

    // Remove existing background image layer from canvas + state
    const existingBg = layers.find(l => l.type === 'image' && (l as ImageLayer).isBackground)
    if (existingBg) canvasRef.current?.removeLayer(existingBg.id)

    const id = uid()
    await canvasRef.current?.setBackgroundImageAsLayer(data.publicUrl, id)
    const newBgLayer: ImageLayer = {
      id, type: 'image', name: '배경 이미지',
      imageUrl: data.publicUrl, visible: true, opacity: 100, isBackground: true,
    }
    const withoutOldBg = layers.filter(l => !(l.type === 'image' && (l as ImageLayer).isBackground))
    updateLayers([newBgLayer, ...withoutOldBg])
    onChange({ ...config, background: { type: 'image', imageUrl: data.publicUrl, color: '' }, fabricJson: canvasRef.current?.getJSON() ?? cfg.fabricJson })
    if (bgFileRef.current) bgFileRef.current.value = ''
  }

  const handleClearBackground = useCallback(() => {
    const bgLayer = layers.find(l => l.type === 'image' && (l as ImageLayer).isBackground)
    if (bgLayer) {
      canvasRef.current?.removeLayer(bgLayer.id)
      updateLayers(layers.filter(l => l.id !== bgLayer.id))
    }
    canvasRef.current?.clearBackground()
    canvasRef.current?.setBackgroundColor('#1e293b')
    onChange({ ...config, background: { type: 'color', color: '#1e293b', imageUrl: '' } })
  }, [layers, config, onChange, updateLayers])

  // ── Image layer — Phase 1: show modal ─────────────────────────────────────
  const handleAddImage = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (imgFileRef.current) imgFileRef.current.value = ''
    setBgRemovalModal({ file, previewUrl: URL.createObjectURL(file) })
  }, [])

  // ── Image layer — shared upload helper ────────────────────────────────────
  const uploadAndAddImageLayer = useCallback(async (file: File) => {
    const ext = file.name.split('.').pop() ?? 'png'
    const path = `banners/img-${uid()}.${ext}`
    const { error } = await supabase.storage.from('gallery-images').upload(path, file, { cacheControl: '3600', upsert: false })
    if (error) { alert('이미지 업로드 실패: ' + error.message); return }
    const { data } = supabase.storage.from('gallery-images').getPublicUrl(path)
    const id = uid()
    await canvasRef.current?.addImageLayer(data.publicUrl, id)
    const nonBgImages = layers.filter(l => l.type === 'image' && !(l as ImageLayer).isBackground)
    const newLayer: ImageLayer = {
      id, type: 'image',
      name: `이미지 ${nonBgImages.length + 1}`,
      imageUrl: data.publicUrl,
      visible: true, opacity: 100,
    }
    updateLayers([...layers, newLayer])
    setSelectedLayerId(id)
    setSelectedType('image')
    setActiveTab('props')
  }, [layers, updateLayers]) // eslint-disable-line

  // ── Phase 2a: Add as-is ───────────────────────────────────────────────────
  const handleAddImageDirect = useCallback(async () => {
    if (!bgRemovalModal) return
    const { file, previewUrl } = bgRemovalModal
    URL.revokeObjectURL(previewUrl)
    setBgRemovalModal(null)
    await uploadAndAddImageLayer(file)
  }, [bgRemovalModal, uploadAndAddImageLayer])

  // ── Phase 2b: Remove background then add ─────────────────────────────────
  // Vercel: bundle-dynamic-imports — library only loaded on user action
  const handleAddImageWithBgRemoval = useCallback(async () => {
    if (!bgRemovalModal) return
    const { file, previewUrl } = bgRemovalModal
    setBgRemoving(true)
    try {
      // @imgly/background-removal — AGPL-3.0; used in internal admin panel only
      const { removeBackground } = await import('@imgly/background-removal')
      const resultBlob = await removeBackground(file)
      const resultFile = new File(
        [resultBlob],
        file.name.replace(/\.[^.]+$/, '.png'),
        { type: 'image/png' }
      )
      URL.revokeObjectURL(previewUrl)
      setBgRemovalModal(null)
      await uploadAndAddImageLayer(resultFile)
    } catch (err) {
      alert('배경 제거 실패: ' + (err instanceof Error ? err.message : '알 수 없는 오류'))
    } finally {
      setBgRemoving(false)
    }
  }, [bgRemovalModal, uploadAndAddImageLayer])

  // ── Close modal ───────────────────────────────────────────────────────────
  const handleCloseModal = useCallback(() => {
    if (bgRemovalModal) URL.revokeObjectURL(bgRemovalModal.previewUrl)
    setBgRemovalModal(null)
  }, [bgRemovalModal])

  // cleanup on unmount
  useEffect(() => {
    return () => {
      if (bgRemovalModal) URL.revokeObjectURL(bgRemovalModal.previewUrl)
    }
  }, []) // eslint-disable-line

  // ── Add text layer ────────────────────────────────────────────────────────
  const handleAddText = useCallback(() => {
    const id = uid()
    const fontFamily = getFontFamily('noto-sans-kr')
    canvasRef.current?.addTextLayer('텍스트를 입력하세요', id, fontFamily)
    const newLayer: TextLayer = {
      id, type: 'text',
      name: `텍스트 ${layers.filter(l => l.type === 'text').length + 1}`,
      text: '텍스트를 입력하세요',
      fontFamily, fontSize: 42, fontWeight: 700,
      fill: '#ffffff', stroke: '', strokeWidth: 1,
      hasShadow: false, textEffect: 'none',
      visible: true, opacity: 100,
    }
    updateLayers([...layers, newLayer])
    setSelectedLayerId(id)
    setSelectedType('text')
    setTxtFont('noto-sans-kr')
    setTxtSize(42); setTxtWeight(700); setTxtColor('#ffffff')
    setTxtStroke(''); setTxtStrokeW(1); setTxtShadow(false); setTxtEffect('none')
    setActiveTab('props')
  }, [layers, updateLayers])

  // ── Delete layer ──────────────────────────────────────────────────────────
  const handleDeleteLayer = useCallback((id: string) => {
    canvasRef.current?.removeLayer(id)
    updateLayers(layers.filter(l => l.id !== id))
    if (selectedLayerId === id) { setSelectedLayerId(null); setSelectedType(null) }
  }, [layers, selectedLayerId, updateLayers])

  // ── Toggle visibility ─────────────────────────────────────────────────────
  const handleToggleVisible = useCallback((id: string) => {
    const layer = layers.find(l => l.id === id)
    if (!layer) return
    const visible = !layer.visible
    canvasRef.current?.setLayerVisible(id, visible)
    updateLayers(layers.map(l => l.id === id ? { ...l, visible } : l))
  }, [layers, updateLayers])

  // ── Reorder layer ─────────────────────────────────────────────────────────
  const handleReorder = useCallback((id: string, dir: 1 | -1) => {
    const layer = layers.find(l => l.id === id)
    // Prevent background layer from being reordered
    if (layer?.type === 'image' && (layer as ImageLayer).isBackground) return
    const idx = layers.findIndex(l => l.id === id)
    const next = idx + dir
    if (next < 0 || next >= layers.length) return
    // Prevent moving a layer below the background layer
    const targetLayer = layers[next]
    if (targetLayer?.type === 'image' && (targetLayer as ImageLayer).isBackground && dir === -1) return
    if (dir === 1) canvasRef.current?.bringLayerForward(id)
    else canvasRef.current?.sendLayerBackward(id)
    const updated = [...layers]
    ;[updated[idx], updated[next]] = [updated[next], updated[idx]]
    updateLayers(updated)
  }, [layers, updateLayers])

  // ── Text property update ──────────────────────────────────────────────────
  const applyTextProps = useCallback((patch: Partial<TextUpdateProps> & { textEffect?: TextEffectType }) => {
    if (!selectedLayerId) return
    const { textEffect, ...canvasProps } = patch
    if (Object.keys(canvasProps).length > 0) {
      canvasRef.current?.updateTextProps(selectedLayerId, canvasProps)
    }
    const layerPatch: Partial<TextLayer> = {}
    if (canvasProps.fontFamily !== undefined) layerPatch.fontFamily = canvasProps.fontFamily
    if (canvasProps.fontSize !== undefined) layerPatch.fontSize = canvasProps.fontSize
    if (canvasProps.fontWeight !== undefined) layerPatch.fontWeight = canvasProps.fontWeight
    if (canvasProps.fill !== undefined) layerPatch.fill = canvasProps.fill
    if (canvasProps.stroke !== undefined) layerPatch.stroke = canvasProps.stroke
    if (canvasProps.strokeWidth !== undefined) layerPatch.strokeWidth = canvasProps.strokeWidth
    if (canvasProps.hasShadow !== undefined) layerPatch.hasShadow = canvasProps.hasShadow
    if (textEffect !== undefined) layerPatch.textEffect = textEffect
    updateLayers(layers.map(l => l.id === selectedLayerId ? { ...l, ...layerPatch } as Layer : l))
  }, [selectedLayerId, layers, updateLayers])

  // ── Image opacity ─────────────────────────────────────────────────────────
  const handleImageOpacity = useCallback((opacity: number) => {
    if (!selectedLayerId) return
    canvasRef.current?.setLayerOpacity(selectedLayerId, opacity)
    updateLayers(layers.map(l => l.id === selectedLayerId ? { ...l, opacity } : l))
  }, [selectedLayerId, layers, updateLayers])

  // ── Canvas size ───────────────────────────────────────────────────────────
  const handleSizePreset = useCallback((w: number, h: number) => {
    onChange({ ...config, canvasWidth: w, canvasHeight: h })
  }, [config, onChange])

  // ── Save / export ─────────────────────────────────────────────────────────
  const handleSave = async () => {
    const cv = canvasRef.current
    if (!cv) return
    setSaving(true); setSaveError(''); setSaveOk(false)
    try {
      const fabricJson = cv.getJSON()
      const dataUrl = cv.exportPNG()
      if (cfg.exportedImageUrl) {
        const oldPath = cfg.exportedImageUrl.split('/gallery-images/')[1]
        if (oldPath) await supabase.storage.from('gallery-images').remove([oldPath])
      }
      const blob = await fetch(dataUrl).then(r => r.blob())
      const path = `banners/banner-${componentId ?? uid()}-${Date.now()}.png`
      const { error } = await supabase.storage.from('gallery-images').upload(path, blob, {
        contentType: 'image/png', cacheControl: '3600', upsert: true,
      })
      if (error) throw error
      const { data } = supabase.storage.from('gallery-images').getPublicUrl(path)
      onChange({ ...config, fabricJson, layers, exportedImageUrl: data.publicUrl })
      setSaveOk(true)
      setTimeout(() => setSaveOk(false), 3000)
    } catch (e: unknown) {
      setSaveError(e instanceof Error ? e.message : '저장 실패')
    } finally {
      setSaving(false)
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

      {/* ── Canvas viewport (scrollable + zoomable) ── */}
      {/* Outer: ResizeObserver anchor + scrollable viewport.
          Use CSS min/max-height (not JS-computed) to avoid SSR hydration mismatch. */}
      <div
        ref={containerRef}
        suppressHydrationWarning
        style={{
          width: '100%',
          minHeight: 160,
          maxHeight: 520,
          overflow: 'auto',
          background: 'var(--bg-tertiary)',
          borderRadius: 8,
          border: '1px solid var(--border)',
        }}
      >
        {/* Spacer: expands to scaled canvas size so scrollbars appear correctly.
            suppressHydrationWarning: effectiveScale is browser-only (ResizeObserver). */}
        <div
          suppressHydrationWarning
          style={{
            width: cfg.canvasWidth * effectiveScale,
            height: cfg.canvasHeight * effectiveScale,
            position: 'relative',
            minWidth: '100%',
          }}
        >
          {/* Canvas holder: CSS-scaled, always at native pixel size.
              CSS transform on wrapper div (not <canvas>) → Fabric.js pointer events unaffected. */}
          <div
            suppressHydrationWarning
            style={{
              width: cfg.canvasWidth,
              height: cfg.canvasHeight,
              transform: `scale(${effectiveScale})`,
              transformOrigin: 'top left',
              position: 'absolute',
              top: 0,
              left: 0,
            }}
          >
            <EditorCanvas
              ref={canvasRef}
              width={cfg.canvasWidth}
              height={cfg.canvasHeight}
              onSelect={handleSelect}
              onModified={handleModified}
            />
          </div>
        </div>
      </div>

      {/* ── Zoom controls ── */}
      <ZoomControls
        effectiveScale={effectiveScale}
        autoScale={autoScale}
        zoomLevel={zoomLevel}
        onZoom={handleZoom}
      />

      {/* Canvas init trigger */}
      <CanvasInitTrigger canvasRef={canvasRef} onReady={handleCanvasReady} />

      {/* ── Toolbar tabs ── */}
      <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--border)', paddingBottom: 2 }}>
        {([
          ['bg', '배경'],
          ['layers', `레이어 (${layers.length})`],
          ['props', '속성'],
          ['size', '크기'],
        ] as [typeof activeTab, string][]).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveTab(key)}
            style={{
              padding: '5px 12px', fontSize: 12, border: 'none', borderRadius: '6px 6px 0 0',
              cursor: 'pointer',
              background: activeTab === key ? 'var(--accent)' : 'transparent',
              color: activeTab === key ? 'var(--accent-fg, #fff)' : 'var(--text-muted)',
              fontWeight: activeTab === key ? 700 : 400,
            }}
          >{label}</button>
        ))}
      </div>

      {/* ── TAB: Background ── */}
      {activeTab === 'bg' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={S.section}>
            <span style={S.sectionTitle}>배경 색상</span>
            <div style={{ ...S.row, gap: 10 }}>
              <input
                type="color"
                value={cfg.background.type === 'color' ? cfg.background.color : '#1e293b'}
                onChange={e => handleBgColorChange(e.target.value)}
                style={{ width: 48, height: 36, border: '1px solid var(--border)', borderRadius: 6, cursor: 'pointer', padding: 2 }}
              />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {['#1e293b','#0f172a','#ffffff','#f8fafc','#3b82f6','#ef4444','#22c55e','#f59e0b','#8b5cf6','#ec4899'].map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => handleBgColorChange(c)}
                    style={{ width: 22, height: 22, background: c, border: `2px solid ${cfg.background.color === c ? 'var(--accent)' : 'var(--border)'}`, borderRadius: 4, cursor: 'pointer' }}
                  />
                ))}
              </div>
            </div>
          </div>
          <div style={S.section}>
            <span style={S.sectionTitle}>배경 이미지</span>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>업로드 후 캔버스에서 드래그로 이동 · 모서리 핸들로 크기 조절 가능</p>
            <input ref={bgFileRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }} onChange={handleBgImageUpload} />
            <button type="button" onClick={() => bgFileRef.current?.click()} style={{ padding: '7px 14px', fontSize: 12, background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: 6, cursor: 'pointer', color: 'var(--text-primary)' }}>
              📁 배경 이미지 업로드
            </button>
            {cfg.background.type === 'image' && cfg.background.imageUrl && (
              <div style={{ ...S.row }}>
                <img src={cfg.background.imageUrl} alt="" style={{ width: 60, height: 40, objectFit: 'cover', borderRadius: 4 }} />
                <button type="button" onClick={handleClearBackground} style={{ fontSize: 11, color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer' }}>배경 제거</button>
              </div>
            )}
            <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>JPG, PNG, WebP · 최대 5MB</p>
          </div>
        </div>
      )}

      {/* ── TAB: Layers ── */}
      {activeTab === 'layers' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ ...S.row }}>
            <input ref={imgFileRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }} onChange={handleAddImage} />
            <button type="button" onClick={() => imgFileRef.current?.click()} disabled={!canvasReady} style={{ flex: 1, padding: '7px 0', fontSize: 12, background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: 6, cursor: 'pointer', color: 'var(--text-primary)' }}>
              🖼️ 이미지 추가
            </button>
            <button type="button" onClick={handleAddText} disabled={!canvasReady} style={{ flex: 1, padding: '7px 0', fontSize: 12, background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: 6, cursor: 'pointer', color: 'var(--text-primary)' }}>
              🔤 텍스트 추가
            </button>
          </div>

          {layers.length === 0 && (
            <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', padding: 16 }}>레이어가 없습니다. 위 버튼으로 추가하세요.</p>
          )}
          {[...layers].reverse().map((layer) => {
            const isBg = layer.type === 'image' && (layer as ImageLayer).isBackground
            return (
              <div
                key={layer.id}
                onClick={() => { canvasRef.current?.selectLayer(layer.id); setSelectedLayerId(layer.id); setSelectedType(layer.type); setActiveTab('props') }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px',
                  background: selectedLayerId === layer.id ? 'var(--accent-subtle, #eef2ff)' : 'var(--bg-secondary)',
                  border: `1px solid ${selectedLayerId === layer.id ? 'var(--accent)' : 'var(--border)'}`,
                  borderRadius: 8, cursor: 'pointer',
                }}
              >
                <span style={{ fontSize: 14 }}>{layer.type === 'text' ? '🔤' : isBg ? '🏞️' : '🖼️'}</span>
                <span style={{ flex: 1, fontSize: 12, fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {layer.name}
                  {isBg && <span style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 4 }}>[배경]</span>}
                </span>
                <button type="button" onClick={e => { e.stopPropagation(); handleToggleVisible(layer.id) }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, opacity: layer.visible ? 1 : 0.4 }} title={layer.visible ? '숨기기' : '표시'}>👁</button>
                <button type="button" onClick={e => { e.stopPropagation(); handleReorder(layer.id, 1) }} disabled={isBg} style={{ background: 'none', border: 'none', cursor: isBg ? 'default' : 'pointer', fontSize: 12, color: 'var(--text-muted)', opacity: isBg ? 0.3 : 1 }} title="위로">▲</button>
                <button type="button" onClick={e => { e.stopPropagation(); handleReorder(layer.id, -1) }} disabled={isBg} style={{ background: 'none', border: 'none', cursor: isBg ? 'default' : 'pointer', fontSize: 12, color: 'var(--text-muted)', opacity: isBg ? 0.3 : 1 }} title="아래로">▼</button>
                <button type="button" onClick={e => { e.stopPropagation(); handleDeleteLayer(layer.id) }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--danger)' }} title="삭제">✕</button>
              </div>
            )
          })}
        </div>
      )}

      {/* ── TAB: Properties ── */}
      {activeTab === 'props' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {!selectedLayer && (
            <p style={{ fontSize: 12, color: 'var(--text-muted)', padding: '12px 0', textAlign: 'center' }}>레이어를 선택하면 속성이 표시됩니다.</p>
          )}

          {selectedLayer?.type === 'image' && (
            <>
              <div style={S.section}>
                <span style={S.sectionTitle}>이미지 변환</span>
                <div style={{ ...S.row, flexWrap: 'wrap', gap: 6 }}>
                  {([['↻ 90°', () => canvasRef.current?.rotateSelected(90)], ['↺ -90°', () => canvasRef.current?.rotateSelected(-90)], ['↔ 좌우반전', () => canvasRef.current?.flipSelected('x')], ['↕ 상하반전', () => canvasRef.current?.flipSelected('y')]] as [string, () => void][]).map(([label, fn]) => (
                    <button key={label} type="button" onClick={fn} style={{ padding: '5px 10px', fontSize: 11, background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: 6, cursor: 'pointer', color: 'var(--text-primary)' }}>{label}</button>
                  ))}
                </div>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>드래그로 이동 · 모서리 핸들로 크기 조절 · 상단 핸들로 회전</p>
              </div>
              <div style={S.section}>
                <span style={S.sectionTitle}>투명도 {(selectedLayer as ImageLayer).opacity}%</span>
                <input type="range" min={5} max={100} step={5}
                  value={(selectedLayer as ImageLayer).opacity}
                  onChange={e => handleImageOpacity(Number(e.target.value))}
                  style={{ accentColor: 'var(--accent)', width: '100%' }}
                />
              </div>
            </>
          )}

          {selectedLayer?.type === 'text' && (
            <>
              <div style={S.section}>
                <span style={S.sectionTitle}>폰트</span>
                <select
                  value={txtFont}
                  onChange={e => {
                    const key = e.target.value
                    setTxtFont(key)
                    applyTextProps({ fontFamily: getFontFamily(key) })
                  }}
                  style={{ width: '100%', padding: '6px 8px', fontSize: 12, background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-primary)' }}
                >
                  {FONTS.map(f => <option key={f.key} value={f.key}>{f.name}</option>)}
                </select>
              </div>

              <div style={S.section}>
                <span style={S.sectionTitle}>크기 {txtSize}px · 굵기</span>
                <input type="range" min={10} max={200} step={2}
                  value={txtSize}
                  onChange={e => { setTxtSize(Number(e.target.value)); applyTextProps({ fontSize: Number(e.target.value) }) }}
                  style={{ accentColor: 'var(--accent)', width: '100%' }}
                />
                <div style={{ ...S.row, gap: 5 }}>
                  {[700, 400].map(w => (
                    <button key={w} type="button"
                      onClick={() => { setTxtWeight(w); applyTextProps({ fontWeight: w }) }}
                      style={S.btn(txtWeight === w)}>
                      {w === 700 ? '굵게' : '보통'}
                    </button>
                  ))}
                </div>
              </div>

              <div style={S.section}>
                <span style={S.sectionTitle}>글자 색상</span>
                <div style={{ ...S.row, flexWrap: 'wrap', gap: 5 }}>
                  <input type="color" value={txtColor}
                    onChange={e => { setTxtColor(e.target.value); applyTextProps({ fill: e.target.value }) }}
                    style={{ width: 40, height: 32, border: '1px solid var(--border)', borderRadius: 5, cursor: 'pointer', padding: 1 }}
                  />
                  {['#ffffff','#000000','#f8fafc','#1e293b','#3b82f6','#ef4444','#f59e0b','#22c55e'].map(c => (
                    <button key={c} type="button" onClick={() => { setTxtColor(c); applyTextProps({ fill: c }) }}
                      style={{ width: 22, height: 22, background: c, border: `2px solid ${txtColor === c ? 'var(--accent)' : 'var(--border)'}`, borderRadius: 4, cursor: 'pointer' }} />
                  ))}
                </div>
              </div>

              <div style={S.section}>
                <span style={S.sectionTitle}>외곽선</span>
                <div style={{ ...S.row, gap: 8 }}>
                  <input type="color" value={txtStroke || '#000000'}
                    onChange={e => { setTxtStroke(e.target.value); applyTextProps({ stroke: e.target.value, strokeWidth: txtStrokeW }) }}
                    style={{ width: 40, height: 32, border: '1px solid var(--border)', borderRadius: 5, cursor: 'pointer', padding: 1 }}
                  />
                  <input type="range" min={0} max={10} step={0.5}
                    value={txtStrokeW}
                    onChange={e => { setTxtStrokeW(Number(e.target.value)); applyTextProps({ stroke: txtStroke || '#000000', strokeWidth: Number(e.target.value) }) }}
                    style={{ flex: 1, accentColor: 'var(--accent)' }}
                  />
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', minWidth: 28 }}>{txtStrokeW}px</span>
                  <button type="button" onClick={() => { setTxtStroke(''); applyTextProps({ stroke: '', strokeWidth: 0 }) }}
                    style={{ fontSize: 11, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)' }}>제거</button>
                </div>
              </div>

              <div style={S.section}>
                <span style={S.sectionTitle}>그림자</span>
                <div style={S.row}>
                  <input type="checkbox" id="txt-shadow" checked={txtShadow}
                    onChange={e => { setTxtShadow(e.target.checked); applyTextProps({ hasShadow: e.target.checked, shadowColor: 'rgba(0,0,0,0.6)' }) }}
                    style={{ accentColor: 'var(--accent)', width: 14, height: 14 }}
                  />
                  <label htmlFor="txt-shadow" style={{ fontSize: 12, cursor: 'pointer', color: 'var(--text-primary)' }}>그림자 효과</label>
                </div>
              </div>

              <div style={S.section}>
                <span style={S.sectionTitle}>애니메이션 효과</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                  {TEXT_EFFECTS.map(({ value, label }) => (
                    <button key={value} type="button"
                      onClick={() => { setTxtEffect(value); applyTextProps({ textEffect: value }) }}
                      style={S.btn(txtEffect === value)}>
                      {label}
                    </button>
                  ))}
                </div>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>효과는 배너 표시 시 적용됩니다 (저장 후 확인).</p>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── TAB: Canvas size ── */}
      {activeTab === 'size' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={S.section}>
            <span style={S.sectionTitle}>프리셋</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {CANVAS_PRESETS.map(({ label, width, height }) => (
                <button key={label} type="button"
                  onClick={() => handleSizePreset(width, height)}
                  style={{ padding: '6px 12px', fontSize: 12, textAlign: 'left', background: cfg.canvasWidth === width && cfg.canvasHeight === height ? 'var(--accent)' : 'var(--bg-tertiary)', border: `1px solid ${cfg.canvasWidth === width && cfg.canvasHeight === height ? 'var(--accent)' : 'var(--border)'}`, borderRadius: 6, cursor: 'pointer', color: cfg.canvasWidth === width && cfg.canvasHeight === height ? 'var(--accent-fg, #fff)' : 'var(--text-primary)' }}>
                  {label} <span style={{ opacity: 0.7, marginLeft: 6 }}>{width}×{height}px</span>
                </button>
              ))}
            </div>
          </div>
          <div style={S.section}>
            <span style={S.sectionTitle}>직접 입력</span>
            <div style={{ ...S.row, gap: 8 }}>
              <input type="number" min={100} max={2400} step={10}
                value={cfg.canvasWidth}
                onChange={e => onChange({ ...config, canvasWidth: Math.max(100, Number(e.target.value)) })}
                style={{ width: 80, padding: '5px 8px', fontSize: 12, background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-primary)' }}
              />
              <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>×</span>
              <input type="number" min={50} max={2400} step={10}
                value={cfg.canvasHeight}
                onChange={e => onChange({ ...config, canvasHeight: Math.max(50, Number(e.target.value)) })}
                style={{ width: 80, padding: '5px 8px', fontSize: 12, background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-primary)' }}
              />
              <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>px</span>
            </div>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>※ 크기 변경 후 에디터를 재시작해야 적용됩니다.</p>
          </div>
        </div>
      )}

      {/* ── Save button ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingTop: 4, borderTop: '1px solid var(--border)' }}>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !canvasReady}
          style={{ padding: '9px 0', fontSize: 13, fontWeight: 700, background: 'var(--accent)', color: 'var(--accent-fg, #fff)', border: 'none', borderRadius: 8, cursor: saving ? 'default' : 'pointer', opacity: saving ? 0.7 : 1 }}
        >
          {saving ? '저장 중...' : '💾 배너 저장'}
        </button>
        {saveOk && <p style={{ fontSize: 11, color: 'var(--success, #22c55e)', textAlign: 'center' }}>✓ 배너가 저장되었습니다.</p>}
        {saveError && <p style={{ fontSize: 11, color: 'var(--danger)', textAlign: 'center' }}>{saveError}</p>}
        <p style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', margin: 0 }}>
          저장하면 PNG로 내보내져 방문자에게 표시됩니다.
        </p>
      </div>

      {/* ── Background removal modal overlay ── */}
      {bgRemovalModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(0,0,0,0.55)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 16,
        }}>
          <div style={{
            background: 'var(--bg-primary)', borderRadius: 14,
            padding: 22, maxWidth: 340, width: '100%',
            border: '1px solid var(--border)',
            display: 'flex', flexDirection: 'column', gap: 14,
            boxShadow: '0 12px 40px rgba(0,0,0,0.3)',
          }}>
            <p style={{ fontWeight: 700, fontSize: 15, margin: 0, color: 'var(--text-primary)' }}>이미지 추가 옵션</p>
            <img
              src={bgRemovalModal.previewUrl}
              alt="미리보기"
              style={{ width: '100%', maxHeight: 150, objectFit: 'contain', borderRadius: 10, background: 'repeating-conic-gradient(#e2e8f0 0% 25%, #fff 0% 50%) 0 0 / 16px 16px' }}
            />
            {bgRemoving ? (
              <div style={{ textAlign: 'center', padding: '12px 0', color: 'var(--text-muted)', fontSize: 13 }}>
                <div style={{ marginBottom: 8, fontSize: 20 }}>⏳</div>
                배경 제거 처리 중...<br />
                <span style={{ fontSize: 11 }}>처음 실행 시 AI 모델을 다운로드합니다 (잠시 기다려주세요)</span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <button type="button" onClick={handleAddImageDirect}
                  style={{ padding: '10px 0', fontSize: 13, background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer', color: 'var(--text-primary)' }}>
                  그대로 추가
                </button>
                <button type="button" onClick={handleAddImageWithBgRemoval}
                  style={{ padding: '10px 0', fontSize: 13, fontWeight: 700, background: 'var(--accent)', border: 'none', borderRadius: 8, cursor: 'pointer', color: 'var(--accent-fg, #fff)' }}>
                  ✨ 배경 제거 후 추가
                </button>
                <p style={{ fontSize: 10, color: 'var(--text-muted)', margin: 0, textAlign: 'center' }}>
                  AI 배경 제거는 브라우저에서 처리됩니다 (외부 서버 미사용)
                </p>
                <button type="button" onClick={handleCloseModal}
                  style={{ fontSize: 12, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px 0' }}>
                  취소
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Canvas init trigger ────────────────────────────────────────────────────────
function CanvasInitTrigger({
  canvasRef,
  onReady,
}: {
  canvasRef: React.RefObject<EditorCanvasRef | null>
  onReady: () => void
}) {
  const fired = useRef(false)
  useEffect(() => {
    if (fired.current) return
    const timer = setInterval(() => {
      if (canvasRef.current) {
        fired.current = true
        clearInterval(timer)
        onReady()
      }
    }, 100)
    return () => clearInterval(timer)
  }, [canvasRef, onReady])
  return null
}
