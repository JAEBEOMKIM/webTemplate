'use client'

// EditorCanvas — Fabric.js v7 canvas wrapper
// Loaded via next/dynamic({ ssr: false }) in BannerEditorComponent

import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react'
import { Canvas, FabricImage, IText } from 'fabric'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface TextUpdateProps {
  fontFamily?: string
  fontSize?: number
  fontWeight?: number
  fontStyle?: string  // 'italic' | 'normal'
  fill?: string
}

export interface EditorCanvasRef {
  addImageLayer(url: string, layerId: string): Promise<void>
  addTextLayer(text: string, layerId: string, fontFamily?: string): void
  setBackgroundColor(color: string): void
  setBackgroundImage(url: string): Promise<void>
  /** 배경 이미지를 선택/이동 가능한 레이어 오브젝트로 추가 (z=0 고정) */
  setBackgroundImageAsLayer(url: string, layerId: string): Promise<void>
  /** 구버전 canvas.backgroundImage → 선택 가능한 오브젝트로 이전 */
  migrateBackgroundImage(layerId: string): Promise<void>
  clearBackground(): void
  /** 배경을 투명(페이지 배경색)으로 설정 */
  setBackgroundTransparent(): void
  removeLayer(layerId: string): void
  setLayerVisible(layerId: string, visible: boolean): void
  setLayerOpacity(layerId: string, opacity: number): void  // 0–100
  bringLayerForward(layerId: string): void
  sendLayerBackward(layerId: string): void
  selectLayer(layerId: string): void
  rotateSelected(deg: number): void
  flipSelected(axis: 'x' | 'y'): void
  updateTextProps(layerId: string, props: TextUpdateProps): void
  getSelectedLayerId(): string | null
  getSelectedType(): 'image' | 'text' | null
  getJSON(): string
  exportPNG(): string
  loadJSON(json: string): Promise<void>
}

export interface EditorCanvasProps {
  width: number
  height: number
  onSelect?: (layerId: string | null, type: 'image' | 'text' | null) => void
  onModified?: () => void
}

// ── Helper ────────────────────────────────────────────────────────────────────

function getType(obj: { type?: string }): 'image' | 'text' | null {
  if (obj.type === 'image') return 'image'
  if (obj.type === 'i-text' || obj.type === 'textbox') return 'text'
  return null
}

// ── Component ─────────────────────────────────────────────────────────────────

const EditorCanvas = forwardRef<EditorCanvasRef, EditorCanvasProps>(
  ({ width, height, onSelect, onModified }, ref) => {
    const elRef = useRef<HTMLCanvasElement>(null)
    const cvRef = useRef<Canvas | null>(null)

    // ── Canvas init ──────────────────────────────────────────────────────────
    useEffect(() => {
      if (!elRef.current || cvRef.current) return

      const canvas = new Canvas(elRef.current, {
        width,
        height,
        backgroundColor: '#ffffff',
        selection: true,
        preserveObjectStacking: true,
      })
      cvRef.current = canvas

      // Selection events
      const onSelChange = () => {
        const obj = canvas.getActiveObject() as ({ layerId?: string; type?: string }) | null
        if (obj) {
          onSelect?.(obj.layerId ?? null, getType(obj))
        } else {
          onSelect?.(null, null)
        }
      }
      canvas.on('selection:created', onSelChange)
      canvas.on('selection:updated', onSelChange)
      canvas.on('selection:cleared', onSelChange)

      // Modification events
      canvas.on('object:modified', () => onModified?.())
      canvas.on('text:changed', () => onModified?.())

      return () => {
        canvas.dispose()
        cvRef.current = null
      }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // ── Helpers ──────────────────────────────────────────────────────────────

    function getCanvas(): Canvas | null {
      return cvRef.current
    }

    function findObj(layerId: string) {
      const cv = getCanvas()
      if (!cv) return null
      return (cv.getObjects() as Array<{ layerId?: string } & InstanceType<typeof FabricImage>>)
        .find(o => o.layerId === layerId) ?? null
    }

    // ── Imperative handle ────────────────────────────────────────────────────
    useImperativeHandle(ref, () => ({

      async addImageLayer(url, layerId) {
        const cv = getCanvas()
        if (!cv) return
        const img = await FabricImage.fromURL(url, { crossOrigin: 'anonymous' })
        const maxW = cv.width! * 0.7
        const maxH = cv.height! * 0.85
        const scale = Math.min(maxW / (img.width || 1), maxH / (img.height || 1), 1)
        img.scale(scale)
        img.set({ left: 40, top: 40 })
        ;(img as typeof img & { layerId: string }).layerId = layerId
        cv.add(img)
        cv.setActiveObject(img)
        cv.requestRenderAll()
        onModified?.()
      },

      addTextLayer(text, layerId, fontFamily) {
        const cv = getCanvas()
        if (!cv) return
        const itext = new IText(text, {
          left: 80,
          top: 80,
          fontFamily: fontFamily ?? "'Noto Sans KR', sans-serif",
          fontSize: 42,
          fill: '#ffffff',
          fontWeight: 700,
          editable: true,
        })
        ;(itext as typeof itext & { layerId: string }).layerId = layerId
        cv.add(itext)
        cv.setActiveObject(itext)
        cv.requestRenderAll()
        onModified?.()
      },

      setBackgroundColor(color) {
        const cv = getCanvas()
        if (!cv) return
        cv.backgroundImage = undefined as unknown as typeof cv.backgroundImage
        cv.backgroundColor = color
        cv.requestRenderAll()
        onModified?.()
      },

      async setBackgroundImage(url) {
        const cv = getCanvas()
        if (!cv) return
        const img = await FabricImage.fromURL(url, { crossOrigin: 'anonymous' })
        const W = cv.width!
        const H = cv.height!
        const scaleX = W / (img.width || 1)
        const scaleY = H / (img.height || 1)
        const scale = Math.max(scaleX, scaleY)
        img.scale(scale)
        img.set({
          left: (W - (img.width || 0) * scale) / 2,
          top: (H - (img.height || 0) * scale) / 2,
          selectable: false,
          evented: false,
        })
        cv.backgroundImage = img as unknown as typeof cv.backgroundImage
        cv.backgroundColor = ''
        cv.requestRenderAll()
        onModified?.()
      },

      async setBackgroundImageAsLayer(url, layerId) {
        const cv = getCanvas()
        if (!cv) return
        const img = await FabricImage.fromURL(url, { crossOrigin: 'anonymous' })
        const W = cv.width!
        const H = cv.height!
        const scaleX = W / (img.width || 1)
        const scaleY = H / (img.height || 1)
        const scale = Math.max(scaleX, scaleY)
        img.scale(scale)
        img.set({
          left: (W - (img.width || 0) * scale) / 2,
          top: (H - (img.height || 0) * scale) / 2,
          selectable: true,
          evented: true,
        })
        ;(img as typeof img & { layerId: string }).layerId = layerId
        cv.add(img)
        cv.sendObjectToBack(img as InstanceType<typeof FabricImage>)
        cv.requestRenderAll()
        onModified?.()
      },

      async migrateBackgroundImage(layerId) {
        const cv = getCanvas()
        if (!cv || !cv.backgroundImage) return
        const img = cv.backgroundImage as InstanceType<typeof FabricImage>
        img.set({ selectable: true, evented: true })
        ;(img as typeof img & { layerId: string }).layerId = layerId
        cv.backgroundImage = undefined as unknown as typeof cv.backgroundImage
        cv.add(img)
        cv.sendObjectToBack(img)
        cv.requestRenderAll()
        onModified?.()
      },

      clearBackground() {
        const cv = getCanvas()
        if (!cv) return
        cv.backgroundImage = undefined as unknown as typeof cv.backgroundImage
        cv.backgroundColor = '#ffffff'
        cv.requestRenderAll()
        onModified?.()
      },

      setBackgroundTransparent() {
        const cv = getCanvas()
        if (!cv) return
        cv.backgroundImage = undefined as unknown as typeof cv.backgroundImage
        cv.backgroundColor = ''
        cv.requestRenderAll()
        onModified?.()
      },

      removeLayer(layerId) {
        const cv = getCanvas()
        if (!cv) return
        const obj = findObj(layerId)
        if (obj) { cv.remove(obj as InstanceType<typeof FabricImage>); cv.requestRenderAll(); onModified?.() }
      },

      setLayerVisible(layerId, visible) {
        const cv = getCanvas()
        if (!cv) return
        const obj = findObj(layerId)
        if (obj) { obj.set({ visible }); cv.requestRenderAll(); onModified?.() }
      },

      setLayerOpacity(layerId, opacity) {
        const cv = getCanvas()
        if (!cv) return
        const obj = findObj(layerId)
        if (obj) { obj.set({ opacity: opacity / 100 }); cv.requestRenderAll(); onModified?.() }
      },

      bringLayerForward(layerId) {
        const cv = getCanvas()
        if (!cv) return
        const obj = findObj(layerId)
        if (obj) { cv.bringObjectForward(obj as InstanceType<typeof FabricImage>); cv.requestRenderAll(); onModified?.() }
      },

      sendLayerBackward(layerId) {
        const cv = getCanvas()
        if (!cv) return
        const obj = findObj(layerId)
        if (obj) { cv.sendObjectBackwards(obj as InstanceType<typeof FabricImage>); cv.requestRenderAll(); onModified?.() }
      },

      selectLayer(layerId) {
        const cv = getCanvas()
        if (!cv) return
        const obj = findObj(layerId)
        if (obj) { cv.setActiveObject(obj as InstanceType<typeof FabricImage>); cv.requestRenderAll() }
      },

      rotateSelected(deg) {
        const cv = getCanvas()
        if (!cv) return
        const obj = cv.getActiveObject()
        if (obj) { obj.rotate((obj.angle ?? 0) + deg); cv.requestRenderAll(); onModified?.() }
      },

      flipSelected(axis) {
        const cv = getCanvas()
        if (!cv) return
        const obj = cv.getActiveObject()
        if (!obj) return
        if (axis === 'x') obj.set({ flipX: !obj.flipX })
        else obj.set({ flipY: !obj.flipY })
        cv.requestRenderAll()
        onModified?.()
      },

      updateTextProps(layerId, props) {
        const cv = getCanvas()
        if (!cv) return
        const obj = findObj(layerId)
        if (!obj) return
        const itext = obj as unknown as IText & { layerId: string }
        if (props.fontFamily !== undefined) itext.set({ fontFamily: props.fontFamily })
        if (props.fontSize !== undefined) itext.set({ fontSize: props.fontSize })
        if (props.fontWeight !== undefined) itext.set({ fontWeight: props.fontWeight } as Parameters<typeof itext.set>[0])
        if (props.fontStyle !== undefined) itext.set({ fontStyle: props.fontStyle } as Parameters<typeof itext.set>[0])
        if (props.fill !== undefined) itext.set({ fill: props.fill })
        cv.requestRenderAll()
        onModified?.()
      },

      getSelectedLayerId() {
        const cv = getCanvas()
        if (!cv) return null
        const obj = cv.getActiveObject() as ({ layerId?: string }) | null
        return obj?.layerId ?? null
      },

      getSelectedType() {
        const cv = getCanvas()
        if (!cv) return null
        const obj = cv.getActiveObject()
        return obj ? getType(obj) : null
      },

      getJSON() {
        const cv = getCanvas()
        if (!cv) return ''
        return JSON.stringify(cv.toObject(['layerId']))
      },

      exportPNG() {
        const cv = getCanvas()
        if (!cv) return ''
        return cv.toDataURL({ format: 'png', multiplier: 2 })
      },

      async loadJSON(json) {
        const cv = getCanvas()
        if (!cv || !json) return
        try {
          await cv.loadFromJSON(JSON.parse(json))
          cv.requestRenderAll()
        } catch (e) {
          console.error('[EditorCanvas] loadJSON failed:', e)
        }
      },

    }))

    return (
      <canvas
        ref={elRef}
        style={{
          display: 'block',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
        }}
      />
    )
  }
)

EditorCanvas.displayName = 'EditorCanvas'
export default EditorCanvas
