#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Vérification des métriques de scraping pour FloDrama - Migration Supabase
Ce script vérifie que chaque source a bien récupéré au moins 200 éléments
et que l'ensemble des données correspond aux objectifs fixés.
"""

import os
import json
import logging
from datetime import datetime
import time
from supabase import create_client, Client

# Configuration du logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('verify_metrics')

# Récupération des variables d'environnement
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")
MIN_TOTAL_ITEMS = int(os.environ.get("MIN_TOTAL_ITEMS", "3800"))  # 19 sources x 200 items
MIN_ITEMS_PER_SOURCE = 200

# Initialisation du client Supabase
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# Configuration des sources attendues
EXPECTED_SOURCES = {
    "dramas": ["voirdrama", "dramacool", "kdrama", "dramafever", "mydramalist", "asiancrush", "dramapassion", "kissasian"],
    "animes": ["myanimelist", "voiranime", "animenews", "animedb"],
    "films": ["kaede_api", "filmweb", "allocine", "imdb"],
    "bollywood": ["bollywood_api", "bollywoodmdb", "indianexpress"]
}

def get_sources_count(table_name):
    """Récupère le nombre d'éléments par source dans une table"""
    logger.info(f"Analyse des sources dans la table {table_name}...")
    
    try:
        # Récupérer toutes les sources et compter les éléments
        result = supabase.table(table_name) \
            .select("source") \
            .execute()
        
        if not result.data:
            logger.warning(f"Aucun élément trouvé dans la table {table_name}")
            return {}
        
        # Compter par source
        sources_count = {}
        for item in result.data:
            source = item.get("source", "unknown")
            if source in sources_count:
                sources_count[source] += 1
            else:
                sources_count[source] = 1
        
        return sources_count
        
    except Exception as e:
        logger.error(f"Erreur lors de l'analyse des sources dans la table {table_name}: {str(e)}")
        return {}

def verify_table_metrics(table_name, expected_sources):
    """Vérifie les métriques pour une table spécifique"""
    logger.info(f"Vérification des métriques pour la table {table_name}...")
    
    sources_count = get_sources_count(table_name)
    
    # Vérifier que toutes les sources attendues sont présentes
    missing_sources = []
    for source in expected_sources:
        if source not in sources_count:
            missing_sources.append(source)
    
    # Vérifier que chaque source a au moins le minimum d'éléments
    below_threshold_sources = []
    for source, count in sources_count.items():
        if source in expected_sources and count < MIN_ITEMS_PER_SOURCE:
            below_threshold_sources.append({
                "source": source,
                "count": count,
                "expected": MIN_ITEMS_PER_SOURCE
            })
    
    # Calculer le total
    total_items = sum(sources_count.values())
    expected_total = len(expected_sources) * MIN_ITEMS_PER_SOURCE
    
    return {
        "table": table_name,
        "total_items": total_items,
        "expected_total": expected_total,
        "meets_total_requirement": total_items >= expected_total,
        "sources_count": sources_count,
        "missing_sources": missing_sources,
        "below_threshold_sources": below_threshold_sources
    }

def verify_all_metrics():
    """Vérifie les métriques pour toutes les tables"""
    start_time = time.time()
    logger.info("Démarrage de la vérification des métriques...")
    
    # Analyser chaque table
    results = {}
    grand_total = 0
    
    for table, expected_sources in EXPECTED_SOURCES.items():
        try:
            table_metrics = verify_table_metrics(table, expected_sources)
            results[table] = table_metrics
            grand_total += table_metrics["total_items"]
        except Exception as e:
            logger.error(f"Erreur lors de la vérification des métriques pour la table {table}: {str(e)}")
            results[table] = {"error": str(e)}
    
    # Générer un rapport global
    duration = time.time() - start_time
    
    report = {
        "timestamp": datetime.now().isoformat(),
        "duration_seconds": duration,
        "grand_total": grand_total,
        "min_total_items": MIN_TOTAL_ITEMS,
        "meets_total_requirement": grand_total >= MIN_TOTAL_ITEMS,
        "table_metrics": results
    }
    
    # Sauvegarder le rapport dans un fichier
    with open("scraping/metrics_report.json", "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2)
    
    return report

def check_metrics():
    """Vérifie les métriques et échoue si les objectifs ne sont pas atteints"""
    logger.info("Vérification des métriques...")
    
    report = verify_all_metrics()
    
    # Afficher un résumé
    print("\n==== RAPPORT DE VÉRIFICATION DES MÉTRIQUES FLODRAMA ====")
    print(f"Date: {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}")
    print(f"Durée: {report['duration_seconds']:.2f} secondes")
    print(f"Total général: {report['grand_total']} éléments (minimum attendu: {MIN_TOTAL_ITEMS})")
    print(f"Objectif atteint: {'✅ OUI' if report['meets_total_requirement'] else '❌ NON'}")
    
    # Détail par table
    print("\nStatistiques par table:")
    for table, metrics in report["table_metrics"].items():
        if "error" in metrics:
            print(f"  - {table}: ERREUR - {metrics['error']}")
            continue
            
        total = metrics["total_items"]
        expected = metrics["expected_total"]
        status = "✅" if metrics["meets_total_requirement"] else "❌"
        print(f"  - {table}: {total}/{expected} éléments {status}")
        
        # Afficher les sources manquantes
        if metrics["missing_sources"]:
            print(f"    Sources manquantes: {', '.join(metrics['missing_sources'])}")
        
        # Afficher les sources en dessous du seuil
        if metrics["below_threshold_sources"]:
            print("    Sources en dessous du seuil minimum:")
            for source in metrics["below_threshold_sources"]:
                print(f"      - {source['source']}: {source['count']}/{source['expected']} éléments")
    
    print("=======================================================\n")
    
    # Si l'objectif global n'est pas atteint, échouer avec un code d'erreur
    if not report["meets_total_requirement"]:
        logger.error(f"Objectif non atteint: {report['grand_total']}/{MIN_TOTAL_ITEMS} éléments")
        exit(1)
    
    return report

if __name__ == "__main__":
    # Vérification de la configuration
    if not SUPABASE_URL or not SUPABASE_KEY:
        logger.error("Les variables d'environnement SUPABASE_URL et SUPABASE_KEY doivent être définies")
        exit(1)
    
    # Vérifier les métriques
    check_metrics()
