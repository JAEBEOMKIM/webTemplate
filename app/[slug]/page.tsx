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

  // 로그인 유저 확인 — 관리자 여부 판단에 사용
  const { data: { user } } = await supabase.auth.getUser()
  const adminEmail = process.env.ADMIN_EMAIL || process.env.NEXT_PUBLIC_ADMIN_EMAIL || ''
  const isAdmin = !!(user && adminEmail && user.email === adminEmail)

  // 접근 권한 체크
  const tracker = <PageViewTracker pageId={page.id} />

  if (page.access_type === 'public') {
    return <>{tracker}<DynamicPage page={page} components={components || []} isAdmin={isAdmin} /></>
  }

  if (page.access_type === 'password') {
    return <>{tracker}<DynamicPage page={page} components={components || []} requiresPassword isAdmin={isAdmin} /></>
  }

  if (page.access_type === 'oauth') {
    if (!user) {
      redirect(`/auth/login?redirect=/${slug}`)
    }

    // 유저 프로필 구성 (메타데이터 포함)
    const meta = user.user_metadata || {}
    const userProfile = {
      id: user.id,
      email: user.email,
      full_name: (meta.full_name as string) || (meta.name as string) || '',
      avatar_url: (meta.avatar_url as string) || (meta.picture as string) || '',
      provider: (meta.provider as string) || '',
    }

    // 접근 권한 확인
    const { data: grant } = await supabase
      .from('page_access_grants')
      .select('id')
      .eq('page_id', page.id)
      .eq('user_id', user.id)
      .single()

    if (!grant) {
      return <>{tracker}<DynamicPage page={page} components={components || []} requiresInviteCode user={userProfile} isAdmin={isAdmin} /></>
    }

    return <>{tracker}<DynamicPage page={page} components={components || []} user={userProfile} isAdmin={isAdmin} /></>
  }

  notFound()
}
