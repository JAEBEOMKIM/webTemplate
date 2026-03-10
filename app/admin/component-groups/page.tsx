import { createClient } from '@/lib/supabase/server'
import { GroupsManager } from './GroupsManager'

export default async function ComponentGroupsPage() {
  const supabase = await createClient()
  const [{ data: groups }, { data: definitions }] = await Promise.all([
    supabase.from('component_groups').select('*').order('display_order'),
    supabase.from('component_definitions').select('*').order('display_order'),
  ])
  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>그룹 관리</h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>컴포넌트 그룹을 관리하고 컴포넌트를 그룹에 배정합니다.</p>
      </div>
      <GroupsManager groups={groups || []} definitions={definitions || []} />
    </div>
  )
}
