-- Migration pour ajouter la colonne image_url à la table dramas
-- Cette colonne est nécessaire pour stocker les URL des images téléchargées dans Supabase Storage

ALTER TABLE dramas 
ADD COLUMN IF NOT EXISTS image_url TEXT;

COMMENT ON COLUMN dramas.image_url IS 'URL de l''image du poster du drama dans Supabase Storage';

-- Migration pour ajouter des colonnes importantes qui pourraient être manquantes
ALTER TABLE dramas 
ADD COLUMN IF NOT EXISTS title TEXT,
ADD COLUMN IF NOT EXISTS synopsis TEXT,
ADD COLUMN IF NOT EXISTS year INTEGER,
ADD COLUMN IF NOT EXISTS genres TEXT[];

-- Mise à jour du timestamp pour que Supabase sache que le schéma a changé
SELECT now();
