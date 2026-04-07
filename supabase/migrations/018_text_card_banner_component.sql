-- =============================================
-- 018_text_card_banner_component.sql
-- 텍스트 카드배너 컴포넌트 추가
-- 3종 변형: Guide / Announcement / Feature
-- =============================================

INSERT INTO component_definitions (
  id, name, description, icon, default_config, is_active
) VALUES (
  'text-card-banner',
  '텍스트 카드배너',
  '3종 변형(Guide/Announcement/Feature) 카드 배너',
  '🃏',
  '{
    "heading": "Chronos",
    "subtitle": "Editorial Guidelines & Updates",
    "layout": "stack",
    "gap": 24,
    "cards": [
      {
        "id": "card-1",
        "variant": "guide",
        "tag": "New Guide",
        "title": "Mastering Deep Focus Intervals",
        "description": "Learn how to sequence your high-cognitive tasks during peak neurological windows while maintaining a serene workspace environment.",
        "linkLabel": "Read the methodology",
        "color": "primary"
      },
      {
        "id": "card-2",
        "variant": "announcement",
        "tag": "Important",
        "title": "System Integrity Protocol",
        "meta": "Released 2 hours ago",
        "description": "We are transitioning our internal data structures to prioritize asynchronous composure. This ensures background scheduling and dependency mapping with absolute silence.",
        "buttonLabel": "Acknowledge Changes",
        "color": "primary"
      },
      {
        "id": "card-3",
        "variant": "feature",
        "title": "Evolution of the Fluid Timeline",
        "description": "Version 2.4 introduces a more nuanced way to visualize your days momentum.",
        "bullets": ["Dynamic node scaling based on task complexity", "Ambient glow indicators for focus areas", "Reduced visual noise in low-density periods"],
        "badge": "V2.4 STABLE RELEASE",
        "color": "primary"
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
  component_module   = 'text-card-banner',
  config_form_module = 'text-card-banner',
  grid_w             = 6,
  grid_h             = 8,
  grid_min_w         = 3,
  grid_min_h         = 4,
  display_order      = 19
WHERE id = 'text-card-banner';
