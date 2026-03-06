-- =============================================
-- Page Views Tracking
-- =============================================

CREATE TABLE IF NOT EXISTS page_views (
  id        UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id   UUID        REFERENCES pages(id) ON DELETE CASCADE NOT NULL,
  viewed_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;

-- 누구나 조회 기록 삽입 가능 (익명 방문자 포함)
CREATE POLICY "Anyone can track page views" ON page_views
  FOR INSERT WITH CHECK (true);

-- 페이지 소유자만 자신의 페이지 통계 조회 가능
CREATE POLICY "Owners can view page view stats" ON page_views
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM pages
      WHERE pages.id = page_views.page_id
        AND pages.created_by = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_page_views_page_id  ON page_views(page_id);
CREATE INDEX IF NOT EXISTS idx_page_views_viewed_at ON page_views(viewed_at DESC);

-- =============================================
-- 대시보드용 통계 집계 함수 (top-10)
-- =============================================
CREATE OR REPLACE FUNCTION get_dashboard_stats()
RETURNS json
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(

    -- 페이지별 총 접속량 top10
    'total_views', (
      SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
      FROM (
        SELECT p.id, p.title, COUNT(pv.id) AS views
        FROM pages p
        LEFT JOIN page_views pv ON pv.page_id = p.id
        WHERE p.created_by = auth.uid()
        GROUP BY p.id, p.title
        ORDER BY views DESC
        LIMIT 10
      ) t
    ),

    -- 페이지별 오늘(일일) 접속량 top10
    'daily_views', (
      SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
      FROM (
        SELECT p.id, p.title, COUNT(pv.id) AS views
        FROM pages p
        LEFT JOIN page_views pv
          ON pv.page_id = p.id
         AND pv.viewed_at >= CURRENT_DATE
        WHERE p.created_by = auth.uid()
        GROUP BY p.id, p.title
        ORDER BY views DESC
        LIMIT 10
      ) t
    ),

    -- 페이지별 이미지 사용량 top10
    'image_usage', (
      SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
      FROM (
        SELECT
          p.id,
          p.title,
          COALESCE(
            SUM(
              CASE
                WHEN pc.config -> 'images' IS NOT NULL
                THEN jsonb_array_length((pc.config -> 'images')::jsonb)
                ELSE 0
              END
            ), 0
          ) AS image_count
        FROM pages p
        LEFT JOIN page_components pc
          ON pc.page_id = p.id
         AND pc.component_type = 'image-gallery'
        WHERE p.created_by = auth.uid()
        GROUP BY p.id, p.title
        ORDER BY image_count DESC
        LIMIT 10
      ) t
    )

  ) INTO result;

  RETURN result;
END;
$$;
