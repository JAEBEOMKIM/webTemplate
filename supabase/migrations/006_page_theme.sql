-- Add theme column to pages table
ALTER TABLE pages ADD COLUMN IF NOT EXISTS theme varchar DEFAULT NULL;

COMMENT ON COLUMN pages.theme IS 'Per-page theme id (null = default). Matches .theme-{id} CSS class.';
