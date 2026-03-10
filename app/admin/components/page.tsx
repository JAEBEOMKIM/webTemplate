import { createClient } from '@/lib/supabase/server'
import ComponentsManager from './ComponentsManager'

export default async function AdminComponentsPage() {
  const supabase = await createClient()

  const [{ data: definitions }, { data: groups }] = await Promise.all([
    supabase.from('component_definitions').select('*').order('display_order'),
    supabase.from('component_groups').select('*').order('display_order'),
  ])

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text-primary)', marginBottom: '4px' }}>
          컴포넌트 관리
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          등록된 컴포넌트 정의를 관리합니다. Component/ConfigForm 모듈은 개발자가 코드로 구현해야 합니다.
        </p>
      </div>

      <ComponentsManager
        definitions={definitions ?? []}
        groups={groups ?? []}
      />
    </div>
  )
}
