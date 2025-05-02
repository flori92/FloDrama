-- Ajout des colonnes manquantes à la table scraping_logs

-- Ajout de la colonne target_table
ALTER TABLE public.scraping_logs 
ADD COLUMN IF NOT EXISTS target_table TEXT,
ADD COLUMN IF NOT EXISTS error_message TEXT,
ADD COLUMN IF NOT EXISTS error_count INTEGER DEFAULT 0;

-- Commentaire pour documenter les modifications
COMMENT ON COLUMN public.scraping_logs.target_table IS 'Table cible du scraping';
COMMENT ON COLUMN public.scraping_logs.error_message IS 'Message d''erreur en cas d''échec';
COMMENT ON COLUMN public.scraping_logs.error_count IS 'Nombre d''erreurs lors du scraping';

-- Message de confirmation
DO $$
BEGIN
    RAISE NOTICE 'Colonnes supplémentaires ajoutées à la table scraping_logs';
END $$;
