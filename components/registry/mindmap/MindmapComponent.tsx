'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { motion, type PanInfo } from 'framer-motion'
import { flushSync } from 'react-dom'
import type { ComponentProps, ConfigFormProps } from '../types'

// ── Types ──────────────────────────────────────────────────────────────────

interface MindmapNode {
  id: string
  label: string
  color: string
  link?: string       // 클릭 시 이동할 URL
  x: number
  y: number
  parentId: string | null
}

interface MindmapConfig {
  title: string
  nodes: MindmapNode[]
  canvasHeight: number
}

// ── Constants ──────────────────────────────────────────────────────────────

const NODE_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  blue:   { bg: '#dbeafe', border: '#3b82f6', text: '#1e40af' },
  green:  { bg: '#dcfce7', border: '#22c55e', text: '#166534' },
  purple: { bg: '#f3e8ff', border: '#a855f7', text: '#6b21a8' },
  orange: { bg: '#ffedd5', border: '#f97316', text: '#9a3412' },
  red:    { bg: '#fee2e2', border: '#ef4444', text: '#991b1b' },
  teal:   { bg: '#ccfbf1', border: '#14b8a6', text: '#115e59' },
  amber:  { bg: '#fef3c7', border: '#f59e0b', text: '#92400e' },
  pink:   { bg: '#fce7f3', border: '#ec4899', text: '#9d174d' },
}

const COLOR_LABELS: Record<string, string> = {
  blue: '파랑', green: '초록', purple: '보라', orange: '주황',
  red: '빨강', teal: '청록', amber: '노랑', pink: '핑크',
}

const ROOT_STYLE = { bg: '#1e293b', border: '#334155', text: '#f1f5f9' }

let _idCounter = 0
function uid() { return `mn-${Date.now()}-${++_idCounter}` }

// ── Connection Line ────────────────────────────────────────────────────────

function ConnectionLine({ parent, child }: { parent: MindmapNode; child: MindmapNode }) {
  const px = parent.x + 75, py = parent.y + 20
  const cx = child.x + 75, cy = child.y + 20
  const midX = (px + cx) / 2
  const d = `M${px},${py} C${midX},${py} ${midX},${cy} ${cx},${cy}`
  const colors = NODE_COLORS[child.color] ?? NODE_COLORS.blue
  return (
    <path d={d} fill="none" stroke={colors.border} strokeWidth={2} opacity={0.45} strokeLinecap="round" />
  )
}

// ── Draggable Node ─────────────────────────────────────────────────────────

function DraggableNode({
  node,
  isRoot,
  isAdmin,
  selected,
  onSelect,
  onDragStart,
  onDrag,
  onDragEnd,
}: {
  node: MindmapNode
  isRoot: boolean
  isAdmin: boolean
  selected: boolean
  onSelect: () => void
  onDragStart: () => void
  onDrag: (info: PanInfo) => void
  onDragEnd: () => void
}) {
  const colors = isRoot ? ROOT_STYLE : (NODE_COLORS[node.color] ?? NODE_COLORS.blue)
  const hasLink = !!node.link

  const content = (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '6px',
      padding: isRoot ? '10px 20px' : '8px 14px',
      fontSize: isRoot ? '14px' : '12px',
      fontWeight: isRoot ? 700 : 600,
      color: colors.text,
      whiteSpace: 'nowrap',
      userSelect: 'none',
    }}>
      {hasLink && (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={colors.text} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, opacity: 0.6 }}>
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </svg>
      )}
      <span>{node.label}</span>
    </div>
  )

  return (
    <motion.div
      drag={isAdmin}
      dragMomentum={false}
      dragConstraints={{ left: 0, top: 0, right: 100000, bottom: 100000 }}
      onDragStart={onDragStart}
      onDrag={(_, info) => onDrag(info)}
      onDragEnd={onDragEnd}
      style={{
        x: node.x,
        y: node.y,
        position: 'absolute',
        transformOrigin: '0 0',
        cursor: isAdmin ? 'grab' : (hasLink ? 'pointer' : 'default'),
        zIndex: selected ? 10 : 1,
      }}
      whileHover={{ scale: 1.05 }}
      whileDrag={{ scale: 1.08, cursor: 'grabbing' }}
      onClick={(e) => {
        e.stopPropagation()
        if (!isAdmin && hasLink) {
          window.open(node.link, '_blank', 'noopener')
        } else {
          onSelect()
        }
      }}
    >
      <div style={{
        background: colors.bg,
        border: `2px solid ${selected ? '#6366f1' : colors.border}`,
        borderRadius: isRoot ? '14px' : '10px',
        boxShadow: selected
          ? '0 0 0 3px rgba(99,102,241,0.3), 0 4px 12px rgba(0,0,0,0.1)'
          : '0 2px 8px rgba(0,0,0,0.06)',
        transition: 'border-color 0.15s, box-shadow 0.15s',
      }}>
        {content}
      </div>
    </motion.div>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────

export function MindmapComponent({ config, isAdmin }: ComponentProps) {
  const cfg = config as unknown as MindmapConfig
  const title = cfg.title || ''
  const initialNodes = cfg.nodes || []
  const canvasHeight = cfg.canvasHeight || 500

  const [nodes, setNodes] = useState<MindmapNode[]>(initialNodes)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const dragStart = useRef<{ x: number; y: number } | null>(null)
  const canvasRef = useRef<HTMLDivElement>(null)

  // Sync from config when it changes externally
  useEffect(() => {
    setNodes(cfg.nodes || [])
  }, [JSON.stringify(cfg.nodes)])

  const handleDragStart = useCallback((nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId)
    if (node) dragStart.current = { x: node.x, y: node.y }
  }, [nodes])

  const handleDrag = useCallback((nodeId: string, info: PanInfo) => {
    if (!dragStart.current) return
    const newX = Math.max(0, dragStart.current.x + info.offset.x)
    const newY = Math.max(0, dragStart.current.y + info.offset.y)
    flushSync(() => {
      setNodes(prev => prev.map(n => n.id === nodeId ? { ...n, x: newX, y: newY } : n))
    })
  }, [])

  const handleDragEnd = useCallback(() => {
    dragStart.current = null
  }, [])

  const root = nodes.find(n => n.parentId === null)
  const svgW = Math.max(600, ...nodes.map(n => n.x + 200))
  const svgH = Math.max(canvasHeight, ...nodes.map(n => n.y + 80))

  return (
    <div style={{ padding: '16px' }}>
      {title && (
        <h3 style={{
          fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)',
          marginBottom: '12px', letterSpacing: '-0.01em',
        }}>{title}</h3>
      )}
      <div
        ref={canvasRef}
        onClick={() => setSelectedId(null)}
        style={{
          position: 'relative',
          width: '100%',
          height: `${canvasHeight}px`,
          overflow: 'auto',
          borderRadius: '12px',
          border: '1px solid var(--border)',
          background: 'var(--bg-secondary)',
        }}
      >
        <div style={{ position: 'relative', minWidth: svgW, minHeight: svgH }}>
          {/* SVG connections */}
          <svg
            width={svgW}
            height={svgH}
            style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none', overflow: 'visible' }}
          >
            {nodes.filter(n => n.parentId).map(child => {
              const parent = nodes.find(p => p.id === child.parentId)
              if (!parent) return null
              return <ConnectionLine key={child.id} parent={parent} child={child} />
            })}
          </svg>

          {/* Nodes */}
          {nodes.map(node => (
            <DraggableNode
              key={node.id}
              node={node}
              isRoot={node.parentId === null}
              isAdmin={!!isAdmin}
              selected={selectedId === node.id}
              onSelect={() => setSelectedId(node.id)}
              onDragStart={() => handleDragStart(node.id)}
              onDrag={(info) => handleDrag(node.id, info)}
              onDragEnd={handleDragEnd}
            />
          ))}

          {/* Empty state */}
          {nodes.length === 0 && (
            <div style={{
              position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
              textAlign: 'center', color: 'var(--text-muted)',
            }}>
              <div style={{ fontSize: '36px', marginBottom: '8px', opacity: 0.3 }}>🧠</div>
              <p style={{ fontSize: '13px' }}>마인드맵 노드를 추가하세요</p>
            </div>
          )}
        </div>
      </div>
      {/* Legend */}
      {nodes.some(n => n.link) && (
        <div style={{
          marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px',
          fontSize: '10px', color: 'var(--text-muted)',
        }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
          </svg>
          <span>링크 아이콘이 있는 노드를 클릭하면 해당 페이지로 이동합니다</span>
        </div>
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
  padding: '6px 12px', fontSize: '12px', fontWeight: 600,
  border: '1px solid var(--border)', borderRadius: '8px',
  background: 'var(--bg-secondary)', color: 'var(--text-primary)',
  cursor: 'pointer',
}

export function MindmapConfigForm({ config, onChange }: ConfigFormProps) {
  const cfg = config as unknown as MindmapConfig
  const nodes: MindmapNode[] = cfg.nodes || []
  const [editingId, setEditingId] = useState<string | null>(null)

  const update = (patch: Partial<MindmapConfig>) => {
    onChange({ ...config, ...patch })
  }

  const addNode = (parentId: string | null) => {
    const parent = parentId ? nodes.find(n => n.id === parentId) : null
    const siblings = nodes.filter(n => n.parentId === parentId)
    const colorKeys = Object.keys(NODE_COLORS)

    const newNode: MindmapNode = {
      id: uid(),
      label: '새 노드',
      color: colorKeys[(nodes.length) % colorKeys.length],
      link: '',
      x: parent ? parent.x + 200 : 300,
      y: parent ? parent.y + (siblings.length * 70) : 200,
      parentId,
    }
    update({ nodes: [...nodes, newNode] })
    setEditingId(newNode.id)
  }

  const updateNode = (id: string, patch: Partial<MindmapNode>) => {
    update({ nodes: nodes.map(n => n.id === id ? { ...n, ...patch } : n) })
  }

  const removeNode = (id: string) => {
    // Remove node and all descendants
    const toRemove = new Set<string>()
    const collect = (nodeId: string) => {
      toRemove.add(nodeId)
      nodes.filter(n => n.parentId === nodeId).forEach(n => collect(n.id))
    }
    collect(id)
    update({ nodes: nodes.filter(n => !toRemove.has(n.id)) })
    if (editingId && toRemove.has(editingId)) setEditingId(null)
  }

  const autoLayout = () => {
    const root = nodes.find(n => n.parentId === null)
    if (!root) return

    const laid: MindmapNode[] = [...nodes]
    const nodeMap = new Map(laid.map(n => [n.id, n]))

    // BFS layout
    const getChildren = (pid: string) => laid.filter(n => n.parentId === pid)
    const layoutNode = (id: string, depth: number, yOffset: number): number => {
      const children = getChildren(id)
      if (children.length === 0) {
        const node = nodeMap.get(id)!
        node.x = depth * 220 + 30
        node.y = yOffset
        return yOffset + 60
      }
      let currentY = yOffset
      for (const child of children) {
        currentY = layoutNode(child.id, depth + 1, currentY)
      }
      const node = nodeMap.get(id)!
      node.x = depth * 220 + 30
      const firstChild = nodeMap.get(children[0].id)!
      const lastChild = nodeMap.get(children[children.length - 1].id)!
      node.y = (firstChild.y + lastChild.y) / 2
      return currentY
    }

    layoutNode(root.id, 0, 30)
    update({ nodes: laid })
  }

  const root = nodes.find(n => n.parentId === null)
  const editing = editingId ? nodes.find(n => n.id === editingId) : null

  // Build tree for display
  const renderTree = (parentId: string | null, depth: number): React.ReactNode => {
    const children = nodes.filter(n => n.parentId === parentId)
    return children.map(node => {
      const colors = NODE_COLORS[node.color] ?? NODE_COLORS.blue
      const isEditing = editingId === node.id
      return (
        <div key={node.id} style={{ marginLeft: depth * 16 }}>
          <div
            onClick={() => setEditingId(node.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '5px 8px', borderRadius: '6px', cursor: 'pointer',
              background: isEditing ? 'var(--accent-subtle)' : 'transparent',
              border: isEditing ? '1px solid var(--accent)' : '1px solid transparent',
              marginBottom: '2px', fontSize: '12px',
            }}
          >
            <span style={{
              width: '8px', height: '8px', borderRadius: '50%',
              background: colors.border, flexShrink: 0,
            }} />
            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-primary)' }}>
              {node.label}
            </span>
            {node.link && (
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
            )}
          </div>
          {renderTree(node.id, depth + 1)}
        </div>
      )
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Title */}
      <div>
        <label style={labelStyle}>제목</label>
        <input
          style={inputStyle}
          value={cfg.title || ''}
          onChange={e => update({ title: e.target.value })}
          placeholder="마인드맵 제목"
        />
      </div>

      {/* Canvas Height */}
      <div>
        <label style={labelStyle}>캔버스 높이 (px)</label>
        <input
          type="number"
          style={{ ...inputStyle, width: '100px' }}
          value={cfg.canvasHeight || 500}
          onChange={e => update({ canvasHeight: Math.max(200, parseInt(e.target.value) || 500) })}
          min={200}
          max={2000}
          step={50}
        />
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        {!root && (
          <button style={{ ...btnStyle, background: 'var(--accent)', color: 'white', border: 'none' }} onClick={() => {
            const newRoot: MindmapNode = { id: uid(), label: '중심 주제', color: 'blue', x: 250, y: 200, parentId: null }
            update({ nodes: [...nodes, newRoot] })
            setEditingId(newRoot.id)
          }}>
            + 루트 노드
          </button>
        )}
        {root && (
          <>
            <button style={btnStyle} onClick={() => addNode(editingId || root.id)}>
              + 하위 노드
            </button>
            <button style={btnStyle} onClick={autoLayout}>
              자동 정렬
            </button>
          </>
        )}
      </div>

      {/* Node Tree */}
      {root && (
        <div>
          <label style={labelStyle}>노드 목록</label>
          <div style={{
            border: '1px solid var(--border)', borderRadius: '8px',
            padding: '8px', maxHeight: '200px', overflowY: 'auto',
            background: 'var(--bg-primary)',
          }}>
            <div
              onClick={() => setEditingId(root.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '5px 8px', borderRadius: '6px', cursor: 'pointer',
                background: editingId === root.id ? 'var(--accent-subtle)' : 'transparent',
                border: editingId === root.id ? '1px solid var(--accent)' : '1px solid transparent',
                marginBottom: '2px', fontSize: '12px', fontWeight: 700,
              }}
            >
              <span style={{
                width: '8px', height: '8px', borderRadius: '50%',
                background: '#334155', flexShrink: 0,
              }} />
              <span style={{ color: 'var(--text-primary)' }}>{root.label}</span>
            </div>
            {renderTree(root.id, 1)}
          </div>
        </div>
      )}

      {/* Edit selected node */}
      {editing && (
        <div style={{
          border: '1px solid var(--border)', borderRadius: '10px',
          padding: '12px', background: 'var(--bg-primary)',
          display: 'flex', flexDirection: 'column', gap: '10px',
        }}>
          <label style={{ ...labelStyle, marginBottom: 0 }}>노드 편집: {editing.label}</label>

          <div>
            <label style={{ ...labelStyle, fontSize: '10px' }}>이름</label>
            <input
              style={inputStyle}
              value={editing.label}
              onChange={e => updateNode(editing.id, { label: e.target.value })}
            />
          </div>

          <div>
            <label style={{ ...labelStyle, fontSize: '10px' }}>링크 (URL)</label>
            <input
              style={inputStyle}
              value={editing.link || ''}
              onChange={e => updateNode(editing.id, { link: e.target.value })}
              placeholder="https://example.com"
            />
          </div>

          {editing.parentId !== null && (
            <div>
              <label style={{ ...labelStyle, fontSize: '10px' }}>색상</label>
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                {Object.entries(NODE_COLORS).map(([key, val]) => (
                  <button
                    key={key}
                    onClick={() => updateNode(editing.id, { color: key })}
                    title={COLOR_LABELS[key]}
                    style={{
                      width: '24px', height: '24px', borderRadius: '6px',
                      background: val.bg, border: `2px solid ${editing.color === key ? val.border : 'transparent'}`,
                      cursor: 'pointer',
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          <div>
            <label style={{ ...labelStyle, fontSize: '10px' }}>부모 노드</label>
            <select
              style={{ ...inputStyle, cursor: 'pointer' }}
              value={editing.parentId || ''}
              onChange={e => {
                const newParentId = e.target.value || null
                // Prevent circular reference
                if (newParentId === editing.id) return
                updateNode(editing.id, { parentId: newParentId })
              }}
            >
              <option value="">없음 (루트)</option>
              {nodes.filter(n => n.id !== editing.id).map(n => (
                <option key={n.id} value={n.id}>{n.label}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', gap: '6px' }}>
            <button style={btnStyle} onClick={() => addNode(editing.id)}>
              + 하위 추가
            </button>
            {editing.parentId !== null && (
              <button
                style={{ ...btnStyle, color: '#ef4444', borderColor: '#fca5a5' }}
                onClick={() => removeNode(editing.id)}
              >
                삭제
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
