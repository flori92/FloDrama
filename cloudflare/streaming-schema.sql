-- Schema SQL pour le stockage des références de streaming
-- à utiliser avec Cloudflare D1 Database

-- Table pour stocker les informations de streaming
CREATE TABLE IF NOT EXISTS streaming_references (
  id TEXT PRIMARY KEY,
  content_id TEXT NOT NULL,
  content_type TEXT NOT NULL,  -- 'movie', 'episode', 'trailer'
  streaming_url TEXT NOT NULL,
  source TEXT NOT NULL,        -- 'dramacool', 'viewasian', 'myasiantv', etc.
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  expires_at TEXT,             -- Date d'expiration de l'URL (certaines expirent rapidement)
  referrer_policy TEXT,
  content_type_header TEXT,
  subtitles_url TEXT,
  subtitles_language TEXT,
  episode_number INTEGER,      -- Pour les dramas
  season_number INTEGER,       -- Pour les dramas
  quality TEXT,                -- 'HD', '720p', '1080p', etc.
  is_active BOOLEAN DEFAULT 1,
  
  -- Index pour des recherches rapides
  UNIQUE(content_id, episode_number, season_number)
);

-- Table pour le mapping entre les contenus et leurs épisodes
CREATE TABLE IF NOT EXISTS content_episodes (
  id TEXT PRIMARY KEY,
  drama_id TEXT NOT NULL,
  episode_number INTEGER NOT NULL,
  season_number INTEGER DEFAULT 1,
  title TEXT,
  description TEXT,
  thumbnail_id TEXT,          -- ID de la vignette dans Cloudflare Images
  duration INTEGER,           -- Durée en secondes
  streaming_reference_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  
  -- Index pour des recherches rapides
  UNIQUE(drama_id, episode_number, season_number)
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_streaming_content_id ON streaming_references(content_id);
CREATE INDEX IF NOT EXISTS idx_streaming_expiry ON streaming_references(expires_at);
CREATE INDEX IF NOT EXISTS idx_content_episodes_drama ON content_episodes(drama_id);
