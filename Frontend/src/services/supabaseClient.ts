import { createClient } from '@supabase/supabase-js';

// URL et clé Supabase
const SUPABASE_URL = 'https://fffgoqubrbgppcqqkyod.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZmZmdvcXVicmJncHBjcXFreW9kIiwicm9sZSI6ImFub24iLCJpYXQiOjE2ODI5NjQ0MDAsImV4cCI6MTk5ODU0MDQwMH0.KkGMbBzGAEoUKyqwE4QXiKKUFUPzm-kn7zXBIcFLWEY';

// Création du client Supabase avec la clé API et l'URL
export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_KEY,
  {
    auth: {
      persistSession: false, // Ne pas persister la session entre les rechargements
      autoRefreshToken: false, // Ne pas rafraîchir automatiquement le token
    },
    global: {
      headers: {
        'x-application-name': 'FloDrama',
      },
    },
  }
);

// Export d'une fonction pour récupérer les données de manière générique
export const fetchFromSupabase = async <T>(
  table: string,
  query?: {
    column?: string;
    value?: string;
    order?: { column: string; ascending: boolean };
    limit?: number;
    offset?: number;
  }
): Promise<T[]> => {
  try {
    let request = supabase.from(table).select('*');

    // Ajout des filtres si spécifiés
    if (query?.column && query?.value) {
      request = request.eq(query.column, query.value);
    }

    // Ajout de l'ordre si spécifié
    if (query?.order) {
      request = request.order(
        query.order.column,
        { ascending: query.order.ascending }
      );
    }

    // Ajout de la pagination si spécifiée
    if (query?.limit) {
      request = request.limit(query.limit);
    }

    if (query?.offset) {
      request = request.range(
        query.offset,
        query.offset + (query.limit || 20) - 1
      );
    }

    const { data, error } = await request;

    if (error) {
      console.error('Erreur Supabase:', error);
      throw error;
    }

    return data as T[];
  } catch (error) {
    console.error('Erreur lors de la récupération des données:', error);
    throw error;
  }
};
