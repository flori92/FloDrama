-- Migration Supabase pour FloDrama
-- Création des tables principales: dramas, animes, films, bollywood, carousels, hero_banners, scraping_logs, health_check

-- Table pour les dramas
CREATE TABLE IF NOT EXISTS public.dramas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    original_title TEXT,
    poster TEXT,
    backdrop TEXT,
    year INTEGER,
    rating FLOAT,
    language TEXT,
    description TEXT,
    genres TEXT[],
    episodes INTEGER,
    duration INTEGER,
    country TEXT,
    source_url TEXT,
    trailer_url TEXT,
    watch_url TEXT,
    status TEXT,
    actors TEXT[],
    director TEXT,
    studio TEXT,
    tags TEXT[],
    popularity INTEGER DEFAULT 0,
    season INTEGER,
    related_content TEXT[],
    similar_content TEXT[],
    age_rating TEXT,
    has_subtitles BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    is_trending BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table pour les animes
CREATE TABLE IF NOT EXISTS public.animes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    original_title TEXT,
    poster TEXT,
    backdrop TEXT,
    year INTEGER,
    rating FLOAT,
    language TEXT,
    description TEXT,
    genres TEXT[],
    episodes INTEGER,
    duration INTEGER,
    country TEXT,
    source_url TEXT,
    trailer_url TEXT,
    watch_url TEXT,
    status TEXT,
    actors TEXT[],
    director TEXT,
    studio TEXT,
    tags TEXT[],
    popularity INTEGER DEFAULT 0,
    season INTEGER,
    related_content TEXT[],
    similar_content TEXT[],
    age_rating TEXT,
    has_subtitles BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    is_trending BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table pour les films
CREATE TABLE IF NOT EXISTS public.films (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    original_title TEXT,
    poster TEXT,
    backdrop TEXT,
    year INTEGER,
    rating FLOAT,
    language TEXT,
    description TEXT,
    genres TEXT[],
    duration INTEGER,
    country TEXT,
    source_url TEXT,
    trailer_url TEXT,
    watch_url TEXT,
    status TEXT,
    actors TEXT[],
    director TEXT,
    studio TEXT,
    tags TEXT[],
    popularity INTEGER DEFAULT 0,
    related_content TEXT[],
    similar_content TEXT[],
    age_rating TEXT,
    has_subtitles BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    is_trending BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table pour les bollywood
CREATE TABLE IF NOT EXISTS public.bollywood (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    original_title TEXT,
    poster TEXT,
    backdrop TEXT,
    year INTEGER,
    rating FLOAT,
    language TEXT,
    description TEXT,
    genres TEXT[],
    duration INTEGER,
    country TEXT,
    source_url TEXT,
    trailer_url TEXT,
    watch_url TEXT,
    status TEXT,
    actors TEXT[],
    director TEXT,
    studio TEXT,
    tags TEXT[],
    popularity INTEGER DEFAULT 0,
    related_content TEXT[],
    similar_content TEXT[],
    age_rating TEXT,
    has_subtitles BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    is_trending BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table pour les carousels
CREATE TABLE IF NOT EXISTS public.carousels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    type TEXT,
    order_index INTEGER DEFAULT 0,
    items JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table pour les hero_banners
CREATE TABLE IF NOT EXISTS public.hero_banners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT,
    subtitle TEXT,
    description TEXT,
    image_url TEXT,
    backdrop TEXT,
    content_id TEXT,
    content_type TEXT,
    call_to_action TEXT,
    link TEXT,
    order_index INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table pour les logs de scraping
CREATE TABLE IF NOT EXISTS public.scraping_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source TEXT NOT NULL,
    content_type TEXT NOT NULL,
    items_count INTEGER DEFAULT 0,
    status TEXT,
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table pour la vérification de la santé
CREATE TABLE IF NOT EXISTS public.health_check (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    status TEXT DEFAULT 'OK',
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
    message TEXT
);

-- Insertion d'une entrée de test dans health_check
INSERT INTO public.health_check (status, message) 
VALUES ('OK', 'Supabase est opérationnel');

-- Création d'index pour améliorer les performances
CREATE INDEX IF NOT EXISTS dramas_title_idx ON public.dramas USING gin (to_tsvector('french', title));
CREATE INDEX IF NOT EXISTS animes_title_idx ON public.animes USING gin (to_tsvector('french', title));
CREATE INDEX IF NOT EXISTS films_title_idx ON public.films USING gin (to_tsvector('french', title));
CREATE INDEX IF NOT EXISTS bollywood_title_idx ON public.bollywood USING gin (to_tsvector('french', title));

-- Création d'une fonction de recherche fulltext
CREATE OR REPLACE FUNCTION search_content(search_term TEXT)
RETURNS TABLE (
    id UUID,
    title TEXT,
    original_title TEXT,
    poster TEXT,
    content_type TEXT,
    year INTEGER,
    rating FLOAT,
    score FLOAT
) AS $$
BEGIN
    RETURN QUERY
        SELECT 
            d.id, 
            d.title, 
            d.original_title, 
            d.poster, 
            'drama'::TEXT as content_type, 
            d.year, 
            d.rating,
            ts_rank(to_tsvector('french', d.title || ' ' || COALESCE(d.description, '')), plainto_tsquery('french', search_term)) as score
        FROM 
            public.dramas d
        WHERE 
            to_tsvector('french', d.title || ' ' || COALESCE(d.description, '')) @@ plainto_tsquery('french', search_term)
        UNION ALL
        SELECT 
            a.id, 
            a.title, 
            a.original_title, 
            a.poster, 
            'anime'::TEXT as content_type, 
            a.year, 
            a.rating,
            ts_rank(to_tsvector('french', a.title || ' ' || COALESCE(a.description, '')), plainto_tsquery('french', search_term)) as score
        FROM 
            public.animes a
        WHERE 
            to_tsvector('french', a.title || ' ' || COALESCE(a.description, '')) @@ plainto_tsquery('french', search_term)
        UNION ALL
        SELECT 
            f.id, 
            f.title, 
            f.original_title, 
            f.poster, 
            'film'::TEXT as content_type, 
            f.year, 
            f.rating,
            ts_rank(to_tsvector('french', f.title || ' ' || COALESCE(f.description, '')), plainto_tsquery('french', search_term)) as score
        FROM 
            public.films f
        WHERE 
            to_tsvector('french', f.title || ' ' || COALESCE(f.description, '')) @@ plainto_tsquery('french', search_term)
        UNION ALL
        SELECT 
            b.id, 
            b.title, 
            b.original_title, 
            b.poster, 
            'bollywood'::TEXT as content_type, 
            b.year, 
            b.rating,
            ts_rank(to_tsvector('french', b.title || ' ' || COALESCE(b.description, '')), plainto_tsquery('french', search_term)) as score
        FROM 
            public.bollywood b
        WHERE 
            to_tsvector('french', b.title || ' ' || COALESCE(b.description, '')) @@ plainto_tsquery('french', search_term)
        ORDER BY 
            score DESC;
END;
$$ LANGUAGE plpgsql;

-- Activer les extensions nécessaires
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Commentaires sur les tables
COMMENT ON TABLE public.dramas IS 'Table contenant les dramas coréens, chinois, etc.';
COMMENT ON TABLE public.animes IS 'Table contenant les animes japonais';
COMMENT ON TABLE public.films IS 'Table contenant les films internationaux';
COMMENT ON TABLE public.bollywood IS 'Table contenant les films et séries de Bollywood';
COMMENT ON TABLE public.carousels IS 'Table contenant les carousels de la page d''accueil';
COMMENT ON TABLE public.hero_banners IS 'Table contenant les banners de la page d''accueil';
COMMENT ON TABLE public.scraping_logs IS 'Table contenant les logs de scraping de contenu';
COMMENT ON TABLE public.health_check IS 'Table pour vérifier la santé de la connexion Supabase';
