'use client'

import { useState } from 'react'
import type { PopupConfig, PopupButtonConfig } from './types'
import type { ResolvedComponentDefinition } from '@/components/registry/types'
import PopupOverlay from './PopupOverlay'

interface PopupConfigFormProps {
  config: Record<string, unknown>
  onChange: (config: Record<string, unknown>) => void
  resolvedRegistry: Map<string, ResolvedComponentDefinition>
}

export default function PopupConfigForm({ config, onChange, resolvedRegistry }: PopupConfigFormProps) {
  const popups = (config.popups as PopupConfig[] | undefined) ?? []
  const [previewIdx, setPreviewIdx] = useState<number | null>(null)
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null)

  const setPopups = (next: PopupConfig[]) => {
    onChange({ ...config, popups: next.length > 0 ? next : undefined })
  }

  const addPopup = () => {
    const id = `popup-${Date.now()}`
    const newP: PopupConfig = { id, type: 'modal', trigger: 'click' }
    setPopups([...popups, newP])
    setExpandedIdx(popups.length)
  }

  const updatePopup = (idx: number, patch: Partial<PopupConfig>) => {
    setPopups(popups.map((p, i) => i === idx ? { ...p, ...patch } : p))
  }

  const removePopup = (idx: number) => {
    setPopups(popups.filter((_, i) => i !== idx))
    if (expandedIdx === idx) setExpandedIdx(null)
    else if (expandedIdx !== null && expandedIdx > idx) setExpandedIdx(expandedIdx - 1)
  }

  const registryEntries = Array.from(resolvedRegistry.entries())
    .filter(([key]) => key !== 'easter-cantata')
    .sort((a, b) => a[1].name.localeCompare(b[1].name))

  const labelStyle: React.CSSProperties = {
    fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)',
    textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px', display: 'block',
  }
  const miniLabel: React.CSSProperties = {
    fontSize: '10px', color: 'var(--text-muted)', marginBottom: '3px', display: 'block',
  }

  const ToggleButtons = ({ options, value, onSelect }: {
    options: { key: string; label: string }[]
    value: string
    onSelect: (key: string) => void
  }) => (
    <div style={{ display: 'flex', gap: '4px' }}>
      {options.map(o => (
        <button key={o.key} onClick={() => onSelect(o.key)}
          style={{
            flex: 1, padding: '5px 4px', fontSize: '11px', fontWeight: 600,
            borderRadius: '8px', border: '1px solid var(--border)', cursor: 'pointer',
            background: value === o.key ? 'var(--accent)' : 'var(--bg-secondary)',
            color: value === o.key ? 'white' : 'var(--text-primary)',
            transition: 'all 0.15s',
          }}>
          {o.label}
        </button>
      ))}
    </div>
  )

  const ButtonEditor = ({ label: sectionLabel, btn, onChangeBtn }: {
    label: string
    btn: PopupButtonConfig | undefined
    onChangeBtn: (val: PopupButtonConfig | undefined) => void
  }) => {
    const enabled = !!btn
    return (
      <div style={{ padding: '8px 10px', borderRadius: '8px', background: 'var(--bg-card, var(--bg-primary))', border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: enabled ? '8px' : '0' }}>
          <input type="checkbox" checked={enabled}
            onChange={e => onChangeBtn(e.target.checked ? { label: sectionLabel === 'Primary' ? '확인' : '취소', action: 'close' } : undefined)}
            style={{ width: '13px', height: '13px', accentColor: 'var(--accent)' }} />
          <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>{sectionLabel} 버튼</span>
        </div>
        {enabled && btn && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingLeft: '21px' }}>
            <div>
              <label style={miniLabel}>라벨</label>
              <input className="input" value={btn.label} style={{ fontSize: '12px' }}
                onChange={e => onChangeBtn({ ...btn, label: e.target.value })} />
            </div>
            <div>
              <label style={miniLabel}>액션</label>
              <ToggleButtons
                options={[{ key: 'close', label: '팝업 닫기' }, { key: 'link', label: '링크 이동' }]}
                value={btn.action}
                onSelect={key => onChangeBtn({ ...btn, action: key as 'close' | 'link' })}
              />
            </div>
            {btn.action === 'link' && (
              <div>
                <label style={miniLabel}>URL</label>
                <input className="input" value={btn.url || ''} placeholder="https://..."
                  onChange={e => onChangeBtn({ ...btn, url: e.target.value })} style={{ fontSize: '12px' }} />
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  const TRIGGER_LABELS: Record<string, string> = { load: '로드', click: '클릭', touch: '터치' }
  const TYPE_LABELS: Record<string, string> = { modal: '모달', slide: '슬라이드' }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          팝업 설정 {popups.length > 0 && `(${popups.length})`}
        </div>
        <button onClick={addPopup}
          style={{
            padding: '3px 10px', fontSize: '10px', fontWeight: 600,
            background: 'var(--accent)', color: 'white',
            border: 'none', borderRadius: '6px', cursor: 'pointer',
          }}>+ 추가</button>
      </div>

      {popups.length === 0 && (
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', padding: '8px 0' }}>
          팝업이 없습니다. 추가 버튼으로 팝업을 만드세요.
        </div>
      )}

      {popups.map((popup, idx) => {
        const isExpanded = expandedIdx === idx
        const contentDef = popup.content?.componentType
          ? resolvedRegistry.get(popup.content.componentType)
          : null

        return (
          <div key={popup.id} style={{
            borderRadius: '10px', border: '1px solid var(--border)',
            background: 'var(--bg-secondary)', overflow: 'hidden',
          }}>
            {/* Collapsed header */}
            <div
              onClick={() => setExpandedIdx(isExpanded ? null : idx)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '8px 12px', cursor: 'pointer',
                background: isExpanded ? 'var(--bg-card, var(--bg-primary))' : 'transparent',
                transition: 'background 0.15s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', transform: isExpanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }}>▶</span>
                <span style={{
                  fontSize: '9px', fontWeight: 700, padding: '1px 6px', borderRadius: '4px',
                  background: popup.type === 'modal' ? 'var(--accent)' : 'var(--bg-primary)',
                  color: popup.type === 'modal' ? 'white' : 'var(--text-primary)',
                  border: '1px solid var(--border)',
                }}>
                  {TYPE_LABELS[popup.type]}
                </span>
                <span style={{
                  fontSize: '9px', fontWeight: 600, padding: '1px 6px', borderRadius: '4px',
                  background: 'var(--bg-primary)', border: '1px solid var(--border)', color: 'var(--text-muted)',
                }}>
                  {TRIGGER_LABELS[popup.trigger]}
                </span>
                <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {popup.header?.title || popup.content?.componentType || `팝업 ${idx + 1}`}
                </span>
              </div>
              <button
                onClick={e => { e.stopPropagation(); removePopup(idx) }}
                style={{ padding: '2px 6px', fontSize: '10px', color: 'var(--danger)', background: 'none', border: '1px solid var(--border)', borderRadius: '4px', cursor: 'pointer' }}
              >삭제</button>
            </div>

            {/* Expanded body */}
            {isExpanded && (
              <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '10px', borderTop: '1px solid var(--border)' }}>
                {/* Type */}
                <div>
                  <label style={labelStyle}>팝업 유형</label>
                  <ToggleButtons
                    options={[{ key: 'modal', label: '모달 팝업' }, { key: 'slide', label: '슬라이드 팝업' }]}
                    value={popup.type}
                    onSelect={key => updatePopup(idx, { type: key as 'modal' | 'slide' })}
                  />
                </div>

                {/* Trigger */}
                <div>
                  <label style={labelStyle}>트리거</label>
                  <ToggleButtons
                    options={[
                      { key: 'load', label: '페이지 로드' },
                      { key: 'click', label: '클릭' },
                      { key: 'touch', label: '터치' },
                    ]}
                    value={popup.trigger}
                    onSelect={key => updatePopup(idx, { trigger: key as 'load' | 'click' | 'touch' })}
                  />
                </div>

                {/* Trigger selector (click/touch only) */}
                {(popup.trigger === 'click' || popup.trigger === 'touch') && (
                  <div>
                    <label style={labelStyle}>트리거 영역 (CSS 셀렉터)</label>
                    <input className="input"
                      value={popup.triggerSelector || ''}
                      placeholder="예: .btn-detail, [data-popup], #promo-area"
                      onChange={e => updatePopup(idx, { triggerSelector: e.target.value || undefined })}
                      style={{ fontSize: '12px', fontFamily: 'monospace' }}
                    />
                    <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px', lineHeight: 1.4 }}>
                      비우면 컴포넌트 전체 영역에 반응. CSS 셀렉터로 특정 버튼이나 영역을 지정 가능.
                    </p>
                  </div>
                )}

                {/* Delay (load only) */}
                {popup.trigger === 'load' && (
                  <div>
                    <label style={labelStyle}>지연 시간 (ms)</label>
                    <input type="number" className="input" value={popup.triggerDelay ?? 0} min={0} max={10000} step={100}
                      onChange={e => updatePopup(idx, { triggerDelay: parseInt(e.target.value) || 0 })}
                      style={{ fontSize: '12px' }} />
                  </div>
                )}

                {/* Header */}
                <div>
                  <label style={labelStyle}>헤더 제목 (선택)</label>
                  <input className="input" value={popup.header?.title || ''} placeholder="팝업 제목"
                    onChange={e => updatePopup(idx, { header: e.target.value ? { title: e.target.value } : undefined })}
                    style={{ fontSize: '12px' }} />
                </div>

                {/* Content component */}
                <div>
                  <label style={labelStyle}>컨텐츠 컴포넌트</label>
                  <select className="input"
                    value={popup.content?.componentType || ''}
                    onChange={e => {
                      const ct = e.target.value
                      if (!ct) { updatePopup(idx, { content: undefined }); return }
                      const def = resolvedRegistry.get(ct)
                      updatePopup(idx, { content: { componentType: ct, componentConfig: def?.defaultConfig ?? {} } })
                    }}
                    style={{ fontSize: '12px' }}
                  >
                    <option value="">-- 선택하세요 --</option>
                    {registryEntries.map(([key, def]) => (
                      <option key={key} value={key}>{def.icon} {def.name}</option>
                    ))}
                  </select>
                </div>

                {/* Inline ConfigForm for selected content component */}
                {contentDef && popup.content && (
                  <div style={{
                    padding: '10px', borderRadius: '8px',
                    border: '1px solid var(--border)', background: 'var(--bg-card, var(--bg-primary))',
                  }}>
                    <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                      {contentDef.icon} {contentDef.name} 설정
                    </div>
                    <contentDef.ConfigForm
                      config={popup.content.componentConfig}
                      onChange={(cc: Record<string, unknown>) => updatePopup(idx, { content: { ...popup.content!, componentConfig: cc } })}
                      componentId={`popup-${popup.id}`}
                    />
                  </div>
                )}

                {/* Footer buttons */}
                <div>
                  <label style={labelStyle}>하단 버튼</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <ButtonEditor
                      label="Primary"
                      btn={popup.footer?.primaryButton}
                      onChangeBtn={val => {
                        const footer = { ...(popup.footer || {}) }
                        if (val) footer.primaryButton = val; else delete footer.primaryButton
                        updatePopup(idx, { footer: (footer.primaryButton || footer.secondaryButton) ? footer : undefined })
                      }}
                    />
                    <ButtonEditor
                      label="Secondary"
                      btn={popup.footer?.secondaryButton}
                      onChangeBtn={val => {
                        const footer = { ...(popup.footer || {}) }
                        if (val) footer.secondaryButton = val; else delete footer.secondaryButton
                        updatePopup(idx, { footer: (footer.primaryButton || footer.secondaryButton) ? footer : undefined })
                      }}
                    />
                  </div>
                </div>

                {/* Preview */}
                <button
                  onClick={() => setPreviewIdx(idx)}
                  style={{
                    padding: '8px', fontSize: '12px', fontWeight: 600,
                    borderRadius: '8px', border: '1px dashed var(--border)',
                    background: 'var(--bg-card, var(--bg-primary))',
                    color: 'var(--accent)', cursor: 'pointer',
                  }}
                >
                  팝업 미리보기
                </button>
              </div>
            )}
          </div>
        )
      })}

      {/* Preview overlay */}
      {previewIdx !== null && popups[previewIdx] && (
        <PopupOverlay
          open
          config={popups[previewIdx]}
          parentComponentId="preview"
          pageId=""
          onClose={() => setPreviewIdx(null)}
        />
      )}
    </div>
  )
}
