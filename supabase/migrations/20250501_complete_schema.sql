-- Migration complète pour le schéma Supabase (tables de scraping)
-- Date: 2025-05-01

-- Table dramas (remplacement complet de la table AWS)
DO $$ 
BEGIN
    -- Vérifier si la table existe
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'dramas') THEN
        -- Créer la table dramas complète
        CREATE TABLE public.dramas (
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
            
            -- Métadonnées supplémentaires
            actors TEXT[],
            director TEXT,
            duration INTEGER, -- en minutes
            
            -- Champs pour Supabase
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        );

        -- Commentaires sur les colonnes
        COMMENT ON TABLE public.dramas IS 'Table contenant les dramas scrapés';
        COMMENT ON COLUMN public.dramas.id IS 'Identifiant unique du drama';
        COMMENT ON COLUMN public.dramas.title IS 'Titre du drama';
        COMMENT ON COLUMN public.dramas.source IS 'Source de scraping (ex: voirdrama, mydramalist)';
        COMMENT ON COLUMN public.dramas.source_url IS 'URL source du contenu';
        COMMENT ON COLUMN public.dramas.image_url IS 'URL de l''image dans Supabase Storage';
    ELSE
        -- Si la table existe, ajouter les colonnes manquantes
        DO $inner$ 
        BEGIN
            -- Ajouter les colonnes qui pourraient manquer
            IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'dramas' AND column_name = 'image_url') THEN
                ALTER TABLE public.dramas ADD COLUMN image_url TEXT;
                COMMENT ON COLUMN public.dramas.image_url IS 'URL de l''image dans Supabase Storage';
            END IF;

            IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'dramas' AND column_name = 'source') THEN
                ALTER TABLE public.dramas ADD COLUMN source TEXT;
                COMMENT ON COLUMN public.dramas.source IS 'Source de scraping (ex: voirdrama, mydramalist)';
            END IF;

            IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'dramas' AND column_name = 'source_url') THEN
                ALTER TABLE public.dramas ADD COLUMN source_url TEXT;
                COMMENT ON COLUMN public.dramas.source_url IS 'URL source du contenu';
            END IF;

            IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'dramas' AND column_name = 'episodes_count') THEN
                ALTER TABLE public.dramas ADD COLUMN episodes_count INTEGER;
            END IF;

            IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'dramas' AND column_name = 'scraped_at') THEN
                ALTER TABLE public.dramas ADD COLUMN scraped_at TIMESTAMP WITH TIME ZONE DEFAULT now();
            END IF;
        END $inner$;
    END IF;

    -- Création de la table scraping_logs si elle n'existe pas
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'scraping_logs') THEN
        CREATE TABLE public.scraping_logs (
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
        
        COMMENT ON TABLE public.scraping_logs IS 'Logs de scraping pour chaque source';
    END IF;
END $$;

-- Créer des index pour optimiser les performances
DO $$ 
BEGIN
    -- Index sur title et source pour les recherches rapides
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'dramas' AND indexname = 'dramas_title_source_idx') THEN
        CREATE INDEX dramas_title_source_idx ON public.dramas(title, source);
    END IF;

    -- Index sur source pour filtrer par source
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'dramas' AND indexname = 'dramas_source_idx') THEN
        CREATE INDEX dramas_source_idx ON public.dramas(source);
    END IF;

    -- Index sur year pour filtrer par année
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'dramas' AND indexname = 'dramas_year_idx') THEN
        CREATE INDEX dramas_year_idx ON public.dramas(year);
    END IF;
END $$;

-- Créer un trigger pour mettre à jour le champ updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Ajouter le trigger pour la table dramas s'il n'existe pas
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_dramas_updated_at') THEN
        CREATE TRIGGER set_dramas_updated_at
        BEFORE UPDATE ON public.dramas
        FOR EACH ROW
        EXECUTE FUNCTION public.handle_updated_at();
    END IF;
END $$;

-- Vérifier l'existence et mettre à jour le stockage
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'images') THEN
        INSERT INTO storage.buckets (id, name, public) VALUES ('images', 'Images', true);
    END IF;
END $$;

-- Accorder les permissions nécessaires
DO $$ 
BEGIN
    -- Politique d'accès en lecture pour tout le monde
    IF NOT EXISTS (SELECT 1 FROM storage.policies WHERE name = 'Public Images Access') THEN
        CREATE POLICY "Public Images Access" ON storage.objects
        FOR SELECT USING (bucket_id = 'images');
    END IF;
END $$;

-- Valider le succès
SELECT 'Migration vers Supabase réussie. Tables dramas et scraping_logs configurées.' as result;
