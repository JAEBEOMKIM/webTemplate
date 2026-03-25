-- 타이틀 헤더 컴포넌트 추가
-- 타이프라이터 등 애니메이션 타이틀 (유형 확장 가능)

INSERT INTO component_definitions (
  id, name, description, icon, default_config, is_active
) VALUES (
  'title-header',
  '타이틀 헤더',
  '타이프라이터 등 애니메이션 타이틀 (유형 확장 가능)',
  '✍️',
  '{
    "variant": "typewriter",
    "texts": ["환영합니다", "반갑습니다", "Welcome"],
    "prefix": "",
    "typingSpeed": 80,
    "deletingSpeed": 40,
    "pauseDuration": 2000,
    "cursorChar": "|",
    "fontSize": 32,
    "align": "center",
    "textColor": "",
    "cursorColor": "",
    "subtitle": "",
    "subtitleColor": "",
    "link": ""
  }'::jsonb,
  true
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  default_config = EXCLUDED.default_config,
  is_active = EXCLUDED.is_active;

UPDATE component_definitions SET
  component_module = 'title-header',
  config_form_module = 'title-header',
  grid_w = 10,
  grid_h = 2,
  grid_min_w = 4,
  grid_min_h = 1,
  display_order = 15
WHERE id = 'title-header';
