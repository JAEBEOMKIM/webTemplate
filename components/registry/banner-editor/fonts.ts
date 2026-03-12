// ── Font registry — add entries here to make new fonts available ──────────────
// url: null → system font (no external load needed)
// url: Google Fonts CSS URL → loaded dynamically when editor opens

export interface FontConfig {
  key: string
  name: string
  family: string   // CSS font-family value (quoted if needed)
  url: string | null
  category: 'sans-serif' | 'serif' | 'display' | 'handwriting' | 'monospace'
}

export const FONTS: FontConfig[] = [
  // ── Korean fonts ─────────────────────────────────────────────────────────
  {
    key: 'noto-sans-kr',
    name: 'Noto Sans KR',
    family: "'Noto Sans KR', sans-serif",
    url: 'https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;700;900&display=swap',
    category: 'sans-serif',
  },
  {
    key: 'nanum-gothic',
    name: '나눔고딕',
    family: "'Nanum Gothic', sans-serif",
    url: 'https://fonts.googleapis.com/css2?family=Nanum+Gothic:wght@400;700;800&display=swap',
    category: 'sans-serif',
  },
  {
    key: 'nanum-myeongjo',
    name: '나눔명조',
    family: "'Nanum Myeongjo', serif",
    url: 'https://fonts.googleapis.com/css2?family=Nanum+Myeongjo:wght@400;700;800&display=swap',
    category: 'serif',
  },
  {
    key: 'black-han-sans',
    name: '블랙한산스',
    family: "'Black Han Sans', sans-serif",
    url: 'https://fonts.googleapis.com/css2?family=Black+Han+Sans&display=swap',
    category: 'display',
  },
  {
    key: 'jua',
    name: 'Jua (주아)',
    family: "'Jua', sans-serif",
    url: 'https://fonts.googleapis.com/css2?family=Jua&display=swap',
    category: 'display',
  },
  {
    key: 'do-hyeon',
    name: 'Do Hyeon (도현)',
    family: "'Do Hyeon', sans-serif",
    url: 'https://fonts.googleapis.com/css2?family=Do+Hyeon&display=swap',
    category: 'display',
  },
  {
    key: 'nanum-pen',
    name: '나눔펜',
    family: "'Nanum Pen Script', cursive",
    url: 'https://fonts.googleapis.com/css2?family=Nanum+Pen+Script&display=swap',
    category: 'handwriting',
  },
  // ── English / global fonts ────────────────────────────────────────────────
  {
    key: 'inter',
    name: 'Inter',
    family: "'Inter', sans-serif",
    url: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap',
    category: 'sans-serif',
  },
  {
    key: 'poppins',
    name: 'Poppins',
    family: "'Poppins', sans-serif",
    url: 'https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;800&display=swap',
    category: 'sans-serif',
  },
  {
    key: 'plus-jakarta-sans',
    name: 'Plus Jakarta Sans',
    family: "'Plus Jakarta Sans', sans-serif",
    url: 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap',
    category: 'sans-serif',
  },
  {
    key: 'playfair-display',
    name: 'Playfair Display',
    family: "'Playfair Display', serif",
    url: 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&display=swap',
    category: 'serif',
  },
  {
    key: 'bebas-neue',
    name: 'Bebas Neue',
    family: "'Bebas Neue', sans-serif",
    url: 'https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap',
    category: 'display',
  },
  {
    key: 'montserrat',
    name: 'Montserrat',
    family: "'Montserrat', sans-serif",
    url: 'https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700;900&display=swap',
    category: 'sans-serif',
  },
  // ── System fonts (no external load) ──────────────────────────────────────
  {
    key: 'system-sans',
    name: '시스템 고딕',
    family: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    url: null,
    category: 'sans-serif',
  },
  {
    key: 'system-serif',
    name: '시스템 명조',
    family: 'Georgia, "Times New Roman", serif',
    url: null,
    category: 'serif',
  },
  {
    key: 'system-mono',
    name: '시스템 고정폭',
    family: '"Courier New", Courier, monospace',
    url: null,
    category: 'monospace',
  },
]

// Inject Google Fonts <link> into document head (idempotent)
function loadFontUrl(url: string): void {
  if (typeof document === 'undefined') return
  if (document.querySelector(`link[href="${url}"]`)) return
  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = url
  document.head.appendChild(link)
}

// Call this once when the editor opens to preload all fonts
export function loadAllFonts(): void {
  for (const font of FONTS) {
    if (font.url) loadFontUrl(font.url)
  }
}

export function getFontByKey(key: string): FontConfig | undefined {
  return FONTS.find(f => f.key === key)
}

export function getFontFamily(key: string): string {
  return getFontByKey(key)?.family ?? 'sans-serif'
}
