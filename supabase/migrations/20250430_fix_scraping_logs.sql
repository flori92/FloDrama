-- Migration pour mettre à jour la table scraping_logs
-- Cette migration corrige la structure de la table pour correspondre aux scripts de scraping

-- Ajout des colonnes manquantes dans scraping_logs
ALTER TABLE public.scraping_logs 
ADD COLUMN IF NOT EXISTS started_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS success BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS total_items INTEGER DEFAULT 0;

-- Commentaire pour documenter les modifications
COMMENT ON COLUMN public.scraping_logs.started_at IS 'Horodatage du début du scraping';
COMMENT ON COLUMN public.scraping_logs.completed_at IS 'Horodatage de la fin du scraping';
COMMENT ON COLUMN public.scraping_logs.success IS 'Indique si le scraping a réussi';
COMMENT ON COLUMN public.scraping_logs.total_items IS 'Nombre total d''éléments récupérés';

-- Message de confirmation
DO $$
BEGIN
    RAISE NOTICE 'La table scraping_logs a été mise à jour avec succès';
END $$;
