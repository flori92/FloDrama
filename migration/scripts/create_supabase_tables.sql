-- Script de création des tables Supabase pour FloDrama
-- À exécuter dans l'interface SQL de Supabase

-- Table pour les dramas
CREATE TABLE IF NOT EXISTS dramas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  original_title TEXT,
  poster TEXT,
  backdrop TEXT,
  year INTEGER,
  rating NUMERIC(3,1),
  language TEXT NOT NULL,
  description TEXT,
  synopsis TEXT,
  genres TEXT[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  actors TEXT[] DEFAULT '{}',
  director TEXT,
  episode_count INTEGER,
  episodes INTEGER,
  seasons INTEGER,
  duration INTEGER,
  status TEXT,
  release_date DATE,
  streaming_urls JSONB DEFAULT '[]',
  trailers JSONB DEFAULT '[]',
  images JSONB DEFAULT '[]',
  subtitles JSONB DEFAULT '[]',
  related_content TEXT[] DEFAULT '{}',
  user_ratings JSONB DEFAULT '{"average": 0, "count": 0}',
  popularity_score NUMERIC(10,2) DEFAULT 0,
  is_premium BOOLEAN DEFAULT false,
  gallery TEXT[] DEFAULT '{}',
  source TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table pour les animes
CREATE TABLE IF NOT EXISTS animes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  original_title TEXT,
  poster TEXT,
  backdrop TEXT,
  year INTEGER,
  rating NUMERIC(3,1),
  language TEXT NOT NULL,
  description TEXT,
  synopsis TEXT,
  genres TEXT[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  actors TEXT[] DEFAULT '{}',
  director TEXT,
  episode_count INTEGER,
  episodes INTEGER,
  seasons INTEGER,
  duration INTEGER,
  status TEXT,
  release_date DATE,
  streaming_urls JSONB DEFAULT '[]',
  trailers JSONB DEFAULT '[]',
  images JSONB DEFAULT '[]',
  subtitles JSONB DEFAULT '[]',
  related_content TEXT[] DEFAULT '{}',
  user_ratings JSONB DEFAULT '{"average": 0, "count": 0}',
  popularity_score NUMERIC(10,2) DEFAULT 0,
  is_premium BOOLEAN DEFAULT false,
  gallery TEXT[] DEFAULT '{}',
  source TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table pour les films
CREATE TABLE IF NOT EXISTS films (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  original_title TEXT,
  poster TEXT,
  backdrop TEXT,
  year INTEGER,
  rating NUMERIC(3,1),
  language TEXT NOT NULL,
  description TEXT,
  synopsis TEXT,
  genres TEXT[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  actors TEXT[] DEFAULT '{}',
  director TEXT,
  duration INTEGER,
  status TEXT,
  release_date DATE,
  streaming_urls JSONB DEFAULT '[]',
  trailers JSONB DEFAULT '[]',
  images JSONB DEFAULT '[]',
  subtitles JSONB DEFAULT '[]',
  related_content TEXT[] DEFAULT '{}',
  user_ratings JSONB DEFAULT '{"average": 0, "count": 0}',
  popularity_score NUMERIC(10,2) DEFAULT 0,
  is_premium BOOLEAN DEFAULT false,
  gallery TEXT[] DEFAULT '{}',
  source TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table pour les films bollywood
CREATE TABLE IF NOT EXISTS bollywood (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  original_title TEXT,
  poster TEXT,
  backdrop TEXT,
  year INTEGER,
  rating NUMERIC(3,1),
  language TEXT NOT NULL,
  description TEXT,
  synopsis TEXT,
  genres TEXT[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  actors TEXT[] DEFAULT '{}',
  director TEXT,
  duration INTEGER,
  status TEXT,
  release_date DATE,
  streaming_urls JSONB DEFAULT '[]',
  trailers JSONB DEFAULT '[]',
  images JSONB DEFAULT '[]',
  subtitles JSONB DEFAULT '[]',
  related_content TEXT[] DEFAULT '{}',
  user_ratings JSONB DEFAULT '{"average": 0, "count": 0}',
  popularity_score NUMERIC(10,2) DEFAULT 0,
  is_premium BOOLEAN DEFAULT false,
  gallery TEXT[] DEFAULT '{}',
  source TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table pour les carrousels
CREATE TABLE IF NOT EXISTS carousels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  items JSONB NOT NULL DEFAULT '[]',
  position INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table pour les bannieres Hero
CREATE TABLE IF NOT EXISTS hero_banners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT,
  content_id UUID,
  content_type TEXT,
  image TEXT,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table pour le suivi du scraping
CREATE TABLE IF NOT EXISTS scraping_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source TEXT NOT NULL,
  content_type TEXT NOT NULL,
  items_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL,
  error_message TEXT,
  duration_seconds NUMERIC(10,2),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  finished_at TIMESTAMP WITH TIME ZONE,
  details JSONB
);

-- Table pour la vérification de la santé
CREATE TABLE IF NOT EXISTS health_check (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  status TEXT NOT NULL DEFAULT 'ok',
  last_checked TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insertions initiales
INSERT INTO health_check (status) VALUES ('ok');

-- Configuration des politiques de sécurité RLS (Row Level Security)
ALTER TABLE dramas ENABLE ROW LEVEL SECURITY;
ALTER TABLE animes ENABLE ROW LEVEL SECURITY;
ALTER TABLE films ENABLE ROW LEVEL SECURITY;
ALTER TABLE bollywood ENABLE ROW LEVEL SECURITY;
ALTER TABLE carousels ENABLE ROW LEVEL SECURITY;
ALTER TABLE hero_banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE scraping_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_check ENABLE ROW LEVEL SECURITY;

-- Politiques de lecture publique pour les contenus
CREATE POLICY "Contenu public en lecture" ON dramas FOR SELECT USING (true);
CREATE POLICY "Contenu public en lecture" ON animes FOR SELECT USING (true);
CREATE POLICY "Contenu public en lecture" ON films FOR SELECT USING (true);
CREATE POLICY "Contenu public en lecture" ON bollywood FOR SELECT USING (true);
CREATE POLICY "Contenu public en lecture" ON carousels FOR SELECT USING (true);
CREATE POLICY "Contenu public en lecture" ON hero_banners FOR SELECT USING (true);
CREATE POLICY "Health check public en lecture" ON health_check FOR SELECT USING (true);

-- Création des index pour optimiser les performances
CREATE INDEX idx_dramas_title ON dramas (title);
CREATE INDEX idx_animes_title ON animes (title);
CREATE INDEX idx_films_title ON films (title);
CREATE INDEX idx_bollywood_title ON bollywood (title);
CREATE INDEX idx_dramas_popularity ON dramas (popularity_score DESC);
CREATE INDEX idx_animes_popularity ON animes (popularity_score DESC);
CREATE INDEX idx_films_popularity ON films (popularity_score DESC);
CREATE INDEX idx_bollywood_popularity ON bollywood (popularity_score DESC);

-- Fonctions pour mettre à jour le timestamp de mise à jour
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers pour la mise à jour automatique des timestamps
CREATE TRIGGER set_timestamp_dramas
BEFORE UPDATE ON dramas
FOR EACH ROW
EXECUTE PROCEDURE update_modified_column();

CREATE TRIGGER set_timestamp_animes
BEFORE UPDATE ON animes
FOR EACH ROW
EXECUTE PROCEDURE update_modified_column();

CREATE TRIGGER set_timestamp_films
BEFORE UPDATE ON films
FOR EACH ROW
EXECUTE PROCEDURE update_modified_column();

CREATE TRIGGER set_timestamp_bollywood
BEFORE UPDATE ON bollywood
FOR EACH ROW
EXECUTE PROCEDURE update_modified_column();

CREATE TRIGGER set_timestamp_carousels
BEFORE UPDATE ON carousels
FOR EACH ROW
EXECUTE PROCEDURE update_modified_column();

CREATE TRIGGER set_timestamp_hero_banners
BEFORE UPDATE ON hero_banners
FOR EACH ROW
EXECUTE PROCEDURE update_modified_column();

-- Commentaires sur les tables
COMMENT ON TABLE dramas IS 'Table contenant les dramas asiatiques';
COMMENT ON TABLE animes IS 'Table contenant les animes japonais';
COMMENT ON TABLE films IS 'Table contenant les films divers';
COMMENT ON TABLE bollywood IS 'Table contenant les films bollywood';
COMMENT ON TABLE carousels IS 'Table contenant les définitions des carrousels pour la page d''accueil';
COMMENT ON TABLE hero_banners IS 'Table contenant les bannières principales pour la page d''accueil';
COMMENT ON TABLE scraping_logs IS 'Table contenant les logs des opérations de scraping';
COMMENT ON TABLE health_check IS 'Table pour vérifier l''état de la base de données';
