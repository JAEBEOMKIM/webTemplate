'use client'

import { useEffect } from 'react'

export default function RootPage() {
  useEffect(() => {
    const hash = window.location.hash
    if (hash.includes('access_token=')) {
      // Supabase 인증 콜백이 site root로 떨어진 경우 (redirectTo 허용 URL 미등록 시 fallback)
      // → /auth/callback 으로 넘겨서 세션 처리
      window.location.replace('/auth/callback' + window.location.search + hash)
    } else {
      window.location.replace('/admin')
    }
  }, [])

  return null
}
