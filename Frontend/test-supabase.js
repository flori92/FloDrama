// Script de test pour vérifier la connexion à Supabase
const { createClient } = require('@supabase/supabase-js');

// Configuration Supabase
const supabaseUrl = 'https://fffgoqubrbgppcqqkyod.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZmZmdvcXVicmJncHBjcXFreW9kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU2ODM1MDQsImV4cCI6MjA2MTI1OTUwNH0.lxpg0D4vmAbCAR-tHxUSFCvayNQFEe98Qii32YsCnJI';

// Création du client Supabase
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Fonction pour vérifier la connexion
async function testSupabaseConnection() {
  console.log('🔍 Vérification de la connexion Supabase...');
  
  try {
    // Utiliser auth.getSession() qui ne dépend pas d'une table spécifique
    const { data, error } = await supabase.auth.getSession();
      
    if (error) {
      console.error('❌ Connexion indisponible:', error.message);
      return false;
    } else {
      console.log('✅ Connexion Supabase établie avec succès!');
      return true;
    }
  } catch (error) {
    console.error('❌ Erreur lors de la connexion:', error);
    return false;
  }
}

// Fonction pour tester les tables disponibles
async function checkTables() {
  const tables = ['dramas', 'animes', 'films', 'bollywood', 'carousels', 'hero_banners', 'scraping_logs', 'health_check'];
  console.log('🔍 Vérification des tables Supabase...');
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('count')
        .limit(1);
        
      if (error) {
        console.error(`❌ Table "${table}" inaccessible:`, error.message);
      } else {
        console.log(`✅ Table "${table}" accessible`);
      }
    } catch (error) {
      console.error(`❌ Erreur lors de l'accès à la table "${table}":`, error);
    }
  }
}

// Exécuter les tests
async function runTests() {
  const isConnected = await testSupabaseConnection();
  
  if (isConnected) {
    await checkTables();
  }
  
  console.log('\n📊 Résultat: Supabase est', isConnected ? 'PRÊT ✅' : 'NON PRÊT ❌');
}

runTests();
