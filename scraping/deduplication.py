#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Système de déduplication pour FloDrama - Migration Supabase
Ce script analyse les contenus issus des 19 sources et supprime les doublons
en utilisant des algorithmes de correspondance avancés.
"""

import os
import json
import logging
from datetime import datetime
import time
from difflib import SequenceMatcher
from supabase import create_client, Client

# Configuration du logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('deduplication')

# Récupération des variables d'environnement
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")

# Initialisation du client Supabase
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# Tables à analyser
CONTENT_TABLES = ["dramas", "animes", "films", "bollywood"]

def similarity_ratio(title1, title2):
    """Calcule le ratio de similarité entre deux titres"""
    # Nettoyage des titres
    t1 = title1.lower().strip()
    t2 = title2.lower().strip()
    
    # Utiliser la différence de séquence pour comparer
    return SequenceMatcher(None, t1, t2).ratio()

def find_duplicates_in_table(table_name):
    """Identifie les doublons potentiels dans une table en fonction du titre et de l'année"""
    logger.info(f"Recherche de doublons dans la table {table_name}...")
    
    # Récupérer tous les éléments
    result = supabase.table(table_name) \
        .select("id, title, original_title, year, source") \
        .execute()
    
    if not result.data:
        logger.warning(f"Aucun élément trouvé dans la table {table_name}")
        return []
    
    items = result.data
    duplicates = []
    
    # Indexation par sources
    sources = {}
    for item in items:
        if item["source"] not in sources:
            sources[item["source"]] = []
        sources[item["source"]].append(item)
    
    # Vérifier les doublons entre sources
    source_names = list(sources.keys())
    
    for i in range(len(source_names)):
        source1 = source_names[i]
        source1_items = sources[source1]
        
        for j in range(i + 1, len(source_names)):
            source2 = source_names[j]
            source2_items = sources[source2]
            
            logger.info(f"Comparaison des sources {source1} ({len(source1_items)} items) et {source2} ({len(source2_items)} items)")
            
            # Comparer les éléments des deux sources
            for item1 in source1_items:
                for item2 in source2_items:
                    # Vérifier si l'année est la même (si elle existe)
                    year_match = True
                    if item1["year"] and item2["year"] and abs(item1["year"] - item2["year"]) > 1:
                        year_match = False
                    
                    # Comparer les titres
                    title_similarity = similarity_ratio(item1["title"], item2["title"])
                    
                    # Comparer aussi les titres originaux s'ils existent
                    original_title_similarity = 0
                    if item1["original_title"] and item2["original_title"]:
                        original_title_similarity = similarity_ratio(item1["original_title"], item2["original_title"])
                    
                    # Si l'un des titres est très similaire et l'année correspond, c'est probablement un doublon
                    if year_match and (title_similarity > 0.85 or original_title_similarity > 0.85):
                        duplicates.append({
                            "id1": item1["id"],
                            "id2": item2["id"],
                            "title1": item1["title"],
                            "title2": item2["title"],
                            "source1": item1["source"],
                            "source2": item2["source"],
                            "year1": item1["year"],
                            "year2": item2["year"],
                            "title_similarity": title_similarity,
                            "original_title_similarity": original_title_similarity
                        })
    
    logger.info(f"Trouvé {len(duplicates)} doublons potentiels dans la table {table_name}")
    return duplicates

def merge_duplicates(table_name, duplicates):
    """Fusionne les doublons en conservant celui avec le plus d'informations"""
    logger.info(f"Fusion des {len(duplicates)} doublons dans la table {table_name}...")
    
    for dup in duplicates:
        try:
            # Récupérer les deux éléments complets
            item1 = supabase.table(table_name).select("*").eq("id", dup["id1"]).single().execute()
            item2 = supabase.table(table_name).select("*").eq("id", dup["id2"]).single().execute()
            
            if not item1.data or not item2.data:
                continue
            
            item1_data = item1.data
            item2_data = item2.data
            
            # Compter les champs non vides pour déterminer l'élément le plus complet
            count1 = sum(1 for k, v in item1_data.items() if v not in [None, "", [], {}])
            count2 = sum(1 for k, v in item2_data.items() if v not in [None, "", [], {}])
            
            # L'élément à conserver est celui qui a le plus d'informations
            keep_id = dup["id1"] if count1 >= count2 else dup["id2"]
            delete_id = dup["id2"] if count1 >= count2 else dup["id1"]
            
            # Si l'élément à conserver manque certaines informations, les prendre de l'autre
            if count1 >= count2:
                merged_item = item1_data.copy()
                source_item = item2_data
            else:
                merged_item = item2_data.copy()
                source_item = item1_data
            
            # Fusionner les champs manquants ou vides
            update_data = {}
            for key, value in source_item.items():
                if key not in ["id", "created_at", "updated_at"] and (
                    merged_item.get(key) in [None, "", [], {}] and value not in [None, "", [], {}]
                ):
                    update_data[key] = value
            
            # Fusionner les tableaux si les deux ont des données
            for key in ["genres", "tags", "actors", "related_content", "gallery"]:
                if isinstance(merged_item.get(key), list) and isinstance(source_item.get(key), list):
                    merged_list = list(set(merged_item.get(key, []) + source_item.get(key, [])))
                    if merged_list and len(merged_list) > len(merged_item.get(key, [])):
                        update_data[key] = merged_list
            
            # Si des mises à jour sont nécessaires, les appliquer
            if update_data:
                # Mettre à jour avec les données fusionnées
                update_data["source"] = f"{merged_item['source']}+{source_item['source']}"
                update_data["updated_at"] = datetime.now().isoformat()
                
                supabase.table(table_name).update(update_data).eq("id", keep_id).execute()
                logger.info(f"Élément {keep_id} mis à jour avec les données de {delete_id}")
            
            # Supprimer l'élément en double
            supabase.table(table_name).delete().eq("id", delete_id).execute()
            logger.info(f"Élément {delete_id} supprimé car doublon de {keep_id}")
            
            # Attendre un peu pour éviter de surcharger l'API
            time.sleep(0.1)
            
        except Exception as e:
            logger.error(f"Erreur lors de la fusion des doublons {dup['id1']} et {dup['id2']}: {str(e)}")
    
    return len(duplicates)

def run_deduplication():
    """Exécute le processus complet de déduplication sur toutes les tables"""
    start_time = time.time()
    logger.info("Démarrage du processus de déduplication...")
    
    # Statistiques globales
    total_duplicates = 0
    table_stats = {}
    
    # Analyser chaque table
    for table in CONTENT_TABLES:
        try:
            # Trouver les doublons
            duplicates = find_duplicates_in_table(table)
            
            # Si des doublons sont trouvés, les fusionner
            if duplicates:
                merged_count = merge_duplicates(table, duplicates)
                total_duplicates += merged_count
                table_stats[table] = merged_count
            else:
                table_stats[table] = 0
        
        except Exception as e:
            logger.error(f"Erreur lors de la déduplication de la table {table}: {str(e)}")
            table_stats[table] = -1
    
    # Générer un rapport
    duration = time.time() - start_time
    logger.info(f"Déduplication terminée en {duration:.2f} secondes")
    logger.info(f"Total des doublons traités: {total_duplicates}")
    
    report = {
        "timestamp": datetime.now().isoformat(),
        "duration_seconds": duration,
        "total_duplicates": total_duplicates,
        "table_stats": table_stats
    }
    
    # Sauvegarder le rapport dans un fichier
    with open("scraping/deduplication_report.json", "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2)
    
    return report

if __name__ == "__main__":
    # Vérification de la configuration
    if not SUPABASE_URL or not SUPABASE_KEY:
        logger.error("Les variables d'environnement SUPABASE_URL et SUPABASE_KEY doivent être définies")
        exit(1)
    
    # Lancer la déduplication
    report = run_deduplication()
    
    # Afficher un résumé
    print("\n==== RAPPORT DE DÉDUPLICATION FLODRAMA ====")
    print(f"Date: {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}")
    print(f"Durée: {report['duration_seconds']:.2f} secondes")
    print(f"Total des doublons traités: {report['total_duplicates']}")
    print("\nStatistiques par table:")
    for table, count in report['table_stats'].items():
        print(f"  - {table}: {count} doublons traités")
    print("===========================================\n")
