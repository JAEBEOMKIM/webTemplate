-- Add accordion component to component_definitions
INSERT INTO component_definitions (id, name, description, icon, default_config)
VALUES (
  'accordion',
  '아코디언',
  '다단계 아코디언 + 펼침 목록 컴포넌트',
  '📂',
  '{
    "title": "",
    "items": [
      {
        "id": "item-1",
        "title": "회사 소개",
        "icon": "🏢",
        "color": "blue",
        "children": [
          {"id": "child-1-1", "title": "미션", "content": "우리의 미션은 고객의 삶을 개선하는 고품질 제품을 제공하는 것입니다."},
          {"id": "child-1-2", "title": "핵심 가치", "content": "정직함, 혁신, 고객 만족이 우리의 모든 활동의 중심입니다."}
        ]
      },
      {
        "id": "item-2",
        "title": "서비스 안내",
        "icon": "📋",
        "color": "teal",
        "children": [
          {"id": "child-2-1", "title": "기본 서비스", "content": "기본 서비스에 대한 안내 내용입니다."},
          {"id": "child-2-2", "title": "프리미엄 서비스", "content": "프리미엄 서비스에 대한 안내 내용입니다."}
        ]
      }
    ]
  }'::jsonb
)
ON CONFLICT (id) DO NOTHING;
