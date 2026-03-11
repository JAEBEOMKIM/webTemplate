/**
 * Theme system — each theme defines metadata + preview colors.
 * Actual CSS variables live in app/themes.css (scoped by `.theme-{id}` class).
 * Adding a new theme:
 *   1. Add entry here
 *   2. Add `.theme-{id}` + `.dark .theme-{id}` block in themes.css
 */

export interface ThemeDefinition {
  id: string
  name: string
  description: string
  fontLabel: string          // display name of the font
  /** Preview swatches (light mode) */
  preview: {
    bg: string
    accent: string
    text: string
    card: string
  }
  /** Preview swatches (dark mode) */
  previewDark: {
    bg: string
    accent: string
    text: string
    card: string
  }
}

export const themes: ThemeDefinition[] = [
  {
    id: 'notebook',
    name: '노트북',
    description: '손글씨 느낌의 Architects Daughter, 크림빛 포인트',
    fontLabel: 'Architects Daughter',
    preview:     { bg: '#f9f9f9', accent: '#606060', text: '#3a3a3a', card: '#ffffff' },
    previewDark: { bg: '#2b2b2b', accent: '#b0b0b0', text: '#dcdcdc', card: '#333333' },
  },
  {
    id: 'solar-dusk',
    name: '솔라 더스크',
    description: '황혼의 앰버 & 스톤, 따뜻한 노을빛',
    fontLabel: 'Oxanium',
    preview:     { bg: '#FDFBF7', accent: '#B45309', text: '#4A3B33', card: '#F8F4EE' },
    previewDark: { bg: '#1C1917', accent: '#F97316', text: '#F5F5F4', card: '#292524' },
  },
  {
    id: 'default',
    name: '기본',
    description: '깔끔한 블루 액센트, 프로페셔널한 디자인',
    fontLabel: 'System (Inter)',
    preview:     { bg: '#ffffff', accent: '#2563eb', text: '#0f172a', card: '#f8fafc' },
    previewDark: { bg: '#0a0f1e', accent: '#3b82f6', text: '#e2eaf5', card: '#131c35' },
  },
  {
    id: 'minimal',
    name: '미니멀',
    description: '모노크롬 세리프, 우아한 에디토리얼 스타일',
    fontLabel: 'Noto Serif KR',
    preview:     { bg: '#fafaf9', accent: '#292524', text: '#1c1917', card: '#f5f5f4' },
    previewDark: { bg: '#1c1917', accent: '#d6d3d1', text: '#e7e5e4', card: '#292524' },
  },
  {
    id: 'nature',
    name: '네이처',
    description: '자연을 닮은 그린 톤, 따뜻한 느낌',
    fontLabel: 'Noto Sans KR',
    preview:     { bg: '#fefdf8', accent: '#2d6a4f', text: '#1b4332', card: '#f0fdf4' },
    previewDark: { bg: '#0f1f15', accent: '#52b788', text: '#d8f3dc', card: '#1a2e1f' },
  },
  {
    id: 'sunset',
    name: '선셋',
    description: '코랄 & 오렌지, 따뜻하고 에너지 넘치는',
    fontLabel: 'Noto Sans KR',
    preview:     { bg: '#fffbf5', accent: '#ea580c', text: '#431407', card: '#fff7ed' },
    previewDark: { bg: '#1c1008', accent: '#fb923c', text: '#fed7aa', card: '#2a1a0e' },
  },
  {
    id: 'ocean',
    name: '오션',
    description: '딥 블루 & 티얼, 시원하고 모던한',
    fontLabel: 'Noto Sans KR',
    preview:     { bg: '#f0fdfa', accent: '#0d9488', text: '#134e4a', card: '#ccfbf1' },
    previewDark: { bg: '#0a1a1a', accent: '#2dd4bf', text: '#ccfbf1', card: '#132626' },
  },
  {
    id: 'rose',
    name: '로제',
    description: '소프트 로즈 핑크, 부드럽고 감성적인',
    fontLabel: 'Noto Sans KR',
    preview:     { bg: '#fff5f7', accent: '#e11d48', text: '#4c0519', card: '#ffe4e9' },
    previewDark: { bg: '#1a0a10', accent: '#fb7185', text: '#ffe4e9', card: '#2a1018' },
  },
  {
    id: 'bubblegum',
    name: '버블검',
    description: '달콤한 핑크 & 민트, 귀엽고 생기넘치는 팝 스타일',
    fontLabel: 'Poppins',
    preview:     { bg: '#f6e6ee', accent: '#d04f99', text: '#5b5b5b', card: '#fdedc9' },
    previewDark: { bg: '#12242e', accent: '#fbe2a7', text: '#f3e3ea', card: '#1c2e38' },
  },
  {
    id: 'candyland',
    name: '캔디랜드',
    description: '파스텔 핑크 & 하늘색, 달콤하고 몽환적인 판타지',
    fontLabel: 'Poppins',
    preview:     { bg: '#f7f9fa', accent: '#ffc0cb', text: '#333333', card: '#ffffff' },
    previewDark: { bg: '#1a1d23', accent: '#ff99cc', text: '#e5e5e5', card: '#2f3436' },
  },
  {
    id: 'shadcn',
    name: '순수',
    description: '군더더기 없는 흑백 대비, shadcn 표준 스타일',
    fontLabel: 'System',
    preview:     { bg: '#ffffff', accent: '#171717', text: '#0a0a0a', card: '#ffffff' },
    previewDark: { bg: '#0a0a0a', accent: '#fafafa', text: '#fafafa', card: '#121212' },
  },
  {
    id: 'graphite',
    name: '그라파이트',
    description: '차분한 회색 계열, 세련되고 집중력을 높이는 스타일',
    fontLabel: 'Inter',
    preview:     { bg: '#f0f0f0', accent: '#606060', text: '#333333', card: '#f5f5f5' },
    previewDark: { bg: '#1a1a1a', accent: '#a0a0a0', text: '#d9d9d9', card: '#202020' },
  },
  {
    id: 'violet-bloom',
    name: '바이올렛 블룸',
    description: '생동감 있는 보라색 액센트, 현대적이고 창의적인',
    fontLabel: 'Plus Jakarta Sans',
    preview:     { bg: '#fdfdfd', accent: '#7033ff', text: '#000000', card: '#fdfdfd' },
    previewDark: { bg: '#1a1b1e', accent: '#8c5cff', text: '#f0f0f0', card: '#222327' },
  },
]

export const themeMap = new Map(themes.map(t => [t.id, t]))

export function getTheme(id: string | null | undefined): ThemeDefinition {
  return themeMap.get(id ?? 'default') ?? themes[0]
}
