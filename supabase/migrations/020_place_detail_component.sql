-- =============================================
-- 020_place_detail_component.sql
-- 장소 상세 컴포넌트 추가
-- 바텀시트/페이지 안에서 표시되는 장소 정보 컴포넌트
-- 기본 정보(제목+설명+사진 스트립+빠른 정보) + 임베디드 컴포넌트(갤러리/지도/공유)
-- =============================================

INSERT INTO component_definitions (
  id, name, description, icon, default_config, is_active
) VALUES (
  'place-detail',
  '장소 상세',
  '바텀시트/페이지에서 장소 정보 표시 (사진 + 정보 + 갤러리/지도/공유 임베드)',
  '📍',
  '{
    "title": "Creative Hub",
    "description": "혁신가, 아티스트, 그리고 사업가를 위한 프리미엄 코워킹 공간. 협업 환경, 최첨단 시설, 고속 인터넷, 그리고 커뮤니티 기반 분위기로 비즈니스 성장을 돕습니다.",
    "show_photos": true,
    "photos": [],
    "show_info": true,
    "info_items": [
      { "id": "info-loc", "icon": "location_on", "primary": "128 Innovation Way, Suite 400", "secondary": "Silicon Valley, CA 94025" },
      { "id": "info-call", "icon": "call", "primary": "+1 (555) 012-3456", "secondary": "creativehub.io" }
    ],
    "show_gallery": false,
    "gallery_section_title": "갤러리",
    "gallery_config": {
      "title": "",
      "images": [],
      "autoplay": true,
      "interval": 4000,
      "image_fit": "cover",
      "transition_effect": "fade",
      "show_thumbnails": true
    },
    "show_map": true,
    "map_section_title": "위치",
    "map_config": {
      "app_key": "",
      "center_lat": 37.5665,
      "center_lng": 126.978,
      "zoom": 3,
      "map_type": "ROADMAP",
      "markers": [],
      "show_controls": true,
      "height": 240,
      "map_title": ""
    },
    "show_share": true,
    "share_section_title": "공유하기",
    "share_config": {
      "title": "이 장소 공유하기",
      "description": "",
      "kakao_app_key": "",
      "show_kakao": true,
      "show_sms": true,
      "show_copy": true,
      "show_qr": false
    }
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
  component_module   = 'place-detail',
  config_form_module = 'place-detail',
  grid_w             = 8,
  grid_h             = 12,
  grid_min_w         = 4,
  grid_min_h         = 6,
  display_order      = 21
WHERE id = 'place-detail';
