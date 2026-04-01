'use client'

import { useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { ComponentProps, ConfigFormProps } from '../types'

// ── 타입 ─────────────────────────────────────────────────────────────────
interface ProgramItem {
  number: string
  title: string
  performer: string
}

interface OrchSection {
  section: string
  members: string
}

interface CantataConfig {
  // 상단 이미지 히어로
  hero_image_url: string
  hero_english_title: string
  hero_height: number
  // 행사 정보
  year: number
  event_label: string
  main_title: string
  sub_title: string
  date_label: string
  venue_label: string
  poster_image_url: string
  // 섹션 표시 여부
  show_program: boolean
  show_choir: boolean
  show_footer_verse: boolean
  // 프로그램
  program_items: ProgramItem[]
  // 지휘 / 반주
  conductor_name: string
  pianist_name: string
  organist_name: string
  choir_label: string
  // 합창단 파트
  soprano: string
  alto: string
  tenor: string
  bass: string
  // 오케스트라
  orchestra_label: string
  orchestra_sections: OrchSection[]
  // 성경 구절
  bible_verse: string
  bible_ref: string
  // 테마 색상
  color_bg: string
  color_surface: string
  color_primary: string
  color_tertiary: string
  color_secondary: string
}

// ── 기본 설정 ─────────────────────────────────────────────────────────────
const DEFAULT_CONFIG: CantataConfig = {
  hero_image_url: '',
  hero_english_title: 'Jesus Christ: King of Kings',
  hero_height: 320,
  year: 2026,
  event_label: 'Easter Cantata',
  main_title: '만왕의 왕\n예수 그리스도',
  sub_title: '',
  date_label: '2026년 4월 3일 오후 7시',
  venue_label: '등촌 교회 본당',
  poster_image_url: '',
  show_program: true,
  show_choir: true,
  show_footer_verse: true,
  program_items: [
    { number: '01', title: '예수 그리스도', performer: '합창' },
    { number: '02', title: '왕의 왕 찬양하리', performer: 'Narration / 합창' },
    { number: '03', title: '마지막 만찬', performer: 'Bas.전준홍 / 합창' },
    { number: '04', title: '겟세마네의 기도', performer: 'Narration / Sop.원진주 / 합창' },
    { number: '05', title: '나는 저 사람을 모릅니다', performer: 'Narration / Ter.안철준 / 합창' },
    { number: '06', title: '주 나를 위하여', performer: '임마누엘 중창단 / 합창' },
    { number: '07', title: '부활하셨다', performer: 'Narration / 합창' },
  ],
  conductor_name: '강태휘',
  pianist_name: '구예담',
  organist_name: '',
  choir_label: '임마누엘 찬양대',
  soprano: '김지수 이민정 박소연 최윤희 정다은 한지혜 유민주 김태희 이은지 서현주 홍수아',
  alto: '이지영 박은혜 최민정 김수진 정현주 이나영 조은아 배지민 강수연 유선희',
  tenor: '이철수 박종혁 김동현 최재영 정성우 한기석 유태건 손민호 임재윤',
  bass: '정지훈 김성수 박준호 최영민 이태양 장동건 유해진 김진우 안승범',
  orchestra_label: '임마누엘 앙상블',
  orchestra_sections: [
    { section: 'Violin / Viola', members: 'Vn1. 김은정 박지혜  Vn2. 이나리 최성원  Va. 박준석 정유미' },
    { section: 'Cello / Bass', members: 'Vc. 이민지 김하늘  Db. 박철민' },
    { section: 'Woodwind / Brass', members: 'Fl. 한지수  Ob. 정민아  Cl. 김도윤  Hn. 이강산  Trp. 박재현' },
    { section: 'Percussion', members: 'Tim. 김대원  Perc. 최한결' },
  ],
  bible_verse:
    '"그리스도께서 다시 살아나신 일이 없으면 너희의 믿음도 헛되고 너희가 여전히 죄 가운데 있을 것이요"',
  bible_ref: '(고린도전서 15:17)',
  color_bg: '#1a0f1c',
  color_surface: '#261629',
  color_primary: '#f2dfd0',
  color_tertiary: '#ffdcbd',
  color_secondary: '#d5c3b5',
}

function useConfig(raw: Record<string, unknown>): CantataConfig {
  return { ...DEFAULT_CONFIG, ...raw } as CantataConfig
}

// ── 컴포넌트 ──────────────────────────────────────────────────────────────
export function EasterCantataComponent({ config }: ComponentProps) {
  const cfg = useConfig(config)

  const style = {
    '--c-bg': cfg.color_bg,
    '--c-surface': cfg.color_surface,
    '--c-primary': cfg.color_primary,
    '--c-tertiary': cfg.color_tertiary,
    '--c-secondary': cfg.color_secondary,
  } as React.CSSProperties

  const titleLines = cfg.main_title.split('\n')

  return (
    <>
      {/* Google Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@400;700;900&family=Manrope:wght@300;400;600;800&display=swap');
        .ec-wrap * { box-sizing: border-box; }
        .ec-headline { font-family: 'Noto Serif KR', serif; }
        .ec-body { font-family: 'Manrope', sans-serif; }
        .ec-text-glow { text-shadow: 0 0 15px rgba(255,220,189,0.35); }
        .ec-divider { width: 48px; height: 4px; background: var(--c-tertiary); border-radius: 2px; }
      `}</style>

      <div
        className="ec-wrap ec-body"
        style={{
          ...style,
          background: cfg.color_bg,
          color: cfg.color_primary,
          minHeight: '100%',
          overflowX: 'hidden',
        }}
      >
        {/* ── 상단 이미지 히어로 ────────────────────────────────── */}
        {cfg.hero_image_url && (
          <section
            style={{
              position: 'relative',
              width: '100%',
              height: `${cfg.hero_height}px`,
              overflow: 'hidden',
              backgroundImage: `url(${cfg.hero_image_url})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center top',
            }}
          >
            {/* 하단만 어두워지는 그라디언트 오버레이 */}
            <div style={{
              position: 'absolute', inset: 0,
              background: `linear-gradient(to bottom, transparent 0%, transparent 50%, ${cfg.color_bg}bb 80%, ${cfg.color_bg} 100%)`,
            }} />

            {/* 콘텐츠 레이어: 영문 장식 라인만 이미지 하단에 표시 */}
            {cfg.hero_english_title && (
              <div style={{
                position: 'absolute', bottom: '28px', left: '24px', right: '24px',
                display: 'flex', alignItems: 'center', gap: '10px',
              }}>
                <div style={{ flex: 1, height: '1px', background: `${cfg.color_secondary}55` }} />
                <span
                  className="ec-body"
                  style={{
                    fontSize: '10px',
                    letterSpacing: '0.12em',
                    color: `${cfg.color_secondary}99`,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {cfg.hero_english_title}
                </span>
                <div style={{ flex: 1, height: '1px', background: `${cfg.color_secondary}55` }} />
              </div>
            )}
          </section>
        )}

        {/* ── 행사 정보 (배지 + 타이틀 + 날짜/장소) ──────────────── */}
        <section style={{ position: 'relative', overflow: 'hidden', background: cfg.color_bg }}>
          {/* 히어로 없을 때만 poster_image_url 사용 */}
          {!cfg.hero_image_url && cfg.poster_image_url && (
            <div style={{ width: '100%', position: 'relative' }}>
              <img
                src={cfg.poster_image_url}
                alt="칸타타 포스터"
                style={{ width: '100%', height: 'auto', display: 'block', objectFit: 'contain' }}
              />
              <div style={{
                position: 'absolute', inset: 0,
                background: `linear-gradient(to top, ${cfg.color_bg} 0%, transparent 50%)`,
              }} />
            </div>
          )}

          <div
            style={{
              padding: '0 32px 48px',
              marginTop: cfg.hero_image_url ? '24px' : (!cfg.hero_image_url && cfg.poster_image_url ? '-40px' : '32px'),
              position: 'relative',
              zIndex: 10,
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
            }}
          >
            {/* 이벤트 라벨 배지 */}
            <div style={{ display: 'inline-block' }}>
              <span
                className="ec-body"
                style={{
                  display: 'inline-block',
                  padding: '4px 16px',
                  borderRadius: '999px',
                  background: `${cfg.color_primary}1a`,
                  border: `1px solid ${cfg.color_primary}33`,
                  fontSize: '11px',
                  letterSpacing: '0.2rem',
                  textTransform: 'uppercase',
                  color: cfg.color_tertiary,
                }}
              >
                {cfg.year} {cfg.event_label}
              </span>
            </div>

            {/* 메인 타이틀 */}
            <h1
              className="ec-headline ec-text-glow"
              style={{
                fontSize: 'clamp(36px, 8vw, 56px)',
                fontWeight: 900,
                lineHeight: 1.1,
                letterSpacing: '-0.03em',
                color: cfg.color_primary,
                margin: 0,
                whiteSpace: 'pre-line',
              }}
            >
              {titleLines.map((line, i) => (
                <span key={i}>
                  {line}
                  {i < titleLines.length - 1 && <br />}
                </span>
              ))}
            </h1>

            {cfg.sub_title && (
              <p className="ec-body" style={{ color: cfg.color_secondary, fontSize: '15px', margin: 0 }}>
                {cfg.sub_title}
              </p>
            )}

            {/* 날짜 / 장소 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <CalendarIcon color={cfg.color_tertiary} />
                <span className="ec-body" style={{ fontWeight: 700, fontSize: '17px', color: cfg.color_primary }}>
                  {cfg.date_label}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <LocationIcon color={cfg.color_tertiary} />
                <span className="ec-body" style={{ fontWeight: 600, fontSize: '15px', color: cfg.color_primary }}>
                  {cfg.venue_label}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ── Program ─────────────────────────────────────────────── */}
        {cfg.show_program && (
          <section style={{ marginTop: '48px', padding: '0 32px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
              {/* 섹션 헤더 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <h2
                  className="ec-headline"
                  style={{ fontSize: '28px', fontWeight: 700, color: cfg.color_primary, margin: 0 }}
                >
                  Cantata Program
                </h2>
                <div className="ec-divider" />
              </div>

              {/* 프로그램 목록 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                {cfg.program_items.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <span
                      className="ec-body"
                      style={{
                        fontSize: '13px',
                        fontWeight: 700,
                        color: cfg.color_tertiary,
                        paddingTop: '6px',
                        minWidth: '24px',
                        flexShrink: 0,
                      }}
                    >
                      {item.number}
                    </span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <h3
                        className="ec-headline"
                        style={{
                          fontSize: '22px',
                          fontWeight: 600,
                          color: cfg.color_primary,
                          margin: 0,
                        }}
                      >
                        {item.title}
                      </h3>
                      {item.performer && (
                        <p
                          className="ec-body"
                          style={{
                            fontSize: '13px',
                            color: cfg.color_secondary,
                            fontStyle: 'italic',
                            opacity: 0.85,
                            margin: 0,
                          }}
                        >
                          {item.performer}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── Choir & Orchestra ───────────────────────────────────── */}
        {cfg.show_choir && (
          <section
            style={{
              marginTop: '80px',
              background: `${cfg.color_surface}99`,
              borderTop: `1px solid rgba(255,255,255,0.06)`,
              borderBottom: `1px solid rgba(255,255,255,0.06)`,
              padding: '64px 32px',
            }}
          >
            <div style={{ maxWidth: '480px', margin: '0 auto', textAlign: 'center' }}>
              {/* 헤더 */}
              <div style={{ marginBottom: '48px' }}>
                <h2
                  className="ec-headline"
                  style={{
                    fontSize: '26px',
                    fontWeight: 700,
                    color: cfg.color_primary,
                    margin: '0 0 8px',
                  }}
                >
                  Choir &amp; Orchestra
                </h2>
                <p
                  className="ec-body"
                  style={{
                    fontSize: '11px',
                    letterSpacing: '0.15rem',
                    textTransform: 'uppercase',
                    color: cfg.color_tertiary,
                    margin: 0,
                  }}
                >
                  The Artistic Excellence
                </p>
              </div>

              {/* 단일 박스: 지휘/반주 + 합창 + 오케스트라 */}
              <div
                style={{
                  background: cfg.color_surface,
                  borderRadius: '12px',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '20px',
                  textAlign: 'left',
                }}
              >
                {/* 지휘 및 반주 */}
                <div>
                  <p className="ec-body" style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: cfg.color_tertiary, marginBottom: '10px' }}>
                    지휘 및 반주
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {[
                      { role: 'Conductor', name: cfg.conductor_name },
                      { role: 'Piano', name: cfg.pianist_name },
                      ...(cfg.organist_name ? [{ role: 'Organ', name: cfg.organist_name }] : []),
                    ].map(({ role, name }) => name ? (
                      <div key={role}>
                        <span className="ec-body" style={{ display: 'block', fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: `${cfg.color_tertiary}bb`, marginBottom: '3px' }}>
                          {role}
                        </span>
                        <p className="ec-body" style={{ fontSize: '11px', lineHeight: 1.6, color: `${cfg.color_primary}cc`, margin: 0 }}>
                          {name}
                        </p>
                      </div>
                    ) : null)}
                  </div>
                </div>

                {/* 합창 */}
                <div style={{ paddingTop: '16px', borderTop: `1px solid rgba(255,255,255,0.06)` }}>
                  <p className="ec-body" style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: cfg.color_tertiary, marginBottom: '12px' }}>
                    Choir ({cfg.choir_label})
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {[
                      { part: 'Soprano', members: cfg.soprano },
                      { part: 'Alto', members: cfg.alto },
                      { part: 'Tenor', members: cfg.tenor },
                      { part: 'Bass', members: cfg.bass },
                    ].map(({ part, members }) => members ? (
                      <div key={part}>
                        <span className="ec-body" style={{ display: 'block', fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: `${cfg.color_tertiary}bb`, marginBottom: '3px' }}>
                          {part}
                        </span>
                        <p className="ec-body" style={{ fontSize: '11px', lineHeight: 1.6, color: `${cfg.color_primary}cc`, margin: 0 }}>
                          {members}
                        </p>
                      </div>
                    ) : null)}
                  </div>
                </div>

                {/* 오케스트라 */}
                {cfg.orchestra_sections.length > 0 && (
                  <div style={{ paddingTop: '16px', borderTop: `1px solid rgba(255,255,255,0.06)` }}>
                    <p className="ec-body" style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: cfg.color_tertiary, marginBottom: '12px' }}>
                      Orchestra ({cfg.orchestra_label})
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {cfg.orchestra_sections.map((sec, idx) => (
                        <div key={idx}>
                          <span className="ec-body" style={{ display: 'block', fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: `${cfg.color_tertiary}bb`, marginBottom: '3px' }}>
                            {sec.section}
                          </span>
                          <p className="ec-body" style={{ fontSize: '11px', lineHeight: 1.6, color: `${cfg.color_primary}cc`, margin: 0 }}>
                            {sec.members}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* ── Bible Verse Footer ──────────────────────────────────── */}
        {cfg.show_footer_verse && (
          <footer style={{ marginTop: '64px', marginBottom: '48px', padding: '0 32px', textAlign: 'center' }}>
            <p
              className="ec-headline"
              style={{
                fontSize: '13px',
                fontStyle: 'italic',
                color: cfg.color_secondary,
                opacity: 0.85,
                lineHeight: 1.7,
                margin: '0 0 8px',
              }}
            >
              {cfg.bible_verse}
            </p>
            <span
              className="ec-body"
              style={{
                fontSize: '11px',
                letterSpacing: '0.1em',
                color: cfg.color_secondary,
                opacity: 0.6,
              }}
            >
              {cfg.bible_ref}
            </span>
          </footer>
        )}
      </div>
    </>
  )
}

// ── 서브 UI 컴포넌트 ──────────────────────────────────────────────────────
function RoleCard({
  role, name, bg, primary, accent,
}: {
  role: string; name: string; bg: string; primary: string; accent: string
}) {
  return (
    <div
      style={{
        background: bg,
        padding: '14px',
        borderRadius: '10px',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
      }}
    >
      <span
        className="ec-body"
        style={{
          fontSize: '9px',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
          color: accent,
        }}
      >
        {role}
      </span>
      <span className="ec-headline" style={{ fontSize: '17px', fontWeight: 700, color: primary }}>
        {name}
      </span>
    </div>
  )
}

function CalendarIcon({ color }: { color: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  )
}

function LocationIcon({ color }: { color: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
      <circle cx="12" cy="10" r="3"/>
    </svg>
  )
}

// ── ConfigForm ────────────────────────────────────────────────────────────
export function EasterCantataConfigForm({ config, onChange }: ConfigFormProps) {
  const cfg = useConfig(config)
  const [tab, setTab] = useState<'basic' | 'program' | 'choir' | 'orch' | 'theme'>('basic')
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const heroFileRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  async function handleHeroImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setUploadError('')
    try {
      const ext = file.name.split('.').pop() ?? 'jpg'
      const path = `cantata/hero-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error } = await supabase.storage.from('gallery-images').upload(path, file, { cacheControl: '3600', upsert: false })
      if (error) {
        setUploadError(`업로드 실패: ${error.message}`)
      } else {
        const { data } = supabase.storage.from('gallery-images').getPublicUrl(path)
        onChange({ ...config, hero_image_url: data.publicUrl })
      }
    } catch (err) {
      setUploadError('업로드 중 오류가 발생했습니다.')
    }
    setUploading(false)
    if (heroFileRef.current) heroFileRef.current.value = ''
  }

  function set(key: keyof CantataConfig, value: unknown) {
    onChange({ ...config, [key]: value })
  }

  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: '6px 14px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
    border: 'none',
    background: active ? '#3b82f6' : 'transparent',
    color: active ? '#fff' : '#888',
    transition: 'all 0.15s',
  })

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '7px 10px',
    borderRadius: '6px',
    border: '1px solid #333',
    background: '#1a1a1a',
    color: '#fff',
    fontSize: '13px',
  }

  const labelStyle: React.CSSProperties = {
    fontSize: '12px',
    fontWeight: 600,
    color: '#aaa',
    marginBottom: '4px',
    display: 'block',
  }

  const fieldStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  }

  function updateProgramItem(idx: number, key: keyof ProgramItem, value: string) {
    const items = [...cfg.program_items]
    items[idx] = { ...items[idx], [key]: value }
    set('program_items', items)
  }

  function addProgramItem() {
    const n = cfg.program_items.length + 1
    const num = n < 10 ? `0${n}` : `${n}`
    set('program_items', [...cfg.program_items, { number: num, title: '', performer: '' }])
  }

  function removeProgramItem(idx: number) {
    set('program_items', cfg.program_items.filter((_, i) => i !== idx))
  }

  function updateOrchSection(idx: number, key: keyof OrchSection, value: string) {
    const secs = [...cfg.orchestra_sections]
    secs[idx] = { ...secs[idx], [key]: value }
    set('orchestra_sections', secs)
  }

  function addOrchSection() {
    set('orchestra_sections', [...cfg.orchestra_sections, { section: '', members: '' }])
  }

  function removeOrchSection(idx: number) {
    set('orchestra_sections', cfg.orchestra_sections.filter((_, i) => i !== idx))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '13px' }}>
      {/* 탭 */}
      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', borderBottom: '1px solid #222', paddingBottom: '8px' }}>
        {([
          ['basic', '기본'],
          ['program', '프로그램'],
          ['choir', '합창/지휘'],
          ['orch', '오케스트라'],
          ['theme', '테마'],
        ] as const).map(([id, label]) => (
          <button key={id} style={tabStyle(tab === id)} onClick={() => setTab(id)}>{label}</button>
        ))}
      </div>

      {/* 기본 정보 */}
      {tab === 'basic' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

          {/* ── 상단 이미지 배경 ── */}
          <div style={{ padding: '12px', borderRadius: '8px', background: '#111', border: '1px solid #2a2a2a' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#ffdcbd', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              상단 이미지 배경
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>

              {/* 미리보기 */}
              {cfg.hero_image_url && (
                <div style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden', height: '100px' }}>
                  <img src={cfg.hero_image_url} alt="hero preview"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  <button
                    type="button"
                    onClick={() => set('hero_image_url', '')}
                    style={{
                      position: 'absolute', top: '6px', right: '6px',
                      width: '22px', height: '22px', borderRadius: '50%',
                      background: 'rgba(0,0,0,0.6)', border: 'none', color: '#fff',
                      fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                    title="이미지 제거"
                  >×</button>
                </div>
              )}

              {/* 업로드 버튼 */}
              <input
                ref={heroFileRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleHeroImageUpload}
              />
              <button
                type="button"
                disabled={uploading}
                onClick={() => heroFileRef.current?.click()}
                style={{
                  width: '100%', padding: '9px', borderRadius: '7px',
                  border: '1px dashed #444', background: uploading ? '#1a1a1a' : 'transparent',
                  color: uploading ? '#666' : '#ccc', fontSize: '13px', cursor: uploading ? 'default' : 'pointer',
                  fontWeight: 600,
                }}
              >
                {uploading ? '⏳ 업로드 중...' : cfg.hero_image_url ? '🔄 이미지 교체' : '📁 이미지 업로드'}
              </button>
              {uploadError && (
                <p style={{ fontSize: '11px', color: '#f87171', margin: 0 }}>{uploadError}</p>
              )}

              {/* URL 직접 입력 */}
              <div style={fieldStyle}>
                <label style={labelStyle}>또는 이미지 URL 직접 입력</label>
                <input style={inputStyle} placeholder="https://..." value={cfg.hero_image_url}
                  onChange={e => set('hero_image_url', e.target.value)} />
              </div>

              <div style={fieldStyle}>
                <label style={labelStyle}>영문 부제 (장식 라인)</label>
                <input style={inputStyle} value={cfg.hero_english_title}
                  onChange={e => set('hero_english_title', e.target.value)} />
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>이미지 영역 높이 (px)</label>
                <input type="number" style={inputStyle} value={cfg.hero_height}
                  onChange={e => set('hero_height', Number(e.target.value))} />
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={fieldStyle}>
              <label style={labelStyle}>연도</label>
              <input type="number" style={inputStyle} value={cfg.year}
                onChange={e => set('year', Number(e.target.value))} />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>이벤트 라벨</label>
              <input style={inputStyle} value={cfg.event_label}
                onChange={e => set('event_label', e.target.value)} />
            </div>
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>메인 타이틀 (줄바꿈: \n)</label>
            <textarea style={{ ...inputStyle, minHeight: '60px', resize: 'vertical' }}
              value={cfg.main_title}
              onChange={e => set('main_title', e.target.value)} />
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>부제 (선택)</label>
            <input style={inputStyle} value={cfg.sub_title}
              onChange={e => set('sub_title', e.target.value)} />
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>날짜/시간</label>
            <input style={inputStyle} value={cfg.date_label}
              onChange={e => set('date_label', e.target.value)} />
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>장소</label>
            <input style={inputStyle} value={cfg.venue_label}
              onChange={e => set('venue_label', e.target.value)} />
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>포스터 이미지 URL</label>
            <input style={inputStyle} value={cfg.poster_image_url}
              onChange={e => set('poster_image_url', e.target.value)} />
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>성경 구절</label>
            <textarea style={{ ...inputStyle, minHeight: '56px', resize: 'vertical' }}
              value={cfg.bible_verse}
              onChange={e => set('bible_verse', e.target.value)} />
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>성경 출처</label>
            <input style={inputStyle} value={cfg.bible_ref}
              onChange={e => set('bible_ref', e.target.value)} />
          </div>
          {/* 섹션 표시 토글 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '4px', borderTop: '1px solid #222' }}>
            <span style={labelStyle}>섹션 표시</span>
            {([
              ['show_program', '프로그램 목록'],
              ['show_choir', '합창단/오케스트라'],
              ['show_footer_verse', '성경 구절 푸터'],
            ] as const).map(([key, label]) => (
              <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input type="checkbox" checked={cfg[key] as boolean}
                  onChange={e => set(key, e.target.checked)} />
                <span style={{ color: '#ccc' }}>{label}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* 프로그램 */}
      {tab === 'program' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {cfg.program_items.map((item, idx) => (
            <div key={idx} style={{ background: '#1a1a1a', borderRadius: '8px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#ffdcbd' }}>{item.number}</span>
                <button onClick={() => removeProgramItem(idx)}
                  style={{ fontSize: '11px', color: '#f87171', background: 'none', border: 'none', cursor: 'pointer' }}>
                  삭제
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 3fr', gap: '8px' }}>
                <div style={fieldStyle}>
                  <label style={labelStyle}>번호</label>
                  <input style={inputStyle} value={item.number}
                    onChange={e => updateProgramItem(idx, 'number', e.target.value)} />
                </div>
                <div style={fieldStyle}>
                  <label style={labelStyle}>곡명</label>
                  <input style={inputStyle} value={item.title}
                    onChange={e => updateProgramItem(idx, 'title', e.target.value)} />
                </div>
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>연주자/구성</label>
                <input style={inputStyle} value={item.performer}
                  onChange={e => updateProgramItem(idx, 'performer', e.target.value)} />
              </div>
            </div>
          ))}
          <button onClick={addProgramItem}
            style={{ padding: '8px', borderRadius: '8px', border: '1px dashed #444', background: 'transparent', color: '#888', cursor: 'pointer', fontSize: '13px' }}>
            + 곡 추가
          </button>
        </div>
      )}

      {/* 합창/지휘 */}
      {tab === 'choir' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={fieldStyle}>
              <label style={labelStyle}>지휘자</label>
              <input style={inputStyle} value={cfg.conductor_name}
                onChange={e => set('conductor_name', e.target.value)} />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>피아니스트</label>
              <input style={inputStyle} value={cfg.pianist_name}
                onChange={e => set('pianist_name', e.target.value)} />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>오르가니스트 (선택)</label>
              <input style={inputStyle} placeholder="이름 입력시 표시" value={cfg.organist_name}
                onChange={e => set('organist_name', e.target.value)} />
            </div>
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>합창단 이름</label>
            <input style={inputStyle} value={cfg.choir_label}
              onChange={e => set('choir_label', e.target.value)} />
          </div>
          {([
            ['soprano', 'Soprano'],
            ['alto', 'Alto'],
            ['tenor', 'Tenor'],
            ['bass', 'Bass'],
          ] as const).map(([key, part]) => (
            <div key={key} style={fieldStyle}>
              <label style={labelStyle}>{part}</label>
              <textarea style={{ ...inputStyle, minHeight: '56px', resize: 'vertical' }}
                value={cfg[key] as string}
                onChange={e => set(key, e.target.value)} />
            </div>
          ))}
        </div>
      )}

      {/* 오케스트라 */}
      {tab === 'orch' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={fieldStyle}>
            <label style={labelStyle}>오케스트라 이름</label>
            <input style={inputStyle} value={cfg.orchestra_label}
              onChange={e => set('orchestra_label', e.target.value)} />
          </div>
          {cfg.orchestra_sections.map((sec, idx) => (
            <div key={idx} style={{ background: '#1a1a1a', borderRadius: '8px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#ffdcbd' }}>{sec.section || `섹션 ${idx + 1}`}</span>
                <button onClick={() => removeOrchSection(idx)}
                  style={{ fontSize: '11px', color: '#f87171', background: 'none', border: 'none', cursor: 'pointer' }}>
                  삭제
                </button>
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>섹션명</label>
                <input style={inputStyle} value={sec.section}
                  onChange={e => updateOrchSection(idx, 'section', e.target.value)} />
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>단원</label>
                <textarea style={{ ...inputStyle, minHeight: '56px', resize: 'vertical' }}
                  value={sec.members}
                  onChange={e => updateOrchSection(idx, 'members', e.target.value)} />
              </div>
            </div>
          ))}
          <button onClick={addOrchSection}
            style={{ padding: '8px', borderRadius: '8px', border: '1px dashed #444', background: 'transparent', color: '#888', cursor: 'pointer', fontSize: '13px' }}>
            + 섹션 추가
          </button>
        </div>
      )}

      {/* 테마 */}
      {tab === 'theme' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {([
            ['color_bg', '배경색'],
            ['color_surface', '서피스색'],
            ['color_primary', '주요 텍스트'],
            ['color_tertiary', '골드 강조색'],
            ['color_secondary', '보조 텍스트'],
          ] as const).map(([key, label]) => (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <input type="color" value={cfg[key] as string}
                onChange={e => set(key, e.target.value)}
                style={{ width: '40px', height: '32px', borderRadius: '4px', border: 'none', cursor: 'pointer', background: 'none' }} />
              <div style={{ flex: 1 }}>
                <div style={{ ...labelStyle, marginBottom: '2px' }}>{label}</div>
                <input style={inputStyle} value={cfg[key] as string}
                  onChange={e => set(key, e.target.value)} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
