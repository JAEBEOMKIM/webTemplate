import { createClient } from '@/lib/supabase/server'
import ImageManager, { type ImageRow } from './ImageManager'

export default async function AdminImagesPage() {
  const supabase = await createClient()

  // image-gallery 컴포넌트의 config.images 에서 직접 읽기
  const { data: rows, error } = await supabase
    .from('page_components')
    .select(`
      id,
      config,
      pages (
        id,
        title,
        slug
      )
    `)
    .eq('component_type', 'image-gallery')

  if (error) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--danger)' }}>
        <p style={{ fontSize: '14px' }}>이미지 목록을 불러오는 데 실패했습니다: {error.message}</p>
      </div>
    )
  }

  // config.images 배열을 평탄화하여 ImageRow[] 생성
  const images: ImageRow[] = []
  for (const row of rows ?? []) {
    const page = Array.isArray(row.pages) ? row.pages[0] : row.pages
    if (!page) continue
    const configImages = ((row.config as Record<string, unknown>)?.images as { url: string; caption?: string }[]) ?? []
    for (const img of configImages) {
      if (!img.url) continue
      images.push({
        id:           `${row.id}__${img.url}`,
        url:          img.url,
        caption:      img.caption ?? null,
        component_id: row.id,
        page_id:      page.id,
        page_title:   page.title,
        page_slug:    page.slug,
      })
    }
  }

  return <ImageManager initialImages={images} />
}
