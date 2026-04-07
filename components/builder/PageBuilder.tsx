'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { componentRegistry, buildResolvedRegistry } from '@/components/registry'
import type {
  PageData,
  PageComponentData,
  ComponentDefinitionRow,
  ComponentGroupRow,
  ComponentGroupNode,
  ResolvedComponentDefinition,
} from '@/components/registry/types'
import { buildGroupTree, countGroupComponents } from '@/lib/components/group-utils'
import PopupConfigForm from '@/components/ui/popup/PopupConfigForm'
import { ThemeSelector } from '@/components/ui/ThemeSelector'
import { GridLayout } from 'react-grid-layout'
import type { Layout, LayoutItem } from 'react-grid-layout'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'
import {
  DndContext,
  DragOverlay,
  useDraggable,
  useDroppable,
  type DragEndEvent,
  type DragStartEvent,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { PreviewErrorBoundary } from './PreviewErrorBoundary'

const COLS = 10
const ROW_HEIGHT = 60
const MAX_ROWS = 20

const DEVICE_PRESETS = [
  { id: 'pc', label: 'PC', width: 1280 },
  { id: 'laptop', label: 'Laptop', width: 1024 },
  { id: 'tablet', label: 'iPad', width: 768 },
  { id: 'mobile-lg', label: 'iPhone 16 Pro Max', width: 430 },
  { id: 'mobile-md', label: 'iPhone 14 Pro', width: 393 },
  { id: 'mobile-sm', label: 'Galaxy S24', width: 360 },
  { id: 'mobile-xs', label: 'iPhone SE', width: 320 },
] as const

interface Props {
  page: PageData
  initialComponents: PageComponentData[]
  componentDefs: ComponentDefinitionRow[]
  componentGroups: ComponentGroupRow[]
}

function PanelToggle({ label, collapsed, onClick }: { label: string; collapsed: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        writingMode: collapsed ? 'vertical-rl' : undefined,
        padding: collapsed ? '12px 6px' : '6px 10px',
        background: 'var(--bg-secondary)',
        border: 'none',
        cursor: 'pointer',
        fontSize: '11px',
        fontWeight: 700,
        color: 'var(--text-muted)',
        letterSpacing: '0.05em',
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        flexShrink: 0,
      }}
      title={collapsed ? `${label} 열기` : `${label} 닫기`}
    >
      <span style={{ fontSize: '10px', transform: collapsed ? 'rotate(90deg)' : undefined }}>{collapsed ? '▶' : '◀'}</span>
      {collapsed && <span>{label}</span>}
    </button>
  )
}

// ── 팔레트 그룹 (재귀적 트리 렌더링) ───────────────────────────────────────
function PaletteGroup({ group, depth = 0 }: { group: ComponentGroupNode; depth?: number }) {
  const [expanded, setExpanded] = useState(true)
  const count = countGroupComponents(group)
  if (count === 0) return null

  return (
    <div style={{ marginLeft: depth * 6 }}>
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          display: 'flex', alignItems: 'center', gap: '5px', width: '100%',
          padding: '6px 8px', background: 'none', border: 'none', cursor: 'pointer',
          fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)',
          borderRadius: '6px', textAlign: 'left',
        }}
        className="palette-group-btn"
      >
        <span style={{ fontSize: '8px', opacity: 0.6, transition: 'transform 0.15s', transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)' }}>▶</span>
        <span>{group.icon}</span>
        <span style={{ flex: 1 }}>{group.name}</span>
        <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 400 }}>{count}</span>
      </button>
      {expanded && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '2px' }}>
          {group.components.map(def => (
            <PaletteItem key={def.id} def={def} size={{ w: def.gridW, h: def.gridH }} />
          ))}
          {group.children.map(child => (
            <PaletteGroup key={child.id} group={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  )
}

// ── 팔레트 아이템 (dnd-kit useDraggable) ─────────────────────────────────
function PaletteItem({
  def,
  size,
}: {
  def: { id: string; name: string; icon: React.ReactNode }
  size?: { w: number; h: number }
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `palette-${def.id}`,
    data: { componentType: def.id },
  })

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={{
        padding: '10px 12px',
        borderRadius: '10px',
        border: '1.5px dashed var(--border)',
        background: 'transparent',
        cursor: 'grab',
        userSelect: 'none',
        // 드래그 중에는 원본을 반투명하게 (DragOverlay가 ghost 역할)
        opacity: isDragging ? 0.4 : 1,
        transform: CSS.Translate.toString(transform),
        touchAction: 'none', // 터치 스크롤 방지 (dnd-kit 필수)
      }}
      className="palette-item"
    >
      <div style={{ fontSize: '20px', marginBottom: '4px' }}>{def.icon}</div>
      <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '2px' }}>{def.name}</div>
      <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
        기본 {size?.w ?? '?'}×{size?.h ?? '?'}
      </div>
    </div>
  )
}

// ── DragOverlay 내부에서 렌더되는 드래그 ghost ────────────────────────────
function PaletteDragGhost({ componentType, resolvedRegistry }: { componentType: string; resolvedRegistry: Map<string, ResolvedComponentDefinition> }) {
  const def = resolvedRegistry.get(componentType) ?? componentRegistry.get(componentType)
  if (!def) return null
  return (
    <div style={{
      padding: '10px 12px',
      borderRadius: '10px',
      border: '1.5px solid var(--accent)',
      background: 'var(--accent-subtle)',
      boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
      cursor: 'grabbing',
      minWidth: '120px',
    }}>
      <div style={{ fontSize: '20px', marginBottom: '4px' }}>{def.icon}</div>
      <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent)' }}>{def.name}</div>
    </div>
  )
}

// ── 캔버스 드롭 영역 (dnd-kit useDroppable) ──────────────────────────────
function CanvasDropZone({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  const { setNodeRef, isOver } = useDroppable({ id: 'canvas' })
  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        outline: isOver ? '2px dashed var(--accent)' : undefined,
        outlineOffset: '-4px',
        transition: 'outline 0.1s',
      }}
    >
      {children}
    </div>
  )
}

export function PageBuilder({ page, initialComponents, componentDefs, componentGroups }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const containerRef = useRef<HTMLDivElement>(null)

  // DB 행 + 코드 구현체 병합 → 렌더 가능한 컴포넌트만
  const resolvedRegistry = useMemo(() => buildResolvedRegistry(componentDefs), [componentDefs])
  // 그룹 트리 구축
  const groupTree = useMemo(
    () => buildGroupTree(componentGroups, Array.from(resolvedRegistry.values())),
    [componentGroups, resolvedRegistry]
  )

  const [components, setComponents] = useState<PageComponentData[]>(initialComponents)
  const [layout, setLayout] = useState<LayoutItem[]>(
    initialComponents.map(c => ({
      i: c.id,
      x: c.grid_x ?? 0,
      y: c.grid_y ?? 0,
      w: c.grid_w ?? 10,
      h: c.grid_h ?? 6,
    }))
  )
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [pageTheme, setPageTheme] = useState<string | null>(page.theme ?? null)
  const [pageTitle, setPageTitle] = useState(page.title)
  const [pageShowHeader, setPageShowHeader] = useState(page.show_header !== false)
  const [pagePadding, setPagePadding] = useState({
    top: page.padding_top ?? 20,
    right: page.padding_right ?? 20,
    bottom: page.padding_bottom ?? 20,
    left: page.padding_left ?? 20,
  })
  const [containerWidth, setContainerWidth] = useState(800)
  const [dropError, setDropError] = useState<string | null>(null)

  // dnd-kit: 현재 드래그 중인 팔레트 아이템 타입
  const [activePaletteType, setActivePaletteType] = useState<string | null>(null)
  // ▲/▼ 스왑 중에 onLayoutChange가 layout을 덮어쓰지 않도록 플래그
  const swapInProgress = useRef(false)

  // Panel collapse states
  const [paletteCollapsed, setPaletteCollapsed] = useState(false)
  const [configCollapsed, setConfigCollapsed] = useState(false)
  const [previewMode, setPreviewMode] = useState(true)
  const [devicePreset, setDevicePreset] = useState<string>('pc')
  const activePreset = DEVICE_PRESETS.find(d => d.id === devicePreset) ?? DEVICE_PRESETS[0]

  // Resizable panel widths
  const [paletteWidth, setPaletteWidth] = useState(180)
  const [configWidth, setConfigWidth] = useState(260)
  const resizingPanel = useRef<'palette' | 'config' | null>(null)
  const startXRef = useRef(0)
  const startWidthRef = useRef(0)

  // dnd-kit 센서: PointerSensor (마우스 + 터치 통합), TouchSensor (모바일 최적화)
  // activationConstraint: 5px 이동 후 드래그 시작 → 클릭과 구분
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 100, tolerance: 5 },
    })
  )

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!resizingPanel.current) return
      const delta = e.clientX - startXRef.current
      if (resizingPanel.current === 'palette') {
        setPaletteWidth(Math.max(140, Math.min(320, startWidthRef.current + delta)))
      } else {
        setConfigWidth(Math.max(200, Math.min(500, startWidthRef.current - delta)))
      }
    }
    const onMouseUp = () => {
      if (!resizingPanel.current) return
      resizingPanel.current = null
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }, [])

  const startResizePalette = useCallback((e: React.MouseEvent) => {
    resizingPanel.current = 'palette'
    startXRef.current = e.clientX
    startWidthRef.current = paletteWidth
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }, [paletteWidth])

  const startResizeConfig = useCallback((e: React.MouseEvent) => {
    resizingPanel.current = 'config'
    startXRef.current = e.clientX
    startWidthRef.current = configWidth
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }, [configWidth])

  const selectedComponent = components.find(c => c.id === selectedId) ?? null
  const selectedDef = selectedComponent
    ? (resolvedRegistry.get(selectedComponent.component_type) ?? componentRegistry.get(selectedComponent.component_type) ?? null)
    : null

  useEffect(() => {
    if (!containerRef.current) return
    const observer = new ResizeObserver(entries => {
      setContainerWidth(entries[0].contentRect.width)
    })
    observer.observe(containerRef.current)
    setContainerWidth(containerRef.current.clientWidth)
    return () => observer.disconnect()
  }, [])

  const saveLayout = useCallback(async (newLayout: readonly LayoutItem[]) => {
    await Promise.all(
      newLayout
        .filter(item => item.i !== '__dropping-elem__')
        .map(item =>
          supabase.from('page_components').update({
            grid_x: item.x,
            grid_y: item.y,
            grid_w: item.w,
            grid_h: item.h,
          }).eq('id', item.i)
        )
    )
  }, [supabase])

  const addComponentToCanvas = useCallback((type: string, gridX: number, gridY: number) => {
    // DB 기반 resolved registry에서 먼저 조회, 없으면 레거시 registry
    const resolved = resolvedRegistry.get(type)
    const legacyDef = componentRegistry.get(type)
    const def = resolved ?? legacyDef
    if (!def) return

    const w = resolved?.gridW ?? 5
    const h = resolved?.gridH ?? 4
    const newId = crypto.randomUUID()
    const displayOrder = components.length

    const newComp: PageComponentData = {
      id: newId,
      page_id: page.id,
      component_type: type,
      display_order: displayOrder,
      config: def.defaultConfig,
      grid_x: gridX,
      grid_y: gridY,
      grid_w: w,
      grid_h: h,
    }

    setComponents(prev => [...prev, newComp])
    setLayout(prev => [...prev, { i: newId, x: gridX, y: gridY, w, h }])
    setSelectedId(newId)
    setDropError(null)

    supabase
      .from('page_components')
      .insert({
        id: newId,
        page_id: page.id,
        component_type: type,
        display_order: displayOrder,
        config: def.defaultConfig,
        grid_x: gridX,
        grid_y: gridY,
        grid_w: w,
        grid_h: h,
      })
      .then(({ error }) => {
        if (error) {
          console.error('[PageBuilder] 컴포넌트 추가 실패:', error.message)
          setDropError(`추가 실패: ${error.message}`)
          setComponents(prev => prev.filter(c => c.id !== newId))
          setLayout(prev => prev.filter(l => l.i !== newId))
          setSelectedId(null)
        }
      })
  }, [supabase, page.id, components.length, resolvedRegistry])

  // dnd-kit: 드래그 시작
  const handleDragStart = (event: DragStartEvent) => {
    const type = (event.active.data.current as { componentType?: string })?.componentType
    if (type) setActivePaletteType(type)
  }

  // dnd-kit: 드롭 완료 — 팔레트 → 캔버스
  const handleDragEnd = (event: DragEndEvent) => {
    const { over, active } = event
    setActivePaletteType(null)

    // canvas 드롭존 위에서 놓았을 때만 추가
    if (over?.id === 'canvas') {
      const type = (active.data.current as { componentType?: string })?.componentType
      if (type) {
        const gridY = components.length > 0
          ? Math.max(...layout.map(l => l.y + l.h))
          : 0
        addComponentToCanvas(type, 0, gridY)
      }
    }
  }

  // react-grid-layout internal drop (HTML5 fallback for desktop — 여전히 지원)
  const handleDrop = (_newLayout: Layout, droppedItem: LayoutItem | undefined) => {
    if (!activePaletteType || !droppedItem) return
    addComponentToCanvas(activePaletteType, droppedItem.x, droppedItem.y)
    setActivePaletteType(null)
  }

  const handleRemoveComponent = async (id: string) => {
    if (!confirm('이 컴포넌트를 삭제할까요?')) return
    await supabase.from('page_components').delete().eq('id', id)
    setComponents(prev => prev.filter(c => c.id !== id))
    setLayout(prev => prev.filter(l => l.i !== id))
    if (selectedId === id) setSelectedId(null)
  }

  const handleConfigChange = async (id: string, config: Record<string, unknown>) => {
    setComponents(prev => prev.map(c => c.id === id ? { ...c, config } : c))
    await supabase.from('page_components').update({ config }).eq('id', id)
  }

  const handlePublishToggle = async () => {
    setSaving(true)
    await supabase.from('pages').update({ is_published: !page.is_published }).eq('id', page.id)
    router.refresh()
    setSaving(false)
  }

  const handleThemeChange = async (themeId: string | null) => {
    setPageTheme(themeId)
    await supabase.from('pages').update({ theme: themeId }).eq('id', page.id)
  }

  const handleTitleChange = async (title: string) => {
    setPageTitle(title)
    await supabase.from('pages').update({ title }).eq('id', page.id)
  }

  const handleShowHeaderChange = async (show: boolean) => {
    setPageShowHeader(show)
    await supabase.from('pages').update({ show_header: show }).eq('id', page.id)
  }

  const handlePaddingChange = async (side: 'top' | 'right' | 'bottom' | 'left', value: number) => {
    const next = { ...pagePadding, [side]: value }
    setPagePadding(next)
    await supabase.from('pages').update({
      padding_top: next.top,
      padding_right: next.right,
      padding_bottom: next.bottom,
      padding_left: next.left,
    }).eq('id', page.id)
  }

  const handleSwapPosition = useCallback(async (compId: string, direction: 'up' | 'down') => {
    const sorted = [...components]
      .map(c => {
        const li = layout.find(l => l.i === c.id)
        return { comp: c, y: li?.y ?? 0, h: li?.h ?? 1 }
      })
      .sort((a, b) => a.y - b.y)

    const idx = sorted.findIndex(s => s.comp.id === compId)
    if (idx < 0) return
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= sorted.length) return

    const current = sorted[idx]
    const target = sorted[swapIdx]

    const topItem = direction === 'up' ? target : current
    const bottomItem = direction === 'up' ? current : target

    const newTopY = topItem.y
    const newBottomY = newTopY + (direction === 'up' ? current.h : target.h)

    const newLayout = layout.map(l => {
      if (l.i === current.comp.id) return { ...l, y: direction === 'up' ? newTopY : newBottomY }
      if (l.i === target.comp.id) return { ...l, y: direction === 'up' ? newBottomY : newTopY }
      return { ...l }
    })

    swapInProgress.current = true
    setLayout(newLayout)
    await saveLayout(newLayout)
    // onLayoutChange가 react-grid-layout auto-compact로 덮어쓰지 않도록
    // 다음 렌더 사이클까지 플래그 유지
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        swapInProgress.current = false
      })
    })
  }, [components, layout, saveLayout])

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div style={{ display: 'flex', gap: '0', height: 'calc(100vh - 120px)', minHeight: '600px', background: 'var(--bg-secondary)', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--border)' }}>

        {/* Left: Component Palette */}
        {paletteCollapsed ? (
          <PanelToggle label="컴포넌트" collapsed onClick={() => setPaletteCollapsed(false)} />
        ) : (<>
          <div style={{
            width: `${paletteWidth}px`, flexShrink: 0,
            background: 'var(--bg-primary)',
            display: 'flex', flexDirection: 'column',
          }}>
            <div style={{ padding: '14px 14px 10px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>컴포넌트</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>드래그해서 추가</div>
              </div>
              <button
                onClick={() => setPaletteCollapsed(true)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '14px', padding: '0 2px', lineHeight: 1 }}
                title="패널 접기"
              >◀</button>
            </div>
            <div style={{ padding: '8px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {groupTree.map(group => (
                <PaletteGroup key={group.id} group={group} />
              ))}
            </div>
          </div>
          {/* Palette resize handle */}
          <div
            onMouseDown={startResizePalette}
            style={{
              width: '5px', flexShrink: 0, cursor: 'col-resize',
              background: 'var(--border)', transition: 'background 0.1s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = 'var(--accent)' }}
            onMouseLeave={e => { if (!resizingPanel.current) (e.currentTarget as HTMLDivElement).style.background = 'var(--border)' }}
            title="드래그하여 패널 크기 조절"
          />
        </>)}

        {/* Center: Grid Canvas */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          {/* Header */}
          <div style={{
            padding: '12px 16px', borderBottom: '1px solid var(--border)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            background: 'var(--bg-primary)', flexWrap: 'wrap', gap: '8px',
          }}>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>{pageTitle}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>/{page.slug} · {COLS}열 × {MAX_ROWS}행</div>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button
                onClick={() => setPreviewMode(p => !p)}
                style={{
                  padding: '5px 10px', fontSize: '12px', fontWeight: 600,
                  background: previewMode ? 'var(--accent)' : 'var(--bg-secondary)',
                  color: previewMode ? 'white' : 'var(--text-secondary)',
                  border: '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer',
                }}
                title={previewMode ? '미리보기 끄기' : '미리보기 켜기'}
              >
                {previewMode ? '👁 미리보기' : '👁‍🗨 플레이스홀더'}
              </button>
              <select
                value={devicePreset}
                onChange={e => setDevicePreset(e.target.value)}
                style={{
                  padding: '5px 8px', fontSize: '11px', fontWeight: 600,
                  background: 'var(--bg-secondary)', color: 'var(--text-secondary)',
                  border: '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer',
                }}
              >
                {DEVICE_PRESETS.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.label}{d.width ? ` (${d.width}px)` : ''}
                  </option>
                ))}
              </select>
              <span className={page.is_published ? 'badge-success' : 'badge-draft'}>
                {page.is_published ? '발행됨' : '초안'}
              </span>
              <button
                onClick={handlePublishToggle}
                disabled={saving}
                className={page.is_published ? 'btn-secondary' : 'btn-primary'}
                style={{ padding: '7px 16px', fontSize: '13px' }}
              >
                {saving ? '...' : page.is_published ? '발행 취소' : '발행하기'}
              </button>
            </div>
          </div>

          {/* Grid area — useDroppable 캔버스 */}
          <CanvasDropZone
            style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '16px', background: 'var(--bg-secondary)', position: 'relative' }}
          >
            <div ref={containerRef} style={{ width: '100%', height: '100%' }}>
              {dropError && (
                <div style={{ position: 'absolute', top: '8px', left: '50%', transform: 'translateX(-50%)', zIndex: 10, background: 'var(--danger)', color: 'white', padding: '6px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, whiteSpace: 'nowrap' }}>
                  {dropError}
                  <button onClick={() => setDropError(null)} style={{ marginLeft: '8px', background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '14px', lineHeight: 1 }}>×</button>
                </div>
              )}
              {components.length === 0 && !activePaletteType && (
                <div style={{
                  position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                  textAlign: 'center', color: 'var(--text-muted)', pointerEvents: 'none', zIndex: 0,
                }}>
                  <div style={{ fontSize: '48px', marginBottom: '12px', opacity: 0.3 }}>🧩</div>
                  <p style={{ fontSize: '14px', fontWeight: 600 }}>왼쪽 패널에서 컴포넌트를</p>
                  <p style={{ fontSize: '13px' }}>드래그해서 캔버스에 놓으세요</p>
                </div>
              )}

              <GridLayout
                layout={layout}
                width={containerWidth - 32}
                gridConfig={{
                  cols: COLS,
                  rowHeight: ROW_HEIGHT,
                  maxRows: MAX_ROWS,
                  margin: [8, 8],
                  containerPadding: [0, 0],
                }}
                dragConfig={{
                  enabled: true,
                  handle: '.drag-handle',
                }}
                resizeConfig={{ enabled: true }}
                dropConfig={{
                  enabled: true,
                  defaultItem: activePaletteType
                    ? { w: resolvedRegistry.get(activePaletteType)?.gridW ?? 5, h: resolvedRegistry.get(activePaletteType)?.gridH ?? 4 }
                    : { w: 5, h: 4 },
                }}
                onDrop={handleDrop}
                onDragStop={(updatedLayout) => {
                  saveLayout(updatedLayout)
                }}
                onResizeStop={(updatedLayout) => {
                  saveLayout(updatedLayout)
                }}
                onLayoutChange={newLayout => {
                  // ▲/▼ 스왑 중에는 react-grid-layout auto-compact가 덮어쓰지 않도록 무시
                  if (swapInProgress.current) return
                  setLayout(prev => {
                    const newIds = new Set(newLayout.map(l => l.i))
                    const preserved = prev.filter(l => !newIds.has(l.i))
                    const merged = [...newLayout, ...preserved]
                    const same = merged.length === prev.length && merged.every((item) => {
                      const p = prev.find(pl => pl.i === item.i)
                      return p && p.x === item.x && p.y === item.y && p.w === item.w && p.h === item.h
                    })
                    return same ? prev : merged
                  })
                }}
                style={{ minHeight: `${MAX_ROWS * ROW_HEIGHT}px` }}
              >
                {(() => {
                  const sortedIds = [...components]
                    .map(c => ({ id: c.id, y: layout.find(l => l.i === c.id)?.y ?? 0 }))
                    .sort((a, b) => a.y - b.y)
                    .map(s => s.id)
                  const sortedIndexMap = new Map(sortedIds.map((id, i) => [id, i]))

                  return components.map(comp => {
                    const resolved = resolvedRegistry.get(comp.component_type)
                    const def = resolved ?? componentRegistry.get(comp.component_type)
                    const isSelected = selectedId === comp.id
                    const layoutItem = layout.find(l => l.i === comp.id)
                    const sortedIdx = sortedIndexMap.get(comp.id) ?? 0
                    const canMoveUp = sortedIdx > 0
                    const canMoveDown = sortedIdx < sortedIds.length - 1

                    return (
                      <div
                        key={comp.id}
                        data-grid={layout.find(l => l.i === comp.id)}
                        onClick={() => setSelectedId(comp.id)}
                        style={{
                          border: `2px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`,
                          background: isSelected ? 'var(--accent-subtle)' : 'var(--bg-primary)',
                          borderRadius: '12px',
                          overflow: 'hidden',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                        }}
                      >
                        <div
                          className="drag-handle"
                          style={{
                            padding: '7px 10px',
                            background: isSelected ? 'var(--accent)' : 'var(--bg-secondary)',
                            borderBottom: `1px solid ${isSelected ? 'var(--accent-hover)' : 'var(--border)'}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            cursor: 'grab', flexShrink: 0,
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '14px' }}>{def?.icon}</span>
                            <span style={{ fontSize: '11px', fontWeight: 700, color: isSelected ? 'white' : 'var(--text-primary)' }}>
                              {(comp.config.title as string) || def?.name}
                            </span>
                            {(comp.config.full_page as boolean) === true && (
                              <span style={{ fontSize: '9px', fontWeight: 800, background: isSelected ? 'rgba(255,255,255,0.25)' : 'var(--accent)', color: isSelected ? 'white' : '#fff', borderRadius: '4px', padding: '1px 5px', letterSpacing: '0.04em', flexShrink: 0 }}>
                                전체
                              </span>
                            )}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                            <button
                              onClick={e => { e.stopPropagation(); handleSwapPosition(comp.id, 'up') }}
                              disabled={!canMoveUp}
                              style={{
                                width: '18px', height: '18px', background: 'transparent', border: 'none',
                                borderRadius: '3px', cursor: canMoveUp ? 'pointer' : 'default', fontSize: '10px',
                                color: isSelected ? (canMoveUp ? 'white' : 'rgba(255,255,255,0.3)') : (canMoveUp ? 'var(--text-secondary)' : 'var(--border)'),
                                display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1, padding: 0,
                              }}
                              title="위로 이동"
                            >▲</button>
                            <button
                              onClick={e => { e.stopPropagation(); handleSwapPosition(comp.id, 'down') }}
                              disabled={!canMoveDown}
                              style={{
                                width: '18px', height: '18px', background: 'transparent', border: 'none',
                                borderRadius: '3px', cursor: canMoveDown ? 'pointer' : 'default', fontSize: '10px',
                                color: isSelected ? (canMoveDown ? 'white' : 'rgba(255,255,255,0.3)') : (canMoveDown ? 'var(--text-secondary)' : 'var(--border)'),
                                display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1, padding: 0,
                              }}
                              title="아래로 이동"
                            >▼</button>
                            <span style={{ fontSize: '10px', color: isSelected ? 'rgba(255,255,255,0.7)' : 'var(--text-muted)', fontFamily: 'monospace', marginLeft: '2px' }}>
                              {layoutItem?.w ?? 0}×{layoutItem?.h ?? 0}
                            </span>
                            <button
                              onClick={e => { e.stopPropagation(); handleRemoveComponent(comp.id) }}
                              style={{
                                width: '16px', height: '16px', background: 'transparent', border: 'none',
                                borderRadius: '3px', cursor: 'pointer', fontSize: '12px',
                                color: isSelected ? 'white' : 'var(--text-muted)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1, padding: 0,
                              }}
                            >×</button>
                          </div>
                        </div>
                        {(() => {
                          const VIRTUAL_W = activePreset.width
                          const headerH = 35
                          const cellW = ((layoutItem?.w ?? 1) / COLS) * containerWidth - 16
                          const cellH = (layoutItem?.h ?? 1) * ROW_HEIGHT - headerH - 8
                          const scale = Math.min(cellW / VIRTUAL_W, 1)
                          const virtualH = cellH / scale
                          const ResolvedComp = resolved?.Component
                          const placeholder = (
                            <div style={{
                              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                              color: 'var(--text-muted)', fontSize: '12px', gap: '8px', padding: '8px',
                            }}>
                              <span style={{ fontSize: '20px', opacity: 0.35 }}>{def?.icon}</span>
                              <span style={{ opacity: 0.5 }}>{def?.name}</span>
                            </div>
                          )

                          if (!previewMode || !ResolvedComp) return placeholder

                          return (
                            <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
                              <PreviewErrorBoundary key={JSON.stringify(comp.config)} fallback={placeholder}>
                                <div style={{
                                  pointerEvents: 'none',
                                  width: `${VIRTUAL_W}px`,
                                  height: `${virtualH}px`,
                                  transform: `scale(${scale})`,
                                  transformOrigin: 'top left',
                                  overflow: 'hidden',
                                }}>
                                  <ResolvedComp
                                    componentId={comp.id}
                                    config={comp.config}
                                    pageId={page.id}
                                    isAdmin={false}
                                  />
                                </div>
                              </PreviewErrorBoundary>
                            </div>
                          )
                        })()}
                      </div>
                    )
                  })
                })()}
              </GridLayout>
            </div>
          </CanvasDropZone>
        </div>

        {/* Right: Config Panel */}
        {configCollapsed ? (
          <PanelToggle label="설정" collapsed onClick={() => setConfigCollapsed(false)} />
        ) : (<>
          {/* Resize handle */}
          <div
            onMouseDown={startResizeConfig}
            style={{
              width: '5px', flexShrink: 0, cursor: 'col-resize',
              background: 'var(--border)', transition: 'background 0.1s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = 'var(--accent)' }}
            onMouseLeave={e => { if (!resizingPanel.current) (e.currentTarget as HTMLDivElement).style.background = 'var(--border)' }}
            title="드래그하여 패널 크기 조절"
          />
          <div style={{
            width: `${configWidth}px`, flexShrink: 0,
            background: 'var(--bg-primary)',
            display: 'flex', flexDirection: 'column',
          }}>
            <div style={{ padding: '14px 16px 10px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {selectedDef ? `${selectedDef.icon} ${selectedDef.name} 설정` : '설정 패널'}
              </div>
              <button
                onClick={() => setConfigCollapsed(true)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '14px', padding: '0 2px', lineHeight: 1 }}
                title="패널 접기"
              >▶</button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
              {selectedComponent && selectedDef ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <GridSizeControl
                    componentId={selectedComponent.id}
                    layout={layout}
                    onLayoutChange={setLayout}
                    onSave={saveLayout}
                  />
                  <hr style={{ border: 'none', borderTop: '1px solid var(--border)' }} />
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>공통 옵션</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                          type="checkbox"
                          id="common-show-border"
                          checked={(selectedComponent.config.show_border as boolean) !== false}
                          onChange={e => handleConfigChange(selectedComponent.id, { ...selectedComponent.config, show_border: e.target.checked })}
                          style={{ width: '14px', height: '14px', accentColor: 'var(--accent)' }}
                        />
                        <label htmlFor="common-show-border" style={{ fontSize: '13px', color: 'var(--text-primary)', cursor: 'pointer' }}>테두리 표시</label>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                          type="checkbox"
                          id="common-full-page"
                          checked={(selectedComponent.config.full_page as boolean) === true}
                          onChange={e => handleConfigChange(selectedComponent.id, { ...selectedComponent.config, full_page: e.target.checked })}
                          style={{ width: '14px', height: '14px', accentColor: 'var(--accent)' }}
                        />
                        <label htmlFor="common-full-page" style={{ fontSize: '13px', color: 'var(--text-primary)', cursor: 'pointer' }}>전체 페이지 단독 표시</label>
                      </div>
                      {(selectedComponent.config.full_page as boolean) === true && (
                        <p style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.6, padding: '6px 10px', background: 'var(--accent-subtle)', borderRadius: '6px', border: '1px solid var(--accent)', margin: 0 }}>
                          ✦ 이 컴포넌트가 페이지 전체를 단독으로 채웁니다.<br />헤더·그리드·여백 없이 풀스크린으로 렌더링됩니다.
                        </p>
                      )}
                    </div>
                  </div>
                  <hr style={{ border: 'none', borderTop: '1px solid var(--border)' }} />
                  <PopupConfigForm
                    config={selectedComponent.config}
                    onChange={config => handleConfigChange(selectedComponent.id, config)}
                    resolvedRegistry={resolvedRegistry}
                  />
                  <hr style={{ border: 'none', borderTop: '1px solid var(--border)' }} />
                  <selectedDef.ConfigForm
                    config={selectedComponent.config}
                    onChange={config => handleConfigChange(selectedComponent.id, config)}
                    componentId={selectedComponent.id}
                  />
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {/* 페이지 타이틀 */}
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>페이지 타이틀</div>
                    <input
                      type="text"
                      className="input"
                      value={pageTitle}
                      onChange={e => handleTitleChange(e.target.value)}
                      placeholder="페이지 제목"
                      style={{ width: '100%', fontSize: '13px' }}
                    />
                  </div>

                  <hr style={{ border: 'none', borderTop: '1px solid var(--border)' }} />

                  {/* 헤더 표시 여부 */}
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>페이지 헤더</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="checkbox"
                        id="page-show-header"
                        checked={pageShowHeader}
                        onChange={e => handleShowHeaderChange(e.target.checked)}
                        style={{ width: '14px', height: '14px', accentColor: 'var(--accent)' }}
                      />
                      <label htmlFor="page-show-header" style={{ fontSize: '13px', color: 'var(--text-primary)', cursor: 'pointer' }}>헤더 표시</label>
                    </div>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', lineHeight: 1.5 }}>
                      비활성 시 페이지 상단의 타이틀 바가 숨겨집니다
                    </p>
                  </div>

                  <hr style={{ border: 'none', borderTop: '1px solid var(--border)' }} />

                  {/* 페이지 여백 */}
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>페이지 여백 (px)</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      {(['top', 'right', 'bottom', 'left'] as const).map(side => (
                        <div key={side} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <label style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{side}</label>
                          <input
                            type="number"
                            className="input"
                            value={pagePadding[side]}
                            onChange={e => handlePaddingChange(side, Math.max(0, parseInt(e.target.value) || 0))}
                            min={0}
                            max={200}
                            style={{ width: '100%', fontSize: '13px', padding: '6px 8px' }}
                          />
                        </div>
                      ))}
                    </div>
                    <div style={{ display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap' }}>
                      {[
                        { label: '없음', values: { top: 0, right: 0, bottom: 0, left: 0 } },
                        { label: '좁게', values: { top: 10, right: 10, bottom: 10, left: 10 } },
                        { label: '기본', values: { top: 20, right: 20, bottom: 20, left: 20 } },
                        { label: '넓게', values: { top: 40, right: 40, bottom: 40, left: 40 } },
                      ].map(preset => (
                        <button
                          key={preset.label}
                          onClick={async () => {
                            setPagePadding(preset.values)
                            await supabase.from('pages').update({
                              padding_top: preset.values.top,
                              padding_right: preset.values.right,
                              padding_bottom: preset.values.bottom,
                              padding_left: preset.values.left,
                            }).eq('id', page.id)
                          }}
                          style={{
                            padding: '4px 10px', fontSize: '11px', fontWeight: 600,
                            background: 'var(--bg-secondary)', color: 'var(--text-secondary)',
                            border: '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer',
                          }}
                        >{preset.label}</button>
                      ))}
                    </div>
                  </div>

                  <hr style={{ border: 'none', borderTop: '1px solid var(--border)' }} />

                  {/* 테마 */}
                  <ThemeSelector value={pageTheme} onChange={handleThemeChange} />
                </div>
              )}
            </div>
          </div>
        </>)}

        <style>{`
          .palette-item:hover {
            border-color: var(--accent) !important;
            background: var(--accent-subtle) !important;
          }
          .palette-group-btn:hover {
            background: var(--bg-secondary) !important;
          }
          .react-grid-item.react-grid-placeholder {
            background: var(--accent) !important;
            opacity: 0.15 !important;
            border-radius: 12px !important;
          }
          .react-grid-item > .react-resizable-handle {
            opacity: 0;
            transition: opacity 0.15s;
          }
          .react-grid-item:hover > .react-resizable-handle {
            opacity: 1;
          }
          .react-resizable-handle::after {
            border-color: var(--accent) !important;
          }
        `}</style>
      </div>

      {/* DragOverlay: 드래그 중 마우스/터치 포인터를 따라다니는 ghost */}
      <DragOverlay dropAnimation={null}>
        {activePaletteType ? <PaletteDragGhost componentType={activePaletteType} resolvedRegistry={resolvedRegistry} /> : null}
      </DragOverlay>
    </DndContext>
  )
}

function GridSizeControl({
  componentId,
  layout,
  onLayoutChange,
  onSave,
}: {
  componentId: string
  layout: LayoutItem[]
  onLayoutChange: (l: LayoutItem[]) => void
  onSave: (l: readonly LayoutItem[]) => Promise<void>
}) {
  const item = layout.find(l => l.i === componentId)
  if (!item) return null

  const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val))

  const update = async (field: 'w' | 'h', val: number) => {
    const newLayout = layout.map(l =>
      l.i === componentId
        ? { ...l, [field]: field === 'w' ? clamp(val, 1, COLS) : clamp(val, 1, MAX_ROWS) }
        : { ...l }
    )
    onLayoutChange(newLayout)
    await onSave(newLayout)
  }

  return (
    <div>
      <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>그리드 크기</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        <div>
          <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>너비 (1–{COLS})</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <button onClick={() => update('w', item.w - 1)} className="btn-ghost" style={{ padding: '2px 7px', fontSize: '15px', lineHeight: 1 }}>−</button>
            <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--accent)', minWidth: '24px', textAlign: 'center' }}>{item.w}</span>
            <button onClick={() => update('w', item.w + 1)} className="btn-ghost" style={{ padding: '2px 7px', fontSize: '15px', lineHeight: 1 }}>+</button>
          </div>
        </div>
        <div>
          <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>높이 (1–{MAX_ROWS})</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <button onClick={() => update('h', item.h - 1)} className="btn-ghost" style={{ padding: '2px 7px', fontSize: '15px', lineHeight: 1 }}>−</button>
            <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--accent)', minWidth: '24px', textAlign: 'center' }}>{item.h}</span>
            <button onClick={() => update('h', item.h + 1)} className="btn-ghost" style={{ padding: '2px 7px', fontSize: '15px', lineHeight: 1 }}>+</button>
          </div>
        </div>
      </div>
    </div>
  )
}
