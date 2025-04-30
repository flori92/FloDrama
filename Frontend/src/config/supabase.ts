// Configuration Supabase pour FloDrama
import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase.types';

// Utilisation de variables d'environnement pour les informations sensibles
// ces valeurs seront remplacées par les variables d'environnement en production
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fffgoqubrbgppcqqkyod.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''; // À définir dans le .env

// Création du client Supabase typé
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Fonction utilitaire pour vérifier la connexion
export async function checkSupabaseConnection(): Promise<boolean> {
  try {
    const { data, error } = await supabase.from('health_check').select('*').limit(1);
    if (error) {
      console.error('Erreur de connexion à Supabase:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Exception lors de la vérification de connexion Supabase:', err);
    return false;
  }
}

// Gestion des URLs d'images Supabase Storage
export function getSupabaseImageUrl(bucket: string, path: string): string {
  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`;
}
