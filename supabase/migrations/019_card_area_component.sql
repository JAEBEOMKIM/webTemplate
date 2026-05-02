-- =============================================
-- 019_card_area_component.sql
-- 카드 영역 컴포넌트 추가
-- 클릭 시 링크 / 바텀시트 / 모달로 상세 정보 표시
-- 배경 (단색/그라디언트/이미지) + 호버 애니메이션 지원
-- =============================================

INSERT INTO component_definitions (
  id, name, description, icon, default_config, is_active
) VALUES (
  'card-area',
  '카드 영역',
  '클릭 가능한 카드 그리드 (링크/바텀시트/모달, 배경 + 애니메이션 지원)',
  '🃏',
  '{
    "title": "주요 메뉴",
    "subtitle": "카드를 클릭해 자세히 보세요",
    "layout": "grid",
    "columns_desktop": 3,
    "columns_mobile": 1,
    "gap": 16,
    "card_radius": 16,
    "enable_entry_animation": true,
    "cards": [
      {
        "id": "card-sample-1",
        "title": "서비스 소개",
        "subtitle": "ABOUT",
        "description": "우리가 제공하는 서비스의 전체 개요를 확인해 보세요.",
        "badge": "NEW",
        "bg_type": "gradient",
        "bg_gradient": "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        "action_type": "sheet",
        "sheet_content": "여기에 서비스 상세 내용을 작성합니다.\n여러 줄 입력이 가능합니다.",
        "hover_anim": "lift",
        "aspect_ratio": "4/3",
        "align": "bottom"
      },
      {
        "id": "card-sample-2",
        "title": "오시는 길",
        "subtitle": "LOCATION",
        "description": "지도와 함께 위치 정보를 확인하세요.",
        "bg_type": "gradient",
        "bg_gradient": "linear-gradient(135deg, #2193b0 0%, #6dd5ed 100%)",
        "action_type": "link",
        "action_url": "#",
        "action_target": "_self",
        "hover_anim": "zoom",
        "aspect_ratio": "4/3",
        "align": "bottom"
      },
      {
        "id": "card-sample-3",
        "title": "문의하기",
        "subtitle": "CONTACT",
        "description": "궁금한 점이 있으면 언제든 연락주세요.",
        "bg_type": "gradient",
        "bg_gradient": "linear-gradient(135deg, #f12711 0%, #f5af19 100%)",
        "action_type": "modal",
        "sheet_content": "연락처 안내\n전화: 000-0000-0000\n이메일: contact@example.com",
        "hover_anim": "tilt",
        "aspect_ratio": "4/3",
        "align": "bottom"
      }
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
  component_module   = 'card-area',
  config_form_module = 'card-area',
  grid_w             = 8,
  grid_h             = 8,
  grid_min_w         = 3,
  grid_min_h         = 4,
  display_order      = 20
WHERE id = 'card-area';
