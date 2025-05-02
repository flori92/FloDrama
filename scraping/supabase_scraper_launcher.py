#!/usr/bin/env python3
"""
Script de lancement du scraping FloDrama avec Supabase
Ce script orchestre les différents scrapers pour alimenter la base de données Supabase
"""
import os
import sys
import json
import logging
import time
import argparse
from pathlib import Path
from datetime import datetime
import importlib
from dotenv import load_dotenv

# Configuration du logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('FloDrama-SupabaseScrapingLauncher')

# Ajouter le répertoire parent au chemin Python pour les imports
sys.path.append(os.path.abspath(os.path.dirname(os.path.dirname(__file__))))

# Chargement des variables d'environnement
load_dotenv()

# Configuration Supabase
SUPABASE_URL = os.environ.get('SUPABASE_URL')
SUPABASE_KEY = os.environ.get('SUPABASE_SERVICE_KEY')
SUPABASE_STORAGE_BUCKET = os.environ.get('SUPABASE_STORAGE_BUCKET', 'flodrama-images')

# Import des modules nécessaires pour Supabase
from supabase import create_client, Client

# Initialisation du client Supabase
supabase_client: Client = None

def init_supabase_client():
    """Initialise le client Supabase"""
    global supabase_client
    
    if not SUPABASE_URL or not SUPABASE_KEY:
        logger.error("Les variables d'environnement SUPABASE_URL et SUPABASE_SERVICE_KEY doivent être définies")
        return None
    
    try:
        supabase_client = create_client(SUPABASE_URL, SUPABASE_KEY)
        logger.info(f"✅ Client Supabase initialisé pour {SUPABASE_URL}")
        return supabase_client
    except Exception as e:
        logger.error(f"❌ Erreur lors de l'initialisation du client Supabase: {str(e)}")
        raise

def get_available_scrapers():
    """Récupère la liste des scrapers disponibles"""
    # Catégories de scrapers
    categories = {
        "drama": ["voirdrama", "mydramalist", "dramacool", "kdrama", "dramafever", "asiancrus", "dramapassion", "kissasian"],
        "anime": ["gogoanime", "voiranime", "neko-sama"],
        "film": ["dpstream", "allocine", "imdb", "themoviedb", "cinepulse"],
        "bollywood": ["bollywoodmdb", "zee5", "hotstar"]
    }
    
    # Vérifier les scrapers disponibles
    available_scrapers = {}
    sources_dir = Path(__file__).parent / "sources"
    
    if not sources_dir.exists():
        logger.error(f"❌ Répertoire des sources introuvable: {sources_dir}")
        return {}
    
    for category, scrapers in categories.items():
        available_scrapers[category] = []
        
        for scraper in scrapers:
            scraper_file = sources_dir / f"{scraper}.py"
            if scraper_file.exists():
                available_scrapers[category].append(scraper)
    
    return available_scrapers

def load_scraper_module(scraper_name):
    """Charge un module de scraper dynamiquement"""
    try:
        module_path = f"scraping.sources.{scraper_name}"
        module = importlib.import_module(module_path)
        logger.info(f"✅ Module {module_path} chargé avec succès")
        return module
    except ImportError as e:
        logger.error(f"❌ Erreur lors du chargement du module {scraper_name}: {str(e)}")
        return None

def run_scraper(scraper_name, item_limit=10, target_table=None):
    """Lance un scraper spécifique"""
    start_time = time.time()
    result = {
        "scraper": scraper_name,
        "status": "failed",
        "success_count": 0,
        "error_count": 0,
        "duration": 0
    }
    
    try:
        # Déterminer la table cible en fonction du nom du scraper
        if not target_table:
            if any(keyword in scraper_name for keyword in ["drama", "asian"]):
                target_table = "dramas"
            elif any(keyword in scraper_name for keyword in ["anime"]):
                target_table = "animes"
            elif any(keyword in scraper_name for keyword in ["movie", "film", "cinema"]):
                target_table = "films"
            elif any(keyword in scraper_name for keyword in ["bollywood", "zee", "hotstar"]):
                target_table = "bollywood"
            else:
                target_table = "dramas"  # Par défaut
        
        # Configurer les variables d'environnement pour le scraper
        os.environ["TARGET_TABLE"] = target_table
        os.environ["MIN_ITEMS"] = str(item_limit)
        os.environ["SOURCE_ID"] = scraper_name
        
        # Charger et exécuter le scraper
        logger.info(f"🚀 Lancement du scraper {scraper_name} (table: {target_table}, limite: {item_limit})")
        
        module = load_scraper_module(scraper_name)
        if not module:
            return result
        
        # Initialiser le client Supabase si nécessaire
        if hasattr(module, 'init_supabase_client'):
            module.init_supabase_client()
        
        # Exécuter la fonction principale du scraper
        if hasattr(module, 'scrape_and_upload_dramas'):
            scraping_result = module.scrape_and_upload_dramas()
            
            result["status"] = "success"
            result["success_count"] = scraping_result.get("success", 0)
            result["error_count"] = scraping_result.get("errors", 0)
        else:
            logger.error(f"❌ Le module {scraper_name} ne contient pas de fonction scrape_and_upload_dramas")
            return result
        
    except Exception as e:
        logger.error(f"❌ Erreur lors de l'exécution du scraper {scraper_name}: {str(e)}")
        return result
    
    # Calcul de la durée
    result["duration"] = time.time() - start_time
    
    return result

def run_category_scrapers(category, item_limit=10):
    """Lance tous les scrapers d'une catégorie"""
    available_scrapers = get_available_scrapers()
    
    if category not in available_scrapers:
        logger.error(f"❌ Catégorie inconnue: {category}")
        return []
    
    results = []
    target_table = category if category != "bollywood" else "bollywood"
    
    for scraper in available_scrapers[category]:
        result = run_scraper(scraper, item_limit, target_table)
        results.append(result)
    
    return results

def run_all_scrapers(item_limit=10):
    """Lance tous les scrapers disponibles"""
    available_scrapers = get_available_scrapers()
    results = []
    
    for category, scrapers in available_scrapers.items():
        for scraper in scrapers:
            result = run_scraper(scraper, item_limit)
            results.append(result)
    
    return results

def list_available_scrapers():
    """Affiche la liste des scrapers disponibles"""
    available_scrapers = get_available_scrapers()
    
    print("\n📋 Scrapers disponibles par catégorie:")
    for category, scrapers in available_scrapers.items():
        print(f"\n  📂 {category.upper()} ({len(scrapers)} scrapers)")
        for scraper in scrapers:
            print(f"    - {scraper}")
    
    # Compter le nombre total de scrapers
    total_count = sum(len(scrapers) for scrapers in available_scrapers.values())
    print(f"\n  🔢 Total: {total_count} scrapers\n")

def main():
    """Fonction principale"""
    # Affichage du header
    print("\n" + "="*60)
    print(" "*10 + "🚀 Lanceur de Scraping FloDrama - Supabase 🚀")
    print("="*60 + "\n")
    
    # Parsing des arguments
    parser = argparse.ArgumentParser(description="Lance le scraping FloDrama pour Supabase")
    parser.add_argument("--list", action="store_true", help="Liste les scrapers disponibles")
    parser.add_argument("--scraper", type=str, help="Lance un scraper spécifique")
    parser.add_argument("--category", type=str, choices=["drama", "anime", "film", "bollywood"], help="Lance tous les scrapers d'une catégorie")
    parser.add_argument("--all", action="store_true", help="Lance tous les scrapers disponibles")
    parser.add_argument("--limit", type=int, default=10, help="Nombre minimum d'éléments à scraper par source")
    
    args = parser.parse_args()
    
    # Initialisation du client Supabase
    if not init_supabase_client():
        logger.error("❌ Impossible d'initialiser le client Supabase. Vérifiez les variables d'environnement.")
        return 1
    
    # Exécution en fonction des arguments
    if args.list:
        list_available_scrapers()
        return 0
    
    if args.scraper:
        result = run_scraper(args.scraper, args.limit)
        if result["status"] == "success":
            logger.info(f"✅ Scraper {args.scraper} terminé: {result['success_count']} éléments ajoutés, {result['error_count']} erreurs")
        else:
            logger.error(f"❌ Scraper {args.scraper} échoué")
        return 0
    
    if args.category:
        results = run_category_scrapers(args.category, args.limit)
        success_count = sum(r["success_count"] for r in results)
        error_count = sum(r["error_count"] for r in results)
        logger.info(f"✅ Catégorie {args.category} terminée: {success_count} éléments ajoutés, {error_count} erreurs")
        return 0
    
    if args.all:
        results = run_all_scrapers(args.limit)
        success_count = sum(r["success_count"] for r in results)
        error_count = sum(r["error_count"] for r in results)
        logger.info(f"✅ Scraping complet terminé: {success_count} éléments ajoutés, {error_count} erreurs")
        return 0
    
    # Si aucun argument n'est spécifié, afficher l'aide
    parser.print_help()
    return 0

if __name__ == "__main__":
    sys.exit(main())
