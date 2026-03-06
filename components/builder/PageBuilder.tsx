'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { componentRegistry } from '@/components/registry'
import type { PageData, PageComponentData } from '@/components/registry/types'
import { GridLayout } from 'react-grid-layout'
import type { Layout, LayoutItem } from 'react-grid-layout'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'

const COLS = 10
const ROW_HEIGHT = 60
const MAX_ROWS = 20

const GRID_SIZES: Record<string, { w: number; h: number; minW: number; minH: number }> = {
  board: { w: 10, h: 6, minW: 4, minH: 3 },
  calendar: { w: 10, h: 8, minW: 6, minH: 6 },
  survey: { w: 6, h: 7, minW: 4, minH: 4 },
  'image-gallery': { w: 5, h: 5, minW: 3, minH: 3 },
}

interface Props {
  page: PageData
  initialComponents: PageComponentData[]
}

export function PageBuilder({ page, initialComponents }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const containerRef = useRef<HTMLDivElement>(null)

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
  const [draggingType, setDraggingType] = useState<string | null>(null)
  const draggingTypeRef = useRef<string | null>(null)
  const [containerWidth, setContainerWidth] = useState(800)
  const [dropError, setDropError] = useState<string | null>(null)

  const selectedComponent = components.find(c => c.id === selectedId) ?? null
  const selectedDef = selectedComponent ? componentRegistry.get(selectedComponent.component_type) : null

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

  // Optimistic update: add to state immediately, sync to DB in background
  const addComponentToCanvas = useCallback((type: string, gridX: number, gridY: number) => {
    const def = componentRegistry.get(type)
    if (!def) return

    const sizes = GRID_SIZES[type] ?? { w: 5, h: 4, minW: 3, minH: 3 }
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
      grid_w: sizes.w,
      grid_h: sizes.h,
    }

    // 1. 즉시 UI에 반영 (낙관적 업데이트)
    setComponents(prev => [...prev, newComp])
    setLayout(prev => [...prev, { i: newId, x: gridX, y: gridY, w: sizes.w, h: sizes.h }])
    setSelectedId(newId)
    setDropError(null)

    // 2. 백그라운드에서 DB 저장
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
        grid_w: sizes.w,
        grid_h: sizes.h,
      })
      .then(({ error }) => {
        if (error) {
          // 실패 시 롤백
          console.error('[PageBuilder] 컴포넌트 추가 실패:', error.message)
          setDropError(`추가 실패: ${error.message}`)
          setComponents(prev => prev.filter(c => c.id !== newId))
          setLayout(prev => prev.filter(l => l.i !== newId))
          setSelectedId(null)
        }
      })
  }, [supabase, page.id, components.length])

  // react-grid-layout onDrop 콜백 (그리드 위에 드롭 시)
  const handleDrop = (_newLayout: Layout, droppedItem: LayoutItem | undefined, e: Event) => {
    const type = (e as DragEvent).dataTransfer?.getData('text/plain') || draggingTypeRef.current
    setDraggingType(null)
    draggingTypeRef.current = null
    if (!type || !droppedItem) return
    addComponentToCanvas(type, droppedItem.x, droppedItem.y)
  }

  // 컨테이너 패딩 영역에 드롭된 경우 폴백 처리
  const handleContainerDrop = (e: React.DragEvent<HTMLDivElement>) => {
    const type = e.dataTransfer.getData('text/plain') || draggingTypeRef.current
    setDraggingType(null)
    draggingTypeRef.current = null
    if (!type) return
    e.preventDefault()
    e.stopPropagation()
    // 좌상단에 추가 (사용자가 이후 드래그로 위치 조정 가능)
    const sizes = GRID_SIZES[type] ?? { w: 5, h: 4 }
    const gridY = components.length > 0
      ? Math.max(...layout.map(l => l.y + l.h))
      : 0
    addComponentToCanvas(type, 0, gridY)
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

  return (
    <div style={{ display: 'flex', gap: '0', height: 'calc(100vh - 120px)', minHeight: '600px', background: 'var(--bg-secondary)', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--border)' }}>

      {/* Left: Component Palette */}
      <div style={{
        width: '180px', flexShrink: 0,
        background: 'var(--bg-primary)', borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column',
      }}>
        <div style={{ padding: '14px 14px 10px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>컴포넌트</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>드래그해서 추가</div>
        </div>
        <div style={{ padding: '8px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {Array.from(componentRegistry.values()).map(def => {
            const size = GRID_SIZES[def.id]
            return (
              <div
                key={def.id}
                draggable
                onDragStart={e => {
                  draggingTypeRef.current = def.id
                  setDraggingType(def.id)
                  e.dataTransfer.setData('text/plain', def.id)
                  e.dataTransfer.effectAllowed = 'copy'
                }}
                onDragEnd={() => {
                  draggingTypeRef.current = null
                  setDraggingType(null)
                }}
                style={{
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border: '1.5px dashed var(--border)',
                  background: 'transparent',
                  cursor: 'grab',
                  userSelect: 'none',
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
          })}
        </div>
      </div>

      {/* Center: Grid Canvas */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Header */}
        <div style={{
          padding: '12px 16px', borderBottom: '1px solid var(--border)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: 'var(--bg-primary)', flexWrap: 'wrap', gap: '8px',
        }}>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>{page.title}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>/{page.slug} · {COLS}열 × {MAX_ROWS}행</div>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
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

        {/* Grid area */}
        <div
          ref={containerRef}
          style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '16px', background: 'var(--bg-secondary)', position: 'relative' }}
          onDragOver={e => { if (draggingTypeRef.current) e.preventDefault() }}
          onDrop={handleContainerDrop}
        >
          {dropError && (
            <div style={{ position: 'absolute', top: '8px', left: '50%', transform: 'translateX(-50%)', zIndex: 10, background: 'var(--danger)', color: 'white', padding: '6px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, whiteSpace: 'nowrap' }}>
              {dropError}
              <button onClick={() => setDropError(null)} style={{ marginLeft: '8px', background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '14px', lineHeight: 1 }}>×</button>
            </div>
          )}
          {components.length === 0 && !draggingType && (
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
              defaultItem: draggingType
                ? { w: GRID_SIZES[draggingType]?.w ?? 5, h: GRID_SIZES[draggingType]?.h ?? 4 }
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
              setLayout(prev => {
                // 라이브러리가 아직 모르는 optimistic 아이템(방금 추가된)을 보존
                const newIds = new Set(newLayout.map(l => l.i))
                const preserved = prev.filter(l => !newIds.has(l.i))
                return [...newLayout, ...preserved]
              })
            }}
            style={{ minHeight: `${MAX_ROWS * ROW_HEIGHT}px` }}
          >
            {components.map(comp => {
              const def = componentRegistry.get(comp.component_type)
              const isSelected = selectedId === comp.id
              const layoutItem = layout.find(l => l.i === comp.id)
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
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ fontSize: '10px', color: isSelected ? 'rgba(255,255,255,0.7)' : 'var(--text-muted)', fontFamily: 'monospace' }}>
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
                  <div style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--text-muted)', fontSize: '12px', gap: '8px', padding: '8px',
                  }}>
                    <span style={{ fontSize: '20px', opacity: 0.35 }}>{def?.icon}</span>
                    <span style={{ opacity: 0.5 }}>{def?.name}</span>
                  </div>
                </div>
              )
            })}
          </GridLayout>
        </div>
      </div>

      {/* Right: Config Panel */}
      <div style={{
        width: '260px', flexShrink: 0,
        background: 'var(--bg-primary)', borderLeft: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column',
      }}>
        <div style={{ padding: '14px 16px 10px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            {selectedDef ? `${selectedDef.icon} ${selectedDef.name} 설정` : '설정 패널'}
          </div>
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
              <selectedDef.ConfigForm
                config={selectedComponent.config}
                onChange={config => handleConfigChange(selectedComponent.id, config)}
                componentId={selectedComponent.id}
              />
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', paddingTop: '48px' }}>
              <div style={{ fontSize: '32px', marginBottom: '12px', opacity: 0.35 }}>⚙️</div>
              <p style={{ fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>컴포넌트를 선택하면</p>
              <p style={{ fontSize: '12px', lineHeight: 1.6 }}>크기와 설정을 변경할 수 있습니다</p>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .palette-item:hover {
          border-color: var(--accent) !important;
          background: var(--accent-subtle) !important;
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
