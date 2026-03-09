'use client'

import { useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'

function CallbackHandler() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const handled = useRef(false)

  useEffect(() => {
    if (handled.current) return
    handled.current = true

    const handleCallback = async () => {
      const supabase = createClient()

      // ── 1. 에러 파라미터 처리 ─────────────────────────────────────────
      const errorParam = searchParams.get('error')
      if (errorParam) {
        const detail = searchParams.get('detail') || errorParam
        router.replace(`/auth/login?error=callback_failed&detail=${encodeURIComponent(detail)}`)
        return
      }

      // ── 2. 인증 파라미터 파싱 ─────────────────────────────────────────
      // Implicit flow: Supabase가 hash fragment에 토큰을 넣음 (#access_token=...&type=magiclink)
      // PKCE flow:     Supabase가 query param에 code를 넣음 (?code=...)
      const hash = typeof window !== 'undefined' ? window.location.hash.substring(1) : ''
      const hashParams = new URLSearchParams(hash)

      const accessToken = hashParams.get('access_token')
      const refreshToken = hashParams.get('refresh_token')
      const code = searchParams.get('code')

      // ── 3. 세션 생성 ──────────────────────────────────────────────────
      let sessionError: { message: string } | null = null

      if (accessToken && refreshToken) {
        // Naver/Kakao 매직링크 — implicit flow (hash)
        const { error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
        sessionError = error
      } else if (code) {
        // Google OAuth — PKCE flow (query param)
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        sessionError = error
      } else {
        // 이미 세션이 있을 수도 있음 (중복 호출 등)
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          router.replace('/auth/login')
          return
        }
      }

      if (sessionError) {
        router.replace(`/auth/login?error=callback_failed&detail=${encodeURIComponent(sessionError.message)}`)
        return
      }

      // ── 4. 이동 목적지 결정 ───────────────────────────────────────────
      // 우선순위: ?next= > ?redirect= > oauth_redirect 쿠키 > 기본(/admin)
      const cookieRedirect = document.cookie
        .split('; ')
        .find(r => r.startsWith('oauth_redirect='))
        ?.split('=')[1]
      const cookiePath = cookieRedirect ? decodeURIComponent(cookieRedirect) : null

      // 쿠키 소비 후 삭제
      if (cookiePath) {
        document.cookie = 'oauth_redirect=; max-age=0; path=/'
      }

      const next = searchParams.get('next') || searchParams.get('redirect') || cookiePath || '/admin'
      const redirectTo = next.startsWith('/') ? next : '/admin'

      // ── 5. 관리자 경로 접근 시 이메일 검증 ───────────────────────────
      const isAdminPath = redirectTo === '/' || redirectTo === '/admin' || redirectTo.startsWith('/admin/')
      if (isAdminPath) {
        const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || ''
        if (adminEmail) {
          const { data: { user } } = await supabase.auth.getUser()
          if (user?.email !== adminEmail) {
            await supabase.auth.signOut()
            router.replace(`/auth/login?error=not_admin&email=${encodeURIComponent(user?.email ?? '')}`)
            return
          }
        }
      }

      // router.replace() 는 소프트 내비게이션 → 서버가 setSession() 쿠키를 못 읽을 수 있음
      // window.location.href 로 풀 리로드 → 브라우저가 최신 쿠키를 서버에 전달 보장
      window.location.href = redirectTo
    }

    handleCallback()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid var(--border)', borderTop: '3px solid var(--accent)', borderRadius: '50%', margin: '0 auto 16px', animation: 'spin 0.8s linear infinite' }} />
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>로그인 처리 중...</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

export default function CallbackPage() {
  return (
    <Suspense>
      <CallbackHandler />
    </Suspense>
  )
}
