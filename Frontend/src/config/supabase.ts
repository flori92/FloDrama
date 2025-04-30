// Configuration Supabase pour FloDrama
import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase.types';

// Utilisation de variables d'environnement pour les informations sensibles
// ces valeurs seront remplacées par les variables d'environnement en production
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fffgoqubrbgppcqqkyod.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZmZmdvcXVicmJncHBjcXFreW9kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU2ODM1MDQsImV4cCI6MjA2MTI1OTUwNH0.lxpg0D4vmAbCAR-tHxUSFCvayNQFEe98Qii32YsCnJI';

// Création du client Supabase typé
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Type helper pour les requêtes Supabase
export type Tables = Database['public']['Tables'];

// Fonction helper pour contourner les problèmes de typage
export function fromTable<T extends keyof Tables>(table: T) {
  return supabase.from(table);
}

// Fonction helper pour le typage des données
export function typedData<T>(data: any): T {
  return data as T;
}

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
