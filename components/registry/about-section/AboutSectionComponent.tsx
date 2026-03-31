'use client'

import { useEffect, useRef, useState } from 'react'
import {
  Pen, PaintBucket, Home, Ruler, PenTool, Building2,
  Award, Users, Calendar, CheckCircle, Sparkles, Star,
  ArrowRight, Zap, TrendingUp, LucideIcon,
} from 'lucide-react'
import {
  motion, useScroll, useTransform, useInView, useSpring, type Variants,
} from 'framer-motion'
import type { ComponentProps, ConfigFormProps } from '../types'

// ── Types ──────────────────────────────────────────────────────────────────

interface ServiceItem {
  icon: string   // lucide icon key
  title: string
  description: string
  position: 'left' | 'right'
}

interface StatItem {
  icon: string   // lucide icon key
  value: number
  label: string
  suffix: string
}

interface AboutSectionConfig {
  // Section visibility
  show_header: boolean
  show_services: boolean
  show_image: boolean
  show_stats: boolean
  show_cta: boolean

  // Header
  eyebrow: string
  title: string
  subtitle: string

  // Center image
  image_url: string
  image_alt: string
  image_button_label: string
  image_button_url: string

  // Services
  services: ServiceItem[]

  // Stats
  stats: StatItem[]

  // CTA
  cta_title: string
  cta_description: string
  cta_button_label: string
  cta_button_url: string

  // Theme colors
  color_primary: string
  color_accent: string
  color_bg: string
  color_text: string
}

// ── Icon Map ───────────────────────────────────────────────────────────────

const ICON_MAP: Record<string, LucideIcon> = {
  Pen, PaintBucket, Home, Ruler, PenTool, Building2,
  Award, Users, Calendar, CheckCircle, Sparkles, Star,
  ArrowRight, Zap, TrendingUp,
}

const ICON_OPTIONS = Object.keys(ICON_MAP)

function DynIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICON_MAP[name] ?? Zap
  return <Icon className={className} />
}

// ── Stat Counter ───────────────────────────────────────────────────────────

const cardVariants: Variants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.6 } },
}

const statVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: (delay: number) => ({ opacity: 1, y: 0, transition: { duration: 0.6, delay } }),
}

function StatCounter({ icon, value, label, suffix, delay, accentColor, textColor }: StatItem & { delay: number; accentColor: string; textColor: string }) {
  const countRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(countRef, { once: false })
  const [hasAnimated, setHasAnimated] = useState(false)
  const springValue = useSpring(0, { stiffness: 50, damping: 10 })
  const displayValue = useTransform(springValue, (v) => Math.floor(v))

  useEffect(() => {
    if (isInView && !hasAnimated) { springValue.set(value); setHasAnimated(true) }
    else if (!isInView && hasAnimated) { springValue.set(0); setHasAnimated(false) }
  }, [isInView, value, springValue, hasAnimated])

  return (
    <motion.div
      className="p-6 rounded-xl flex flex-col items-center text-center group"
      style={{ background: 'rgba(255,255,255,0.5)', backdropFilter: 'blur(4px)' }}
      variants={statVariants}
      custom={delay}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
    >
      <motion.div
        className="w-14 h-14 rounded-full flex items-center justify-center mb-4"
        style={{ background: `${accentColor}15`, color: accentColor }}
        whileHover={{ rotate: 360, transition: { duration: 0.8 } }}
      >
        <DynIcon name={icon} className="w-6 h-6" />
      </motion.div>
      <div ref={countRef} className="text-3xl font-bold flex items-center" style={{ color: textColor }}>
        <motion.span>{displayValue}</motion.span>
        <span>{suffix}</span>
      </div>
      <p className="text-sm mt-1" style={{ color: `${textColor}99` }}>{label}</p>
      <motion.div
        className="h-0.5 mt-3 transition-all duration-300"
        style={{ width: 40, background: accentColor }}
        whileHover={{ width: 64 }}
      />
    </motion.div>
  )
}

// ── Service Item ───────────────────────────────────────────────────────────

function ServiceItemCard({ item, delay, direction, accentColor, textColor }: {
  item: ServiceItem; delay: number; direction: 'left' | 'right'; accentColor: string; textColor: string
}) {
  return (
    <motion.div
      className="flex flex-col group"
      variants={cardVariants}
      transition={{ delay }}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
    >
      <motion.div
        className="flex items-center gap-3 mb-3"
        initial={{ x: direction === 'left' ? -20 : 20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: delay + 0.2 }}
      >
        <motion.div
          className="p-3 rounded-lg relative"
          style={{ background: `${accentColor}18`, color: accentColor }}
          whileHover={{ rotate: [0, -10, 10, -5, 0], transition: { duration: 0.5 } }}
        >
          <DynIcon name={item.icon} className="w-6 h-6" />
        </motion.div>
        <h3 className="text-xl font-medium transition-colors duration-300" style={{ color: textColor }}>
          {item.title}
        </h3>
      </motion.div>
      <motion.p
        className="text-sm leading-relaxed pl-12"
        style={{ color: `${textColor}cc` }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: delay + 0.4 }}
      >
        {item.description}
      </motion.p>
    </motion.div>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────

const DEFAULT_CONFIG: AboutSectionConfig = {
  show_header: true,
  show_services: true,
  show_image: true,
  show_stats: true,
  show_cta: true,

  eyebrow: 'DISCOVER OUR STORY',
  title: 'About Us',
  subtitle: 'We are a passionate team of designers and architects dedicated to creating beautiful, functional spaces that inspire and elevate everyday living.',

  image_url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&auto=format&fit=crop',
  image_alt: '대표 이미지',
  image_button_label: '포트폴리오 보기',
  image_button_url: '',

  services: [
    { icon: 'Pen',        title: '인테리어',  description: '전문적인 인테리어 디자인으로 공간을 혁신적으로 변화시킵니다. 기능성과 미학을 결합하여 당신만의 스타일을 표현합니다.', position: 'left' },
    { icon: 'Home',       title: '익스테리어', description: '아름다운 외관 디자인으로 첫인상을 완성합니다. 건축과 조경의 조화로운 연결을 만들어냅니다.', position: 'left' },
    { icon: 'PenTool',    title: '디자인',    description: '창의성과 실용성을 결합한 혁신적인 설계 프로세스로 아름답고 기능적인 공간을 만들어냅니다.', position: 'left' },
    { icon: 'PaintBucket',title: '데코레이션', description: '색상, 소재, 액세서리까지 모든 디테일을 완벽하게 조율하여 당신의 비전을 현실로 구현합니다.', position: 'right' },
    { icon: 'Ruler',      title: '플래닝',    description: '개념에서 완성까지 프로젝트가 원활하게 진행되도록 세심하게 계획합니다.', position: 'right' },
    { icon: 'Building2',  title: '시공',      description: '숙련된 팀이 모든 구현 과정을 정밀하고 세심하게 처리하여 꿈의 공간을 완성합니다.', position: 'right' },
  ],

  stats: [
    { icon: 'Award',      value: 150,  label: '완료 프로젝트', suffix: '+' },
    { icon: 'Users',      value: 1200, label: '만족 고객',     suffix: '+' },
    { icon: 'Calendar',   value: 12,   label: '업력 (년)',     suffix: '' },
    { icon: 'TrendingUp', value: 98,   label: '만족도',        suffix: '%' },
  ],

  cta_title: '공간을 변화시킬 준비가 되셨나요?',
  cta_description: '함께 아름다운 공간을 만들어봅시다.',
  cta_button_label: '시작하기',
  cta_button_url: '',

  color_primary: '#202e44',
  color_accent: '#88734C',
  color_bg: '#F2F2EB',
  color_text: '#202e44',
}

export function AboutSectionComponent({ config }: ComponentProps) {
  const cfg = { ...DEFAULT_CONFIG, ...(config as Partial<AboutSectionConfig>) }
  if (!cfg.services?.length) cfg.services = DEFAULT_CONFIG.services
  if (!cfg.stats?.length) cfg.stats = DEFAULT_CONFIG.stats

  const sectionRef = useRef<HTMLDivElement>(null)
  const statsRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(sectionRef, { once: false, amount: 0.1 })
  const isStatsInView = useInView(statsRef, { once: false, amount: 0.3 })

  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start end', 'end start'] })
  const y1 = useTransform(scrollYProgress, [0, 1], [0, -50])
  const y2 = useTransform(scrollYProgress, [0, 1], [0, 50])
  const rotate1 = useTransform(scrollYProgress, [0, 1], [0, 20])
  const rotate2 = useTransform(scrollYProgress, [0, 1], [0, -20])

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.2, delayChildren: 0.3 } },
  }
  const itemVariants: Variants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.6 } },
  }

  const leftServices = cfg.services.filter(s => s.position === 'left')
  const rightServices = cfg.services.filter(s => s.position === 'right')
  const hasServices = cfg.show_services && cfg.services.length > 0
  const showCenter = cfg.show_image || hasServices

  return (
    <section
      ref={sectionRef}
      className="w-full py-24 px-4 overflow-hidden relative"
      style={{
        background: `linear-gradient(to bottom, ${cfg.color_bg}, ${cfg.color_bg}f0)`,
        color: cfg.color_text,
      }}
    >
      {/* Background decorations */}
      <motion.div className="absolute top-20 left-10 w-64 h-64 rounded-full blur-3xl" style={{ y: y1, rotate: rotate1, background: `${cfg.color_accent}0d` }} />
      <motion.div className="absolute bottom-20 right-10 w-80 h-80 rounded-full blur-3xl" style={{ y: y2, rotate: rotate2, background: `${cfg.color_primary}0d` }} />
      <motion.div className="absolute top-1/2 left-1/4 w-4 h-4 rounded-full" style={{ background: `${cfg.color_accent}50` }} animate={{ y: [0, -15, 0], opacity: [0.5, 1, 0.5] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }} />
      <motion.div className="absolute bottom-1/3 right-1/4 w-6 h-6 rounded-full" style={{ background: `${cfg.color_primary}50` }} animate={{ y: [0, 20, 0], opacity: [0.5, 1, 0.5] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1 }} />

      <motion.div
        className="container mx-auto max-w-6xl relative z-10"
        initial="hidden"
        animate={isInView ? 'visible' : 'hidden'}
        variants={containerVariants}
      >
        {/* ── Header ── */}
        {cfg.show_header && (
          <>
            <motion.div className="flex flex-col items-center mb-6" variants={itemVariants}>
              <motion.span
                className="font-medium mb-2 flex items-center gap-2 text-sm"
                style={{ color: cfg.color_accent }}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <Zap className="w-4 h-4" />
                {cfg.eyebrow}
              </motion.span>
              <h2 className="text-4xl md:text-5xl font-light mb-4 text-center" style={{ color: cfg.color_text }}>
                {cfg.title}
              </h2>
              <motion.div
                className="h-1 rounded-full"
                style={{ background: cfg.color_accent }}
                initial={{ width: 0 }}
                animate={{ width: 96 }}
                transition={{ duration: 1, delay: 0.5 }}
              />
            </motion.div>

            {cfg.subtitle && (
              <motion.p
                className="text-center max-w-2xl mx-auto mb-16"
                style={{ color: `${cfg.color_text}cc` }}
                variants={itemVariants}
              >
                {cfg.subtitle}
              </motion.p>
            )}
          </>
        )}

        {/* ── Services + Center Image ── */}
        {showCenter && (
          <div className={`grid gap-8 ${(hasServices && leftServices.length > 0 && rightServices.length > 0) ? 'md:grid-cols-3' : cfg.show_image ? 'md:grid-cols-1' : 'md:grid-cols-2'} relative`}>

            {/* Left services */}
            {hasServices && leftServices.length > 0 && (
              <div className="space-y-16">
                {leftServices.map((svc, i) => (
                  <ServiceItemCard key={i} item={svc} delay={i * 0.2} direction="left" accentColor={cfg.color_accent} textColor={cfg.color_text} />
                ))}
              </div>
            )}

            {/* Center image */}
            {cfg.show_image && (
              <div className="flex justify-center items-center order-first md:order-none mb-8 md:mb-0">
                <motion.div className="relative w-full max-w-xs" variants={itemVariants}>
                  <motion.div
                    className="rounded-md overflow-hidden shadow-xl"
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                    whileHover={{ scale: 1.03, transition: { duration: 0.3 } }}
                  >
                    <img
                      src={cfg.image_url || DEFAULT_CONFIG.image_url}
                      alt={cfg.image_alt || '대표 이미지'}
                      className="w-full h-full object-cover"
                      style={{ minHeight: 300 }}
                    />
                    {cfg.image_button_label && (
                      <motion.div
                        className="absolute inset-0 flex items-end justify-center p-4"
                        style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.5), transparent)' }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.8, delay: 0.9 }}
                      >
                        <motion.button
                          className="bg-white px-4 py-2 rounded-full flex items-center gap-2 text-sm font-medium"
                          style={{ color: cfg.color_primary }}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => { if (cfg.image_button_url) window.open(cfg.image_button_url, '_blank', 'noopener') }}
                        >
                          {cfg.image_button_label} <ArrowRight className="w-4 h-4" />
                        </motion.button>
                      </motion.div>
                    )}
                  </motion.div>
                  {/* Accent border */}
                  <motion.div
                    className="absolute inset-0 rounded-md -m-3"
                    style={{ border: `4px solid ${cfg.color_primary}40`, zIndex: -1 }}
                    initial={{ opacity: 0, scale: 1.1 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, delay: 0.6 }}
                  />
                  {/* Floating blobs */}
                  <motion.div className="absolute -top-4 -right-8 w-16 h-16 rounded-full" style={{ background: `${cfg.color_accent}1a`, y: y1 }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.9 }} />
                  <motion.div className="absolute -bottom-6 -left-10 w-20 h-20 rounded-full" style={{ background: `${cfg.color_primary}26`, y: y2 }} initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 1.1 }} />
                </motion.div>
              </div>
            )}

            {/* Right services */}
            {hasServices && rightServices.length > 0 && (
              <div className="space-y-16">
                {rightServices.map((svc, i) => (
                  <ServiceItemCard key={i} item={svc} delay={i * 0.2} direction="right" accentColor={cfg.color_accent} textColor={cfg.color_text} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Stats ── */}
        {cfg.show_stats && cfg.stats.length > 0 && (
          <motion.div
            ref={statsRef}
            className="mt-24 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8"
            initial="hidden"
            animate={isStatsInView ? 'visible' : 'hidden'}
            variants={containerVariants}
          >
            {cfg.stats.map((stat, i) => (
              <StatCounter key={i} {...stat} delay={i * 0.1} accentColor={cfg.color_accent} textColor={cfg.color_text} />
            ))}
          </motion.div>
        )}

        {/* ── CTA ── */}
        {cfg.show_cta && (
          <motion.div
            className="mt-20 p-8 rounded-xl flex flex-col md:flex-row items-center justify-between gap-6"
            style={{ background: cfg.color_primary, color: '#fff' }}
            initial={{ opacity: 0, y: 30 }}
            animate={isStatsInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.8, delay: 0.5 }}
          >
            <div className="flex-1">
              <h3 className="text-2xl font-medium mb-2">{cfg.cta_title}</h3>
              {cfg.cta_description && (
                <p style={{ color: 'rgba(255,255,255,0.8)' }}>{cfg.cta_description}</p>
              )}
            </div>
            {cfg.cta_button_label && (
              <motion.button
                className="px-6 py-3 rounded-lg flex items-center gap-2 font-medium transition-colors"
                style={{ background: cfg.color_accent, color: '#fff' }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => { if (cfg.cta_button_url) window.open(cfg.cta_button_url, '_blank', 'noopener') }}
              >
                {cfg.cta_button_label} <ArrowRight className="w-4 h-4" />
              </motion.button>
            )}
          </motion.div>
        )}
      </motion.div>
    </section>
  )
}

// ── Config Form ────────────────────────────────────────────────────────────

const labelStyle: React.CSSProperties = {
  fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)',
  textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px', display: 'block',
}
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '7px 10px', fontSize: '13px',
  border: '1px solid var(--border)', borderRadius: '8px',
  background: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none',
}
const btnStyle: React.CSSProperties = {
  padding: '5px 10px', fontSize: '11px', fontWeight: 600,
  border: '1px solid var(--border)', borderRadius: '6px',
  background: 'var(--bg-secondary)', color: 'var(--text-primary)', cursor: 'pointer',
}
const sectionBoxStyle: React.CSSProperties = {
  border: '1px solid var(--border)', borderRadius: '10px',
  padding: '12px', background: 'var(--bg-primary)',
  display: 'flex', flexDirection: 'column', gap: '10px',
}

function ToggleRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <input
        type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)}
        style={{ width: 14, height: 14, accentColor: 'var(--accent)' }}
      />
      <span style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{label}</span>
    </div>
  )
}

export function AboutSectionConfigForm({ config, onChange }: ConfigFormProps) {
  const cfg = { ...DEFAULT_CONFIG, ...(config as Partial<AboutSectionConfig>) }
  if (!cfg.services?.length) cfg.services = [...DEFAULT_CONFIG.services]
  if (!cfg.stats?.length) cfg.stats = [...DEFAULT_CONFIG.stats]

  const [tab, setTab] = useState<'sections' | 'header' | 'image' | 'services' | 'stats' | 'cta' | 'theme'>('sections')

  const up = (patch: Partial<AboutSectionConfig>) => onChange({ ...config, ...patch })

  const tabBtnStyle = (t: string): React.CSSProperties => ({
    padding: '5px 10px', fontSize: '11px', fontWeight: 600, cursor: 'pointer',
    borderRadius: '6px', border: 'none',
    background: tab === t ? 'var(--accent)' : 'var(--bg-secondary)',
    color: tab === t ? 'white' : 'var(--text-primary)',
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Tabs */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
        {(['sections', 'header', 'image', 'services', 'stats', 'cta', 'theme'] as const).map(t => (
          <button key={t} style={tabBtnStyle(t)} onClick={() => setTab(t)}>
            {{ sections: '영역', header: '헤더', image: '이미지', services: '서비스', stats: '통계', cta: 'CTA', theme: '테마' }[t]}
          </button>
        ))}
      </div>

      {/* ── 영역 표시/숨김 ── */}
      {tab === 'sections' && (
        <div style={sectionBoxStyle}>
          <label style={labelStyle}>표시할 영역</label>
          <ToggleRow label="헤더 (제목/부제목)" checked={cfg.show_header} onChange={v => up({ show_header: v })} />
          <ToggleRow label="서비스 목록 (좌/우 컬럼)" checked={cfg.show_services} onChange={v => up({ show_services: v })} />
          <ToggleRow label="중앙 이미지" checked={cfg.show_image} onChange={v => up({ show_image: v })} />
          <ToggleRow label="통계 카드" checked={cfg.show_stats} onChange={v => up({ show_stats: v })} />
          <ToggleRow label="CTA 배너" checked={cfg.show_cta} onChange={v => up({ show_cta: v })} />
        </div>
      )}

      {/* ── 헤더 ── */}
      {tab === 'header' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div>
            <label style={labelStyle}>아이콘 텍스트 (Eyebrow)</label>
            <input style={inputStyle} value={cfg.eyebrow} onChange={e => up({ eyebrow: e.target.value })} />
          </div>
          <div>
            <label style={labelStyle}>메인 제목</label>
            <input style={inputStyle} value={cfg.title} onChange={e => up({ title: e.target.value })} />
          </div>
          <div>
            <label style={labelStyle}>부제목</label>
            <textarea style={{ ...inputStyle, resize: 'vertical' }} rows={3} value={cfg.subtitle} onChange={e => up({ subtitle: e.target.value })} />
          </div>
        </div>
      )}

      {/* ── 이미지 ── */}
      {tab === 'image' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div>
            <label style={labelStyle}>이미지 URL</label>
            <input style={inputStyle} value={cfg.image_url} onChange={e => up({ image_url: e.target.value })} placeholder="https://..." />
          </div>
          {cfg.image_url && (
            <img src={cfg.image_url} alt="preview" style={{ width: '100%', maxHeight: 160, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--border)' }} />
          )}
          <div>
            <label style={labelStyle}>이미지 대체 텍스트</label>
            <input style={inputStyle} value={cfg.image_alt} onChange={e => up({ image_alt: e.target.value })} />
          </div>
          <div>
            <label style={labelStyle}>이미지 위 버튼 텍스트</label>
            <input style={inputStyle} value={cfg.image_button_label} onChange={e => up({ image_button_label: e.target.value })} placeholder="비워두면 버튼 숨김" />
          </div>
          <div>
            <label style={labelStyle}>이미지 위 버튼 URL</label>
            <input style={inputStyle} value={cfg.image_button_url} onChange={e => up({ image_button_url: e.target.value })} placeholder="https://..." />
          </div>
        </div>
      )}

      {/* ── 서비스 ── */}
      {tab === 'services' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {cfg.services.map((svc, i) => (
            <div key={i} style={{ ...sectionBoxStyle, position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>서비스 {i + 1}</span>
                <button
                  style={{ ...btnStyle, color: '#ef4444', padding: '3px 8px', fontSize: '11px' }}
                  onClick={() => up({ services: cfg.services.filter((_, j) => j !== i) })}
                >×</button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                <div>
                  <label style={{ ...labelStyle, fontSize: '10px' }}>제목</label>
                  <input style={{ ...inputStyle, fontSize: '12px' }} value={svc.title}
                    onChange={e => {
                      const s = [...cfg.services]; s[i] = { ...s[i], title: e.target.value }
                      up({ services: s })
                    }}
                  />
                </div>
                <div>
                  <label style={{ ...labelStyle, fontSize: '10px' }}>위치</label>
                  <select style={{ ...inputStyle, fontSize: '12px', cursor: 'pointer' }} value={svc.position}
                    onChange={e => {
                      const s = [...cfg.services]; s[i] = { ...s[i], position: e.target.value as 'left' | 'right' }
                      up({ services: s })
                    }}
                  >
                    <option value="left">왼쪽</option>
                    <option value="right">오른쪽</option>
                  </select>
                </div>
              </div>
              <div>
                <label style={{ ...labelStyle, fontSize: '10px' }}>아이콘</label>
                <select style={{ ...inputStyle, fontSize: '12px', cursor: 'pointer' }} value={svc.icon}
                  onChange={e => {
                    const s = [...cfg.services]; s[i] = { ...s[i], icon: e.target.value }
                    up({ services: s })
                  }}
                >
                  {ICON_OPTIONS.map(ic => <option key={ic} value={ic}>{ic}</option>)}
                </select>
              </div>
              <div>
                <label style={{ ...labelStyle, fontSize: '10px' }}>설명</label>
                <textarea style={{ ...inputStyle, fontSize: '12px', resize: 'vertical' }} rows={2} value={svc.description}
                  onChange={e => {
                    const s = [...cfg.services]; s[i] = { ...s[i], description: e.target.value }
                    up({ services: s })
                  }}
                />
              </div>
            </div>
          ))}
          <button style={{ ...btnStyle, textAlign: 'center' }}
            onClick={() => up({ services: [...cfg.services, { icon: 'Zap', title: '새 서비스', description: '서비스 설명을 입력하세요.', position: cfg.services.filter(s => s.position === 'left').length <= cfg.services.filter(s => s.position === 'right').length ? 'left' : 'right' }] })}
          >
            + 서비스 추가
          </button>
        </div>
      )}

      {/* ── 통계 ── */}
      {tab === 'stats' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {cfg.stats.map((stat, i) => (
            <div key={i} style={{ ...sectionBoxStyle }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>통계 {i + 1}</span>
                <button style={{ ...btnStyle, color: '#ef4444', padding: '3px 8px' }} onClick={() => up({ stats: cfg.stats.filter((_, j) => j !== i) })}>×</button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                <div>
                  <label style={{ ...labelStyle, fontSize: '10px' }}>수치</label>
                  <input type="number" style={{ ...inputStyle, fontSize: '12px' }} value={stat.value}
                    onChange={e => { const s = [...cfg.stats]; s[i] = { ...s[i], value: parseInt(e.target.value) || 0 }; up({ stats: s }) }}
                  />
                </div>
                <div>
                  <label style={{ ...labelStyle, fontSize: '10px' }}>접미사</label>
                  <input style={{ ...inputStyle, fontSize: '12px' }} value={stat.suffix} placeholder="+ / % / 없음"
                    onChange={e => { const s = [...cfg.stats]; s[i] = { ...s[i], suffix: e.target.value }; up({ stats: s }) }}
                  />
                </div>
              </div>
              <div>
                <label style={{ ...labelStyle, fontSize: '10px' }}>레이블</label>
                <input style={{ ...inputStyle, fontSize: '12px' }} value={stat.label}
                  onChange={e => { const s = [...cfg.stats]; s[i] = { ...s[i], label: e.target.value }; up({ stats: s }) }}
                />
              </div>
              <div>
                <label style={{ ...labelStyle, fontSize: '10px' }}>아이콘</label>
                <select style={{ ...inputStyle, fontSize: '12px', cursor: 'pointer' }} value={stat.icon}
                  onChange={e => { const s = [...cfg.stats]; s[i] = { ...s[i], icon: e.target.value }; up({ stats: s }) }}
                >
                  {ICON_OPTIONS.map(ic => <option key={ic} value={ic}>{ic}</option>)}
                </select>
              </div>
            </div>
          ))}
          <button style={{ ...btnStyle, textAlign: 'center' }}
            onClick={() => up({ stats: [...cfg.stats, { icon: 'Award', value: 0, label: '새 통계', suffix: '' }] })}
          >
            + 통계 추가
          </button>
        </div>
      )}

      {/* ── CTA ── */}
      {tab === 'cta' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div>
            <label style={labelStyle}>CTA 제목</label>
            <input style={inputStyle} value={cfg.cta_title} onChange={e => up({ cta_title: e.target.value })} />
          </div>
          <div>
            <label style={labelStyle}>CTA 설명</label>
            <input style={inputStyle} value={cfg.cta_description} onChange={e => up({ cta_description: e.target.value })} />
          </div>
          <div>
            <label style={labelStyle}>버튼 텍스트</label>
            <input style={inputStyle} value={cfg.cta_button_label} onChange={e => up({ cta_button_label: e.target.value })} placeholder="비워두면 버튼 숨김" />
          </div>
          <div>
            <label style={labelStyle}>버튼 URL</label>
            <input style={inputStyle} value={cfg.cta_button_url} onChange={e => up({ cta_button_url: e.target.value })} placeholder="https://..." />
          </div>
        </div>
      )}

      {/* ── 테마 ── */}
      {tab === 'theme' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {([
            { key: 'color_primary', label: '주요 색상 (헤더/CTA 배경)' },
            { key: 'color_accent', label: '강조 색상 (아이콘/언더라인)' },
            { key: 'color_bg', label: '배경 색상' },
            { key: 'color_text', label: '텍스트 색상' },
          ] as { key: keyof AboutSectionConfig; label: string }[]).map(({ key, label }) => (
            <div key={key}>
              <label style={labelStyle}>{label}</label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input type="color" value={(cfg[key] as string) || '#000000'}
                  onChange={e => up({ [key]: e.target.value } as Partial<AboutSectionConfig>)}
                  style={{ width: 36, height: 30, border: 'none', cursor: 'pointer', borderRadius: 6 }}
                />
                <span style={{ fontSize: '12px', fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                  {(cfg[key] as string) || ''}
                </span>
              </div>
            </div>
          ))}
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', padding: '8px', background: 'var(--bg-secondary)', borderRadius: 8 }}>
            💡 배경 색상은 전체 섹션 배경에 적용됩니다. 이 컴포넌트는 전체 너비로 렌더링되도록 그리드에서 넓게 배치하세요.
          </div>
        </div>
      )}
    </div>
  )
}
