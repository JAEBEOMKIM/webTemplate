import { BoardComponent, BoardConfigForm } from './board/BoardComponent'
import { CalendarComponent, CalendarConfigForm } from './calendar/CalendarComponent'
import { SurveyComponent, SurveyConfigForm } from './survey/SurveyComponent'
import { ImageGalleryComponent, ImageGalleryConfigForm } from './image-gallery/ImageGalleryComponent'
import { HtmlComponent, HtmlConfigForm } from './html/HtmlComponent'
import { MarkdownComponent, MarkdownConfigForm } from './markdown/MarkdownComponent'
import { ShareComponent, ShareConfigForm } from './share/ShareComponent'
import { TimetableComponent, TimetableConfigForm } from './timetable/TimetableComponent'
import { KakaoMapComponent, KakaoMapConfigForm } from './kakaomap/KakaoMapComponent'
import type { ComponentDefinition } from './types'

export const componentRegistry = new Map<string, ComponentDefinition>([
  [
    'board',
    {
      id: 'board',
      name: '게시판',
      description: '글 작성, 수정, 삭제 기능이 있는 게시판',
      icon: '📋',
      defaultConfig: { title: '게시판', allow_anonymous: false },
      Component: BoardComponent,
      ConfigForm: BoardConfigForm,
    },
  ],
  [
    'calendar',
    {
      id: 'calendar',
      name: '달력/스케줄',
      description: '일정 등록 및 관리 기능이 있는 캘린더',
      icon: '📅',
      defaultConfig: { title: '일정', allow_user_add: true },
      Component: CalendarComponent,
      ConfigForm: CalendarConfigForm,
    },
  ],
  [
    'survey',
    {
      id: 'survey',
      name: '설문조사',
      description: '다양한 방식의 설문조사 컴포넌트',
      icon: '📊',
      defaultConfig: { title: '설문조사', questions: [], allow_multiple: false },
      Component: SurveyComponent,
      ConfigForm: SurveyConfigForm,
    },
  ],
  [
    'image-gallery',
    {
      id: 'image-gallery',
      name: '이미지 갤러리',
      description: '연속 이미지 슬라이드쇼 및 갤러리',
      icon: '🖼️',
      defaultConfig: { title: '갤러리', images: [], autoplay: true, interval: 3000 },
      Component: ImageGalleryComponent,
      ConfigForm: ImageGalleryConfigForm,
    },
  ],
  [
    'html',
    {
      id: 'html',
      name: 'HTML',
      description: '직접 작성한 HTML을 그대로 표시',
      icon: '🖥️',
      defaultConfig: { html: '' },
      Component: HtmlComponent,
      ConfigForm: HtmlConfigForm,
    },
  ],
  [
    'markdown',
    {
      id: 'markdown',
      name: '마크다운',
      description: '마크다운 형식으로 텍스트 콘텐츠 작성',
      icon: '📝',
      defaultConfig: { content: '' },
      Component: MarkdownComponent,
      ConfigForm: MarkdownConfigForm,
    },
  ],
  [
    'share',
    {
      id: 'share',
      name: '공유하기',
      description: '카카오톡, 문자, 링크 복사 공유 버튼',
      icon: '🔗',
      defaultConfig: { title: '공유하기', description: '', show_kakao: true, show_sms: true, show_copy: true, kakao_app_key: '' },
      Component: ShareComponent,
      ConfigForm: ShareConfigForm,
    },
  ],
  [
    'timetable',
    {
      id: 'timetable',
      name: '하루 일정표',
      description: '시간별 하루 일정을 시각적으로 표시',
      icon: '🗓️',
      defaultConfig: { title: '하루 일정', events: [], start_hour: 8, end_hour: 22, show_timeline: true, show_legend: true },
      Component: TimetableComponent,
      ConfigForm: TimetableConfigForm,
    },
  ],
  [
    'kakaomap',
    {
      id: 'kakaomap',
      name: '카카오맵',
      description: '카카오맵으로 위치와 마커를 표시',
      icon: '🗺️',
      defaultConfig: {
        app_key: '',
        center_lat: 37.5665,
        center_lng: 126.9780,
        zoom: 3,
        map_type: 'ROADMAP',
        markers: [],
        show_controls: true,
        height: 400,
        use_current_location: false,
        destination_link: '',
        map_title: '',
      },
      Component: KakaoMapComponent,
      ConfigForm: KakaoMapConfigForm,
    },
  ],
])

export type { ComponentDefinition, ComponentProps, PageData, PageComponentData } from './types'
