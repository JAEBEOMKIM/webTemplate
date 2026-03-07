-- =============================================
-- 003_new_components.sql
-- HTML, Markdown, Share 컴포넌트 타입 등록
-- =============================================

INSERT INTO component_definitions (id, name, description, icon, default_config) VALUES
  ('html',      'HTML',        '직접 작성한 HTML을 그대로 표시',             '🖥️', '{"html": ""}'),
  ('markdown',  '마크다운',    '마크다운 형식으로 텍스트 콘텐츠 작성',       '📝', '{"content": ""}'),
  ('share',     '공유하기',    '카카오톡, 문자, 링크 복사 공유 버튼',        '🔗', '{"title": "공유하기", "description": "", "show_kakao": true, "show_sms": true, "show_copy": true, "kakao_app_key": ""}'),
  ('timetable', '하루 일정표', '시간별 하루 일정을 시각적으로 표시',         '🗓️', '{"title": "하루 일정", "events": [], "start_hour": 8, "end_hour": 22}')
ON CONFLICT (id) DO NOTHING;

