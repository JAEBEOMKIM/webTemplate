import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DynamicPage } from './DynamicPage'
import { PageViewTracker } from '@/components/PageViewTracker'

interface Props {
  params: Promise<{ slug: string }>
}

export default async function SlugPage({ params }: Props) {
  const { slug } = await params
  const supabase = await createClient()

  // 페이지 조회
  const { data: page } = await supabase
    .from('pages')
    .select('*')
    .eq('slug', slug)
    .eq('is_published', true)
    .single()

  if (!page) notFound()

  // 컴포넌트 조회
  const { data: components } = await supabase
    .from('page_components')
    .select('*')
    .eq('page_id', page.id)
    .order('display_order')

  // 접근 권한 체크
  const tracker = <PageViewTracker pageId={page.id} />

  if (page.access_type === 'public') {
    return <>{tracker}<DynamicPage page={page} components={components || []} /></>
  }

  if (page.access_type === 'password') {
    return <>{tracker}<DynamicPage page={page} components={components || []} requiresPassword /></>
  }

  if (page.access_type === 'oauth') {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      redirect(`/auth/login?redirect=/${slug}`)
    }

    // 접근 권한 확인
    const { data: grant } = await supabase
      .from('page_access_grants')
      .select('id')
      .eq('page_id', page.id)
      .eq('user_id', user.id)
      .single()

    if (!grant) {
      return <>{tracker}<DynamicPage page={page} components={components || []} requiresInviteCode user={user} /></>
    }

    return <>{tracker}<DynamicPage page={page} components={components || []} /></>
  }

  notFound()
}
