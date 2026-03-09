'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function AdminSignOut() {
  const [loading, setLoading] = useState(false)

  const handleSignOut = async () => {
    setLoading(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/auth/login'
  }

  return (
    <button
      onClick={handleSignOut}
      disabled={loading}
      style={{
        width: '100%',
        padding: '8px 12px',
        background: 'transparent',
        border: '1px solid var(--border)',
        borderRadius: '8px',
        cursor: loading ? 'not-allowed' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        color: 'var(--text-muted)',
        fontSize: '12px',
        fontWeight: 500,
        transition: 'color 0.15s, border-color 0.15s',
        opacity: loading ? 0.6 : 1,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.color = 'var(--danger, #EF4444)'
        e.currentTarget.style.borderColor = 'var(--danger, #EF4444)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.color = 'var(--text-muted)'
        e.currentTarget.style.borderColor = 'var(--border)'
      }}
    >
      <svg width="13" height="13" viewBox="0 0 15 15" fill="none">
        <path d="M3 1a1 1 0 0 0-1 1v11a1 1 0 0 0 1 1h6.5a.5.5 0 0 0 0-1H3V2h6.5a.5.5 0 0 0 0-1H3zm9.354 4.646a.5.5 0 0 0-.708.708L12.793 7.5H6.5a.5.5 0 0 0 0 1h6.293l-1.147 1.146a.5.5 0 0 0 .708.708l2-2a.5.5 0 0 0 0-.708l-2-2z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"/>
      </svg>
      {loading ? '로그아웃 중...' : '로그아웃'}
    </button>
  )
}
