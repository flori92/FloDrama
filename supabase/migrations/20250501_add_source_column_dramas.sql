-- Migration pour ajouter la colonne source à la table dramas
-- Cette colonne identifie la source de scraping des données (ex: mydramalist, viki, etc.)

ALTER TABLE dramas 
ADD COLUMN IF NOT EXISTS source TEXT,
ADD COLUMN IF NOT EXISTS source_url TEXT;

COMMENT ON COLUMN dramas.source IS 'Identifiant de la source de scraping (ex: mydramalist, viki, etc.)';
COMMENT ON COLUMN dramas.source_url IS 'URL d'origine du contenu scrapé';

-- Index pour accélérer les recherches par source
CREATE INDEX IF NOT EXISTS idx_dramas_source ON dramas(source);
