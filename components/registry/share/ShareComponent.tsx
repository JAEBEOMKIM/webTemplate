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

function isMobileDevice() {
  return typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
}

function supportsNativeShare() {
  return typeof navigator !== 'undefined' && !!navigator.share
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
  const [kakaoError, setKakaoError] = useState('')
  const [isMobile, setIsMobile] = useState(false)
  const kakaoReady = useKakaoSdk(showKakao ? kakaoAppKey : '')

  useEffect(() => {
    setIsMobile(isMobileDevice() && supportsNativeShare())
  }, [])

  const getShareUrl = () => typeof window !== 'undefined' ? window.location.href : ''

  // Kakao SDK share (opens KakaoTalk app on mobile, popup on desktop)
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
        { title: buttonLabel, link: { mobileWebUrl: shareUrl, webUrl: shareUrl } },
      ],
    })
  }

  // Native Web Share API (shows OS share sheet — includes KakaoTalk on Android/iOS)
  const shareViaNative = async (shareUrl: string) => {
    try {
      await navigator.share({ title, text: description, url: shareUrl })
    } catch (e) {
      // User cancelled or API unsupported — ignore
      if ((e as DOMException)?.name !== 'AbortError') {
        setKakaoError('공유에 실패했습니다.')
        setTimeout(() => setKakaoError(''), 3000)
      }
    }
  }

  const handleKakao = async () => {
    setKakaoError('')
    const shareUrl = getShareUrl()

    // 1) Kakao SDK ready → use it (naturally opens KakaoTalk app on mobile)
    if (kakaoReady && window.Kakao?.Share) {
      shareViaKakaoSdk(shareUrl)
      return
    }

    // 2) Mobile without SDK → use native share sheet (KakaoTalk appears in list)
    if (isMobileDevice() && supportsNativeShare()) {
      await shareViaNative(shareUrl)
      return
    }

    // 3) Desktop without SDK key → guide user
    setKakaoError('Kakao App Key를 설정해주세요.')
    setTimeout(() => setKakaoError(''), 4000)
  }

  // Button is usable when: SDK is ready OR mobile can fall back to native share
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
