'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { ThemeSelector } from '@/components/ui/ThemeSelector'

export default function NewPagePage() {
  const router = useRouter()
  const [form, setForm] = useState({ title: '', slug: '', description: '', access_type: 'public', password: '', theme: null as string | null })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleTitleChange = (title: string) => {
    const slug = title.toLowerCase().replace(/[^a-z0-9가-힣\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim()
    setForm(f => ({ ...f, title, slug }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true); setError('')
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const insertData: Record<string, unknown> = {
      title: form.title, slug: form.slug, description: form.description || null,
      access_type: form.access_type, is_published: false, created_by: user?.id,
      theme: form.theme,
    }

    if (form.access_type === 'password' && form.password) {
      const res = await fetch('/api/pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...insertData, password: form.password }),
      })
      if (!res.ok) { const err = await res.json(); setError(err.error || '생성 실패'); setSaving(false); return }
      const { page } = await res.json()
      router.push(`/admin/pages/${page.id}/edit`)
      return
    }

    const { data, error: err } = await supabase.from('pages').insert(insertData).select().single()
    if (err) { setError(err.message); setSaving(false) }
    else router.push(`/admin/pages/${data.id}/edit`)
  }

  return (
    <div style={{ maxWidth: '560px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Link href="/admin/pages" style={{ textDecoration: 'none' }}>
          <button className="btn-ghost" style={{ marginBottom: '12px', padding: '6px 8px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            ← 페이지 목록
          </button>
        </Link>
        <h1 style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>새 페이지 만들기</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

          <div>
            <label className="label">페이지 제목 *</label>
            <input className="input" required value={form.title} onChange={e => handleTitleChange(e.target.value)} placeholder="예: 2024 팀 워크샵" />
          </div>

          <div>
            <label className="label">URL 슬러그 *</label>
            <div style={{ display: 'flex', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden', background: 'var(--bg-secondary)' }}>
              <div style={{ padding: '8px 12px', background: 'var(--bg-card)', borderRight: '1px solid var(--border)', fontSize: '13px', color: 'var(--text-muted)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                yourdomain.com /
              </div>
              <input
                style={{ flex: 1, padding: '8px 12px', background: 'transparent', border: 'none', outline: 'none', fontSize: '13px', color: 'var(--text-primary)', fontFamily: 'monospace' }}
                required
                value={form.slug}
                onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
                placeholder="page-slug"
              />
            </div>
          </div>

          <div>
            <label className="label">설명 (선택)</label>
            <textarea className="input" rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="페이지에 대한 간단한 설명" style={{ resize: 'none' }} />
          </div>

          <div>
            <label className="label">접근 권한</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { value: 'public', icon: '🌐', label: '공개', desc: '누구나 접근 가능' },
                { value: 'password', icon: '🔒', label: '비밀번호', desc: '비밀번호 입력 후 접근' },
                { value: 'oauth', icon: '🔑', label: 'OAuth + 초대코드', desc: '소셜 로그인 후 초대코드 필요' },
              ].map(opt => (
                <label key={opt.value} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '12px 14px', border: `1px solid ${form.access_type === opt.value ? 'var(--accent)' : 'var(--border)'}`, borderRadius: '10px', cursor: 'pointer', background: form.access_type === opt.value ? 'var(--accent-subtle)' : 'var(--bg-secondary)', transition: 'all 0.12s' }}>
                  <input type="radio" name="access_type" value={opt.value} checked={form.access_type === opt.value} onChange={() => setForm(f => ({ ...f, access_type: opt.value }))} style={{ marginTop: '2px' }} />
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{opt.icon} {opt.label}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>{opt.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {form.access_type === 'password' && (
            <div>
              <label className="label">비밀번호 *</label>
              <input type="password" className="input" required value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="접근 비밀번호 입력" />
            </div>
          )}

          <ThemeSelector value={form.theme} onChange={theme => setForm(f => ({ ...f, theme }))} />

          {error && <p style={{ fontSize: '13px', color: 'var(--danger)' }}>{error}</p>}

          <div style={{ display: 'flex', gap: '10px', paddingTop: '4px' }}>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? '생성 중...' : '페이지 만들기 →'}
            </button>
            <button type="button" onClick={() => router.back()} className="btn-secondary">취소</button>
          </div>
        </div>
      </form>
    </div>
  )
}
