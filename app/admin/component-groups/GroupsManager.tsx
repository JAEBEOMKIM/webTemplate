'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { ComponentGroupRow, ComponentDefinitionRow } from '@/components/registry/types'

interface Props {
  groups: ComponentGroupRow[]
  definitions: ComponentDefinitionRow[]
}

function getDescendantIds(groupId: string, groups: ComponentGroupRow[]): string[] {
  const directChildren = groups.filter(g => g.parent_id === groupId)
  const ids: string[] = []
  for (const child of directChildren) {
    ids.push(child.id)
    ids.push(...getDescendantIds(child.id, groups))
  }
  return ids
}

function buildTree(groups: ComponentGroupRow[], parentId: string | null): ComponentGroupRow[] {
  return groups
    .filter(g => g.parent_id === parentId)
    .sort((a, b) => a.display_order - b.display_order)
}

export function GroupsManager({ groups, definitions }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set(groups.map(g => g.id)))
  const [editName, setEditName] = useState('')
  const [editIcon, setEditIcon] = useState('')
  const [editParentId, setEditParentId] = useState<string | null>(null)
  const [editOrder, setEditOrder] = useState(0)
  const [saving, setSaving] = useState(false)

  const selectedGroup = groups.find(g => g.id === selectedId) ?? null

  function selectGroup(group: ComponentGroupRow) {
    setSelectedId(group.id)
    setEditName(group.name)
    setEditIcon(group.icon)
    setEditParentId(group.parent_id)
    setEditOrder(group.display_order)
  }

  function toggleExpand(id: string) {
    setExpandedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function getComponentCount(groupId: string): number {
    return definitions.filter(d => d.group_id === groupId).length
  }

  function getChildGroups(parentId: string | null): ComponentGroupRow[] {
    return buildTree(groups, parentId)
  }

  // ── CRUD ──

  async function createGroup(parentId: string | null) {
    const maxOrder = Math.max(0, ...groups.map(g => g.display_order))
    const { data } = await supabase
      .from('component_groups')
      .insert({ name: '새 그룹', icon: '📁', display_order: maxOrder + 1, parent_id: parentId })
      .select()
      .single()
    if (data) {
      router.refresh()
      // Auto-select after refresh will lose state, so we just refresh
    }
    router.refresh()
  }

  async function saveGroup() {
    if (!selectedId) return
    setSaving(true)
    await supabase
      .from('component_groups')
      .update({
        name: editName,
        icon: editIcon,
        parent_id: editParentId,
        display_order: editOrder,
      })
      .eq('id', selectedId)
    setSaving(false)
    router.refresh()
  }

  async function deleteGroup(id: string) {
    if (!confirm('이 그룹을 삭제하시겠습니까?')) return
    // Move children to root
    await supabase
      .from('component_groups')
      .update({ parent_id: null })
      .eq('parent_id', id)
    // Unassign components
    await supabase
      .from('component_definitions')
      .update({ group_id: null })
      .eq('group_id', id)
    // Delete
    await supabase.from('component_groups').delete().eq('id', id)
    if (selectedId === id) setSelectedId(null)
    router.refresh()
  }

  async function assignComponent(defId: string) {
    if (!selectedId) return
    await supabase
      .from('component_definitions')
      .update({ group_id: selectedId })
      .eq('id', defId)
    router.refresh()
  }

  async function removeComponent(defId: string) {
    await supabase
      .from('component_definitions')
      .update({ group_id: null })
      .eq('id', defId)
    router.refresh()
  }

  // ── Tree rendering ──

  function renderGroupNode(group: ComponentGroupRow, depth: number) {
    const children = getChildGroups(group.id)
    const hasChildren = children.length > 0
    const isExpanded = expandedIds.has(group.id)
    const isSelected = selectedId === group.id
    const count = getComponentCount(group.id)

    return (
      <div key={group.id}>
        <div
          onClick={() => selectGroup(group)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 10px',
            marginLeft: depth * 20,
            borderRadius: '8px',
            cursor: 'pointer',
            border: isSelected ? '1.5px solid var(--accent)' : '1.5px solid transparent',
            background: isSelected ? 'var(--accent-subtle)' : 'transparent',
            transition: 'all 0.15s',
            position: 'relative',
          }}
          onMouseEnter={e => {
            const del = e.currentTarget.querySelector('[data-delete]') as HTMLElement
            if (del) del.style.opacity = '1'
          }}
          onMouseLeave={e => {
            const del = e.currentTarget.querySelector('[data-delete]') as HTMLElement
            if (del) del.style.opacity = '0'
          }}
        >
          {/* Expand/collapse */}
          {hasChildren ? (
            <span
              onClick={e => { e.stopPropagation(); toggleExpand(group.id) }}
              style={{
                width: '18px',
                height: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '10px',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                borderRadius: '4px',
                flexShrink: 0,
              }}
            >
              {isExpanded ? '▼' : '▶'}
            </span>
          ) : (
            <span style={{ width: '18px', flexShrink: 0 }} />
          )}

          {/* Icon */}
          <span style={{ fontSize: '16px', flexShrink: 0 }}>{group.icon}</span>

          {/* Name */}
          <span style={{
            fontSize: '13px',
            fontWeight: 600,
            color: 'var(--text-primary)',
            flex: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {group.name}
          </span>

          {/* Count badge */}
          {count > 0 && (
            <span style={{
              fontSize: '11px',
              fontWeight: 600,
              color: 'var(--text-muted)',
              background: 'var(--bg-secondary)',
              padding: '1px 7px',
              borderRadius: '10px',
              flexShrink: 0,
            }}>
              {count}
            </span>
          )}

          {/* Delete button */}
          <span
            data-delete=""
            onClick={e => { e.stopPropagation(); deleteGroup(group.id) }}
            style={{
              opacity: 0,
              fontSize: '12px',
              color: 'var(--danger)',
              cursor: 'pointer',
              padding: '2px 4px',
              borderRadius: '4px',
              transition: 'opacity 0.15s',
              flexShrink: 0,
            }}
          >
            ✕
          </span>
        </div>

        {/* Children */}
        {hasChildren && isExpanded && children.map(child => renderGroupNode(child, depth + 1))}
      </div>
    )
  }

  // ── Parent dropdown options (exclude self and descendants) ──

  function getParentOptions(): { id: string | null; label: string }[] {
    const excluded = selectedId ? new Set([selectedId, ...getDescendantIds(selectedId, groups)]) : new Set<string>()
    const options: { id: string | null; label: string }[] = [{ id: null, label: '없음 (최상위)' }]

    function addGroup(group: ComponentGroupRow, prefix: string) {
      if (!excluded.has(group.id)) {
        options.push({ id: group.id, label: `${prefix}${group.icon} ${group.name}` })
      }
      const children = getChildGroups(group.id)
      for (const child of children) {
        if (!excluded.has(child.id)) {
          addGroup(child, prefix + '  ')
        }
      }
    }

    for (const root of getChildGroups(null)) {
      addGroup(root, '')
    }
    return options
  }

  // ── Assigned / unassigned components ──

  const assignedDefs = selectedId ? definitions.filter(d => d.group_id === selectedId) : []
  const unassignedDefs = selectedId
    ? definitions.filter(d => d.group_id !== selectedId)
    : []

  // ── Render ──

  const rootGroups = getChildGroups(null)

  return (
    <div style={{ display: 'flex', gap: '20px', minHeight: '500px' }}>
      {/* Left Panel - Tree */}
      <div style={{
        flex: 3,
        background: 'var(--bg-primary)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        padding: '16px',
        overflowY: 'auto',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)' }}>그룹 목록</span>
          <button
            onClick={() => createGroup(null)}
            style={{
              fontSize: '12px',
              fontWeight: 600,
              color: 'var(--accent)',
              background: 'var(--accent-subtle)',
              border: 'none',
              borderRadius: '6px',
              padding: '5px 12px',
              cursor: 'pointer',
            }}
          >
            + 그룹 추가
          </button>
        </div>

        {rootGroups.length === 0 && (
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', padding: '40px 0' }}>
            그룹이 없습니다. 그룹을 추가해주세요.
          </p>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {rootGroups.map(g => renderGroupNode(g, 0))}
        </div>
      </div>

      {/* Right Panel - Detail */}
      <div style={{
        flex: 2,
        background: 'var(--bg-primary)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        padding: '20px',
        overflowY: 'auto',
      }}>
        {!selectedGroup ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: 'var(--text-muted)',
            fontSize: '13px',
          }}>
            좌측에서 그룹을 선택하세요
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Name */}
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                그룹 이름
              </label>
              <input
                value={editName}
                onChange={e => setEditName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  fontSize: '13px',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Icon */}
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                아이콘 (이모지)
              </label>
              <input
                value={editIcon}
                onChange={e => setEditIcon(e.target.value)}
                style={{
                  width: '80px',
                  padding: '8px 12px',
                  fontSize: '16px',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  outline: 'none',
                  textAlign: 'center',
                }}
              />
            </div>

            {/* Parent dropdown */}
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                상위 그룹
              </label>
              <select
                value={editParentId ?? ''}
                onChange={e => setEditParentId(e.target.value || null)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  fontSize: '13px',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              >
                {getParentOptions().map(opt => (
                  <option key={opt.id ?? '__null'} value={opt.id ?? ''}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Display order */}
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                표시 순서
              </label>
              <input
                type="number"
                value={editOrder}
                onChange={e => setEditOrder(Number(e.target.value))}
                style={{
                  width: '100px',
                  padding: '8px 12px',
                  fontSize: '13px',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  outline: 'none',
                }}
              />
            </div>

            {/* Save button */}
            <button
              onClick={saveGroup}
              disabled={saving}
              style={{
                padding: '8px 20px',
                fontSize: '13px',
                fontWeight: 600,
                color: '#fff',
                background: saving ? 'var(--text-muted)' : 'var(--accent)',
                border: 'none',
                borderRadius: '8px',
                cursor: saving ? 'default' : 'pointer',
                alignSelf: 'flex-start',
                transition: 'background 0.15s',
              }}
            >
              {saving ? '저장 중...' : '저장'}
            </button>

            {/* Divider */}
            <div style={{ height: '1px', background: 'var(--border)', margin: '4px 0' }} />

            {/* Assigned components */}
            <div>
              <label style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '10px' }}>
                소속 컴포넌트
              </label>

              {assignedDefs.length === 0 ? (
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px' }}>
                  이 그룹에 배정된 컴포넌트가 없습니다.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '10px' }}>
                  {assignedDefs.map(def => (
                    <div
                      key={def.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '7px 10px',
                        background: 'var(--bg-secondary)',
                        borderRadius: '8px',
                        border: '1px solid var(--border)',
                      }}
                    >
                      <span style={{ fontSize: '14px', flexShrink: 0 }}>{def.icon || '🧩'}</span>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', flex: 1 }}>
                        {def.name}
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                        {def.id}
                      </span>
                      <button
                        onClick={() => removeComponent(def.id)}
                        style={{
                          fontSize: '11px',
                          fontWeight: 600,
                          color: 'var(--danger)',
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          flexShrink: 0,
                        }}
                      >
                        제거
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add component dropdown */}
              {unassignedDefs.length > 0 && (
                <select
                  value=""
                  onChange={e => { if (e.target.value) assignComponent(e.target.value) }}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    fontSize: '13px',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                >
                  <option value="">컴포넌트 추가...</option>
                  {unassignedDefs.map(def => (
                    <option key={def.id} value={def.id}>
                      {def.icon || '🧩'} {def.name} ({def.id})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Divider */}
            <div style={{ height: '1px', background: 'var(--border)', margin: '4px 0' }} />

            {/* Add child group button */}
            <button
              onClick={() => createGroup(selectedId)}
              style={{
                padding: '8px 16px',
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--accent)',
                background: 'var(--accent-subtle)',
                border: '1px solid var(--accent)',
                borderRadius: '8px',
                cursor: 'pointer',
                alignSelf: 'flex-start',
              }}
            >
              + 하위 그룹 추가
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
