-- =============================================
-- 014_about_section_component.sql
-- 소개 섹션 컴포넌트 추가
-- 서비스 목록 / 중앙 이미지 / 통계 카드 / CTA 배너를 포함한 전체 페이지형 소개 섹션
-- =============================================

INSERT INTO component_definitions (
  id, name, description, icon, default_config, is_active
) VALUES (
  'about-section',
  '소개 섹션',
  '서비스/통계/CTA를 포함한 전체 페이지형 소개 섹션',
  '🏢',
  '{
    "show_header": true,
    "show_services": true,
    "show_image": true,
    "show_stats": true,
    "show_cta": true,
    "eyebrow": "DISCOVER OUR STORY",
    "title": "About Us",
    "subtitle": "We are a passionate team dedicated to creating beautiful, functional spaces that inspire and elevate everyday living.",
    "image_url": "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&auto=format&fit=crop",
    "image_alt": "대표 이미지",
    "image_button_label": "포트폴리오 보기",
    "image_button_url": "",
    "services": [
      { "icon": "Pen",         "title": "인테리어",   "description": "전문적인 인테리어 디자인으로 공간을 혁신적으로 변화시킵니다.",     "position": "left"  },
      { "icon": "Home",        "title": "익스테리어", "description": "아름다운 외관 디자인으로 첫인상을 완성합니다.",                   "position": "left"  },
      { "icon": "PenTool",     "title": "디자인",     "description": "창의성과 실용성을 결합한 혁신적인 설계 프로세스를 제공합니다.",   "position": "left"  },
      { "icon": "PaintBucket", "title": "데코레이션", "description": "색상, 소재, 액세서리까지 모든 디테일을 완벽하게 조율합니다.",     "position": "right" },
      { "icon": "Ruler",       "title": "플래닝",     "description": "개념에서 완성까지 프로젝트가 원활하게 진행되도록 계획합니다.",    "position": "right" },
      { "icon": "Building2",   "title": "시공",       "description": "숙련된 팀이 모든 구현 과정을 정밀하고 세심하게 처리합니다.",     "position": "right" }
    ],
    "stats": [
      { "icon": "Award",      "value": 150,  "label": "완료 프로젝트", "suffix": "+" },
      { "icon": "Users",      "value": 1200, "label": "만족 고객",     "suffix": "+" },
      { "icon": "Calendar",   "value": 12,   "label": "업력 (년)",     "suffix": ""  },
      { "icon": "TrendingUp", "value": 98,   "label": "만족도",        "suffix": "%" }
    ],
    "cta_title": "공간을 변화시킬 준비가 되셨나요?",
    "cta_description": "함께 아름다운 공간을 만들어봅시다.",
    "cta_button_label": "시작하기",
    "cta_button_url": "",
    "color_primary": "#202e44",
    "color_accent": "#88734C",
    "color_bg": "#F2F2EB",
    "color_text": "#202e44"
  }'::jsonb,
  true
)
ON CONFLICT (id) DO UPDATE SET
  name          = EXCLUDED.name,
  description   = EXCLUDED.description,
  icon          = EXCLUDED.icon,
  default_config = EXCLUDED.default_config,
  is_active     = EXCLUDED.is_active;

UPDATE component_definitions SET
  component_module    = 'about-section',
  config_form_module  = 'about-section',
  grid_w              = 10,
  grid_h              = 8,
  grid_min_w          = 6,
  grid_min_h          = 4,
  display_order       = 16
WHERE id = 'about-section';
