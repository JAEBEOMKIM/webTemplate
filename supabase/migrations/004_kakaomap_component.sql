-- =============================================
-- 004_kakaomap_component.sql
-- 카카오맵 컴포넌트 타입 등록
-- =============================================

INSERT INTO component_definitions (id, name, description, icon, default_config) VALUES
  ('kakaomap', '카카오맵', '카카오맵으로 위치와 마커를 표시', '🗺️',
   '{"app_key": "", "center_lat": 37.5665, "center_lng": 126.9780, "zoom": 3, "map_type": "ROADMAP", "markers": [], "show_controls": true, "height": 400}')
ON CONFLICT (id) DO NOTHING;
