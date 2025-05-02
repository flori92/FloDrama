-- Script pour ajouter les colonnes manquantes aux tables existantes
-- À exécuter sur la base de données Supabase FloDrama

-- Ajout des colonnes manquantes à la table dramas
ALTER TABLE public.dramas 
ADD COLUMN IF NOT EXISTS synopsis TEXT,
ADD COLUMN IF NOT EXISTS year INTEGER,
ADD COLUMN IF NOT EXISTS country TEXT,
ADD COLUMN IF NOT EXISTS language TEXT,
ADD COLUMN IF NOT EXISTS genres TEXT[],
ADD COLUMN IF NOT EXISTS episodes_count INTEGER,
ADD COLUMN IF NOT EXISTS status TEXT,
ADD COLUMN IF NOT EXISTS rating FLOAT,
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS source TEXT,
ADD COLUMN IF NOT EXISTS source_url TEXT,
ADD COLUMN IF NOT EXISTS scraped_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Commentaires sur les colonnes ajoutées
COMMENT ON COLUMN public.dramas.synopsis IS 'Synopsis du drama';
COMMENT ON COLUMN public.dramas.year IS 'Année de sortie';
COMMENT ON COLUMN public.dramas.country IS 'Pays d''origine';
COMMENT ON COLUMN public.dramas.language IS 'Langue principale (ko, ja, zh, th, hi, etc.)';
COMMENT ON COLUMN public.dramas.genres IS 'Liste des genres';
COMMENT ON COLUMN public.dramas.episodes_count IS 'Nombre d''épisodes';
COMMENT ON COLUMN public.dramas.status IS 'Statut (En cours, Terminé, etc.)';
COMMENT ON COLUMN public.dramas.rating IS 'Note sur 10';
COMMENT ON COLUMN public.dramas.image_url IS 'URL de l''image dans Supabase Storage';
COMMENT ON COLUMN public.dramas.source IS 'Source de scraping (ex: voirdrama, mydramalist)';
COMMENT ON COLUMN public.dramas.source_url IS 'URL source du contenu';
COMMENT ON COLUMN public.dramas.scraped_at IS 'Date de scraping';

-- Ajout des colonnes manquantes à la table scraping_logs
ALTER TABLE public.scraping_logs
ADD COLUMN IF NOT EXISTS ended_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS errors_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS duration FLOAT,
ADD COLUMN IF NOT EXISTS details JSONB;

-- Commentaires sur les colonnes ajoutées
COMMENT ON COLUMN public.scraping_logs.ended_at IS 'Date de fin du scraping';
COMMENT ON COLUMN public.scraping_logs.errors_count IS 'Nombre d''erreurs rencontrées';
COMMENT ON COLUMN public.scraping_logs.duration IS 'Durée du scraping en secondes';
COMMENT ON COLUMN public.scraping_logs.details IS 'Détails supplémentaires (JSON)';

-- Ajout des colonnes manquantes à la table animes
ALTER TABLE public.animes
ADD COLUMN IF NOT EXISTS source TEXT,
ADD COLUMN IF NOT EXISTS source_url TEXT;

-- Ajout des colonnes manquantes à la table films
ALTER TABLE public.films
ADD COLUMN IF NOT EXISTS source TEXT,
ADD COLUMN IF NOT EXISTS source_url TEXT;

-- Ajout des colonnes manquantes à la table bollywood
ALTER TABLE public.bollywood
ADD COLUMN IF NOT EXISTS source TEXT,
ADD COLUMN IF NOT EXISTS source_url TEXT;

-- Création des index pour les colonnes source et title
DROP INDEX IF EXISTS dramas_title_source_idx;
CREATE INDEX dramas_title_source_idx ON public.dramas(title, source);
DROP INDEX IF EXISTS dramas_source_idx;
CREATE INDEX dramas_source_idx ON public.dramas(source);

DROP INDEX IF EXISTS animes_title_source_idx;
CREATE INDEX animes_title_source_idx ON public.animes(title, source);
DROP INDEX IF EXISTS animes_source_idx;
CREATE INDEX animes_source_idx ON public.animes(source);

DROP INDEX IF EXISTS films_title_source_idx;
CREATE INDEX films_title_source_idx ON public.films(title, source);
DROP INDEX IF EXISTS films_source_idx;
CREATE INDEX films_source_idx ON public.films(source);

DROP INDEX IF EXISTS bollywood_title_source_idx;
CREATE INDEX bollywood_title_source_idx ON public.bollywood(title, source);
DROP INDEX IF EXISTS bollywood_source_idx;
CREATE INDEX bollywood_source_idx ON public.bollywood(source);

-- Création du bucket storage si nécessaire (directement via SQL)
DO $$
BEGIN
    BEGIN
        INSERT INTO storage.buckets (id, name, public)
        VALUES ('images', 'Images', true);
    EXCEPTION WHEN OTHERS THEN
        -- Le bucket existe probablement déjà
        NULL;
    END;
END $$;

-- Ajout d'une politique d'accès en lecture pour le bucket images
DO $$
BEGIN
    BEGIN
        CREATE POLICY "Public Images Access"
        ON storage.objects FOR SELECT
        USING (bucket_id = 'images');
    EXCEPTION WHEN OTHERS THEN
        -- La politique existe probablement déjà
        NULL;
    END;
END $$;

-- Confirmation de fin d'exécution
SELECT 'Migration des colonnes manquantes réussie !' as resultat;
