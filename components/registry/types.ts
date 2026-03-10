import { ComponentType } from 'react'

export interface ComponentProps {
  componentId: string  // page_components.id
  config: Record<string, unknown>
  pageId: string
  isAdmin?: boolean
}

export interface ConfigFormProps {
  config: Record<string, unknown>
  onChange: (config: Record<string, unknown>) => void
  componentId?: string
}

export interface ComponentDefinition {
  id: string
  name: string
  description: string
  icon: string
  defaultConfig: Record<string, unknown>
  Component: ComponentType<ComponentProps>
  ConfigForm: ComponentType<ConfigFormProps>
}

// ── 코드 측 구현체 (Component + ConfigForm만)
export interface ComponentImpl {
  Component: ComponentType<ComponentProps>
  ConfigForm: ComponentType<ConfigFormProps>
}

// ── DB: component_groups 행
export interface ComponentGroupRow {
  id: string
  name: string
  icon: string
  display_order: number
  parent_id: string | null
}

// ── DB: component_definitions 행 (확장된 컬럼 포함)
export interface ComponentDefinitionRow {
  id: string
  name: string
  description: string | null
  icon: string | null
  default_config: Record<string, unknown>
  group_id: string | null
  component_module: string | null
  config_form_module: string | null
  grid_w: number
  grid_h: number
  grid_min_w: number
  grid_min_h: number
  display_order: number
  is_active: boolean
}

// ── DB 메타데이터 + 코드 구현체 병합 결과
export interface ResolvedComponentDefinition {
  id: string
  name: string
  description: string
  icon: string
  defaultConfig: Record<string, unknown>
  Component: ComponentType<ComponentProps>
  ConfigForm: ComponentType<ConfigFormProps>
  groupId: string | null
  gridW: number
  gridH: number
  gridMinW: number
  gridMinH: number
  displayOrder: number
  isActive: boolean
}

// ── 그룹 트리 노드 (UI용)
export interface ComponentGroupNode {
  id: string
  name: string
  icon: string
  displayOrder: number
  parentId: string | null
  children: ComponentGroupNode[]
  components: ResolvedComponentDefinition[]
}

// DB에서 읽어온 페이지 컴포넌트 데이터
export interface PageComponentData {
  id: string
  page_id: string
  component_type: string
  display_order: number
  config: Record<string, unknown>
  grid_x: number
  grid_y: number
  grid_w: number
  grid_h: number
}

// DB에서 읽어온 페이지 데이터
export interface PageData {
  id: string
  slug: string
  title: string
  description: string | null
  access_type: 'public' | 'password' | 'oauth'
  password_hash: string | null
  is_published: boolean
  theme: string | null
  created_at: string
  updated_at: string
}
