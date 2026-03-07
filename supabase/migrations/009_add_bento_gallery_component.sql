-- Add bento-gallery component to component_definitions
INSERT INTO component_definitions (id, name, description, icon, default_config)
VALUES (
  'bento-gallery',
  '벤토 갤러리',
  '드래그 가능한 인터랙티브 이미지/영상 갤러리',
  '🎨',
  '{}'::jsonb
)
ON CONFLICT (id) DO NOTHING;
