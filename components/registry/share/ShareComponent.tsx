'use client'

import { useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'
import type { ComponentProps, ConfigFormProps } from '../types'

declare global {
  interface Window {
    Kakao?: {
      isInitialized: () => boolean
      init: (key: string) => void
      Share: {
        sendDefault: (opts: unknown) => void
      }
    }
  }
}

function useKakaoSdk(appKey: string) {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!appKey) return
    const load = () => {
      if (!window.Kakao) return
      if (!window.Kakao.isInitialized()) {
        window.Kakao.init(appKey)
      }
      setReady(true)
    }

    if (window.Kakao) { load(); return }

    const script = document.createElement('script')
    script.src = 'https://t1.kakaocdn.net/kakao_js_sdk/2.7.2/kakao.min.js'
    script.crossOrigin = 'anonymous'
    script.onload = load
    document.head.appendChild(script)
  }, [appKey])

  return ready
}

function isMobileDevice() {
  return typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
}
function supportsNativeShare() {
  return typeof navigator !== 'undefined' && !!navigator.share
}

// ── QR Code Panel ─────────────────────────────────────────────────────────

function QrPanel({ url, title, fgColor, bgColor, size }: {
  url: string
  title: string
  fgColor: string
  bgColor: string
  size: number
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [dataUrl, setDataUrl] = useState('')

  useEffect(() => {
    if (!url || !canvasRef.current) return
    QRCode.toCanvas(canvasRef.current, url, {
      width: size,
      margin: 2,
      color: { dark: fgColor || '#000000', light: bgColor || '#ffffff' },
      errorCorrectionLevel: 'M',
    })
    setDataUrl(canvasRef.current.toDataURL('image/png'))
  }, [url, fgColor, bgColor, size])

  const handleDownload = () => {
    if (!canvasRef.current) return
    const a = document.createElement('a')
    a.href = canvasRef.current.toDataURL('image/png')
    a.download = `qr-${title || 'share'}.png`
    a.click()
  }

  const btnSmall: React.CSSProperties = {
    padding: '6px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px',
    fontWeight: 600, border: '1px solid var(--border)', background: 'var(--bg-secondary)',
    color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px',
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px',
      padding: '16px', borderRadius: '12px',
      border: '1px solid var(--border)', background: 'var(--bg-primary)',
      width: '100%', maxWidth: '280px',
    }}>
      <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        QR 코드
      </p>
      <canvas
        ref={canvasRef}
        style={{ borderRadius: '8px', display: 'block' }}
      />
      <div style={{ display: 'flex', gap: '6px' }}>
        <button onClick={handleDownload} style={btnSmall}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          저장
        </button>
        <button
          onClick={() => navigator.clipboard.writeText(url).catch(() => {})}
          style={btnSmall}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
          </svg>
          URL 복사
        </button>
      </div>
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────

export function ShareComponent({ config }: ComponentProps) {
  const title = (config.title as string) || '공유하기'
  const description = (config.description as string) || ''
  const imageUrl = (config.image_url as string) || ''
  const kakaoAppKey = (config.kakao_app_key as string) || ''
  const showKakao = (config.show_kakao as boolean) !== false
  const showSms = (config.show_sms as boolean) !== false
  const showCopy = (config.show_copy as boolean) !== false
  const showQr = (config.show_qr as boolean) === true
  const qrFgColor = (config.qr_fg_color as string) || '#000000'
  const qrBgColor = (config.qr_bg_color as string) || '#ffffff'
  const qrSize = (config.qr_size as number) || 180

  const [copied, setCopied] = useState(false)
  const [kakaoError, setKakaoError] = useState('')
  const [isMobile, setIsMobile] = useState(false)
  const [currentUrl, setCurrentUrl] = useState('')
  const kakaoReady = useKakaoSdk(showKakao ? kakaoAppKey : '')

  useEffect(() => {
    setIsMobile(isMobileDevice() && supportsNativeShare())
    setCurrentUrl(window.location.href)
  }, [])

  const getShareUrl = () => typeof window !== 'undefined' ? window.location.href : ''

  const shareViaKakaoSdk = (shareUrl: string) => {
    window.Kakao!.Share.sendDefault({
      objectType: 'feed',
      content: {
        title,
        description,
        ...(imageUrl ? { imageUrl } : {}),
        link: { mobileWebUrl: shareUrl, webUrl: shareUrl },
      },
      buttons: [
        { title: '보러가기', link: { mobileWebUrl: shareUrl, webUrl: shareUrl } },
      ],
    })
  }

  const shareViaNative = async (shareUrl: string) => {
    try {
      await navigator.share({ title, text: description, url: shareUrl })
    } catch (e) {
      if ((e as DOMException)?.name !== 'AbortError') {
        setKakaoError('공유에 실패했습니다.')
        setTimeout(() => setKakaoError(''), 3000)
      }
    }
  }

  const handleKakao = async () => {
    setKakaoError('')
    const shareUrl = getShareUrl()
    if (kakaoReady && window.Kakao?.Share) { shareViaKakaoSdk(shareUrl); return }
    if (isMobileDevice() && supportsNativeShare()) { await shareViaNative(shareUrl); return }
    setKakaoError('Kakao App Key를 설정해주세요.')
    setTimeout(() => setKakaoError(''), 4000)
  }

  const kakaoClickable = kakaoReady || isMobile

  const handleSms = () => {
    const shareUrl = getShareUrl()
    const text = [title, description, shareUrl].filter(Boolean).join('\n')
    window.open(`sms:?body=${encodeURIComponent(text)}`)
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(getShareUrl())
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      const el = document.createElement('textarea')
      el.value = getShareUrl()
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const hasAnyButton = showKakao || showSms || showCopy

  const btnBase: React.CSSProperties = {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
    padding: '12px 20px', borderRadius: '10px', cursor: 'pointer',
    border: 'none', fontSize: '14px', fontWeight: 600, flex: 1, minWidth: '100px',
    transition: 'opacity 0.15s',
  }

  return (
    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
      {title && (
        <p style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', textAlign: 'center' }}>{title}</p>
      )}
      {description && (
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', textAlign: 'center' }}>{description}</p>
      )}

      {!hasAnyButton && !showQr && (
        <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>공유 버튼을 관리자 패널에서 설정해주세요.</p>
      )}

      {hasAnyButton && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', width: '100%', maxWidth: '400px' }}>
          {showKakao && (
            <div style={{ flex: 1, minWidth: '100px' }}>
              <button
                onClick={handleKakao}
                disabled={!kakaoClickable && !kakaoReady}
                style={{ ...btnBase, flex: 'unset', width: '100%', background: '#FEE500', color: '#3C1E1E', opacity: (kakaoClickable || kakaoReady) ? 1 : 0.5 }}
              >
                <svg width="20" height="20" viewBox="0 0 40 40" fill="none">
                  <ellipse cx="20" cy="19" rx="18" ry="16" fill="#3C1E1E"/>
                  <path d="M20 8C12.27 8 6 12.93 6 19c0 3.97 2.6 7.45 6.55 9.5L11 32l5.8-3.5c1 .16 2.1.25 3.2.25 7.73 0 14-4.93 14-11S27.73 8 20 8z" fill="#FEE500"/>
                  <path d="M13 17.5h2v6h-2v-6zm3.5 0h2l2.5 3.5V17.5h2v6h-2L18.5 20V23.5h-2v-6zm7 0h5v2h-1.5v4h-2v-4H23.5v-2z" fill="#3C1E1E"/>
                </svg>
                카카오톡
              </button>
              {kakaoError && (
                <p style={{ fontSize: '11px', color: 'var(--danger)', textAlign: 'center', marginTop: '4px' }}>{kakaoError}</p>
              )}
            </div>
          )}

          {showSms && (
            <button onClick={handleSms} style={{ ...btnBase, background: '#34C759', color: '#fff' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              문자
            </button>
          )}

          {showCopy && (
            <button
              onClick={handleCopy}
              style={{ ...btnBase, background: copied ? 'var(--success, #22c55e)' : 'var(--bg-secondary)', color: copied ? '#fff' : 'var(--text-primary)', border: '1px solid var(--border)' }}
            >
              {copied ? (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  복사됨
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                  </svg>
                  링크 복사
                </>
              )}
            </button>
          )}
        </div>
      )}

      {/* QR Code */}
      {showQr && currentUrl && (
        <QrPanel
          url={currentUrl}
          title={title}
          fgColor={qrFgColor}
          bgColor={qrBgColor}
          size={qrSize}
        />
      )}
    </div>
  )
}

// ── Config Form ────────────────────────────────────────────────────────────

export function ShareConfigForm({ config, onChange }: ConfigFormProps) {
  const labelStyle: React.CSSProperties = {
    fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)',
    textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px', display: 'block',
  }
  const rowStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '8px' }
  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '7px 10px', fontSize: '13px',
    border: '1px solid var(--border)', borderRadius: '8px',
    background: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none',
  }

  const showQr = (config.show_qr as boolean) === true

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div>
        <label style={labelStyle}>공유 제목</label>
        <input className="input" value={(config.title as string) || ''} onChange={e => onChange({ ...config, title: e.target.value })} style={{ fontSize: '13px' }} />
      </div>

      <div>
        <label style={labelStyle}>공유 설명</label>
        <input className="input" value={(config.description as string) || ''} onChange={e => onChange({ ...config, description: e.target.value })} placeholder="선택사항" style={{ fontSize: '13px' }} />
      </div>

      <div>
        <label style={labelStyle}>공유 이미지 URL</label>
        <input className="input" value={(config.image_url as string) || ''} onChange={e => onChange({ ...config, image_url: e.target.value })} placeholder="https://... (카카오톡 공유 시 사용)" style={{ fontSize: '13px' }} />
      </div>

      {/* 버튼 토글 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <label style={{ ...labelStyle, marginBottom: '2px' }}>표시할 버튼</label>
        {[
          { key: 'show_kakao', label: '카카오톡 공유' },
          { key: 'show_sms', label: '문자 공유' },
          { key: 'show_copy', label: '링크 복사' },
          { key: 'show_qr', label: 'QR 코드 표시', defaultOff: true },
        ].map(({ key, label, defaultOff }) => (
          <div key={key} style={rowStyle}>
            <input
              type="checkbox"
              id={key}
              checked={defaultOff ? (config[key] as boolean) === true : (config[key] as boolean) !== false}
              onChange={e => onChange({ ...config, [key]: e.target.checked })}
              style={{ width: '14px', height: '14px', accentColor: 'var(--accent)' }}
            />
            <label htmlFor={key} style={{ fontSize: '13px', color: 'var(--text-primary)', cursor: 'pointer' }}>{label}</label>
          </div>
        ))}
      </div>

      {/* Kakao App Key */}
      {(config.show_kakao as boolean) !== false && (
        <div>
          <label style={labelStyle}>Kakao JS App Key</label>
          <input
            className="input"
            type="password"
            value={(config.kakao_app_key as string) || ''}
            onChange={e => onChange({ ...config, kakao_app_key: e.target.value })}
            placeholder="카카오 개발자 콘솔에서 발급"
            style={{ fontSize: '13px' }}
          />
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', lineHeight: 1.5 }}>
            developers.kakao.com → 내 애플리케이션 → 앱 키 → JavaScript 키
          </p>
        </div>
      )}

      {/* QR 설정 */}
      {showQr && (
        <div style={{
          border: '1px solid var(--border)', borderRadius: '10px',
          padding: '12px', background: 'var(--bg-primary)',
          display: 'flex', flexDirection: 'column', gap: '10px',
        }}>
          <label style={{ ...labelStyle, marginBottom: 0 }}>QR 코드 설정</label>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div>
              <label style={{ ...labelStyle, fontSize: '10px' }}>전경 색상</label>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <input
                  type="color"
                  value={(config.qr_fg_color as string) || '#000000'}
                  onChange={e => onChange({ ...config, qr_fg_color: e.target.value })}
                  style={{ width: '36px', height: '30px', border: 'none', cursor: 'pointer', borderRadius: '6px' }}
                />
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  {(config.qr_fg_color as string) || '#000000'}
                </span>
              </div>
            </div>
            <div>
              <label style={{ ...labelStyle, fontSize: '10px' }}>배경 색상</label>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <input
                  type="color"
                  value={(config.qr_bg_color as string) || '#ffffff'}
                  onChange={e => onChange({ ...config, qr_bg_color: e.target.value })}
                  style={{ width: '36px', height: '30px', border: 'none', cursor: 'pointer', borderRadius: '6px' }}
                />
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  {(config.qr_bg_color as string) || '#ffffff'}
                </span>
              </div>
            </div>
          </div>

          <div>
            <label style={{ ...labelStyle, fontSize: '10px' }}>크기 (px)</label>
            <input
              type="range"
              min={100} max={300} step={10}
              value={(config.qr_size as number) || 180}
              onChange={e => onChange({ ...config, qr_size: parseInt(e.target.value) })}
              style={{ width: '100%' }}
            />
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              {(config.qr_size as number) || 180}px
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
