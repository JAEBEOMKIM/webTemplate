-- =============================================
-- 017_daily_schedule_component.sql
-- 동적 하루일정표 컴포넌트 추가
-- 스크롤 위치에 따라 현재 시간대 부각되는 타임라인
-- =============================================

INSERT INTO component_definitions (
  id, name, description, icon, default_config, is_active
) VALUES (
  'daily-schedule',
  '동적 하루일정표',
  '스크롤 위치에 따라 현재 시간대가 부각되는 타임라인 일정표',
  '📋',
  '{
    "title": "오늘의 일정",
    "show_current_time": true,
    "auto_scroll": true,
    "compact_mode": false,
    "events": [
      { "id": "ev-1", "time": "09:00", "endTime": "10:00", "title": "모닝 스탠드업", "description": "팀 전체 진행 상황 공유", "color": "amber" },
      { "id": "ev-2", "time": "10:30", "endTime": "12:00", "title": "디자인 리뷰", "description": "UI/UX 피드백 및 수정사항 논의", "color": "purple" },
      { "id": "ev-3", "time": "12:00", "endTime": "13:00", "title": "점심 시간", "description": "", "color": "green" },
      { "id": "ev-4", "time": "14:00", "endTime": "15:30", "title": "스프린트 플래닝", "description": "다음 스프린트 백로그 정리 및 포인트 산정", "color": "blue" },
      { "id": "ev-5", "time": "16:00", "endTime": "17:00", "title": "1:1 미팅", "description": "팀원 개별 면담", "color": "teal" },
      { "id": "ev-6", "time": "17:30", "endTime": "18:00", "title": "일일 회고", "description": "오늘 진행한 작업 정리", "color": "rose" }
    ]
  }'::jsonb,
  true
)
ON CONFLICT (id) DO UPDATE SET
  name           = EXCLUDED.name,
  description    = EXCLUDED.description,
  icon           = EXCLUDED.icon,
  default_config = EXCLUDED.default_config,
  is_active      = EXCLUDED.is_active;

UPDATE component_definitions SET
  component_module   = 'daily-schedule',
  config_form_module = 'daily-schedule',
  grid_w             = 4,
  grid_h             = 8,
  grid_min_w         = 3,
  grid_min_h         = 4,
  display_order      = 18
WHERE id = 'daily-schedule';
