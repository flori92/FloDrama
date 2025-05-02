-- Script SQL de migration pour la structure Supabase FloDrama
-- Exécuter ce script directement dans l'interface SQL de Supabase

-- Table dramas pour stocker les dramas scrapés
CREATE TABLE IF NOT EXISTS public.dramas (
    id UUID PRIMARY KEY,
    title TEXT NOT NULL,
    synopsis TEXT,
    year INTEGER,
    country TEXT,
    language TEXT,
    genres TEXT[],
    episodes_count INTEGER,
    status TEXT,
    rating FLOAT,
    image_url TEXT,
    source TEXT NOT NULL,
    source_url TEXT NOT NULL,
    scraped_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Commentaires sur la table dramas
COMMENT ON TABLE public.dramas IS 'Table contenant les dramas scrapés';
COMMENT ON COLUMN public.dramas.id IS 'Identifiant unique du drama';
COMMENT ON COLUMN public.dramas.title IS 'Titre du drama';
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
COMMENT ON COLUMN public.dramas.created_at IS 'Date de création de l''enregistrement';
COMMENT ON COLUMN public.dramas.updated_at IS 'Date de dernière mise à jour';

-- Table scraping_logs pour les logs de scraping
CREATE TABLE IF NOT EXISTS public.scraping_logs (
    id UUID PRIMARY KEY,
    source TEXT NOT NULL,
    content_type TEXT NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    ended_at TIMESTAMP WITH TIME ZONE,
    success BOOLEAN,
    items_count INTEGER DEFAULT 0,
    errors_count INTEGER DEFAULT 0,
    duration FLOAT,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Commentaires sur la table scraping_logs
COMMENT ON TABLE public.scraping_logs IS 'Logs de scraping pour chaque source';
COMMENT ON COLUMN public.scraping_logs.id IS 'Identifiant unique du log';
COMMENT ON COLUMN public.scraping_logs.source IS 'Source de scraping (ex: voirdrama, mydramalist)';
COMMENT ON COLUMN public.scraping_logs.content_type IS 'Type de contenu (dramas, animes, etc.)';
COMMENT ON COLUMN public.scraping_logs.started_at IS 'Date de début du scraping';
COMMENT ON COLUMN public.scraping_logs.ended_at IS 'Date de fin du scraping';
COMMENT ON COLUMN public.scraping_logs.success IS 'Succès du scraping';
COMMENT ON COLUMN public.scraping_logs.items_count IS 'Nombre d''éléments scrapés';
COMMENT ON COLUMN public.scraping_logs.errors_count IS 'Nombre d''erreurs rencontrées';
COMMENT ON COLUMN public.scraping_logs.duration IS 'Durée du scraping en secondes';
COMMENT ON COLUMN public.scraping_logs.details IS 'Détails supplémentaires (JSON)';

-- Table animes pour stocker les animes scrapés
CREATE TABLE IF NOT EXISTS public.animes (
    id UUID PRIMARY KEY,
    title TEXT NOT NULL,
    synopsis TEXT,
    year INTEGER,
    country TEXT,
    language TEXT,
    genres TEXT[],
    episodes_count INTEGER,
    status TEXT,
    rating FLOAT,
    image_url TEXT,
    source TEXT NOT NULL,
    source_url TEXT NOT NULL,
    scraped_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Commentaires sur la table animes
COMMENT ON TABLE public.animes IS 'Table contenant les animes scrapés';

-- Table films pour stocker les films scrapés
CREATE TABLE IF NOT EXISTS public.films (
    id UUID PRIMARY KEY,
    title TEXT NOT NULL,
    synopsis TEXT,
    year INTEGER,
    country TEXT,
    language TEXT,
    genres TEXT[],
    duration INTEGER, -- en minutes
    status TEXT,
    rating FLOAT,
    image_url TEXT,
    source TEXT NOT NULL,
    source_url TEXT NOT NULL,
    scraped_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Commentaires sur la table films
COMMENT ON TABLE public.films IS 'Table contenant les films scrapés';

-- Table bollywood pour stocker les contenus bollywood scrapés
CREATE TABLE IF NOT EXISTS public.bollywood (
    id UUID PRIMARY KEY,
    title TEXT NOT NULL,
    synopsis TEXT,
    year INTEGER,
    language TEXT,
    genres TEXT[],
    episodes_count INTEGER,
    status TEXT,
    rating FLOAT,
    image_url TEXT,
    source TEXT NOT NULL,
    source_url TEXT NOT NULL,
    scraped_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Commentaires sur la table bollywood
COMMENT ON TABLE public.bollywood IS 'Table contenant les contenus bollywood scrapés';

-- Création des index
CREATE INDEX IF NOT EXISTS dramas_title_source_idx ON public.dramas(title, source);
CREATE INDEX IF NOT EXISTS dramas_source_idx ON public.dramas(source);
CREATE INDEX IF NOT EXISTS dramas_year_idx ON public.dramas(year);

CREATE INDEX IF NOT EXISTS animes_title_source_idx ON public.animes(title, source);
CREATE INDEX IF NOT EXISTS animes_source_idx ON public.animes(source);
CREATE INDEX IF NOT EXISTS animes_year_idx ON public.animes(year);

CREATE INDEX IF NOT EXISTS films_title_source_idx ON public.films(title, source);
CREATE INDEX IF NOT EXISTS films_source_idx ON public.films(source);
CREATE INDEX IF NOT EXISTS films_year_idx ON public.films(year);

CREATE INDEX IF NOT EXISTS bollywood_title_source_idx ON public.bollywood(title, source);
CREATE INDEX IF NOT EXISTS bollywood_source_idx ON public.bollywood(source);
CREATE INDEX IF NOT EXISTS bollywood_year_idx ON public.bollywood(year);

-- Triggers pour maintenir le champ updated_at à jour
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Ajout des triggers sur chaque table
DROP TRIGGER IF EXISTS set_dramas_updated_at ON public.dramas;
CREATE TRIGGER set_dramas_updated_at
BEFORE UPDATE ON public.dramas
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_animes_updated_at ON public.animes;
CREATE TRIGGER set_animes_updated_at
BEFORE UPDATE ON public.animes
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_films_updated_at ON public.films;
CREATE TRIGGER set_films_updated_at
BEFORE UPDATE ON public.films
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_bollywood_updated_at ON public.bollywood;
CREATE TRIGGER set_bollywood_updated_at
BEFORE UPDATE ON public.bollywood
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Configuration du bucket de stockage
-- Note: Cette partie doit être exécutée manuellement dans l'interface Supabase Storage
-- car elle nécessite des privilèges administrateur
/*
-- Création du bucket images (à faire via l'interface Supabase)
INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'Images', true)
ON CONFLICT (id) DO NOTHING;

-- Politique d'accès en lecture pour tout le monde
CREATE POLICY "Public Images Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'images');
*/

-- Confirmation de fin d'exécution
SELECT 'Migration réussie. Tables et index créés.' as resultat;
