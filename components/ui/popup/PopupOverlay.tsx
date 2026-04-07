'use client'

import { useState, useEffect, useCallback } from 'react'
import { componentRegistry } from '@/components/registry'
import type { PopupConfig } from './types'

interface PopupOverlayProps {
  open: boolean
  config: PopupConfig
  parentComponentId: string
  pageId: string
  onClose: () => void
}

export default function PopupOverlay({ open, config, parentComponentId, pageId, onClose }: PopupOverlayProps) {
  const [closing, setClosing] = useState(false)
  const isModal = config.type === 'modal'

  // ESC 키 닫기
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  // Body 스크롤 잠금
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [open])

  const handleClose = useCallback(() => {
    if (closing) return
    setClosing(true)
  }, [closing])

  const onAnimEnd = useCallback(() => {
    if (closing) {
      setClosing(false)
      onClose()
    }
  }, [closing, onClose])

  if (!open) return null

  // 컨텐츠 컴포넌트 렌더링
  const renderContent = () => {
    const cc = config.content
    if (!cc?.componentType) return null
    const def = componentRegistry.get(cc.componentType)
    if (!def) return (
      <div style={{ padding: '20px', color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center' }}>
        Component not found: {cc.componentType}
      </div>
    )
    return (
      <def.Component
        componentId={`popup-${parentComponentId}`}
        config={cc.componentConfig || {}}
        pageId={pageId}
      />
    )
  }

  // 버튼 핸들러
  const handleButton = (action: 'close' | 'link', url?: string) => {
    if (action === 'link' && url) {
      window.open(url, '_blank', 'noopener,noreferrer')
    }
    handleClose()
  }

  const footer = config.footer
  const header = config.header
  const hasPrimary = !!footer?.primaryButton?.label
  const hasSecondary = !!footer?.secondaryButton?.label
  const hasFooter = hasPrimary || hasSecondary
  const hasContent = !!config.content?.componentType

  // 닫기 버튼 (X) SVG
  const CloseX = (
    <button
      onClick={handleClose}
      aria-label="Close"
      style={{
        position: 'absolute', top: '16px', right: '16px', zIndex: 2,
        width: '32px', height: '32px', borderRadius: '50%',
        background: 'var(--bg-secondary)', border: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', transition: 'background 0.15s',
      }}
    >
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round">
        <line x1="2" y1="2" x2="12" y2="12" />
        <line x1="12" y1="2" x2="2" y2="12" />
      </svg>
    </button>
  )

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        display: 'flex',
        alignItems: isModal ? 'center' : 'flex-end',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.5)',
        backdropFilter: 'blur(4px)',
        padding: isModal ? '20px' : '0',
        animation: `${closing ? 'popupBackdropOut' : 'popupBackdropIn'} ${closing ? '200ms' : '250ms'} ease forwards`,
      }}
      onClick={e => { if (e.target === e.currentTarget) handleClose() }}
      onAnimationEnd={onAnimEnd}
    >
      {/* Card */}
      <div
        style={{
          position: 'relative',
          background: 'var(--bg-primary)',
          border: '1px solid var(--border)',
          borderRadius: isModal ? '24px' : '24px 24px 0 0',
          maxWidth: '480px',
          width: '100%',
          maxHeight: isModal ? '85vh' : '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 24px 80px rgba(0,0,0,0.18)',
          animation: closing
            ? `${isModal ? 'popupModalOut' : 'popupSlideOut'} 200ms ease forwards`
            : `${isModal ? 'popupModalIn' : 'popupSlideIn'} 300ms cubic-bezier(0.16, 1, 0.3, 1) forwards`,
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Close (X) button */}
        {CloseX}

        {/* Slide-up handle bar */}
        {!isModal && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
            <div style={{ width: '40px', height: '4px', borderRadius: '2px', background: 'var(--border)' }} />
          </div>
        )}

        {/* Header */}
        {header?.title && (
          <div style={{
            padding: isModal ? '32px 32px 0' : '16px 24px 0',
            textAlign: isModal ? 'center' : 'left',
            flexShrink: 0,
          }}>
            <h2 style={{
              fontSize: isModal ? '22px' : '24px',
              fontWeight: 800,
              color: 'var(--text-primary)',
              letterSpacing: '-0.02em',
              lineHeight: 1.2,
              margin: 0,
              paddingRight: '32px',
            }}>
              {header.title}
            </h2>
          </div>
        )}

        {/* Content area */}
        {hasContent && (
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: isModal ? '16px 32px' : '16px 24px',
            minHeight: '60px',
          }}>
            {renderContent()}
          </div>
        )}

        {/* Empty spacer if no content but has header+footer */}
        {!hasContent && header?.title && hasFooter && (
          <div style={{ height: '8px' }} />
        )}

        {/* Footer */}
        {hasFooter && (
          <div style={{
            padding: isModal ? '0 32px 32px' : '12px 24px 28px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
            flexShrink: 0,
          }}>
            {hasPrimary && (
              <button
                onClick={() => handleButton(
                  footer!.primaryButton!.action,
                  footer!.primaryButton!.url
                )}
                style={{
                  width: '100%',
                  padding: '14px 24px',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#ffffff',
                  background: 'linear-gradient(135deg, var(--accent), var(--accent-dim, var(--accent)))',
                  border: 'none',
                  borderRadius: '14px',
                  cursor: 'pointer',
                  transition: 'opacity 0.15s, transform 0.1s',
                }}
                className="popup-primary-btn"
              >
                {footer!.primaryButton!.label}
              </button>
            )}
            {hasSecondary && (
              <button
                onClick={() => handleButton(
                  footer!.secondaryButton!.action,
                  footer!.secondaryButton!.url
                )}
                style={{
                  padding: '6px 12px',
                  fontSize: '13px',
                  fontWeight: 500,
                  color: 'var(--text-muted)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  textDecoration: 'none',
                  transition: 'color 0.15s',
                }}
                className="popup-secondary-btn"
              >
                {footer!.secondaryButton!.label}
              </button>
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes popupBackdropIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes popupBackdropOut { from { opacity: 1 } to { opacity: 0 } }
        @keyframes popupModalIn { from { opacity: 0; transform: scale(0.92) } to { opacity: 1; transform: scale(1) } }
        @keyframes popupModalOut { from { opacity: 1; transform: scale(1) } to { opacity: 0; transform: scale(0.92) } }
        @keyframes popupSlideIn { from { transform: translateY(100%) } to { transform: translateY(0) } }
        @keyframes popupSlideOut { from { transform: translateY(0) } to { transform: translateY(100%) } }
        .popup-primary-btn:hover { opacity: 0.9; }
        .popup-primary-btn:active { transform: scale(0.97); }
        .popup-secondary-btn:hover { color: var(--text-primary) !important; }
      `}</style>
    </div>
  )
}
