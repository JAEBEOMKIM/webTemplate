'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense, useState } from 'react'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { createClient } from '@/lib/supabase/client'

function LoginForm() {
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') || '/admin'
  const errorParam = searchParams.get('error')
  const hint = searchParams.get('hint')

  const [devEmail, setDevEmail] = useState(process.env.NEXT_PUBLIC_ADMIN_EMAIL || '')
  const [devPassword, setDevPassword] = useState('')
  const [devLoading, setDevLoading] = useState(false)
  const [devError, setDevError] = useState('')
  const [showDevForm, setShowDevForm] = useState(false)

  const isDevMode = process.env.NEXT_PUBLIC_ALLOW_DEV_LOGIN === 'true'

  const handleNaverLogin = () => {
    window.location.href = `/api/auth/naver?redirect=${encodeURIComponent(redirect)}`
  }

  const handleKakaoLogin = () => {
    window.location.href = `/api/auth/kakao?redirect=${encodeURIComponent(redirect)}`
  }

  const handleGoogleLogin = async () => {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirect)}`,
      },
    })
  }

  const handleDevLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setDevLoading(true)
    setDevError('')

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email: devEmail,
      password: devPassword,
    })

    if (error) {
      setDevError(error.message === 'Invalid login credentials'
        ? '이메일 또는 비밀번호가 올바르지 않습니다'
        : error.message)
      setDevLoading(false)
      return
    }

    window.location.href = redirect
  }

  const step = searchParams.get('step')
  const detail = searchParams.get('detail')
  const email = searchParams.get('email')

  const errorMessage =
    errorParam === 'not_admin'
      ? `관리자 계정이 아닙니다.${email ? ` (${email})` : ''} 관리자 권한이 있는 계정으로 로그인해 주세요.`
    : errorParam === 'kakao_no_email'
      ? (hint || '카카오 계정에서 이메일 제공 동의가 필요합니다')
    : errorParam === 'naver_auth_failed' || errorParam === 'kakao_auth_failed'
      ? `소셜 로그인에 실패했습니다.${step ? ` (단계: ${step})` : ''}`
    : errorParam === 'no_code'
      ? '인증 코드를 받지 못했습니다. 다시 시도해주세요.'
    : errorParam === 'callback_failed'
      ? `인증 처리 중 오류가 발생했습니다.`
    : null

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
      <div className="glow-blob" style={{ top: '-150px', left: '50%', transform: 'translateX(-50%)' }} />

      {/* Top bar */}
      <div style={{ padding: '18px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '28px', height: '28px', background: 'var(--accent)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="3.5" fill="white"/>
              <path d="M12 3v3M12 18v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M3 12h3M18 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </div>
          <span style={{ fontWeight: 800, fontSize: '15px', color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>PageBuilder</span>
        </div>
        <ThemeToggle />
      </div>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', position: 'relative', zIndex: 1 }}>
        <div style={{ width: '100%', maxWidth: '380px' }}>
          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: '36px' }}>
            <div style={{ width: '56px', height: '56px', background: 'var(--accent)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: '0 8px 32px rgba(37,99,235,0.3)' }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="4" fill="white"/>
                <path d="M12 2v4M12 18v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M2 12h4M18 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <h1 style={{ fontSize: '26px', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text-primary)', marginBottom: '8px' }}>로그인</h1>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>계정으로 시작하세요</p>
          </div>

          {/* Error message */}
          {errorMessage && (
            <div style={{ marginBottom: '16px', padding: '10px 14px', background: 'var(--danger-subtle, rgba(239,68,68,0.08))', border: '1px solid var(--danger-border, rgba(239,68,68,0.2))', borderRadius: '10px', color: 'var(--danger)' }}>
              <p style={{ fontSize: '13px', textAlign: 'center', margin: 0 }}>{errorMessage}</p>
              {detail && (
                <p style={{ fontSize: '11px', marginTop: '6px', fontFamily: 'monospace', wordBreak: 'break-all', opacity: 0.8, margin: '6px 0 0' }}>
                  {detail}
                </p>
              )}
            </div>
          )}

          {/* Dev login section */}
          {isDevMode && (
            <div style={{ marginBottom: '20px' }}>
              <div style={{ border: '1.5px solid var(--border)', borderRadius: '14px', overflow: 'hidden', background: 'var(--bg-secondary)' }}>
                <button
                  onClick={() => setShowDevForm(v => !v)}
                  style={{ width: '100%', padding: '12px 16px', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-text)', fontSize: '13px', fontWeight: 600 }}
                >
                  <span style={{ fontSize: '14px' }}>🔧</span>
                  <span style={{ flex: 1, textAlign: 'left' }}>테스트 로그인 (Dev)</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', transform: showDevForm ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▾</span>
                </button>
                {showDevForm && (
                  <form onSubmit={handleDevLogin} style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: '10px', borderTop: '1px solid var(--border)' }}>
                    <div style={{ paddingTop: '14px' }}>
                      <input className="input" type="email" placeholder="이메일" value={devEmail} onChange={e => setDevEmail(e.target.value)} required />
                    </div>
                    <input className="input" type="password" placeholder="비밀번호" value={devPassword} onChange={e => setDevPassword(e.target.value)} required autoFocus />
                    {devError && <p style={{ fontSize: '12px', color: 'var(--danger)', margin: 0 }}>{devError}</p>}
                    <button type="submit" disabled={devLoading} className="btn-primary" style={{ justifyContent: 'center' }}>
                      {devLoading ? '로그인 중...' : '로그인'}
                    </button>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', margin: 0 }}>Supabase Auth에 등록된 계정 사용</p>
                  </form>
                )}
              </div>
            </div>
          )}

          {/* Social login buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* Naver */}
            <button
              onClick={handleNaverLogin}
              style={{ width: '100%', padding: '14px', background: '#03C75A', color: '#fff', border: 'none', borderRadius: '100px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', transition: 'opacity 0.15s, box-shadow 0.15s', boxShadow: '0 4px 14px rgba(3,199,90,0.3)', letterSpacing: '-0.01em' }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.9')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
            >
              <span style={{ fontWeight: 900, fontSize: '17px', fontFamily: 'serif', lineHeight: 1 }}>N</span>
              네이버로 계속하기
            </button>

            {/* Kakao */}
            <button
              onClick={handleKakaoLogin}
              style={{ width: '100%', padding: '14px', background: '#FEE500', color: '#191600', border: 'none', borderRadius: '100px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', transition: 'opacity 0.15s, box-shadow 0.15s', boxShadow: '0 4px 14px rgba(254,229,0,0.35)', letterSpacing: '-0.01em' }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.9')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
            >
              {/* Kakao symbol */}
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" clipRule="evenodd" d="M9 1C4.582 1 1 3.895 1 7.455c0 2.258 1.5 4.24 3.777 5.39L3.9 16.16a.25.25 0 0 0 .37.274L8.34 13.86c.218.016.438.024.66.024 4.418 0 8-2.895 8-6.455C17 3.895 13.418 1 9 1z" fill="#191600"/>
              </svg>
              카카오로 계속하기
            </button>

            {/* Google */}
            <button
              onClick={handleGoogleLogin}
              style={{ width: '100%', padding: '14px', background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1.5px solid var(--border)', borderRadius: '100px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', transition: 'opacity 0.15s, background 0.15s', letterSpacing: '-0.01em' }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
            >
              {/* Google G logo */}
              <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
                <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
              </svg>
              Google로 계속하기
            </button>
          </div>

          <div style={{ margin: '28px 0', textAlign: 'center', position: 'relative' }}>
            <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, borderTop: '1px solid var(--border)' }} />
            <span style={{ position: 'relative', background: 'var(--bg-primary)', padding: '0 14px', fontSize: '12px', color: 'var(--text-muted)' }}>
              접근 권한이 있는 경우에만 로그인
            </span>
          </div>

          <p style={{ textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.7 }}>
            초대코드가 있는 경우 로그인 후 입력하세요
          </p>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
