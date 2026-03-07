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
