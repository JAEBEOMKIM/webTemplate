import { BoardComponent, BoardConfigForm } from './board/BoardComponent'
import { CalendarComponent, CalendarConfigForm } from './calendar/CalendarComponent'
import { SurveyComponent, SurveyConfigForm } from './survey/SurveyComponent'
import { ImageGalleryComponent, ImageGalleryConfigForm } from './image-gallery/ImageGalleryComponent'
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
])

export type { ComponentDefinition, ComponentProps, PageData, PageComponentData } from './types'
