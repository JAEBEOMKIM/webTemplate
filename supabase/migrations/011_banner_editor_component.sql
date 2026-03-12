-- 배너 에디터 컴포넌트 추가
-- Fabric.js 기반 레이어 배너 편집기

INSERT INTO component_definitions (
  id, name, description, icon, default_config, is_active
) VALUES (
  'banner-editor',
  '배너 에디터',
  '레이어 기반 배너 이미지 편집기 (배경·이미지·텍스트 레이어 합성)',
  '🎨',
  '{
    "canvasWidth": 900,
    "canvasHeight": 300,
    "background": { "type": "color", "color": "#1e293b", "imageUrl": "" },
    "layers": [],
    "fabricJson": "",
    "exportedImageUrl": null
  }'::jsonb,
  true
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  default_config = EXCLUDED.default_config,
  is_active = EXCLUDED.is_active;

-- 미디어 그룹에 배치
UPDATE component_definitions SET
  group_id = 'a0000000-0000-0000-0000-000000000002',
  component_module = 'banner-editor',
  config_form_module = 'banner-editor',
  grid_w = 8,
  grid_h = 5,
  grid_min_w = 4,
  grid_min_h = 3,
  display_order = 4
WHERE id = 'banner-editor';
