/**
 * 폰트 레지스트리 — public/fonts/ 에 배치된 모든 폰트 관리
 * 선택 시에만 @font-face를 동적으로 삽입 (성능 최적화)
 */

export interface FontEntry {
  /** CSS font-family 값 */
  family: string
  /** 사용자에게 표시할 한글 이름 */
  label: string
  /** 카테고리 (그룹핑용) */
  category: 'system' | 'gothic' | 'myeongjo' | 'handwriting' | 'display' | 'coding'
  /** font file(들) 경로 — public/ 기준 */
  files: { path: string; weight?: number; style?: string }[]
  /** variable font 여부 */
  variable?: boolean
}

// ── System Fonts (설치 불필요) ──────────────────────────────────────────

const systemFonts: FontEntry[] = [
  { family: 'inherit', label: '기본 (상속)', category: 'system', files: [] },
  { family: '-apple-system, "Segoe UI", sans-serif', label: '시스템 고딕', category: 'system', files: [] },
  { family: 'Georgia, "Times New Roman", serif', label: '시스템 명조', category: 'system', files: [] },
  { family: 'monospace', label: '시스템 고정폭', category: 'system', files: [] },
]

// ── Local Fonts ────────────────────────────────────────────────────────

const localFonts: FontEntry[] = [
  // Gothic
  {
    family: 'NanumGothic', label: '나눔고딕', category: 'gothic',
    files: [
      { path: '/fonts/NanumGothic/NanumGothic.ttf', weight: 400 },
      { path: '/fonts/NanumGothic/NanumGothicBold.ttf', weight: 700 },
    ],
  },
  {
    family: 'NanumBarunGothic', label: '나눔바른고딕', category: 'gothic',
    files: [
      { path: '/fonts/NanumBarunGothic/NanumBarunGothic.ttf', weight: 400 },
      { path: '/fonts/NanumBarunGothic/NanumBarunGothicBold.ttf', weight: 700 },
    ],
  },
  {
    family: 'NanumSquareNeo', label: '나눔스퀘어네오', category: 'gothic',
    files: [{ path: '/fonts/NanumSquareNeo/NanumSquareNeo-Variable.ttf' }],
    variable: true,
  },
  {
    family: 'SCDream', label: 'S-Core 드림', category: 'gothic',
    files: [
      { path: '/fonts/SCDream/SCDream1.otf', weight: 100 },
      { path: '/fonts/SCDream/SCDream2.otf', weight: 200 },
      { path: '/fonts/SCDream/SCDream3.otf', weight: 300 },
      { path: '/fonts/SCDream/SCDream4.otf', weight: 400 },
      { path: '/fonts/SCDream/SCDream5.otf', weight: 500 },
      { path: '/fonts/SCDream/SCDream6.otf', weight: 600 },
      { path: '/fonts/SCDream/SCDream7.otf', weight: 700 },
      { path: '/fonts/SCDream/SCDream8.otf', weight: 800 },
      { path: '/fonts/SCDream/SCDream9.otf', weight: 900 },
    ],
  },
  // Myeongjo
  {
    family: 'NanumMyeongjo', label: '나눔명조', category: 'myeongjo',
    files: [
      { path: '/fonts/NanumMyeongjo/NanumMyeongjo.ttf', weight: 400 },
      { path: '/fonts/NanumMyeongjo/NanumMyeongjoBold.ttf', weight: 700 },
    ],
  },
  {
    family: 'MaruBuri', label: '마루부리', category: 'myeongjo',
    files: [
      { path: '/fonts/MaruBuri/MaruBuri-Regular.ttf', weight: 400 },
      { path: '/fonts/MaruBuri/MaruBuri-Bold.ttf', weight: 700 },
    ],
  },
  // Display
  {
    family: 'BlackHanSans', label: '검은고딕', category: 'display',
    files: [{ path: '/fonts/BlackHanSans/BlackHanSans-Regular.ttf', weight: 400 }],
  },
  {
    family: 'JalnanGothic', label: '잘난고딕', category: 'display',
    files: [{ path: '/fonts/JalnanGothic/JalnanGothicTTF.ttf', weight: 400 }],
  },
  {
    family: 'Jalnan2', label: '잘난2', category: 'display',
    files: [{ path: '/fonts/Jalnan2/Jalnan2TTF.ttf', weight: 400 }],
  },
  // Handwriting
  {
    family: 'NanumBarunPen', label: '나눔바른펜', category: 'handwriting',
    files: [
      { path: '/fonts/NanumBarunPen/NanumBarunpenR.ttf', weight: 400 },
      { path: '/fonts/NanumBarunPen/NanumBarunpenB.ttf', weight: 700 },
    ],
  },
  {
    family: 'NanumPen', label: '나눔손글씨 펜', category: 'handwriting',
    files: [{ path: '/fonts/NanumPen/NanumPen.ttf', weight: 400 }],
  },
  // Coding
  {
    family: 'D2Coding', label: 'D2 Coding', category: 'coding',
    files: [{ path: '/fonts/D2Coding/D2Coding-Ver1.3.2-20180524-ligature.ttf', weight: 400 }],
  },
]

// ── Clova 나눔손글씨 ──────────────────────────────────────────────────

const CLOVA_NAMES = [
  '가람연꽃','갈맷글','갈혜준체','강부장님체','강인한_위로','고딕_아니고_고딩',
  '고려글꼴','곰신체','규리의_일기','금은보화','기쁨밝음','김유이체','꽃내음',
  '끄트머리체','나는_이겨낸다','나무정원','나의_아내_손글씨','노력하는_동희',
  '느릿느릿체','다시_시작해','다진체','다채사랑','다행체','달의궤도','대광유리',
  '대한민국_열사체','동화또박','둥근인연','따뜻한_작별','따악단단','딸에게_엄마가',
  '또박또박','마고체','맛있는체','몽돌','무궁화','무진장체','미니_손글씨','미래나무',
  '바른정신','바른히피','반짝반짝_별','배은혜체','백의의_천사','버드나무','범솜체',
  '부장님_눈치체','북극성','비상체','빵구니맘_손글씨','사랑해_아들','상해찬미체',
  '성실체','세계적인_한글','세아체','세화체','소미체','소방관의_기도','손편지체',
  '수줍은_대학생','시우_귀여워','신혼부부','아기사랑체','아름드리_꽃나무','아빠글씨',
  '아빠의_연애편지','아인맘_손글씨','아줌마_자유','안쌍체','암스테르담',
  '야근하는_김주임','야채장수_백금례','엄마사랑','엉겅퀴체','여름글씨','연지체',
  '열아홉의_반짝임','열일체','예당체','예쁜_민경체','옥비체','와일드','외할머니글씨',
  '왼손잡이도_예뻐','우리딸_손글씨','유니_띵땅띵땅','의미있는_한글','자부심지우',
  '잘하고_있어','장미체','점꼴체','정은체','중학생','진주_박경아체','철필글씨',
  '초딩희망','칼국수','코코체','하나되어_손글씨','하나손글씨','하람체','한윤체',
  '할아버지의나눔','행복한_도비','혁이체','효남_늘_화이팅','희망누리','흰꼬리수리',
  '힘내라는_말보단',
] as const

const clovaFonts: FontEntry[] = CLOVA_NAMES.map(name => ({
  family: `Clova-${name}`,
  label: `나눔손글씨 ${name.replace(/_/g, ' ')}`,
  category: 'handwriting' as const,
  files: [{ path: `/fonts/clova/${encodeURIComponent(name)}.ttf`, weight: 400 }],
}))

// ── All fonts ──────────────────────────────────────────────────────────

export const fontRegistry: FontEntry[] = [
  ...systemFonts,
  ...localFonts,
  ...clovaFonts,
]

export const FONT_CATEGORIES = [
  { id: 'system', label: '시스템' },
  { id: 'gothic', label: '고딕' },
  { id: 'myeongjo', label: '명조' },
  { id: 'display', label: '디스플레이' },
  { id: 'handwriting', label: '손글씨' },
  { id: 'coding', label: '코딩' },
] as const

// ── Dynamic Loader ─────────────────────────────────────────────────────
// 브라우저에서 선택된 폰트만 @font-face 삽입

const loadedFamilies = new Set<string>()

export function loadFont(family: string): void {
  if (typeof document === 'undefined') return
  if (loadedFamilies.has(family)) return

  const entry = fontRegistry.find(f => f.family === family)
  if (!entry || entry.files.length === 0) return // system font

  loadedFamilies.add(family)

  for (const file of entry.files) {
    const ext = file.path.endsWith('.otf') ? 'opentype' : 'truetype'
    const style = new FontFace(
      entry.family,
      `url("${file.path}") format("${ext}")`,
      {
        weight: file.weight ? String(file.weight) : undefined,
        style: file.style || 'normal',
      },
    )
    style.load().then(loaded => {
      document.fonts.add(loaded)
    }).catch(err => {
      console.warn(`Font load failed: ${entry.family}`, err)
    })
  }
}

/** family 값으로 FontEntry 조회 */
export function findFontEntry(family: string): FontEntry | undefined {
  return fontRegistry.find(f => f.family === family)
}
