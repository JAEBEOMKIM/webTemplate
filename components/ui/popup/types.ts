export interface PopupButtonConfig {
  label: string
  action: 'close' | 'link'
  url?: string
}

export interface PopupConfig {
  id: string
  type: 'modal' | 'slide'
  trigger: 'load' | 'click' | 'touch'
  triggerSelector?: string   // CSS selector within component (click/touch only)
  triggerDelay?: number      // ms (load only)
  header?: { title: string }
  content?: {
    componentType: string
    componentConfig: Record<string, unknown>
  }
  footer?: {
    primaryButton?: PopupButtonConfig
    secondaryButton?: PopupButtonConfig
  }
}
