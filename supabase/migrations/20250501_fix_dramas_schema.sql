-- Correction de la structure de la table dramas pour la migration AWS vers Supabase
-- Ajout des colonnes manquantes pour le scraping

-- Ajout des colonnes pour l'identification de la source
ALTER TABLE dramas 
ADD COLUMN IF NOT EXISTS source TEXT,
ADD COLUMN IF NOT EXISTS source_url TEXT;

-- Renommer le champ episodes en episodes_count si nécessaire
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'dramas' 
        AND column_name = 'episodes'
    ) AND NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'dramas' 
        AND column_name = 'episodes_count'
    ) THEN
        ALTER TABLE dramas RENAME COLUMN episodes TO episodes_count;
    END IF;
END $$;

-- Ajout de la colonne episodes_count si elle n'existe pas
ALTER TABLE dramas 
ADD COLUMN IF NOT EXISTS episodes_count INTEGER;

-- Ajout d'autres colonnes potentiellement manquantes
ALTER TABLE dramas
ADD COLUMN IF NOT EXISTS country TEXT,
ADD COLUMN IF NOT EXISTS language TEXT,
ADD COLUMN IF NOT EXISTS status TEXT,
ADD COLUMN IF NOT EXISTS rating DECIMAL;

-- Commentaires sur les colonnes
COMMENT ON COLUMN dramas.source IS 'Identifiant de la source de scraping (ex: mydramalist, viki, etc.)';
COMMENT ON COLUMN dramas.source_url IS 'URL d''origine du contenu scrapé';
COMMENT ON COLUMN dramas.episodes_count IS 'Nombre d''épisodes du drama';
COMMENT ON COLUMN dramas.country IS 'Pays d''origine du drama';
COMMENT ON COLUMN dramas.language IS 'Langue principale du drama (code ISO)';
COMMENT ON COLUMN dramas.status IS 'Statut de diffusion du drama (ex: Terminé, En cours)';
COMMENT ON COLUMN dramas.rating IS 'Note moyenne du drama';

-- Index pour améliorer les performances des requêtes
CREATE INDEX IF NOT EXISTS idx_dramas_source ON dramas(source);
CREATE INDEX IF NOT EXISTS idx_dramas_country ON dramas(country);
CREATE INDEX IF NOT EXISTS idx_dramas_language ON dramas(language);
