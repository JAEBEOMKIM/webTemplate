-- 마인드맵 컴포넌트 추가
-- 노드 기반 마인드맵 (드래그 배치, 링크 지원)

INSERT INTO component_definitions (
  id, name, description, icon, default_config, is_active
) VALUES (
  'mindmap',
  '마인드맵',
  '노드 기반 마인드맵 (드래그 배치, 링크 지원)',
  '🧠',
  '{
    "title": "마인드맵",
    "canvasHeight": 500,
    "nodes": [
      { "id": "root", "label": "중심 주제", "color": "blue", "link": "", "x": 250, "y": 200, "parentId": null },
      { "id": "child-1", "label": "주제 1", "color": "green", "link": "", "x": 500, "y": 100, "parentId": "root" },
      { "id": "child-2", "label": "주제 2", "color": "purple", "link": "", "x": 500, "y": 200, "parentId": "root" },
      { "id": "child-3", "label": "주제 3", "color": "orange", "link": "", "x": 500, "y": 300, "parentId": "root" }
    ]
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
  component_module = 'mindmap',
  config_form_module = 'mindmap',
  grid_w = 8,
  grid_h = 6,
  grid_min_w = 4,
  grid_min_h = 4,
  display_order = 14
WHERE id = 'mindmap';
