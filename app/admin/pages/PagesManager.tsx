'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import ConfirmDialog from '@/components/ui/ConfirmDialog'

export interface PageRow {
  id: string
  slug: string
  title: string
  access_type: string
  is_published: boolean
  created_at: string
}

const accessConfig: Record<string, { label: string; color: string; icon: string }> = {
  public:   { label: '공개',     color: 'var(--success)',      icon: '🌐' },
  password: { label: '비밀번호', color: 'var(--warning)',      icon: '🔒' },
  oauth:    { label: 'OAuth',    color: 'var(--accent-text)',  icon: '🔑' },
}

const ACCESS_OPTIONS = [
  { value: 'public',   label: '🌐 공개',     desc: '누구나 접근' },
  { value: 'password', label: '🔒 비밀번호', desc: '비밀번호 필요' },
  { value: 'oauth',    label: '🔑 OAuth',    desc: '소셜 로그인 + 초대코드' },
]

function extractStoragePath(url: string): string | null {
  const marker = '/storage/v1/object/public/gallery-images/'
  const idx = url.indexOf(marker)
  if (idx === -1) return null
  return decodeURIComponent(url.slice(idx + marker.length))
}

export default function PagesManager({ initialPages }: { initialPages: PageRow[] }) {
  const [pages, setPages]         = useState<PageRow[]>(initialPages)
  const [toggling, setToggling]   = useState<Set<string>>(new Set())
  const [confirmPage, setConfirmPage] = useState<PageRow | null>(null)
  const [deleting, setDeleting]   = useState(false)

  // ── 권한 변경 상태 ──────────────────────────────────────────────────────────
  const [accessPopover, setAccessPopover] = useState<string | null>(null)  // page.id
  const [accessPopoverPos, setAccessPopoverPos] = useState<{ top: number; left: number } | null>(null)
  const [changingAccess, setChangingAccess] = useState<Set<string>>(new Set())
  const [pwModal, setPwModal] = useState<{ page: PageRow; newType: string } | null>(null)
  const [pwInput, setPwInput] = useState('')
  const [pwError, setPwError] = useState('')
  const [pwSaving, setPwSaving] = useState(false)
  const pwInputRef = useRef<HTMLInputElement>(null)

  // ── 스크롤 시 팝오버 닫기 (fixed 팝오버는 스크롤에 따라 이동하지 않으므로)
  useEffect(() => {
    if (!accessPopover) return
    const close = () => { setAccessPopover(null); setAccessPopoverPos(null) }
    window.addEventListener('scroll', close, true)
    return () => window.removeEventListener('scroll', close, true)
  }, [accessPopover])

  // ── 발행/정지 토글 ─────────────────────────────────────────────────────────
  const handleTogglePublish = async (page: PageRow) => {
    if (toggling.has(page.id)) return
    setToggling(prev => new Set(prev).add(page.id))
    const next = !page.is_published
    setPages(prev => prev.map(p => p.id === page.id ? { ...p, is_published: next } : p))
    const supabase = createClient()
    const { error } = await supabase
      .from('pages')
      .update({ is_published: next })
      .eq('id', page.id)
    if (error) {
      setPages(prev => prev.map(p => p.id === page.id ? { ...p, is_published: !next } : p))
    }
    setToggling(prev => { const s = new Set(prev); s.delete(page.id); return s })
  }

  // ── 페이지 삭제 확정 ────────────────────────────────────────────────────────
  const handleConfirmDelete = async () => {
    if (!confirmPage) return
    setDeleting(true)
    const supabase = createClient()
    const page = confirmPage

    // 1) image-gallery 컴포넌트 config에서 스토리지 파일 경로 수집
    const { data: comps } = await supabase
      .from('page_components')
      .select('config')
      .eq('page_id', page.id)
      .eq('component_type', 'image-gallery')

    const storagePaths: string[] = []
    for (const comp of comps ?? []) {
      const imgs = ((comp.config as Record<string, unknown>)?.images as { url: string }[]) ?? []
      for (const img of imgs) {
        const p = extractStoragePath(img.url)
        if (p) storagePaths.push(p)
      }
    }

    // 2) 스토리지 파일 삭제
    if (storagePaths.length > 0) {
      await supabase.storage.from('gallery-images').remove(storagePaths)
    }

    // 3) 페이지 삭제 (DB CASCADE → 모든 관련 데이터 자동 삭제)
    await supabase.from('pages').delete().eq('id', page.id)

    setPages(prev => prev.filter(p => p.id !== page.id))
    setDeleting(false)
    setConfirmPage(null)
  }

  // ── 권한 변경 ──────────────────────────────────────────────────────────────
  // Vercel: rerender-functional-setstate — use function form for derived state
  const handleAccessTypeSelect = useCallback((page: PageRow, newType: string) => {
    setAccessPopover(null); setAccessPopoverPos(null)
    if (newType === page.access_type) return
    if (newType === 'password') {
      setPwInput(''); setPwError('')
      setPwModal({ page, newType })
      // Focus the input after modal mounts
      setTimeout(() => pwInputRef.current?.focus(), 50)
      return
    }
    applyAccessChange(page.id, newType, undefined)
  }, []) // eslint-disable-line

  const applyAccessChange = async (pageId: string, newType: string, password: string | undefined) => {
    setChangingAccess(prev => new Set(prev).add(pageId))
    const res = await fetch('/api/pages/access', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pageId, access_type: newType, password }),
    })
    if (res.ok) {
      setPages(prev => prev.map(p => p.id === pageId ? { ...p, access_type: newType } : p))
    }
    setChangingAccess(prev => { const s = new Set(prev); s.delete(pageId); return s })
  }

  const handlePwConfirm = async () => {
    if (!pwModal) return
    if (!pwInput.trim()) { setPwError('비밀번호를 입력하세요'); return }
    setPwSaving(true); setPwError('')
    const res = await fetch('/api/pages/access', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pageId: pwModal.page.id, access_type: pwModal.newType, password: pwInput }),
    })
    if (res.ok) {
      setPages(prev => prev.map(p => p.id === pwModal.page.id ? { ...p, access_type: pwModal.newType } : p))
      setPwModal(null)
    } else {
      const data = await res.json()
      setPwError(data.error || '변경 실패')
    }
    setPwSaving(false)
  }

  const confirmTarget = confirmPage

  if (pages.length === 0) {
    return (
      <div className="card" style={{ padding: '60px 20px', textAlign: 'center' }}>
        <div style={{ width: '52px', height: '52px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '22px' }}>📄</div>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>페이지가 없습니다</p>
        <Link href="/admin/pages/new">
          <button className="btn-primary">첫 번째 페이지 만들기</button>
        </Link>
      </div>
    )
  }

  return (
    <>
    {/* ── 비밀번호 입력 모달 ─────────────────────────────────────────────────── */}
    {pwModal && (
      <div
        style={{ position: 'fixed', inset: 0, zIndex: 9000, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
        onClick={e => { if (e.target === e.currentTarget && !pwSaving) { setPwModal(null) } }}
      >
        <div style={{ background: 'var(--bg-primary)', borderRadius: '14px', padding: '24px', width: '100%', maxWidth: '360px', border: '1px solid var(--border)', boxShadow: '0 12px 40px rgba(0,0,0,0.25)', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <p style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text-primary)', margin: 0 }}>비밀번호 설정</p>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
            <strong style={{ color: 'var(--text-primary)' }}>{pwModal.page.title}</strong> 페이지에 접근할 비밀번호를 입력하세요.
          </p>
          <input
            ref={pwInputRef}
            type="password"
            className="input"
            placeholder="새 비밀번호"
            value={pwInput}
            onChange={e => { setPwInput(e.target.value); setPwError('') }}
            onKeyDown={e => { if (e.key === 'Enter') handlePwConfirm() }}
            disabled={pwSaving}
            style={{ fontSize: '14px' }}
          />
          {pwError && <p style={{ fontSize: '12px', color: 'var(--danger)', margin: 0 }}>{pwError}</p>}
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button type="button" className="btn-secondary" onClick={() => { if (!pwSaving) setPwModal(null) }} disabled={pwSaving} style={{ fontSize: '13px' }}>취소</button>
            <button type="button" className="btn-primary" onClick={handlePwConfirm} disabled={pwSaving} style={{ fontSize: '13px', minWidth: '64px' }}>
              {pwSaving ? '저장 중...' : '확인'}
            </button>
          </div>
        </div>
      </div>
    )}

    <ConfirmDialog
      open={!!confirmTarget}
      title="페이지 삭제"
      message={`"${confirmTarget?.title}" 페이지를 정말 삭제하시겠습니까?\n\n관련 컴포넌트, 게시글, 이미지, 설문 데이터가 모두 함께 삭제되며 복구할 수 없습니다.`}
      confirmLabel="삭제"
      danger
      loading={deleting}
      onConfirm={handleConfirmDelete}
      onCancel={() => { if (!deleting) setConfirmPage(null) }}
    />

    {/* ── 권한 변경 팝오버 (fixed — overflow 컨테이너에 클리핑되지 않음) ──────── */}
    {accessPopover && accessPopoverPos && (
      <>
        <div style={{ position: 'fixed', inset: 0, zIndex: 199 }} onClick={() => { setAccessPopover(null); setAccessPopoverPos(null) }} />
        <div style={{ position: 'fixed', top: accessPopoverPos.top, left: accessPopoverPos.left, zIndex: 200, background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: '10px', boxShadow: '0 8px 24px rgba(0,0,0,0.15)', minWidth: '180px', overflow: 'hidden' }}>
          {(() => {
            const page = pages.find(p => p.id === accessPopover)
            if (!page) return null
            return ACCESS_OPTIONS.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleAccessTypeSelect(page, opt.value)}
                style={{
                  display: 'flex', flexDirection: 'column', gap: '1px', width: '100%',
                  padding: '8px 12px', textAlign: 'left', border: 'none', cursor: 'pointer',
                  background: page.access_type === opt.value ? 'var(--bg-secondary)' : 'transparent',
                  borderLeft: page.access_type === opt.value ? '2px solid var(--accent)' : '2px solid transparent',
                }}
              >
                <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-primary)' }}>{opt.label}</span>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{opt.desc}</span>
              </button>
            ))
          })()}
        </div>
      </>
    )}

    <div className="card" style={{ overflow: 'hidden' }}>
      <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>

        {/* Header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 130px 100px 120px 1fr',
          borderBottom: '1px solid var(--border)',
          padding: '10px 20px',
          minWidth: '680px',
        }}>
          {['제목', 'URL', '권한', '상태', '관리'].map(h => (
            <div key={h} style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</div>
          ))}
        </div>

        {/* Rows */}
        {pages.map(page => {
          const ac = accessConfig[page.access_type] || { label: page.access_type, color: 'var(--text-muted)' }
          const isToggling = toggling.has(page.id)

          return (
            <div
              key={page.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 130px 100px 120px 1fr',
                padding: '12px 20px',
                borderBottom: '1px solid var(--border-subtle)',
                minWidth: '680px',
                alignItems: 'center',
              }}
            >
              {/* 제목 */}
              <div style={{ fontWeight: 500, fontSize: '14px', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: '12px' }}>
                {page.title}
              </div>

              {/* URL */}
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                /{page.slug}
              </div>

              {/* 권한 — 클릭 시 변경 팝오버 */}
              <div>
                <button
                  type="button"
                  onClick={e => {
                    if (accessPopover === page.id) {
                      setAccessPopover(null); setAccessPopoverPos(null); return
                    }
                    const rect = e.currentTarget.getBoundingClientRect()
                    setAccessPopoverPos({ top: rect.bottom + 4, left: rect.left })
                    setAccessPopover(page.id)
                  }}
                  disabled={changingAccess.has(page.id)}
                  style={{ fontSize: '11px', fontWeight: 500, color: ac.color, background: `${ac.color}18`, padding: '2px 8px', borderRadius: '20px', border: `1px solid ${ac.color}40`, cursor: 'pointer', opacity: changingAccess.has(page.id) ? 0.6 : 1 }}
                  title="클릭하여 권한 변경"
                >
                  {changingAccess.has(page.id) ? '...' : `${ac.icon} ${ac.label}`}
                </button>
              </div>

              {/* 상태 + 발행/정지 토글 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {page.is_published
                  ? <span className="badge-success">발행됨</span>
                  : <span className="badge-draft">초안</span>
                }
                <button
                  onClick={() => handleTogglePublish(page)}
                  disabled={isToggling}
                  className={page.is_published ? 'btn-secondary' : 'btn-primary'}
                  style={{ padding: '3px 8px', fontSize: '11px', opacity: isToggling ? 0.6 : 1 }}
                >
                  {isToggling ? '...' : page.is_published ? '정지' : '발행'}
                </button>
              </div>

              {/* 관리 */}
              <div style={{ display: 'flex', gap: '4px', alignItems: 'center', flexWrap: 'wrap' }}>
                <Link href={`/admin/pages/${page.id}/edit`}>
                  <button className="btn-ghost" style={{ padding: '5px 10px', fontSize: '12px' }}>편집</button>
                </Link>
                <Link href={`/admin/pages/${page.id}/invites`}>
                  <button className="btn-ghost" style={{ padding: '5px 10px', fontSize: '12px', color: 'var(--accent-text)' }}>초대코드</button>
                </Link>
                <Link href={`/${page.slug}`} target="_blank">
                  <button className="btn-ghost" style={{ padding: '5px 8px' }}>
                    <svg width="12" height="12" viewBox="0 0 15 15" fill="none">
                      <path d="M3 2C2.44772 2 2 2.44772 2 3V12C2 12.5523 2.44772 13 3 13H12C12.5523 13 13 12.5523 13 12V8.5C13 8.22386 12.7761 8 12.5 8C12.2239 8 12 8.22386 12 8.5V12H3V3L6.5 3C6.77614 3 7 2.77614 7 2.5C7 2.22386 6.77614 2 6.5 2H3ZM12.8536 2.14645C12.9015 2.19439 12.9377 2.24964 12.9621 2.30861C12.9861 2.36669 12.9996 2.4303 13 2.497L13 2.5V2.50049V5.5C13 5.77614 12.7761 6 12.5 6C12.2239 6 12 5.77614 12 5.5V3.70711L6.85355 8.85355C6.65829 9.04882 6.34171 9.04882 6.14645 8.85355C5.95118 8.65829 5.95118 8.34171 6.14645 8.14645L11.2929 3H9.5C9.22386 3 9 2.77614 9 2.5C9 2.22386 9.22386 2 9.5 2H12.4999H12.5C12.5678 2 12.6324 2.01349 12.6914 2.03794C12.7504 2.06234 12.8058 2.09851 12.8536 2.14645Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"/>
                    </svg>
                  </button>
                </Link>

                <button
                  onClick={() => setConfirmPage(page)}
                  className="btn-danger"
                  style={{ padding: '5px 8px', fontSize: '12px', opacity: 0.7 }}
                >삭제</button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
    </>
  )
}
