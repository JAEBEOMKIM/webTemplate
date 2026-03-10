'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { componentImplementations } from '@/components/registry'
import type { ComponentDefinitionRow, ComponentGroupRow } from '@/components/registry/types'

interface Props {
  definitions: ComponentDefinitionRow[]
  groups: ComponentGroupRow[]
}

const emptyDef: ComponentDefinitionRow = {
  id: '',
  name: '',
  description: null,
  icon: null,
  default_config: {},
  group_id: null,
  component_module: null,
  config_form_module: null,
  grid_w: 12,
  grid_h: 4,
  grid_min_w: 4,
  grid_min_h: 2,
  display_order: 0,
  is_active: true,
}

export default function ComponentsManager({ definitions, groups }: Props) {
  const router = useRouter()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showNew, setShowNew] = useState(false)
  const [form, setForm] = useState<ComponentDefinitionRow>(emptyDef)
  const [configJson, setConfigJson] = useState('{}')
  const [jsonError, setJsonError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  const groupMap = new Map(groups.map(g => [g.id, g]))

  const openNew = () => {
    setEditingId(null)
    setForm({ ...emptyDef })
    setConfigJson('{}')
    setJsonError(null)
    setShowNew(true)
  }

  const openEdit = (def: ComponentDefinitionRow) => {
    setShowNew(false)
    setEditingId(def.id)
    setForm({ ...def })
    setConfigJson(JSON.stringify(def.default_config, null, 2))
    setJsonError(null)
  }

  const closeForm = () => {
    setEditingId(null)
    setShowNew(false)
  }

  const handleConfigJsonChange = (val: string) => {
    setConfigJson(val)
    try {
      JSON.parse(val)
      setJsonError(null)
    } catch (e: unknown) {
      setJsonError(e instanceof Error ? e.message : 'Invalid JSON')
    }
  }

  const handleSave = async () => {
    if (!form.id.trim() || !form.name.trim()) return
    let parsedConfig: Record<string, unknown> = {}
    try {
      parsedConfig = JSON.parse(configJson)
    } catch {
      setJsonError('저장할 수 없습니다: JSON 형식이 올바르지 않습니다.')
      return
    }

    setSaving(true)
    const supabase = createClient()
    const payload = {
      id: form.id.trim(),
      name: form.name.trim(),
      description: form.description?.trim() || null,
      icon: form.icon?.trim() || null,
      group_id: form.group_id || null,
      component_module: form.component_module?.trim() || null,
      config_form_module: form.config_form_module?.trim() || null,
      default_config: parsedConfig,
      grid_w: form.grid_w,
      grid_h: form.grid_h,
      grid_min_w: form.grid_min_w,
      grid_min_h: form.grid_min_h,
      display_order: form.display_order,
      is_active: form.is_active,
    }

    const { error } = await supabase
      .from('component_definitions')
      .upsert(payload, { onConflict: 'id' })

    setSaving(false)
    if (error) {
      alert(`저장 실패: ${error.message}`)
      return
    }
    closeForm()
    router.refresh()
  }

  const handleDelete = async (id: string) => {
    if (!confirm(`"${id}" 컴포넌트를 정말 삭제하시겠습니까?`)) return
    setDeleting(id)
    const supabase = createClient()
    const { error } = await supabase
      .from('component_definitions')
      .delete()
      .eq('id', id)
    setDeleting(null)
    if (error) {
      alert(`삭제 실패: ${error.message}`)
      return
    }
    if (editingId === id) closeForm()
    router.refresh()
  }

  const renderForm = (isNew: boolean) => (
    <div style={{
      background: 'var(--bg-secondary)',
      border: '1px solid var(--border)',
      borderRadius: '12px',
      padding: '20px',
      marginBottom: '16px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
          {isNew ? '새 컴포넌트 추가' : `"${form.id}" 편집`}
        </h3>
        <button onClick={closeForm} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: '18px', color: 'var(--text-muted)', padding: '4px',
        }}>✕</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        {/* ID */}
        <label style={labelStyle}>
          <span style={labelTextStyle}>ID *</span>
          <input
            style={inputStyle}
            value={form.id}
            onChange={e => setForm(f => ({ ...f, id: e.target.value }))}
            disabled={!isNew}
            placeholder="예: my-component"
          />
        </label>

        {/* Name */}
        <label style={labelStyle}>
          <span style={labelTextStyle}>이름 *</span>
          <input
            style={inputStyle}
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="컴포넌트 이름"
          />
        </label>

        {/* Description */}
        <label style={{ ...labelStyle, gridColumn: '1 / -1' }}>
          <span style={labelTextStyle}>설명</span>
          <input
            style={inputStyle}
            value={form.description ?? ''}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="컴포넌트 설명"
          />
        </label>

        {/* Icon */}
        <label style={labelStyle}>
          <span style={labelTextStyle}>아이콘</span>
          <input
            style={inputStyle}
            value={form.icon ?? ''}
            onChange={e => setForm(f => ({ ...f, icon: e.target.value }))}
            placeholder="이모지 입력"
          />
        </label>

        {/* Group */}
        <label style={labelStyle}>
          <span style={labelTextStyle}>그룹</span>
          <select
            style={inputStyle}
            value={form.group_id ?? ''}
            onChange={e => setForm(f => ({ ...f, group_id: e.target.value || null }))}
          >
            <option value="">미분류</option>
            {groups.map(g => (
              <option key={g.id} value={g.id}>{g.icon} {g.name}</option>
            ))}
          </select>
        </label>

        {/* Component Module */}
        <label style={labelStyle}>
          <span style={labelTextStyle}>
            Component 모듈
            {form.component_module && !componentImplementations.has(form.component_module) && (
              <span style={warningBadgeStyle}>미구현</span>
            )}
          </span>
          <input
            style={inputStyle}
            value={form.component_module ?? ''}
            onChange={e => setForm(f => ({ ...f, component_module: e.target.value }))}
            placeholder="registry key (예: accordion)"
          />
        </label>

        {/* Config Form Module */}
        <label style={labelStyle}>
          <span style={labelTextStyle}>
            ConfigForm 모듈
            {form.config_form_module && !componentImplementations.has(form.config_form_module) && (
              <span style={warningBadgeStyle}>미구현</span>
            )}
          </span>
          <input
            style={inputStyle}
            value={form.config_form_module ?? ''}
            onChange={e => setForm(f => ({ ...f, config_form_module: e.target.value }))}
            placeholder="registry key (예: accordion)"
          />
        </label>

        {/* Grid sizes */}
        <div style={{ gridColumn: '1 / -1' }}>
          <span style={{ ...labelTextStyle, display: 'block', marginBottom: '6px' }}>그리드 크기</span>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {([
              ['grid_w', 'W'],
              ['grid_h', 'H'],
              ['grid_min_w', 'Min W'],
              ['grid_min_h', 'Min H'],
            ] as const).map(([key, label]) => (
              <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', minWidth: '36px' }}>{label}</span>
                <input
                  type="number"
                  style={{ ...inputStyle, width: '70px', textAlign: 'center' }}
                  value={form[key]}
                  onChange={e => setForm(f => ({ ...f, [key]: parseInt(e.target.value) || 0 }))}
                  min={1}
                />
              </label>
            ))}
          </div>
        </div>

        {/* Display Order */}
        <label style={labelStyle}>
          <span style={labelTextStyle}>정렬 순서</span>
          <input
            type="number"
            style={inputStyle}
            value={form.display_order}
            onChange={e => setForm(f => ({ ...f, display_order: parseInt(e.target.value) || 0 }))}
          />
        </label>

        {/* Is Active */}
        <label style={{ ...labelStyle, flexDirection: 'row', alignItems: 'center', gap: '8px' }}>
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))}
            style={{ width: '16px', height: '16px', accentColor: 'var(--accent)' }}
          />
          <span style={{ fontSize: '13px', color: 'var(--text-primary)' }}>활성화</span>
        </label>

        {/* Default Config JSON */}
        <label style={{ ...labelStyle, gridColumn: '1 / -1' }}>
          <span style={labelTextStyle}>기본 설정 (JSON)</span>
          <textarea
            style={{
              ...inputStyle,
              minHeight: '100px',
              fontFamily: 'monospace',
              fontSize: '12px',
              resize: 'vertical',
              borderColor: jsonError ? 'var(--danger)' : undefined,
            }}
            value={configJson}
            onChange={e => handleConfigJsonChange(e.target.value)}
          />
          {jsonError && (
            <span style={{ fontSize: '11px', color: 'var(--danger)', marginTop: '2px' }}>{jsonError}</span>
          )}
        </label>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '8px', marginTop: '16px', justifyContent: 'flex-end' }}>
        <button onClick={closeForm} style={{
          padding: '8px 16px', fontSize: '13px', borderRadius: '8px',
          border: '1px solid var(--border)', background: 'var(--bg-primary)',
          color: 'var(--text-secondary)', cursor: 'pointer',
        }}>
          취소
        </button>
        <button
          onClick={handleSave}
          disabled={saving || !form.id.trim() || !form.name.trim() || !!jsonError}
          style={{
            padding: '8px 20px', fontSize: '13px', fontWeight: 600, borderRadius: '8px',
            border: 'none', background: 'var(--accent)', color: '#fff', cursor: 'pointer',
            opacity: (saving || !form.id.trim() || !form.name.trim() || !!jsonError) ? 0.5 : 1,
          }}
        >
          {saving ? '저장 중...' : '저장'}
        </button>
      </div>
    </div>
  )

  return (
    <div>
      {/* Top bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          {definitions.length}개의 컴포넌트 정의
        </p>
        <button
          onClick={openNew}
          style={{
            padding: '8px 16px', fontSize: '13px', fontWeight: 600, borderRadius: '8px',
            border: 'none', background: 'var(--accent)', color: '#fff', cursor: 'pointer',
          }}
        >
          + 새 컴포넌트 추가
        </button>
      </div>

      {/* New form */}
      {showNew && renderForm(true)}

      {/* Definition cards */}
      {definitions.length === 0 && !showNew && (
        <div style={{
          background: 'var(--bg-primary)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '60px 20px',
          textAlign: 'center',
        }}>
          <div style={{
            width: '52px', height: '52px', background: 'var(--bg-secondary)',
            border: '1px solid var(--border)', borderRadius: '14px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px', fontSize: '22px',
          }}>🧩</div>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>등록된 컴포넌트가 없습니다</p>
          <button
            onClick={openNew}
            style={{
              padding: '8px 16px', fontSize: '13px', fontWeight: 600, borderRadius: '8px',
              border: 'none', background: 'var(--accent)', color: '#fff', cursor: 'pointer',
            }}
          >
            첫 번째 컴포넌트 추가
          </button>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {definitions.map(def => {
          const hasImpl = componentImplementations.has(def.component_module ?? def.id)
          const group = def.group_id ? groupMap.get(def.group_id) : null
          const isEditing = editingId === def.id

          return (
            <div key={def.id}>
              {/* Card */}
              <div
                onClick={() => !isEditing && openEdit(def)}
                style={{
                  background: 'var(--bg-primary)',
                  border: `1px solid ${isEditing ? 'var(--accent)' : 'var(--border)'}`,
                  borderRadius: '12px',
                  padding: '16px 20px',
                  cursor: isEditing ? 'default' : 'pointer',
                  transition: 'border-color 0.15s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                  {/* Icon */}
                  <span style={{ fontSize: '22px', lineHeight: 1 }}>
                    {def.icon || '🧩'}
                  </span>

                  {/* Main info */}
                  <div style={{ flex: 1, minWidth: '160px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {def.name}
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                        {def.id}
                      </span>
                    </div>
                    {def.description && (
                      <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>
                        {def.description}
                      </p>
                    )}
                  </div>

                  {/* Tags */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    {/* Group badge */}
                    {group && (
                      <span style={{
                        fontSize: '11px', fontWeight: 500, color: 'var(--text-secondary)',
                        background: 'var(--bg-secondary)', padding: '2px 8px',
                        borderRadius: '20px', border: '1px solid var(--border)',
                      }}>
                        {group.icon} {group.name}
                      </span>
                    )}

                    {/* Module key */}
                    <span style={{
                      fontSize: '11px', fontFamily: 'monospace',
                      color: 'var(--text-muted)', background: 'var(--bg-secondary)',
                      padding: '2px 8px', borderRadius: '6px',
                    }}>
                      {def.component_module ?? def.id}
                    </span>

                    {/* Grid size */}
                    <span style={{
                      fontSize: '10px', color: 'var(--text-muted)',
                    }}>
                      {def.grid_w}×{def.grid_h} (min {def.grid_min_w}×{def.grid_min_h})
                    </span>

                    {/* Implementation status */}
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{
                        width: '8px', height: '8px', borderRadius: '50%',
                        background: hasImpl ? '#22c55e' : 'var(--danger)',
                        display: 'inline-block',
                      }} />
                      {!hasImpl && (
                        <span style={{ fontSize: '11px', color: 'var(--danger)', fontWeight: 500 }}>
                          미구현
                        </span>
                      )}
                    </span>

                    {/* Active status */}
                    {!def.is_active && (
                      <span style={{
                        fontSize: '11px', fontWeight: 500, color: 'var(--text-muted)',
                        background: 'var(--bg-secondary)', padding: '2px 8px',
                        borderRadius: '20px', border: '1px solid var(--border)',
                      }}>
                        비활성
                      </span>
                    )}

                    {/* Delete button */}
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(def.id) }}
                      disabled={deleting === def.id}
                      style={{
                        padding: '4px 8px', fontSize: '11px', borderRadius: '6px',
                        border: '1px solid var(--danger)', background: 'none',
                        color: 'var(--danger)', cursor: 'pointer',
                        opacity: deleting === def.id ? 0.5 : 0.7,
                      }}
                    >
                      {deleting === def.id ? '...' : '삭제'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Inline edit form */}
              {isEditing && (
                <div style={{ marginTop: '8px' }}>
                  {renderForm(false)}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Shared inline styles ────────────────────────────────────────────────────

const labelStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
}

const labelTextStyle: React.CSSProperties = {
  fontSize: '12px',
  fontWeight: 500,
  color: 'var(--text-secondary)',
}

const inputStyle: React.CSSProperties = {
  padding: '8px 10px',
  fontSize: '13px',
  borderRadius: '8px',
  border: '1px solid var(--border)',
  background: 'var(--bg-primary)',
  color: 'var(--text-primary)',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
}

const warningBadgeStyle: React.CSSProperties = {
  display: 'inline-block',
  marginLeft: '6px',
  fontSize: '10px',
  fontWeight: 600,
  color: 'var(--danger)',
  background: 'var(--bg-secondary)',
  padding: '1px 6px',
  borderRadius: '4px',
  border: '1px solid var(--danger)',
}
