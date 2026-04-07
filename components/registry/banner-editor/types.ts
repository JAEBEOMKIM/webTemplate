// ── Layer types ───────────────────────────────────────────────────────────────

export type LayerType = 'image' | 'text'

export type TextVariantType = 'none' | 'typewriter' | 'shiny'

export interface ImageLayer {
  id: string
  type: 'image'
  name: string
  imageUrl: string
  visible: boolean
  opacity: number  // 0-100
  isBackground?: true  // z=0 고정 배경 이미지 레이어 (이동/리사이즈 가능)
}

export interface TextLayer {
  id: string
  type: 'text'
  name: string
  text: string
  // 폰트 설정 (title-header 동일)
  fontFamily: string
  fontSize: number
  fontWeight: number
  italic: boolean
  fill: string           // canvas 렌더링용 텍스트 색상
  // 유형 + 관련 설정
  variant: TextVariantType
  // Typewriter 설정
  texts?: string[]       // 순환 텍스트 (variant=typewriter)
  prefix?: string        // 고정 접두어
  typingSpeed?: number
  deletingSpeed?: number
  pauseDuration?: number
  cursorChar?: string
  cursorColor?: string
  // Shiny 설정
  gradientColors?: string
  gradientSpeed?: number
  hoverGlow?: boolean
  // 공통
  visible: boolean
  opacity: number  // 0-100
}

export type Layer = ImageLayer | TextLayer

// ── Background ────────────────────────────────────────────────────────────────

export type BackgroundType = 'color' | 'image' | 'transparent'

export interface BannerBackground {
  type: BackgroundType
  color: string          // used when type === 'color'
  imageUrl: string       // used when type === 'image'
}

// ── Main config ───────────────────────────────────────────────────────────────

export interface BannerConfig {
  canvasWidth: number     // displayed & exported canvas width (px)
  canvasHeight: number    // displayed & exported canvas height (px)
  background: BannerBackground
  layers: Layer[]         // ordered bottom to top (index 0 = bottom)
  fabricJson: string      // canvas.toJSON() — source of truth for canvas state
  exportedImageUrl: string | null  // final PNG stored in Supabase storage
}

// ── Defaults ──────────────────────────────────────────────────────────────────

export const DEFAULT_BANNER_CONFIG: BannerConfig = {
  canvasWidth: 900,
  canvasHeight: 300,
  background: { type: 'color', color: '#1e293b', imageUrl: '' },
  layers: [],
  fabricJson: '',
  exportedImageUrl: null,
}

// ── Preset canvas sizes ───────────────────────────────────────────────────────

export const CANVAS_PRESETS = [
  { label: '가로 배너 (3:1)', width: 900, height: 300 },
  { label: '정사각형 (1:1)', width: 600, height: 600 },
  { label: '세로 배너 (9:16)', width: 405, height: 720 },
  { label: '소셜 배너 (16:9)', width: 960, height: 540 },
  { label: '이메일 헤더', width: 800, height: 200 },
]
