#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Scraper unifié pour FloDrama - Migration Supabase
Ce script est le point d'entrée principal pour tous les scrapers.
Il permet d'exécuter un ou plusieurs scrapers en fonction des paramètres.
"""

import os
import sys
import time
import logging
import argparse
from datetime import datetime
from typing import List, Dict, Any

# Import des modules de scrapers
from scraper_base import BaseScraper, ScraperUtils
from drama_scrapers import get_all_drama_scrapers
from anime_film_scrapers import get_all_anime_scrapers, get_all_film_scrapers
from bollywood_scrapers import get_all_bollywood_scrapers

# Configuration du logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("scraping/logs/scraping.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger('unified_scraper')

# Création du dossier de logs s'il n'existe pas
os.makedirs("scraping/logs", exist_ok=True)

def get_all_scrapers() -> Dict[str, List[BaseScraper]]:
    """Récupère tous les scrapers disponibles par catégorie"""
    return {
        "dramas": get_all_drama_scrapers(),
        "animes": get_all_anime_scrapers(),
        "films": get_all_film_scrapers(),
        "bollywood": get_all_bollywood_scrapers()
    }

def get_scraper_by_id(scraper_id: str) -> BaseScraper:
    """Récupère un scraper spécifique par son ID"""
    all_scrapers = []
    for category_scrapers in get_all_scrapers().values():
        all_scrapers.extend(category_scrapers)
    
    for scraper in all_scrapers:
        if scraper.source_id == scraper_id:
            return scraper
    
    return None

def run_all_scrapers() -> Dict[str, Any]:
    """Exécute tous les scrapers disponibles"""
    start_time = time.time()
    logger.info("Démarrage du scraping pour toutes les sources")
    
    all_scrapers = get_all_scrapers()
    results = {}
    
    for category, scrapers in all_scrapers.items():
        category_results = []
        logger.info(f"Exécution des scrapers pour la catégorie: {category}")
        
        for scraper in scrapers:
            logger.info(f"Exécution du scraper: {scraper.source_id}")
            try:
                scraper_result = scraper.run()
                category_results.append({
                    "source_id": scraper.source_id,
                    "success": scraper_result.get("success", 0),
                    "errors": scraper_result.get("errors", 0),
                    "total": scraper_result.get("total", 0)
                })
            except Exception as e:
                logger.error(f"Erreur lors de l'exécution du scraper {scraper.source_id}: {str(e)}")
                category_results.append({
                    "source_id": scraper.source_id,
                    "success": 0,
                    "errors": 1,
                    "total": 0,
                    "error_message": str(e)
                })
        
        results[category] = category_results
    
    # Calcul de la durée totale
    duration = time.time() - start_time
    
    # Résumé global
    total_success = sum(item["success"] for category in results.values() for item in category)
    total_errors = sum(item["errors"] for category in results.values() for item in category)
    
    logger.info(f"Scraping terminé en {duration:.2f} secondes")
    logger.info(f"Résultats globaux: {total_success} contenus ajoutés/mis à jour, {total_errors} erreurs")
    
    # Génération du rapport global
    global_report = {
        "timestamp": datetime.now().isoformat(),
        "duration": duration,
        "total_success": total_success,
        "total_errors": total_errors,
        "categories": results
    }
    
    try:
        import json
        with open(f"scraping/global_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json", "w") as f:
            json.dump(global_report, f, indent=4)
    except Exception as e:
        logger.error(f"Erreur lors de la sauvegarde du rapport global: {str(e)}")
    
    return global_report

def run_category_scrapers(category: str) -> Dict[str, Any]:
    """Exécute tous les scrapers d'une catégorie spécifique"""
    start_time = time.time()
    logger.info(f"Démarrage du scraping pour la catégorie: {category}")
    
    all_scrapers = get_all_scrapers()
    if category not in all_scrapers:
        logger.error(f"Catégorie inconnue: {category}")
        return {"error": f"Catégorie inconnue: {category}"}
    
    scrapers = all_scrapers[category]
    results = []
    
    for scraper in scrapers:
        logger.info(f"Exécution du scraper: {scraper.source_id}")
        try:
            scraper_result = scraper.run()
            results.append({
                "source_id": scraper.source_id,
                "success": scraper_result.get("success", 0),
                "errors": scraper_result.get("errors", 0),
                "total": scraper_result.get("total", 0)
            })
        except Exception as e:
            logger.error(f"Erreur lors de l'exécution du scraper {scraper.source_id}: {str(e)}")
            results.append({
                "source_id": scraper.source_id,
                "success": 0,
                "errors": 1,
                "total": 0,
                "error_message": str(e)
            })
    
    # Calcul de la durée totale
    duration = time.time() - start_time
    
    # Résumé
    total_success = sum(item["success"] for item in results)
    total_errors = sum(item["errors"] for item in results)
    
    logger.info(f"Scraping de la catégorie {category} terminé en {duration:.2f} secondes")
    logger.info(f"Résultats: {total_success} contenus ajoutés/mis à jour, {total_errors} erreurs")
    
    # Génération du rapport
    category_report = {
        "category": category,
        "timestamp": datetime.now().isoformat(),
        "duration": duration,
        "total_success": total_success,
        "total_errors": total_errors,
        "scrapers": results
    }
    
    try:
        import json
        with open(f"scraping/{category}_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json", "w") as f:
            json.dump(category_report, f, indent=4)
    except Exception as e:
        logger.error(f"Erreur lors de la sauvegarde du rapport de catégorie: {str(e)}")
    
    return category_report

def run_specific_scraper(scraper_id: str) -> Dict[str, Any]:
    """Exécute un scraper spécifique par son ID"""
    start_time = time.time()
    logger.info(f"Démarrage du scraping pour la source: {scraper_id}")
    
    scraper = get_scraper_by_id(scraper_id)
    if not scraper:
        logger.error(f"Scraper inconnu: {scraper_id}")
        return {"error": f"Scraper inconnu: {scraper_id}"}
    
    try:
        result = scraper.run()
        
        # Calcul de la durée totale
        duration = time.time() - start_time
        
        logger.info(f"Scraping de {scraper_id} terminé en {duration:.2f} secondes")
        logger.info(f"Résultats: {result.get('success', 0)} contenus ajoutés/mis à jour, {result.get('errors', 0)} erreurs")
        
        return result
    except Exception as e:
        logger.error(f"Erreur lors de l'exécution du scraper {scraper_id}: {str(e)}")
        return {
            "source_id": scraper_id,
            "success": 0,
            "errors": 1,
            "total": 0,
            "error_message": str(e)
        }

def verify_metrics():
    """Vérifie que chaque source a au moins MIN_ITEMS éléments"""
    from supabase import create_client
    
    logger.info("Vérification des métriques de scraping")
    
    # Récupération des variables d'environnement
    supabase_url = os.environ.get("SUPABASE_URL")
    supabase_key = os.environ.get("SUPABASE_KEY")
    min_items = int(os.environ.get("MIN_ITEMS", "200"))
    
    if not supabase_url or not supabase_key:
        logger.error("Variables d'environnement SUPABASE_URL et SUPABASE_KEY requises")
        return {"error": "Variables d'environnement manquantes"}
    
    # Initialisation du client Supabase
    supabase = create_client(supabase_url, supabase_key)
    
    # Récupération de tous les scrapers
    all_scrapers = []
    for category_scrapers in get_all_scrapers().values():
        all_scrapers.extend(category_scrapers)
    
    results = {}
    all_success = True
    
    for scraper in all_scrapers:
        source_id = scraper.source_id
        target_table = scraper.target_table
        
        try:
            # Comptage des éléments pour cette source
            count_response = supabase.table(target_table) \
                .select("id", count="exact") \
                .eq("source", source_id) \
                .execute()
            
            count = count_response.count if hasattr(count_response, 'count') else 0
            
            # Vérification du minimum requis
            success = count >= min_items
            if not success:
                all_success = False
            
            results[source_id] = {
                "table": target_table,
                "count": count,
                "min_required": min_items,
                "success": success
            }
            
            status = "✅" if success else "❌"
            logger.info(f"{status} {source_id}: {count}/{min_items} éléments")
            
        except Exception as e:
            logger.error(f"Erreur lors de la vérification des métriques pour {source_id}: {str(e)}")
            results[source_id] = {
                "table": target_table,
                "error": str(e),
                "success": False
            }
            all_success = False
    
    # Résumé global
    if all_success:
        logger.info("✅ Toutes les sources ont atteint le minimum requis")
    else:
        logger.error("❌ Certaines sources n'ont pas atteint le minimum requis")
    
    # Génération du rapport
    metrics_report = {
        "timestamp": datetime.now().isoformat(),
        "min_items": min_items,
        "all_success": all_success,
        "sources": results
    }
    
    try:
        import json
        with open(f"scraping/metrics_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json", "w") as f:
            json.dump(metrics_report, f, indent=4)
    except Exception as e:
        logger.error(f"Erreur lors de la sauvegarde du rapport de métriques: {str(e)}")
    
    return metrics_report

def list_available_scrapers():
    """Liste tous les scrapers disponibles"""
    all_scrapers = get_all_scrapers()
    
    print("Scrapers disponibles:")
    for category, scrapers in all_scrapers.items():
        print(f"\n=== {category.upper()} ===")
        for scraper in scrapers:
            print(f"  - {scraper.source_id} ({scraper.base_url})")
    
    print("\nUtilisation:")
    print("  python unified_scraper.py --all                   # Exécuter tous les scrapers")
    print("  python unified_scraper.py --category dramas       # Exécuter tous les scrapers de dramas")
    print("  python unified_scraper.py --source voirdrama      # Exécuter uniquement le scraper VoirDrama")
    print("  python unified_scraper.py --verify-metrics        # Vérifier les métriques de scraping")
    print("  python unified_scraper.py --list                  # Afficher cette liste")

def main():
    """Point d'entrée principal du script"""
    parser = argparse.ArgumentParser(description="Scraper unifié pour FloDrama")
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--all", action="store_true", help="Exécuter tous les scrapers")
    group.add_argument("--category", type=str, help="Exécuter tous les scrapers d'une catégorie")
    group.add_argument("--source", type=str, help="Exécuter un scraper spécifique")
    group.add_argument("--verify-metrics", action="store_true", help="Vérifier les métriques de scraping")
    group.add_argument("--list", action="store_true", help="Lister tous les scrapers disponibles")
    
    args = parser.parse_args()
    
    if args.all:
        run_all_scrapers()
    elif args.category:
        run_category_scrapers(args.category)
    elif args.source:
        run_specific_scraper(args.source)
    elif args.verify_metrics:
        verify_metrics()
    elif args.list:
        list_available_scrapers()

if __name__ == "__main__":
    main()
