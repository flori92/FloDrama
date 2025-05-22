/**
 * Service de connexion à Supabase
 * Fournit un client Supabase configuré pour l'application FloDrama
 */

import { createClient } from '@supabase/supabase-js';

// Configuration par défaut
const DEFAULT_SUPABASE_URL = 'https://fffgoqubrbgppcqqkyod.supabase.co';
const DEFAULT_SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'; // À remplacer par la vraie clé

/**
 * Crée et retourne un client Supabase configuré
 * @param {Object} options - Options de configuration
 * @returns {Object} Client Supabase
 */
export const getSupabaseClient = (options = {}) => {
  const {
    supabaseUrl = process.env.SUPABASE_URL || DEFAULT_SUPABASE_URL,
    supabaseKey = process.env.SUPABASE_SERVICE_KEY || DEFAULT_SUPABASE_KEY,
  } = options;

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
};

/**
 * Vérifie la connexion à Supabase
 * @returns {Promise<boolean>} True si la connexion est établie, false sinon
 */
export const checkSupabaseConnection = async () => {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.from('sources').select('count').limit(1);
    
    if (error) {
      console.error('Erreur de connexion à Supabase:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Erreur lors de la vérification de la connexion à Supabase:', error);
    return false;
  }
};

/**
 * Initialise les tables nécessaires dans Supabase si elles n'existent pas
 * @returns {Promise<boolean>} True si l'initialisation est réussie, false sinon
 */
export const initializeSupabaseTables = async () => {
  try {
    const supabase = getSupabaseClient();
    
    // Vérifier si les tables existent déjà
    const { data: existingTables, error: tablesError } = await supabase
      .rpc('get_tables');
    
    if (tablesError) {
      console.error('Erreur lors de la récupération des tables:', tablesError);
      return false;
    }
    
    const tables = existingTables || [];
    const requiredTables = ['sources', 'contents', 'recommendations', 'user_preferences'];
    
    // Créer les tables manquantes
    for (const table of requiredTables) {
      if (!tables.includes(table)) {
        console.log(`Création de la table ${table}...`);
        // Implémentation de la création de table spécifique à chaque table
        // ...
      }
    }
    
    return true;
  } catch (error) {
    console.error('Erreur lors de l\'initialisation des tables Supabase:', error);
    return false;
  }
};
