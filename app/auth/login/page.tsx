'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense, useState } from 'react'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { createClient } from '@/lib/supabase/client'

function LoginForm() {
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') || '/admin'

  const [devEmail, setDevEmail] = useState(process.env.NEXT_PUBLIC_ADMIN_EMAIL || '')
  const [devPassword, setDevPassword] = useState('')
  const [devLoading, setDevLoading] = useState(false)
  const [devError, setDevError] = useState('')
  const [showDevForm, setShowDevForm] = useState(false)

  const isDevMode = process.env.NEXT_PUBLIC_ALLOW_DEV_LOGIN === 'true'

  const handleNaverLogin = () => {
    window.location.href = `/api/auth/naver?redirect=${encodeURIComponent(redirect)}`
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

          {/* Dev login section */}
          {isDevMode && (
            <div style={{ marginBottom: '20px' }}>
              <div style={{
                border: '1.5px solid var(--border)',
                borderRadius: '14px',
                overflow: 'hidden',
                background: 'var(--bg-secondary)',
              }}>
                <button
                  onClick={() => setShowDevForm(v => !v)}
                  style={{
                    width: '100%', padding: '12px 16px',
                    background: 'transparent', border: 'none',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
                    color: 'var(--accent-text)', fontSize: '13px', fontWeight: 600,
                  }}
                >
                  <span style={{ fontSize: '14px' }}>🔧</span>
                  <span style={{ flex: 1, textAlign: 'left' }}>테스트 로그인 (Dev)</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', transform: showDevForm ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▾</span>
                </button>

                {showDevForm && (
                  <form onSubmit={handleDevLogin} style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: '10px', borderTop: '1px solid var(--border)' }}>
                    <div style={{ paddingTop: '14px' }}>
                      <input
                        className="input"
                        type="email"
                        placeholder="이메일"
                        value={devEmail}
                        onChange={e => setDevEmail(e.target.value)}
                        required
                      />
                    </div>
                    <input
                      className="input"
                      type="password"
                      placeholder="비밀번호"
                      value={devPassword}
                      onChange={e => setDevPassword(e.target.value)}
                      required
                      autoFocus
                    />
                    {devError && <p style={{ fontSize: '12px', color: 'var(--danger)', margin: 0 }}>{devError}</p>}
                    <button
                      type="submit"
                      disabled={devLoading}
                      className="btn-primary"
                      style={{ justifyContent: 'center' }}
                    >
                      {devLoading ? '로그인 중...' : '로그인'}
                    </button>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', margin: 0 }}>
                      Supabase Auth에 등록된 계정 사용
                    </p>
                  </form>
                )}
              </div>
            </div>
          )}

          {/* Social login */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button
              onClick={handleNaverLogin}
              style={{
                width: '100%', padding: '14px',
                background: '#03C75A', color: '#fff',
                border: 'none', borderRadius: '100px',
                fontSize: '14px', fontWeight: 700,
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                transition: 'opacity 0.15s, box-shadow 0.15s',
                boxShadow: '0 4px 14px rgba(3,199,90,0.3)',
                letterSpacing: '-0.01em',
              }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.9')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
            >
              <span style={{ fontWeight: 900, fontSize: '17px', fontFamily: 'serif', lineHeight: 1 }}>N</span>
              네이버로 계속하기
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
