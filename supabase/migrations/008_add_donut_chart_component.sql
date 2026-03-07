-- Add donut-chart component to component_definitions
INSERT INTO component_definitions (id, name, description, icon, default_config)
VALUES (
  'donut-chart',
  '도넛 차트',
  '인터랙티브 도넛 차트 + 범례',
  '🍩',
  '{
    "title": "",
    "segments": [
      {"id": "seg-1", "label": "항목 A", "value": 40, "color": "#3b82f6"},
      {"id": "seg-2", "label": "항목 B", "value": 30, "color": "#22c55e"},
      {"id": "seg-3", "label": "항목 C", "value": 20, "color": "#f97316"},
      {"id": "seg-4", "label": "항목 D", "value": 10, "color": "#a855f7"}
    ]
  }'::jsonb
)
ON CONFLICT (id) DO NOTHING;
