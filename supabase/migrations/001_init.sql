-- =============================================
-- Web Component Page Builder - Initial Schema
-- =============================================

-- 페이지 정의
CREATE TABLE IF NOT EXISTS pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  access_type TEXT NOT NULL DEFAULT 'public' CHECK (access_type IN ('public', 'password', 'oauth')),
  password_hash TEXT,
  is_published BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 컴포넌트 타입 레지스트리
CREATE TABLE IF NOT EXISTS component_definitions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  default_config JSONB DEFAULT '{}'
);

-- 기본 컴포넌트 등록
INSERT INTO component_definitions (id, name, description, icon, default_config) VALUES
  ('board', '게시판', '글 작성, 수정, 삭제 기능이 있는 게시판', '📋', '{"title": "게시판", "allow_anonymous": false}'),
  ('calendar', '달력/스케줄', '일정 등록 및 관리 기능이 있는 캘린더', '📅', '{"title": "일정", "allow_user_add": true}'),
  ('survey', '설문조사', '다양한 방식의 설문조사 컴포넌트', '📊', '{"title": "설문조사", "questions": [], "allow_multiple": false}'),
  ('image-gallery', '이미지 갤러리', '연속 이미지 슬라이드쇼 및 갤러리', '🖼️', '{"title": "갤러리", "images": [], "autoplay": true, "interval": 3000}')
ON CONFLICT (id) DO NOTHING;

-- 페이지-컴포넌트 조합
CREATE TABLE IF NOT EXISTS page_components (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID REFERENCES pages(id) ON DELETE CASCADE NOT NULL,
  component_type TEXT REFERENCES component_definitions(id) NOT NULL,
  display_order INT NOT NULL DEFAULT 0,
  config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 초대코드
CREATE TABLE IF NOT EXISTS invite_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID REFERENCES pages(id) ON DELETE CASCADE NOT NULL,
  code TEXT UNIQUE NOT NULL,
  max_uses INT DEFAULT 1,
  used_count INT DEFAULT 0,
  expires_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 페이지 접근 권한 (OAuth 방식)
CREATE TABLE IF NOT EXISTS page_access_grants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID REFERENCES pages(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  invite_code_id UUID REFERENCES invite_codes(id) ON DELETE SET NULL,
  granted_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(page_id, user_id)
);

-- 게시판 게시물
CREATE TABLE IF NOT EXISTS board_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  component_id UUID REFERENCES page_components(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  author_name TEXT,
  title TEXT NOT NULL,
  content TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 게시판 댓글
CREATE TABLE IF NOT EXISTS board_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES board_posts(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  author_name TEXT,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 캘린더 이벤트
CREATE TABLE IF NOT EXISTS calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  component_id UUID REFERENCES page_components(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  description TEXT,
  color TEXT DEFAULT '#3B82F6',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 설문조사 응답
CREATE TABLE IF NOT EXISTS survey_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  component_id UUID REFERENCES page_components(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  answers JSONB NOT NULL DEFAULT '{}',
  submitted_at TIMESTAMPTZ DEFAULT now()
);

-- 이미지 갤러리 이미지
CREATE TABLE IF NOT EXISTS gallery_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  component_id UUID REFERENCES page_components(id) ON DELETE CASCADE NOT NULL,
  url TEXT NOT NULL,
  caption TEXT,
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- Row Level Security (RLS)
-- =============================================

ALTER TABLE pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_components ENABLE ROW LEVEL SECURITY;
ALTER TABLE invite_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_access_grants ENABLE ROW LEVEL SECURITY;
ALTER TABLE board_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE board_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery_images ENABLE ROW LEVEL SECURITY;

-- pages: 발행된 페이지는 누구나 읽기 가능, 생성자는 모두 관리 가능
DROP POLICY IF EXISTS "Published pages are viewable by everyone" ON pages;
DROP POLICY IF EXISTS "Owners can manage pages" ON pages;
DROP POLICY IF EXISTS "Admin can manage pages" ON pages;
CREATE POLICY "Published pages are viewable by everyone" ON pages
  FOR SELECT USING (is_published = true OR auth.uid() = created_by);
CREATE POLICY "Owners can manage pages" ON pages
  FOR ALL USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() IS NOT NULL);

-- page_components: 페이지가 공개면 누구나 읽기, 페이지 소유자는 관리
DROP POLICY IF EXISTS "Components viewable for published pages" ON page_components;
DROP POLICY IF EXISTS "Owners can manage page_components" ON page_components;
DROP POLICY IF EXISTS "Admin can manage page_components" ON page_components;
CREATE POLICY "Components viewable for published pages" ON page_components
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM pages WHERE pages.id = page_components.page_id AND pages.is_published = true)
  );
CREATE POLICY "Owners can manage page_components" ON page_components
  FOR ALL USING (
    EXISTS (SELECT 1 FROM pages WHERE pages.id = page_components.page_id AND pages.created_by = auth.uid())
  );

-- invite_codes: 페이지 소유자만 관리
DROP POLICY IF EXISTS "Owners can manage invite codes" ON invite_codes;
DROP POLICY IF EXISTS "Admin can manage invite codes" ON invite_codes;
CREATE POLICY "Owners can manage invite codes" ON invite_codes
  FOR ALL USING (
    EXISTS (SELECT 1 FROM pages WHERE pages.id = invite_codes.page_id AND pages.created_by = auth.uid())
  );

-- page_access_grants: 본인 것만 읽기, 페이지 소유자는 모두 관리
DROP POLICY IF EXISTS "Users can view their own grants" ON page_access_grants;
DROP POLICY IF EXISTS "Owners can manage grants" ON page_access_grants;
DROP POLICY IF EXISTS "Admin can manage grants" ON page_access_grants;
CREATE POLICY "Users can view their own grants" ON page_access_grants
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Owners can manage grants" ON page_access_grants
  FOR ALL USING (
    EXISTS (SELECT 1 FROM pages WHERE pages.id = page_access_grants.page_id AND pages.created_by = auth.uid())
  );

-- board_posts: 공개 페이지면 읽기 가능, 로그인 사용자는 작성 가능
DROP POLICY IF EXISTS "Board posts viewable for published pages" ON board_posts;
DROP POLICY IF EXISTS "Authenticated users can create posts" ON board_posts;
DROP POLICY IF EXISTS "Authors can update their posts" ON board_posts;
DROP POLICY IF EXISTS "Owners can manage all posts" ON board_posts;
DROP POLICY IF EXISTS "Admin can manage all posts" ON board_posts;
CREATE POLICY "Board posts viewable for published pages" ON board_posts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM page_components pc
      JOIN pages p ON p.id = pc.page_id
      WHERE pc.id = board_posts.component_id AND p.is_published = true
    )
  );
CREATE POLICY "Authenticated users can create posts" ON board_posts
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authors can update their posts" ON board_posts
  FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Owners can manage all posts" ON board_posts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM page_components pc
      JOIN pages p ON p.id = pc.page_id
      WHERE pc.id = board_posts.component_id AND p.created_by = auth.uid()
    )
  );

-- board_comments
DROP POLICY IF EXISTS "Comments viewable for published pages" ON board_comments;
DROP POLICY IF EXISTS "Authenticated users can comment" ON board_comments;
CREATE POLICY "Comments viewable for published pages" ON board_comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM board_posts bp
      JOIN page_components pc ON pc.id = bp.component_id
      JOIN pages p ON p.id = pc.page_id
      WHERE bp.id = board_comments.post_id AND p.is_published = true
    )
  );
CREATE POLICY "Authenticated users can comment" ON board_comments
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- calendar_events
DROP POLICY IF EXISTS "Events viewable for published pages" ON calendar_events;
DROP POLICY IF EXISTS "Authenticated users can add events" ON calendar_events;
DROP POLICY IF EXISTS "Owners can manage events" ON calendar_events;
DROP POLICY IF EXISTS "Admin can manage events" ON calendar_events;
CREATE POLICY "Events viewable for published pages" ON calendar_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM page_components pc
      JOIN pages p ON p.id = pc.page_id
      WHERE pc.id = calendar_events.component_id AND p.is_published = true
    )
  );
CREATE POLICY "Authenticated users can add events" ON calendar_events
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Owners can manage events" ON calendar_events
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM page_components pc
      JOIN pages p ON p.id = pc.page_id
      WHERE pc.id = calendar_events.component_id AND p.created_by = auth.uid()
    )
  );

-- survey_responses
DROP POLICY IF EXISTS "Users can submit survey responses" ON survey_responses;
DROP POLICY IF EXISTS "Users can view their own responses" ON survey_responses;
DROP POLICY IF EXISTS "Owners can view all responses" ON survey_responses;
DROP POLICY IF EXISTS "Admin can view all responses" ON survey_responses;
CREATE POLICY "Users can submit survey responses" ON survey_responses
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can view their own responses" ON survey_responses
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Owners can view all responses" ON survey_responses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM page_components pc
      JOIN pages p ON p.id = pc.page_id
      WHERE pc.id = survey_responses.component_id AND p.created_by = auth.uid()
    )
  );

-- gallery_images
DROP POLICY IF EXISTS "Gallery images viewable for published pages" ON gallery_images;
DROP POLICY IF EXISTS "Owners can manage gallery images" ON gallery_images;
DROP POLICY IF EXISTS "Admin can manage gallery images" ON gallery_images;
CREATE POLICY "Gallery images viewable for published pages" ON gallery_images
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM page_components pc
      JOIN pages p ON p.id = pc.page_id
      WHERE pc.id = gallery_images.component_id AND p.is_published = true
    )
  );
CREATE POLICY "Owners can manage gallery images" ON gallery_images
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM page_components pc
      JOIN pages p ON p.id = pc.page_id
      WHERE pc.id = gallery_images.component_id AND p.created_by = auth.uid()
    )
  );

-- =============================================
-- 업데이트 타임스탬프 트리거
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER pages_updated_at BEFORE UPDATE ON pages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER board_posts_updated_at BEFORE UPDATE ON board_posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
