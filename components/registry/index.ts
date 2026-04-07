import { AccordionComponent, AccordionConfigForm } from './accordion/AccordionComponent'
import { BentoGalleryComponent, BentoGalleryConfigForm } from './bento-gallery/BentoGalleryComponent'
import { DonutChartComponent, DonutChartConfigForm } from './donut-chart/DonutChartComponent'
import { BoardComponent, BoardConfigForm } from './board/BoardComponent'
import { CalendarComponent, CalendarConfigForm } from './calendar/CalendarComponent'
import { SurveyComponent, SurveyConfigForm } from './survey/SurveyComponent'
import { ImageGalleryComponent, ImageGalleryConfigForm } from './image-gallery/ImageGalleryComponent'
import { HtmlComponent, HtmlConfigForm } from './html/HtmlComponent'
import { MarkdownComponent, MarkdownConfigForm } from './markdown/MarkdownComponent'
import { ShareComponent, ShareConfigForm } from './share/ShareComponent'
import { TimetableComponent, TimetableConfigForm } from './timetable/TimetableComponent'
import { KakaoMapComponent, KakaoMapConfigForm } from './kakaomap/KakaoMapComponent'
import { BannerEditorComponent, BannerEditorConfigForm } from './banner-editor/BannerEditorComponent'
import { AboutSectionComponent, AboutSectionConfigForm } from './about-section/AboutSectionComponent'
import { MindmapComponent, MindmapConfigForm } from './mindmap/MindmapComponent'
import { TitleHeaderComponent, TitleHeaderConfigForm } from './title-header/TitleHeaderComponent'
import { EasterCantataComponent, EasterCantataConfigForm } from './easter-cantata/EasterCantataComponent'
import { DailyScheduleComponent, DailyScheduleConfigForm } from './daily-schedule/DailyScheduleComponent'
import { TextCardBannerComponent, TextCardBannerConfigForm } from './text-card-banner/TextCardBannerComponent'
import type {
  ComponentDefinition,
  ComponentImpl,
  ComponentDefinitionRow,
  ResolvedComponentDefinition,
} from './types'

// ── 코드 측 구현체 Map (module key → { Component, ConfigForm }) ──────────
// 개발자가 새 컴포넌트를 추가하면 여기에 등록해야 함
export const componentImplementations = new Map<string, ComponentImpl>([
  ['accordion', { Component: AccordionComponent, ConfigForm: AccordionConfigForm }],
  ['bento-gallery', { Component: BentoGalleryComponent, ConfigForm: BentoGalleryConfigForm }],
  ['donut-chart', { Component: DonutChartComponent, ConfigForm: DonutChartConfigForm }],
  ['board', { Component: BoardComponent, ConfigForm: BoardConfigForm }],
  ['calendar', { Component: CalendarComponent, ConfigForm: CalendarConfigForm }],
  ['survey', { Component: SurveyComponent, ConfigForm: SurveyConfigForm }],
  ['image-gallery', { Component: ImageGalleryComponent, ConfigForm: ImageGalleryConfigForm }],
  ['html', { Component: HtmlComponent, ConfigForm: HtmlConfigForm }],
  ['markdown', { Component: MarkdownComponent, ConfigForm: MarkdownConfigForm }],
  ['share', { Component: ShareComponent, ConfigForm: ShareConfigForm }],
  ['timetable', { Component: TimetableComponent, ConfigForm: TimetableConfigForm }],
  ['kakaomap', { Component: KakaoMapComponent, ConfigForm: KakaoMapConfigForm }],
  ['banner-editor', { Component: BannerEditorComponent, ConfigForm: BannerEditorConfigForm }],
  ['about-section', { Component: AboutSectionComponent, ConfigForm: AboutSectionConfigForm }],
  ['mindmap', { Component: MindmapComponent, ConfigForm: MindmapConfigForm }],
  ['title-header', { Component: TitleHeaderComponent, ConfigForm: TitleHeaderConfigForm }],
  ['easter-cantata', { Component: EasterCantataComponent, ConfigForm: EasterCantataConfigForm }],
  ['daily-schedule', { Component: DailyScheduleComponent, ConfigForm: DailyScheduleConfigForm }],
  ['text-card-banner', { Component: TextCardBannerComponent, ConfigForm: TextCardBannerConfigForm }],
])

// ── DB 행 + 코드 구현체 병합 → 렌더 가능한 컴포넌트만 반환 ──────────────
export function buildResolvedRegistry(
  dbDefs: ComponentDefinitionRow[]
): Map<string, ResolvedComponentDefinition> {
  const result = new Map<string, ResolvedComponentDefinition>()
  for (const row of dbDefs) {
    if (!row.is_active) continue
    const moduleKey = row.component_module ?? row.id
    const impl = componentImplementations.get(moduleKey)
    if (!impl) continue // 코드 구현체 없음 → 렌더 불가 → 건너뜀
    result.set(row.id, {
      id: row.id,
      name: row.name,
      description: row.description ?? '',
      icon: row.icon ?? '🧩',
      defaultConfig: row.default_config,
      Component: impl.Component,
      ConfigForm: impl.ConfigForm,
      groupId: row.group_id,
      gridW: row.grid_w,
      gridH: row.grid_h,
      gridMinW: row.grid_min_w,
      gridMinH: row.grid_min_h,
      displayOrder: row.display_order,
      isActive: row.is_active,
    })
  }
  return result
}

// ── 레거시 호환용 componentRegistry ──────────────────────────────────────
// DynamicPage.tsx 등 기존 코드에서 DB 없이도 동작하도록 유지
// 새 코드는 buildResolvedRegistry()를 사용할 것
export const componentRegistry = new Map<string, ComponentDefinition>([
  [
    'accordion',
    {
      id: 'accordion',
      name: '아코디언',
      description: '다단계 아코디언 + 펼침 목록 컴포넌트',
      icon: '📂',
      defaultConfig: {
        title: '',
        items: [
          {
            id: 'item-1',
            title: '회사 소개',
            icon: '🏢',
            color: 'blue',
            children: [
              { id: 'child-1-1', title: '미션', content: '우리의 미션은 고객의 삶을 개선하는 고품질 제품을 제공하는 것입니다.' },
              { id: 'child-1-2', title: '핵심 가치', content: '정직함, 혁신, 고객 만족이 우리의 모든 활동의 중심입니다.' },
            ],
          },
          {
            id: 'item-2',
            title: '서비스 안내',
            icon: '📋',
            color: 'teal',
            children: [
              { id: 'child-2-1', title: '기본 서비스', content: '기본 서비스에 대한 안내 내용입니다.' },
              { id: 'child-2-2', title: '프리미엄 서비스', content: '프리미엄 서비스에 대한 안내 내용입니다.' },
            ],
          },
        ],
      },
      Component: AccordionComponent,
      ConfigForm: AccordionConfigForm,
    },
  ],
  [
    'bento-gallery',
    {
      id: 'bento-gallery',
      name: '벤토 갤러리',
      description: '드래그 가능한 인터랙티브 이미지/영상 갤러리',
      icon: '🎨',
      defaultConfig: {
        title: '갤러리',
        description: '이미지와 영상 컬렉션',
        items: [
          { id: 'bg-1', type: 'image', title: '숲 속 길', desc: '신비로운 숲 속 트레일', url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800', span: 'md:col-span-1 md:row-span-3 sm:col-span-1 sm:row-span-2' },
          { id: 'bg-2', type: 'image', title: '해변 낙조', desc: '열대 해변의 일몰', url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800', span: 'md:col-span-2 md:row-span-2 sm:col-span-2 sm:row-span-2' },
          { id: 'bg-3', type: 'image', title: '가을 단풍', desc: '가을 풍경', url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800', span: 'md:col-span-1 md:row-span-3 sm:col-span-1 sm:row-span-2' },
          { id: 'bg-4', type: 'image', title: '산악 풍경', desc: '장엄한 산맥', url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800', span: 'md:col-span-2 md:row-span-2 sm:col-span-2 sm:row-span-2' },
        ],
      },
      Component: BentoGalleryComponent,
      ConfigForm: BentoGalleryConfigForm,
    },
  ],
  [
    'donut-chart',
    {
      id: 'donut-chart',
      name: '도넛 차트',
      description: '인터랙티브 도넛 차트 + 범례',
      icon: '🍩',
      defaultConfig: {
        title: '',
        segments: [
          { id: 'seg-1', label: '항목 A', value: 40, color: '#3b82f6' },
          { id: 'seg-2', label: '항목 B', value: 30, color: '#22c55e' },
          { id: 'seg-3', label: '항목 C', value: 20, color: '#f97316' },
          { id: 'seg-4', label: '항목 D', value: 10, color: '#a855f7' },
        ],
      },
      Component: DonutChartComponent,
      ConfigForm: DonutChartConfigForm,
    },
  ],
  ['board', { id: 'board', name: '게시판', description: '글 작성, 수정, 삭제 기능이 있는 게시판', icon: '📋', defaultConfig: { title: '게시판', allow_anonymous: false }, Component: BoardComponent, ConfigForm: BoardConfigForm }],
  ['calendar', { id: 'calendar', name: '달력/스케줄', description: '일정 등록 및 관리 기능이 있는 캘린더', icon: '📅', defaultConfig: { title: '일정', allow_user_add: true }, Component: CalendarComponent, ConfigForm: CalendarConfigForm }],
  ['survey', { id: 'survey', name: '설문조사', description: '다양한 방식의 설문조사 컴포넌트', icon: '📊', defaultConfig: { title: '설문조사', questions: [], allow_multiple: false }, Component: SurveyComponent, ConfigForm: SurveyConfigForm }],
  ['image-gallery', { id: 'image-gallery', name: '이미지 갤러리', description: '연속 이미지 슬라이드쇼 및 갤러리', icon: '🖼️', defaultConfig: { title: '갤러리', images: [], autoplay: true, interval: 3000 }, Component: ImageGalleryComponent, ConfigForm: ImageGalleryConfigForm }],
  ['html', { id: 'html', name: 'HTML', description: '직접 작성한 HTML을 그대로 표시', icon: '🖥️', defaultConfig: { html: '' }, Component: HtmlComponent, ConfigForm: HtmlConfigForm }],
  ['markdown', { id: 'markdown', name: '마크다운', description: '마크다운 형식으로 텍스트 콘텐츠 작성', icon: '📝', defaultConfig: { content: '' }, Component: MarkdownComponent, ConfigForm: MarkdownConfigForm }],
  ['share', { id: 'share', name: '공유하기', description: '카카오톡, 문자, 링크 복사 공유 버튼', icon: '🔗', defaultConfig: { title: '공유하기', description: '', show_kakao: true, show_sms: true, show_copy: true, kakao_app_key: '' }, Component: ShareComponent, ConfigForm: ShareConfigForm }],
  ['timetable', { id: 'timetable', name: '하루 일정표', description: '시간별 하루 일정을 시각적으로 표시', icon: '🗓️', defaultConfig: { title: '하루 일정', events: [], start_hour: 8, end_hour: 22, show_timeline: true, show_legend: true }, Component: TimetableComponent, ConfigForm: TimetableConfigForm }],
  ['kakaomap', { id: 'kakaomap', name: '카카오맵', description: '카카오맵으로 위치와 마커를 표시', icon: '🗺️', defaultConfig: { app_key: '', center_lat: 37.5665, center_lng: 126.9780, zoom: 3, map_type: 'ROADMAP', markers: [], show_controls: true, height: 400, use_current_location: false, destination_link: '', map_title: '' }, Component: KakaoMapComponent, ConfigForm: KakaoMapConfigForm }],
  ['banner-editor', { id: 'banner-editor', name: '배너 에디터', description: '레이어 기반 배너 이미지 편집기', icon: '🎨', defaultConfig: { canvasWidth: 900, canvasHeight: 300, background: { type: 'color', color: '#1e293b', imageUrl: '' }, layers: [], fabricJson: '', exportedImageUrl: null }, Component: BannerEditorComponent, ConfigForm: BannerEditorConfigForm }],
  ['about-section', { id: 'about-section', name: '소개 섹션', description: '서비스/통계/CTA를 포함한 전체 페이지형 소개 섹션', icon: '🏢', defaultConfig: { show_header: true, show_services: true, show_image: true, show_stats: true, show_cta: true, eyebrow: 'DISCOVER OUR STORY', title: 'About Us', subtitle: 'We are a passionate team dedicated to creating beautiful spaces.', image_url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&auto=format&fit=crop', image_alt: '대표 이미지', image_button_label: '포트폴리오 보기', image_button_url: '', services: [], stats: [], cta_title: '공간을 변화시킬 준비가 되셨나요?', cta_description: '함께 아름다운 공간을 만들어봅시다.', cta_button_label: '시작하기', cta_button_url: '', color_primary: '#202e44', color_accent: '#88734C', color_bg: '#F2F2EB', color_text: '#202e44' }, Component: AboutSectionComponent, ConfigForm: AboutSectionConfigForm }],
  ['mindmap', { id: 'mindmap', name: '마인드맵', description: '노드 기반 마인드맵 (링크 지원)', icon: '🧠', defaultConfig: { title: '마인드맵', canvasHeight: 500, nodes: [{ id: 'root', label: '중심 주제', color: 'blue', link: '', x: 250, y: 200, parentId: null }, { id: 'child-1', label: '주제 1', color: 'green', link: '', x: 500, y: 100, parentId: 'root' }, { id: 'child-2', label: '주제 2', color: 'purple', link: '', x: 500, y: 200, parentId: 'root' }, { id: 'child-3', label: '주제 3', color: 'orange', link: '', x: 500, y: 300, parentId: 'root' }] }, Component: MindmapComponent, ConfigForm: MindmapConfigForm }],
  ['title-header', { id: 'title-header', name: '타이틀 헤더', description: '타이프라이터/빛나는 텍스트 등 애니메이션 타이틀', icon: '✍️', defaultConfig: { variant: 'typewriter', texts: ['환영합니다', '반갑습니다', 'Welcome'], prefix: '', typingSpeed: 80, deletingSpeed: 40, pauseDuration: 2000, cursorChar: '|', cursorColor: '', gradientColors: '', gradientSpeed: 2, hoverGlow: false, fontSize: 32, fontFamily: 'inherit', fontWeight: 800, italic: false, align: 'center', textColor: '', subtitle: '', subtitleColor: '', link: '' }, Component: TitleHeaderComponent, ConfigForm: TitleHeaderConfigForm }],
  ['text-card-banner', { id: 'text-card-banner', name: '텍스트 카드배너', description: '3종 변형(Guide/Announcement/Feature) 카드 배너', icon: '🃏', defaultConfig: { heading: 'Chronos', subtitle: 'Editorial Guidelines & Updates', layout: 'stack', gap: 24, cards: [{ id: 'card-1', variant: 'guide', tag: 'New Guide', title: 'Mastering Deep Focus Intervals', description: 'Learn how to sequence your high-cognitive tasks during peak neurological windows while maintaining a serene workspace environment.', linkLabel: 'Read the methodology', color: 'primary' }, { id: 'card-2', variant: 'announcement', tag: 'Important', title: 'System Integrity Protocol', meta: 'Released 2 hours ago', description: 'We are transitioning our internal data structures to prioritize asynchronous composure. This ensures background scheduling and dependency mapping with absolute silence.', buttonLabel: 'Acknowledge Changes', color: 'primary' }, { id: 'card-3', variant: 'feature', title: 'Evolution of the Fluid Timeline', description: 'Version 2.4 introduces a more nuanced way to visualize your days momentum.', bullets: ['Dynamic node scaling based on task complexity', 'Ambient glow indicators for focus areas', 'Reduced visual noise in low-density periods'], badge: 'V2.4 STABLE RELEASE', color: 'primary' }] }, Component: TextCardBannerComponent, ConfigForm: TextCardBannerConfigForm }],
  ['daily-schedule', { id: 'daily-schedule', name: '동적 하루일정표', description: '스크롤 위치에 따라 현재 시간대가 부각되는 타임라인 일정표', icon: '📋', defaultConfig: { title: '오늘의 일정', show_current_time: true, auto_scroll: true, compact_mode: false, events: [{ id: 'ev-1', time: '09:00', endTime: '10:00', title: '모닝 스탠드업', description: '팀 전체 진행 상황 공유', color: 'amber' }, { id: 'ev-2', time: '10:30', endTime: '12:00', title: '디자인 리뷰', description: 'UI/UX 피드백 및 수정사항 논의', color: 'purple' }, { id: 'ev-3', time: '12:00', endTime: '13:00', title: '점심 시간', description: '', color: 'green' }, { id: 'ev-4', time: '14:00', endTime: '15:30', title: '스프린트 플래닝', description: '다음 스프린트 백로그 정리 및 포인트 산정', color: 'blue' }, { id: 'ev-5', time: '16:00', endTime: '17:00', title: '1:1 미팅', description: '팀원 개별 면담', color: 'teal' }, { id: 'ev-6', time: '17:30', endTime: '18:00', title: '일일 회고', description: '오늘 진행한 작업 정리', color: 'rose' }] }, Component: DailyScheduleComponent, ConfigForm: DailyScheduleConfigForm }],
  ['easter-cantata', { id: 'easter-cantata', name: '부활절 칸타타', description: '교회 칸타타 팜플렛 (다크 테마)', icon: '✝️', defaultConfig: { year: 2026, event_label: 'Easter Cantata', main_title: '만왕의 왕\n예수 그리스도', sub_title: '', date_label: '2026년 4월 3일 오후 7시', venue_label: '등촌 교회 본당', poster_image_url: '', show_program: true, show_choir: true, show_footer_verse: true, program_items: [{ number: '01', title: '예수 그리스도', performer: '합창' }], conductor_name: '', pianist_name: '', choir_label: '찬양대', soprano: '', alto: '', tenor: '', bass: '', orchestra_label: '앙상블', orchestra_sections: [], bible_verse: '"그리스도께서 다시 살아나신 일이 없으면 너희의 믿음도 헛되고"', bible_ref: '(고린도전서 15:17)', color_bg: '#1a0f1c', color_surface: '#261629', color_primary: '#f2dfd0', color_tertiary: '#ffdcbd', color_secondary: '#d5c3b5' }, Component: EasterCantataComponent, ConfigForm: EasterCantataConfigForm }],
])

export type { ComponentDefinition, ComponentProps, PageData, PageComponentData } from './types'
export type { ComponentImpl, ComponentDefinitionRow, ComponentGroupRow, ResolvedComponentDefinition, ComponentGroupNode } from './types'
