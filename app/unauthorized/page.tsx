'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

function UnauthorizedContent() {
  const searchParams = useSearchParams()
  const email = searchParams.get('email') || ''
  const [loading, setLoading] = useState(false)

  const handleSignOut = async () => {
    setLoading(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/auth/login'
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-primary)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
    }}>
      <div style={{ width: '100%', maxWidth: '400px', textAlign: 'center' }}>
        {/* 아이콘 */}
        <div style={{
          width: '72px', height: '72px',
          background: 'var(--danger-subtle, rgba(239,68,68,0.08))',
          borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 24px',
        }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="var(--danger, #EF4444)" strokeWidth="1.5"/>
            <path d="M15 9l-6 6M9 9l6 6" stroke="var(--danger, #EF4444)" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>

        <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px', letterSpacing: '-0.03em' }}>
          접근 권한이 없습니다
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '24px' }}>
          이 페이지는 관리자만 접근할 수 있습니다.
          {email && (
            <><br /><span style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{email}</span></>
          )}
        </p>

        <button
          onClick={handleSignOut}
          disabled={loading}
          style={{
            width: '100%',
            padding: '12px',
            background: 'var(--danger, #EF4444)',
            color: '#fff',
            border: 'none',
            borderRadius: '100px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1,
            transition: 'opacity 0.15s',
          }}
        >
          {loading ? '로그아웃 중...' : '로그아웃 후 다른 계정으로 로그인'}
        </button>
      </div>
    </div>
  )
}

export default function UnauthorizedPage() {
  return (
    <Suspense>
      <UnauthorizedContent />
    </Suspense>
  )
}
