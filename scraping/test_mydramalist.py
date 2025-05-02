#!/usr/bin/env python3
"""
Script de test pour le scraper MyDramaList
"""
import os
import sys
from dotenv import load_dotenv

# Ajouter le répertoire parent au chemin Python pour les imports
sys.path.append(os.path.abspath(os.path.dirname(os.path.dirname(__file__))))

# Charger les variables d'environnement
load_dotenv()

# Définir les variables d'environnement pour le test
os.environ["MIN_ITEMS"] = "3"  # Limiter à 3 items pour le test
os.environ["TARGET_TABLE"] = "dramas"

# Importer le module après avoir défini les variables d'environnement
from scraping.sources.mydramalist import init_supabase_client, scrape_and_upload_dramas

if __name__ == "__main__":
    print("🔍 Test du scraper MyDramaList...")
    
    # Initialiser le client Supabase
    supabase = init_supabase_client()
    if not supabase:
        print("❌ Erreur d'initialisation du client Supabase")
        sys.exit(1)
    
    # Exécuter le scraping
    results = scrape_and_upload_dramas()
    
    # Afficher les résultats
    print(f"✅ Test terminé! {results['success']} dramas trouvés, {results['errors']} erreurs")
