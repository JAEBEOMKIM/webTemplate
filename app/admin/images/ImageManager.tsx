'use client'

import { useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import ConfirmDialog from '@/components/ui/ConfirmDialog'

export interface ImageRow {
  id: string
  url: string
  caption: string | null
  component_id: string
  page_id: string
  page_title: string
  page_slug: string
}

function extractStoragePath(url: string): string | null {
  const marker = '/storage/v1/object/public/gallery-images/'
  const idx = url.indexOf(marker)
  if (idx === -1) return null
  return decodeURIComponent(url.slice(idx + marker.length))
}

export default function ImageManager({ initialImages }: { initialImages: ImageRow[] }) {
  const [images, setImages]         = useState<ImageRow[]>(initialImages)
  const [filterPage, setFilterPage] = useState<string>('all')
  const [selected, setSelected]     = useState<Set<string>>(new Set())
  const [search, setSearch]         = useState('')
  // 단건 삭제 다이얼로그
  const [confirmSingle, setConfirmSingle] = useState<ImageRow | null>(null)
  const [deletingSingle, setDeletingSingle] = useState(false)
  // 일괄 삭제 다이얼로그
  const [confirmBulk, setConfirmBulk] = useState(false)
  const [deletingBulk, setDeletingBulk] = useState(false)

  // Unique page list for filter
  const pages = useMemo(() => {
    const map = new Map<string, string>()
    images.forEach(img => map.set(img.page_id, img.page_title))
    return Array.from(map.entries()).map(([id, title]) => ({ id, title }))
  }, [images])

  const filtered = images.filter(img => {
    if (filterPage !== 'all' && img.page_id !== filterPage) return false
    if (search && !img.url.toLowerCase().includes(search.toLowerCase()) && !(img.caption || '').toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(filtered.map(i => i.id)))
    }
  }

  const doDelete = async (ids: string[]) => {
    const supabase = createClient()
    const targets = images.filter(i => ids.includes(i.id))

    const byComponent = new Map<string, string[]>()
    for (const img of targets) {
      const urls = byComponent.get(img.component_id) ?? []
      urls.push(img.url)
      byComponent.set(img.component_id, urls)
    }

    for (const [componentId, urlsToDelete] of byComponent) {
      const { data } = await supabase
        .from('page_components')
        .select('config')
        .eq('id', componentId)
        .single()
      if (!data) continue
      const cfg = data.config as Record<string, unknown>
      const current = (cfg.images as { url: string; caption?: string }[]) ?? []
      const updated = current.filter(img => !urlsToDelete.includes(img.url))
      await supabase
        .from('page_components')
        .update({ config: { ...cfg, images: updated } })
        .eq('id', componentId)
    }

    for (const img of targets) {
      const path = extractStoragePath(img.url)
      if (path) await supabase.storage.from('gallery-images').remove([path])
    }

    setImages(prev => prev.filter(i => !ids.includes(i.id)))
    setSelected(new Set())
  }

  const handleConfirmSingle = async () => {
    if (!confirmSingle) return
    setDeletingSingle(true)
    await doDelete([confirmSingle.id])
    setDeletingSingle(false)
    setConfirmSingle(null)
  }

  const handleConfirmBulk = async () => {
    setDeletingBulk(true)
    await doDelete(Array.from(selected))
    setDeletingBulk(false)
    setConfirmBulk(false)
  }

  const cardStyle: React.CSSProperties = {
    border: '1px solid var(--border)',
    borderRadius: '12px',
    overflow: 'hidden',
    background: 'var(--bg-primary)',
    display: 'flex',
    flexDirection: 'column',
    transition: 'box-shadow 0.15s',
    position: 'relative',
  }

  return (
    <>
    <ConfirmDialog
      open={!!confirmSingle}
      title="이미지 삭제"
      message={`이 이미지를 정말 삭제하시겠습니까?\n\n삭제하면 복구할 수 없습니다.`}
      confirmLabel="삭제"
      danger
      loading={deletingSingle}
      onConfirm={handleConfirmSingle}
      onCancel={() => { if (!deletingSingle) setConfirmSingle(null) }}
    />
    <ConfirmDialog
      open={confirmBulk}
      title="이미지 일괄 삭제"
      message={`선택한 이미지 ${selected.size}장을 정말 삭제하시겠습니까?\n\n삭제하면 복구할 수 없습니다.`}
      confirmLabel="삭제"
      danger
      loading={deletingBulk}
      onConfirm={handleConfirmBulk}
      onCancel={() => { if (!deletingBulk) setConfirmBulk(false) }}
    />
    <div>
      {/* Header + stats */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text-primary)', marginBottom: '4px' }}>
          이미지 관리
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
          갤러리에 업로드된 이미지를 확인하고 삭제할 수 있습니다.
        </p>
      </div>

      {/* Stats row */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {[
          { label: '전체 이미지', value: images.length },
          { label: '사용 중인 페이지', value: pages.length },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: '16px 22px', minWidth: '130px' }}>
            <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--accent)', letterSpacing: '-0.04em' }}>{s.value}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Search */}
        <input
          className="input"
          placeholder="파일명 또는 캡션 검색..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ fontSize: '13px', flex: '1', minWidth: '160px', maxWidth: '280px' }}
        />

        {/* Page filter */}
        <select
          className="input"
          value={filterPage}
          onChange={e => setFilterPage(e.target.value)}
          style={{ fontSize: '13px', minWidth: '160px' }}
        >
          <option value="all">전체 페이지</option>
          {pages.map(p => (
            <option key={p.id} value={p.id}>{p.title}</option>
          ))}
        </select>

        {/* Bulk delete */}
        {selected.size > 0 && (
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{selected.size}개 선택</span>
            <button onClick={() => setConfirmBulk(true)} className="btn-danger" style={{ fontSize: '12px', padding: '5px 12px' }}>
              선택 삭제
            </button>
          </div>
        )}
      </div>

      {/* Image count + select all */}
      {filtered.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
          <input
            type="checkbox"
            checked={selected.size === filtered.length && filtered.length > 0}
            onChange={toggleAll}
            style={{ width: '14px', height: '14px', accentColor: 'var(--accent)', cursor: 'pointer' }}
          />
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            {filtered.length}개 이미지 {filterPage !== 'all' || search ? '(필터 적용 중)' : ''}
          </span>
        </div>
      )}

      {/* Grid */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>🖼️</div>
          <p style={{ fontSize: '14px' }}>
            {images.length === 0 ? '업로드된 이미지가 없습니다.' : '검색 결과가 없습니다.'}
          </p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: '16px',
        }}>
          {filtered.map(img => {
            const isSelected = selected.has(img.id)

            return (
              <div key={img.id} style={{
                ...cardStyle,
                outline: isSelected ? '2px solid var(--accent)' : 'none',
              }}>
                {/* Checkbox overlay */}
                <div
                  style={{ position: 'absolute', top: '8px', left: '8px', zIndex: 2, cursor: 'pointer' }}
                  onClick={() => toggleSelect(img.id)}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelect(img.id)}
                    onClick={e => e.stopPropagation()}
                    style={{ width: '16px', height: '16px', accentColor: 'var(--accent)', cursor: 'pointer' }}
                  />
                </div>

                {/* Thumbnail */}
                <div
                  style={{ width: '100%', paddingTop: '75%', position: 'relative', background: 'var(--bg-secondary)', cursor: 'pointer', flexShrink: 0 }}
                  onClick={() => window.open(img.url, '_blank')}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.url}
                    alt={img.caption || ''}
                    style={{
                      position: 'absolute', inset: 0,
                      width: '100%', height: '100%',
                      objectFit: 'cover',
                    }}
                    loading="lazy"
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                  />
                </div>

                {/* Info */}
                <div style={{ padding: '10px 12px', flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {img.caption && (
                    <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {img.caption}
                    </p>
                  )}

                  {/* Page badge */}
                  <Link
                    href={`/admin/pages/${img.page_id}/edit`}
                    style={{ textDecoration: 'none' }}
                    title={`페이지로 이동: ${img.page_title}`}
                  >
                    <div style={{
                      display: 'inline-flex', alignItems: 'center', gap: '4px',
                      background: 'var(--accent-subtle)', borderRadius: '6px',
                      padding: '2px 8px', maxWidth: '100%',
                    }}>
                      <span style={{ fontSize: '10px' }}>📄</span>
                      <span style={{
                        fontSize: '11px', fontWeight: 600, color: 'var(--accent-text)',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {img.page_title}
                      </span>
                    </div>
                  </Link>

                  {/* Delete button */}
                  <div style={{ marginTop: '6px' }}>
                    <button
                      onClick={() => setConfirmSingle(img)}
                      className="btn-danger"
                      style={{ width: '100%', fontSize: '11px', padding: '4px 8px', opacity: 0.7 }}
                    >
                      삭제
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
    </>
  )
}
