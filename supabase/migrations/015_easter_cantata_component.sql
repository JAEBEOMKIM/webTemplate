-- =============================================
-- 015_easter_cantata_component.sql
-- 부활절 칸타타 팜플렛 컴포넌트 추가
-- 다크 테마 교회 칸타타 프로그램북 전용 컴포넌트
-- =============================================

INSERT INTO component_definitions (
  id, name, description, icon, default_config, is_active
) VALUES (
  'easter-cantata',
  '부활절 칸타타',
  '교회 칸타타 팜플렛 (다크 테마)',
  '✝️',
  '{
    "year": 2026,
    "event_label": "Easter Cantata",
    "main_title": "만왕의 왕\n예수 그리스도",
    "sub_title": "",
    "date_label": "2026년 4월 3일 오후 7시",
    "venue_label": "등촌 교회 본당",
    "poster_image_url": "",
    "show_program": true,
    "show_choir": true,
    "show_footer_verse": true,
    "program_items": [
      { "number": "01", "title": "예수 그리스도",          "performer": "합창" },
      { "number": "02", "title": "왕의 왕 찬양하리",       "performer": "Narration / 합창" },
      { "number": "03", "title": "마지막 만찬",            "performer": "Bas.전준홍 / 합창" },
      { "number": "04", "title": "겟세마네의 기도",         "performer": "Narration / Sop.원진주 / 합창" },
      { "number": "05", "title": "나는 저 사람을 모릅니다", "performer": "Narration / Ter.안철준 / 합창" },
      { "number": "06", "title": "주 나를 위하여",          "performer": "임마누엘 중창단 / 합창" },
      { "number": "07", "title": "부활하셨다",             "performer": "Narration / 합창" }
    ],
    "conductor_name": "강태휘",
    "pianist_name": "구예담",
    "choir_label": "임마누엘 찬양대",
    "soprano": "김지수 이민정 박소연 최윤희 정다은 한지혜 유민주 김태희 이은지 서현주 홍수아",
    "alto":    "이지영 박은혜 최민정 김수진 정현주 이나영 조은아 배지민 강수연 유선희",
    "tenor":   "이철수 박종혁 김동현 최재영 정성우 한기석 유태건 손민호 임재윤",
    "bass":    "정지훈 김성수 박준호 최영민 이태양 장동건 유해진 김진우 안승범",
    "orchestra_label": "임마누엘 앙상블",
    "orchestra_sections": [
      { "section": "Violin / Viola",   "members": "Vn1. 김은정 박지혜  Vn2. 이나리 최성원  Va. 박준석 정유미" },
      { "section": "Cello / Bass",     "members": "Vc. 이민지 김하늘  Db. 박철민" },
      { "section": "Woodwind / Brass", "members": "Fl. 한지수  Ob. 정민아  Cl. 김도윤  Hn. 이강산  Trp. 박재현" },
      { "section": "Percussion",       "members": "Tim. 김대원  Perc. 최한결" }
    ],
    "bible_verse": "\"그리스도께서 다시 살아나신 일이 없으면 너희의 믿음도 헛되고 너희가 여전히 죄 가운데 있을 것이요\"",
    "bible_ref": "(고린도전서 15:17)",
    "color_bg":        "#1a0f1c",
    "color_surface":   "#261629",
    "color_primary":   "#f2dfd0",
    "color_tertiary":  "#ffdcbd",
    "color_secondary": "#d5c3b5"
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
  component_module   = 'easter-cantata',
  config_form_module = 'easter-cantata',
  grid_w             = 6,
  grid_h             = 12,
  grid_min_w         = 4,
  grid_min_h         = 6,
  display_order      = 17
WHERE id = 'easter-cantata';
