#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Script de migration des données AWS vers Supabase pour FloDrama
Transfère les données depuis DynamoDB vers PostgreSQL Supabase
"""

import os
import json
import logging
import boto3
from supabase import create_client
import time
from datetime import datetime
from tqdm import tqdm

# Configuration du logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('migration_aws_supabase')

# Configuration Supabase
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")

# Configuration AWS
AWS_ACCESS_KEY = os.environ.get("AWS_ACCESS_KEY_ID")
AWS_SECRET_KEY = os.environ.get("AWS_SECRET_ACCESS_KEY")
AWS_REGION = os.environ.get("AWS_REGION", "us-east-1")

# Tables à migrer
TABLES_MAPPING = {
    "flodrama-dramas": "dramas",
    "flodrama-animes": "animes",
    "flodrama-movies": "films",
    "flodrama-bollywood": "bollywood",
    "flodrama-carousels": "carousels",
    "flodrama-hero-banners": "hero_banners"
}

# Initialisation des clients
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
dynamodb = boto3.resource(
    'dynamodb',
    region_name=AWS_REGION,
    aws_access_key_id=AWS_ACCESS_KEY,
    aws_secret_access_key=AWS_SECRET_KEY
)

def get_all_items_from_dynamodb(table_name):
    """Récupère tous les éléments d'une table DynamoDB"""
    table = dynamodb.Table(table_name)
    items = []
    
    # Pagination pour les grandes tables
    scan_kwargs = {}
    done = False
    start_key = None
    
    while not done:
        if start_key:
            scan_kwargs['ExclusiveStartKey'] = start_key
        
        response = table.scan(**scan_kwargs)
        items.extend(response.get('Items', []))
        
        start_key = response.get('LastEvaluatedKey', None)
        done = start_key is None
    
    logger.info(f"Récupéré {len(items)} éléments depuis la table DynamoDB {table_name}")
    return items

def transform_dynamodb_to_supabase(item, target_table):
    """Transforme un élément DynamoDB au format Supabase"""
    # Conversion des types spécifiques à DynamoDB
    transformed = {}
    
    for key, value in item.items():
        # Ignorer certains champs spécifiques à AWS
        if key in ['pk', 'sk', 'GSI1PK', 'GSI1SK']:
            continue
        
        # Conversion des types complexes comme les ensembles
        if isinstance(value, set):
            transformed[key] = list(value)
        else:
            transformed[key] = value
    
    # Ajout de champs obligatoires
    if 'id' not in transformed:
        transformed['id'] = item.get('pk', '').split('#')[-1]
    
    if 'created_at' not in transformed:
        transformed['created_at'] = datetime.now().isoformat()
    
    if 'updated_at' not in transformed:
        transformed['updated_at'] = datetime.now().isoformat()
    
    # Ajout du champ source s'il n'existe pas
    if 'source' not in transformed:
        transformed['source'] = 'aws_migration'
    
    return transformed

def migrate_table(source_table, target_table):
    """Migre les données d'une table DynamoDB vers Supabase"""
    logger.info(f"Migration de {source_table} vers {target_table}...")
    
    # Récupérer les données de DynamoDB
    items = get_all_items_from_dynamodb(source_table)
    
    if not items:
        logger.warning(f"Aucun élément trouvé dans la table {source_table}")
        return 0
    
    # Compteurs
    success_count = 0
    error_count = 0
    
    # Migrer les éléments par lots
    batch_size = 50
    batches = [items[i:i + batch_size] for i in range(0, len(items), batch_size)]
    
    for batch_idx, batch in enumerate(tqdm(batches, desc=f"Migration de {source_table}")):
        transformed_batch = []
        
        for item in batch:
            try:
                transformed = transform_dynamodb_to_supabase(item, target_table)
                transformed_batch.append(transformed)
            except Exception as e:
                logger.error(f"Erreur lors de la transformation de l'élément: {str(e)}")
                error_count += 1
        
        if transformed_batch:
            try:
                # Insertion en lot dans Supabase
                result = supabase.table(target_table).upsert(transformed_batch).execute()
                success_count += len(transformed_batch)
                
                # Pause pour éviter de surcharger l'API
                time.sleep(1)
                
            except Exception as e:
                logger.error(f"Erreur lors de l'insertion du lot {batch_idx} dans {target_table}: {str(e)}")
                error_count += len(transformed_batch)
    
    logger.info(f"Migration de {source_table} terminée: {success_count} réussites, {error_count} erreurs")
    return success_count

def run_migration():
    """Exécute la migration complète des données"""
    start_time = time.time()
    logger.info("Démarrage de la migration AWS vers Supabase...")
    
    # Statistiques globales
    total_migrated = 0
    results = {}
    
    # Migrer chaque table
    for source_table, target_table in TABLES_MAPPING.items():
        try:
            count = migrate_table(source_table, target_table)
            total_migrated += count
            results[source_table] = {
                "target_table": target_table,
                "migrated_count": count
            }
        except Exception as e:
            logger.error(f"Erreur lors de la migration de {source_table}: {str(e)}")
            results[source_table] = {
                "target_table": target_table,
                "error": str(e)
            }
    
    # Générer un rapport
    duration = time.time() - start_time
    report = {
        "timestamp": datetime.now().isoformat(),
        "duration_seconds": duration,
        "total_migrated": total_migrated,
        "results": results
    }
    
    # Sauvegarder le rapport
    with open("migration/migration_report.json", "w") as f:
        json.dump(report, f, indent=2)
    
    logger.info(f"Migration terminée en {duration:.2f} secondes")
    logger.info(f"Total d'éléments migrés: {total_migrated}")
    
    return report

if __name__ == "__main__":
    # Vérification de la configuration
    if not SUPABASE_URL or not SUPABASE_KEY:
        logger.error("Les variables d'environnement SUPABASE_URL et SUPABASE_KEY doivent être définies")
        exit(1)
    
    if not AWS_ACCESS_KEY or not AWS_SECRET_KEY:
        logger.error("Les variables d'environnement AWS_ACCESS_KEY_ID et AWS_SECRET_ACCESS_KEY doivent être définies")
        exit(1)
    
    # Lancer la migration
    report = run_migration()
    
    # Afficher un résumé
    print("\n==== RAPPORT DE MIGRATION AWS → SUPABASE ====")
    print(f"Date: {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}")
    print(f"Durée: {report['duration_seconds']:.2f} secondes")
    print(f"Total d'éléments migrés: {report['total_migrated']}")
    
    print("\nRésultats par table:")
    for source, result in report['results'].items():
        if "error" in result:
            print(f"  - {source} → {result['target_table']}: ERREUR - {result['error']}")
        else:
            print(f"  - {source} → {result['target_table']}: {result['migrated_count']} éléments migrés")
    
    print("==============================================")
