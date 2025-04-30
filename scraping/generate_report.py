#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Générateur de rapport de scraping pour FloDrama - Migration Supabase
Ce script génère un rapport consolidé des opérations de scraping pour suivi et audit.
"""

import os
import json
import logging
from datetime import datetime, timedelta
from supabase import create_client, Client

# Configuration du logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('rapport_scraping')

# Récupération des variables d'environnement
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")

# Initialisation du client Supabase
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

def generate_scraping_report():
    """Génère un rapport complet des dernières opérations de scraping"""
    
    logger.info("Génération du rapport de scraping")
    
    # Récupérer les logs de scraping des dernières 24 heures
    yesterday = (datetime.now() - timedelta(days=1)).isoformat()
    
    logs_query = supabase.table("scraping_logs") \
        .select("*") \
        .gte("started_at", yesterday) \
        .order("started_at", ascending=False) \
        .execute()
    
    # Récupérer les statistiques de contenu
    content_stats = {}
    for table in ["dramas", "animes", "films", "bollywood"]:
        try:
            count_query = supabase.table(table).select("count", count="exact").execute()
            content_stats[table] = count_query.count if hasattr(count_query, 'count') else 0
        except Exception as e:
            logger.error(f"Erreur lors du comptage des éléments dans {table}: {str(e)}")
            content_stats[table] = 0
    
    # Récupérer le nombre de carrousels et de bannières
    try:
        carousels_query = supabase.table("carousels").select("count", count="exact").execute()
        content_stats["carousels"] = carousels_query.count if hasattr(carousels_query, 'count') else 0
    except:
        content_stats["carousels"] = 0
        
    try:
        banners_query = supabase.table("hero_banners").select("count", count="exact").execute()
        content_stats["hero_banners"] = banners_query.count if hasattr(banners_query, 'count') else 0
    except:
        content_stats["hero_banners"] = 0
    
    # Générer le rapport
    report = {
        "timestamp": datetime.now().isoformat(),
        "statistics": {
            "content_counts": content_stats,
        },
        "recent_operations": logs_query.data if logs_query.data else []
    }
    
    # Calculer des métriques supplémentaires
    total_items = sum(count for table, count in content_stats.items() 
                      if table not in ["carousels", "hero_banners"])
    
    report["statistics"]["total_items"] = total_items
    report["statistics"]["operations_count"] = len(report["recent_operations"])
    
    # Sauvegarder le rapport
    report_path = "scraping/rapport.json"
    with open(report_path, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2, ensure_ascii=False)
    
    logger.info(f"Rapport généré et sauvegardé dans {report_path}")
    
    return report

if __name__ == "__main__":
    # Vérification de la configuration
    if not SUPABASE_URL or not SUPABASE_KEY:
        logger.error("Les variables d'environnement SUPABASE_URL et SUPABASE_KEY doivent être définies")
        exit(1)
    
    # Génération du rapport
    report = generate_scraping_report()
    
    # Affichage des statistiques principales
    print("\n==== RAPPORT DE SCRAPING FLODRAMA ====")
    print(f"Date: {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}")
    print(f"Total des contenus: {report['statistics']['total_items']}")
    print("\nRépartition par type:")
    for category, count in sorted(report['statistics']['content_counts'].items()):
        if category not in ["carousels", "hero_banners"]:
            print(f"  - {category}: {count}")
    
    print(f"\nCarrousels: {report['statistics']['content_counts'].get('carousels', 0)}")
    print(f"Bannières: {report['statistics']['content_counts'].get('hero_banners', 0)}")
    
    print(f"\nOpérations récentes: {report['statistics']['operations_count']}")
    print("==================================")
