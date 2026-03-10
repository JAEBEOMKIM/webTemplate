import { createClient } from '@/lib/supabase/server'
import type {
  ComponentDefinitionRow,
  ComponentGroupRow,
} from '@/components/registry/types'

// ── 서버 측 데이터 페칭 ──────────────────────────────────────────────────

export async function fetchComponentDefinitions(): Promise<ComponentDefinitionRow[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('component_definitions')
    .select('*')
    .order('display_order')
  return (data ?? []) as ComponentDefinitionRow[]
}

export async function fetchComponentGroups(): Promise<ComponentGroupRow[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('component_groups')
    .select('*')
    .order('display_order')
  return (data ?? []) as ComponentGroupRow[]
}

// 클라이언트/서버 공용 유틸은 group-utils.ts를 직접 import하세요
export { buildGroupTree, countGroupComponents } from './group-utils'
