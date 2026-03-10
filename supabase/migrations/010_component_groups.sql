-- =============================================
-- 010_component_groups.sql
-- 컴포넌트 그룹화 + component_definitions 확장
-- =============================================

-- 1. 컴포넌트 그룹 테이블 (계층형 self-reference)
CREATE TABLE IF NOT EXISTS component_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  icon TEXT DEFAULT '📁',
  display_order INT NOT NULL DEFAULT 0,
  parent_id UUID REFERENCES component_groups(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- updated_at 자동 갱신 트리거
CREATE TRIGGER component_groups_updated_at
  BEFORE UPDATE ON component_groups
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 2. component_definitions 확장 (기존 컬럼 보존, 신규 컬럼 추가)
ALTER TABLE component_definitions
  ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES component_groups(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS component_module TEXT,
  ADD COLUMN IF NOT EXISTS config_form_module TEXT,
  ADD COLUMN IF NOT EXISTS grid_w INT NOT NULL DEFAULT 5,
  ADD COLUMN IF NOT EXISTS grid_h INT NOT NULL DEFAULT 4,
  ADD COLUMN IF NOT EXISTS grid_min_w INT NOT NULL DEFAULT 3,
  ADD COLUMN IF NOT EXISTS grid_min_h INT NOT NULL DEFAULT 3,
  ADD COLUMN IF NOT EXISTS display_order INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

-- 3. RLS 정책
ALTER TABLE component_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "groups_select" ON component_groups
  FOR SELECT USING (true);

CREATE POLICY "groups_manage" ON component_groups
  FOR ALL USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

ALTER TABLE component_definitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "defs_select" ON component_definitions
  FOR SELECT USING (true);

CREATE POLICY "defs_manage" ON component_definitions
  FOR ALL USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- 4. 기본 그룹 시드 (고정 UUID 사용)
INSERT INTO component_groups (id, name, icon, display_order, parent_id) VALUES
  ('a0000000-0000-0000-0000-000000000001', '콘텐츠',   '📝', 1, NULL),
  ('a0000000-0000-0000-0000-000000000002', '미디어',   '🖼️', 2, NULL),
  ('a0000000-0000-0000-0000-000000000003', '데이터',   '📊', 3, NULL),
  ('a0000000-0000-0000-0000-000000000004', '유틸리티', '🔧', 4, NULL)
ON CONFLICT (id) DO NOTHING;

-- 5. 기존 12개 컴포넌트에 그룹 배정 + 모듈명 + 그리드 크기 설정

-- 콘텐츠 그룹
UPDATE component_definitions SET
  group_id = 'a0000000-0000-0000-0000-000000000001',
  component_module = 'board', config_form_module = 'board',
  grid_w = 10, grid_h = 6, grid_min_w = 4, grid_min_h = 3,
  display_order = 1
WHERE id = 'board';

UPDATE component_definitions SET
  group_id = 'a0000000-0000-0000-0000-000000000001',
  component_module = 'html', config_form_module = 'html',
  grid_w = 5, grid_h = 4, grid_min_w = 3, grid_min_h = 3,
  display_order = 2
WHERE id = 'html';

UPDATE component_definitions SET
  group_id = 'a0000000-0000-0000-0000-000000000001',
  component_module = 'markdown', config_form_module = 'markdown',
  grid_w = 5, grid_h = 4, grid_min_w = 3, grid_min_h = 3,
  display_order = 3
WHERE id = 'markdown';

UPDATE component_definitions SET
  group_id = 'a0000000-0000-0000-0000-000000000001',
  component_module = 'accordion', config_form_module = 'accordion',
  grid_w = 5, grid_h = 4, grid_min_w = 3, grid_min_h = 3,
  display_order = 4
WHERE id = 'accordion';

-- 미디어 그룹
UPDATE component_definitions SET
  group_id = 'a0000000-0000-0000-0000-000000000002',
  component_module = 'image-gallery', config_form_module = 'image-gallery',
  grid_w = 5, grid_h = 5, grid_min_w = 3, grid_min_h = 3,
  display_order = 1
WHERE id = 'image-gallery';

UPDATE component_definitions SET
  group_id = 'a0000000-0000-0000-0000-000000000002',
  component_module = 'bento-gallery', config_form_module = 'bento-gallery',
  grid_w = 5, grid_h = 4, grid_min_w = 3, grid_min_h = 3,
  display_order = 2
WHERE id = 'bento-gallery';

UPDATE component_definitions SET
  group_id = 'a0000000-0000-0000-0000-000000000002',
  component_module = 'kakaomap', config_form_module = 'kakaomap',
  grid_w = 5, grid_h = 4, grid_min_w = 3, grid_min_h = 3,
  display_order = 3
WHERE id = 'kakaomap';

-- 데이터 그룹
UPDATE component_definitions SET
  group_id = 'a0000000-0000-0000-0000-000000000003',
  component_module = 'calendar', config_form_module = 'calendar',
  grid_w = 10, grid_h = 8, grid_min_w = 6, grid_min_h = 6,
  display_order = 1
WHERE id = 'calendar';

UPDATE component_definitions SET
  group_id = 'a0000000-0000-0000-0000-000000000003',
  component_module = 'survey', config_form_module = 'survey',
  grid_w = 6, grid_h = 7, grid_min_w = 4, grid_min_h = 4,
  display_order = 2
WHERE id = 'survey';

UPDATE component_definitions SET
  group_id = 'a0000000-0000-0000-0000-000000000003',
  component_module = 'timetable', config_form_module = 'timetable',
  grid_w = 5, grid_h = 4, grid_min_w = 3, grid_min_h = 3,
  display_order = 3
WHERE id = 'timetable';

UPDATE component_definitions SET
  group_id = 'a0000000-0000-0000-0000-000000000003',
  component_module = 'donut-chart', config_form_module = 'donut-chart',
  grid_w = 5, grid_h = 4, grid_min_w = 3, grid_min_h = 3,
  display_order = 4
WHERE id = 'donut-chart';

-- 유틸리티 그룹
UPDATE component_definitions SET
  group_id = 'a0000000-0000-0000-0000-000000000004',
  component_module = 'share', config_form_module = 'share',
  grid_w = 5, grid_h = 4, grid_min_w = 3, grid_min_h = 3,
  display_order = 1
WHERE id = 'share';
