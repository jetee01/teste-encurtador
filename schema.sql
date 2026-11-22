CREATE TABLE IF NOT EXISTS links (
  slug TEXT PRIMARY KEY NOT NULL CHECK (length(slug) = 7 AND slug NOT GLOB '*[^A-Za-z0-9]*'),
  target_url TEXT NOT NULL CHECK (length(target_url) <= 4096 AND (target_url LIKE 'http://%' OR target_url LIKE 'https://%')),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
