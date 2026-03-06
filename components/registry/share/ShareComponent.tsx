'use client'

import { useEffect, useState } from 'react'
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

    if (window.Kakao) {
      load()
      return
    }

    const script = document.createElement('script')
    script.src = 'https://t1.kakaocdn.net/kakao_js_sdk/2.7.2/kakao.min.js'
    script.crossOrigin = 'anonymous'
    script.onload = load
    document.head.appendChild(script)
  }, [appKey])

  return ready
}

export function ShareComponent({ config }: ComponentProps) {
  const title = (config.title as string) || '공유하기'
  const description = (config.description as string) || ''
  const imageUrl = (config.image_url as string) || ''
  const kakaoAppKey = (config.kakao_app_key as string) || ''
  const showKakao = (config.show_kakao as boolean) !== false
  const showSms = (config.show_sms as boolean) !== false
  const showCopy = (config.show_copy as boolean) !== false
  const buttonLabel = (config.button_label as string) || '공유하기'

  const [copied, setCopied] = useState(false)
  const kakaoReady = useKakaoSdk(showKakao ? kakaoAppKey : '')

  const getShareUrl = () => typeof window !== 'undefined' ? window.location.href : ''

  const handleKakao = () => {
    if (!window.Kakao?.Share) return
    const shareUrl = getShareUrl()
    window.Kakao.Share.sendDefault({
      objectType: 'feed',
      content: {
        title,
        description,
        ...(imageUrl ? { imageUrl } : {}),
        link: { mobileWebUrl: shareUrl, webUrl: shareUrl },
      },
      buttons: [
        { title: buttonLabel, link: { mobileWebUrl: shareUrl, webUrl: shareUrl } },
      ],
    })
  }

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
      // fallback
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

      {!hasAnyButton && (
        <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>공유 버튼을 관리자 패널에서 설정해주세요.</p>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', width: '100%', maxWidth: '400px' }}>
        {showKakao && (
          <button
            onClick={handleKakao}
            disabled={!kakaoReady}
            style={{ ...btnBase, background: '#FEE500', color: '#3C1E1E', opacity: kakaoReady ? 1 : 0.5 }}
            title={!kakaoAppKey ? 'Kakao App Key가 설정되지 않았습니다' : undefined}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M9 1.5C4.86 1.5 1.5 4.19 1.5 7.5c0 2.12 1.32 3.98 3.3 5.08L4 15l3.27-2.12c.56.09 1.14.12 1.73.12 4.14 0 7.5-2.69 7.5-6S13.14 1.5 9 1.5z" fill="#3C1E1E"/>
            </svg>
            카카오톡
          </button>
        )}

        {showSms && (
          <button
            onClick={handleSms}
            style={{ ...btnBase, background: '#34C759', color: '#fff' }}
          >
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
    </div>
  )
}

export function ShareConfigForm({ config, onChange }: ConfigFormProps) {
  const labelStyle: React.CSSProperties = {
    fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)',
    textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px', display: 'block',
  }
  const rowStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '8px' }

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

      {/* Button toggles */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <label style={{ ...labelStyle, marginBottom: '2px' }}>표시할 버튼</label>
        {[
          { key: 'show_kakao', label: '카카오톡 공유' },
          { key: 'show_sms', label: '문자 공유' },
          { key: 'show_copy', label: '링크 복사' },
        ].map(({ key, label }) => (
          <div key={key} style={rowStyle}>
            <input
              type="checkbox"
              id={key}
              checked={(config[key] as boolean) !== false}
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
    </div>
  )
}
