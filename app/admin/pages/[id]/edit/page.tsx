import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PageBuilder } from '@/components/builder/PageBuilder'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditPagePage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: page }, { data: components }, { data: componentDefs }, { data: componentGroups }] = await Promise.all([
    supabase.from('pages').select('*').eq('id', id).single(),
    supabase.from('page_components').select('*').eq('page_id', id).order('display_order'),
    supabase.from('component_definitions').select('*').order('display_order'),
    supabase.from('component_groups').select('*').order('display_order'),
  ])

  if (!page) notFound()

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">페이지 편집: {page.title}</h1>
      <PageBuilder
        page={page}
        initialComponents={components || []}
        componentDefs={componentDefs || []}
        componentGroups={componentGroups || []}
      />
    </div>
  )
}
