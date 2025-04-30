#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Script de génération de contenu agrégé pour FloDrama
Ce script récupère les données depuis S3, les traite et génère des fichiers JSON
pour le frontend avec les contenus populaires, en vedette, récents et mieux notés.
"""

import os
import json
import logging
import time
import boto3
from datetime import datetime
from botocore.exceptions import ClientError

# Configuration du logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('FloDrama-ContentGenerator')

# Configuration AWS
S3_BUCKET = os.environ.get('S3_BUCKET', 'flodrama-content-1745269660')
CLOUDFRONT_DISTRIBUTION_ID = os.environ.get('CLOUDFRONT_DISTRIBUTION_ID', '')
AWS_REGION = os.environ.get('AWS_REGION', 'us-east-1')

# Chemins des fichiers de sortie
OUTPUT_FILES = {
    'featured': 'featured.json',
    'popular': 'popular.json',
    'recently': 'recently.json',
    'topRated': 'topRated.json',
    'categories': 'categories.json',
    'metadata': 'metadata.json'
}

# Initialisation des clients AWS
s3_client = boto3.client('s3', region_name=AWS_REGION)
cloudfront_client = boto3.client('cloudfront', region_name=AWS_REGION)


def download_s3_content(bucket, key, local_path):
    """Télécharge un fichier depuis S3"""
    try:
        logger.info(f"Téléchargement de {key} depuis S3...")
        s3_client.download_file(bucket, key, local_path)
        return True
    except ClientError as e:
        logger.error(f"Erreur lors du téléchargement de {key}: {e}")
        return False


def upload_to_s3(bucket, key, local_path):
    """Téléverse un fichier vers S3"""
    try:
        logger.info(f"Téléversement de {local_path} vers S3 ({key})...")
        s3_client.upload_file(
            local_path, 
            bucket, 
            key,
            ExtraArgs={
                'ContentType': 'application/json', 
                'CacheControl': 'max-age=3600'
                # ACL supprimé car le bucket n'autorise pas les ACLs
            }
        )
        return True
    except ClientError as e:
        logger.error(f"Erreur lors du téléversement de {local_path}: {e}")
        return False


def invalidate_cloudfront_cache():
    """Invalide le cache CloudFront"""
    if not CLOUDFRONT_DISTRIBUTION_ID:
        logger.warning("ID de distribution CloudFront non défini, pas d'invalidation")
        return False

    try:
        logger.info(f"Invalidation du cache CloudFront pour la distribution {CLOUDFRONT_DISTRIBUTION_ID}...")
        response = cloudfront_client.create_invalidation(
            DistributionId=CLOUDFRONT_DISTRIBUTION_ID,
            InvalidationBatch={
                'Paths': {
                    'Quantity': 1,
                    'Items': ['/*']
                },
                'CallerReference': str(int(time.time()))
            }
        )
        logger.info(f"Invalidation créée: {response['Invalidation']['Id']}")
        return True
    except ClientError as e:
        logger.error(f"Erreur lors de l'invalidation du cache CloudFront: {e}")
        return False


def list_s3_content(bucket, prefix=''):
    """Liste le contenu d'un bucket S3"""
    try:
        logger.info(f"Listage du contenu de {bucket}/{prefix}...")
        response = s3_client.list_objects_v2(Bucket=bucket, Prefix=prefix)
        
        if 'Contents' not in response:
            logger.warning(f"Aucun contenu trouvé dans {bucket}/{prefix}")
            return []
        
        return response['Contents']
    except ClientError as e:
        logger.error(f"Erreur lors du listage du contenu de {bucket}/{prefix}: {e}")
        return []


def process_raw_data():
    """Traite les données brutes et génère les fichiers de sortie"""
    # Créer un répertoire temporaire pour les fichiers
    os.makedirs('tmp', exist_ok=True)
    
    # Récupérer les données brutes depuis S3
    raw_data = []
    content_items = list_s3_content(S3_BUCKET, 'raw-data/')
    
    if not content_items:
        logger.error("Aucune donnée brute trouvée dans S3")
        # Utiliser les exemples de données si aucune donnée n'est trouvée
        return use_example_data()
    
    # Télécharger et traiter chaque fichier
    for item in content_items:
        key = item['Key']
        if not key.endswith('.json'):
            continue
            
        local_path = f"tmp/{os.path.basename(key)}"
        if download_s3_content(S3_BUCKET, key, local_path):
            try:
                with open(local_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    if isinstance(data, list):
                        raw_data.extend(data)
                    else:
                        raw_data.append(data)
            except json.JSONDecodeError as e:
                logger.error(f"Erreur de décodage JSON pour {key}: {e}")
    
    if not raw_data:
        logger.error("Aucune donnée valide trouvée dans les fichiers téléchargés")
        return use_example_data()
    
    # Traiter les données brutes
    logger.info(f"Traitement de {len(raw_data)} éléments...")
    
    # Trier par popularité, date d'ajout et note
    popular_items = sorted(raw_data, key=lambda x: x.get('popularity', 0), reverse=True)[:20]
    recent_items = sorted(raw_data, key=lambda x: x.get('addedDate', ''), reverse=True)[:20]
    top_rated = sorted(raw_data, key=lambda x: x.get('score', 0), reverse=True)[:20]
    
    # Sélectionner les éléments en vedette (combinaison de popularité et de note)
    featured_score = lambda x: (x.get('popularity', 0) * 0.7) + (x.get('score', 0) * 0.3)
    featured_items = sorted(raw_data, key=featured_score, reverse=True)[:12]
    
    # Générer les fichiers de sortie
    generate_output_file('featured', featured_items)
    generate_output_file('popular', popular_items)
    generate_output_file('recently', recent_items)
    generate_output_file('topRated', top_rated)
    
    # Générer les catégories et métadonnées
    generate_categories()
    generate_metadata(raw_data)
    
    # Téléverser les fichiers vers S3
    upload_output_files()
    
    # Invalider le cache CloudFront
    invalidate_cloudfront_cache()
    
    return True


def generate_output_file(file_type, data):
    """Génère un fichier de sortie"""
    output_path = f"tmp/{OUTPUT_FILES[file_type]}"
    logger.info(f"Génération du fichier {output_path}...")
    
    try:
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        return True
    except Exception as e:
        logger.error(f"Erreur lors de la génération du fichier {output_path}: {e}")
        return False


def generate_categories():
    """Génère le fichier de catégories"""
    # Essayer de télécharger le fichier de catégories depuis S3
    categories_key = 'data/categories.json'
    local_path = f"tmp/{OUTPUT_FILES['categories']}"
    
    if download_s3_content(S3_BUCKET, categories_key, local_path):
        logger.info("Fichier de catégories existant téléchargé depuis S3")
        return True
    
    # Si le fichier n'existe pas, utiliser l'exemple
    logger.info("Utilisation du fichier de catégories exemple")
    try:
        example_path = 'scripts/example-data/categories.json'
        if os.path.exists(example_path):
            with open(example_path, 'r', encoding='utf-8') as f:
                categories = json.load(f)
            
            with open(local_path, 'w', encoding='utf-8') as f:
                json.dump(categories, f, ensure_ascii=False, indent=2)
            return True
        else:
            logger.error(f"Fichier exemple {example_path} introuvable")
            return False
    except Exception as e:
        logger.error(f"Erreur lors de la génération du fichier de catégories: {e}")
        return False


def generate_metadata(raw_data):
    """Génère le fichier de métadonnées"""
    local_path = f"tmp/{OUTPUT_FILES['metadata']}"
    
    try:
        # Calculer les statistiques à partir des données brutes
        total_items = len(raw_data)
        popular_count = len([x for x in raw_data if x.get('popularity', 0) > 70])
        featured_count = len([x for x in raw_data if x.get('isFeatured', False)])
        top_rated_count = len([x for x in raw_data if x.get('score', 0) > 8.0])
        recent_count = len([x for x in raw_data if x.get('addedDate', '') > (datetime.now().strftime('%Y-%m-%d'))])
        
        # Créer les métadonnées
        metadata = {
            "lastUpdate": datetime.now().isoformat(),
            "contentCounts": {
                "total": total_items,
                "popular": popular_count,
                "featured": featured_count,
                "topRated": top_rated_count,
                "recently": recent_count
            }
        }
        
        # Essayer de télécharger les métadonnées existantes pour les fusionner
        metadata_key = 'data/metadata.json'
        temp_path = "tmp/existing_metadata.json"
        
        if download_s3_content(S3_BUCKET, metadata_key, temp_path):
            try:
                with open(temp_path, 'r', encoding='utf-8') as f:
                    existing_metadata = json.load(f)
                
                # Fusionner les métadonnées existantes avec les nouvelles
                if 'trends' in existing_metadata:
                    metadata['trends'] = existing_metadata['trends']
                if 'userStats' in existing_metadata:
                    metadata['userStats'] = existing_metadata['userStats']
                if 'platformPerformance' in existing_metadata:
                    metadata['platformPerformance'] = existing_metadata['platformPerformance']
            except Exception as e:
                logger.error(f"Erreur lors de la fusion des métadonnées: {e}")
        else:
            # Si les métadonnées n'existent pas, utiliser l'exemple
            example_path = 'scripts/example-data/metadata.json'
            if os.path.exists(example_path):
                try:
                    with open(example_path, 'r', encoding='utf-8') as f:
                        example_metadata = json.load(f)
                    
                    # Fusionner les métadonnées calculées avec l'exemple
                    if 'trends' in example_metadata:
                        metadata['trends'] = example_metadata['trends']
                    if 'userStats' in example_metadata:
                        metadata['userStats'] = example_metadata['userStats']
                    if 'platformPerformance' in example_metadata:
                        metadata['platformPerformance'] = example_metadata['platformPerformance']
                except Exception as e:
                    logger.error(f"Erreur lors de la lecture du fichier exemple de métadonnées: {e}")
        
        # Enregistrer les métadonnées
        with open(local_path, 'w', encoding='utf-8') as f:
            json.dump(metadata, f, ensure_ascii=False, indent=2)
        
        return True
    except Exception as e:
        logger.error(f"Erreur lors de la génération du fichier de métadonnées: {e}")
        return False


def use_example_data():
    """Utilise les données d'exemple en cas d'échec de récupération des données réelles"""
    logger.warning("Utilisation des données d'exemple...")
    
    # Créer un répertoire temporaire pour les fichiers
    os.makedirs('tmp', exist_ok=True)
    
    # Copier les fichiers d'exemple
    example_files = {
        'featured': 'scripts/example-data/featured.json',
        'popular': 'scripts/example-data/popular.json',
        'recently': 'scripts/example-data/recently.json',
        'topRated': 'scripts/example-data/topRated.json'
    }
    
    for file_type, example_path in example_files.items():
        output_path = f"tmp/{OUTPUT_FILES[file_type]}"
        
        if os.path.exists(example_path):
            try:
                with open(example_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                
                with open(output_path, 'w', encoding='utf-8') as f:
                    json.dump(data, f, ensure_ascii=False, indent=2)
            except Exception as e:
                logger.error(f"Erreur lors de la copie du fichier exemple {example_path}: {e}")
                # Créer un fichier vide pour éviter les erreurs
                with open(output_path, 'w', encoding='utf-8') as f:
                    json.dump([], f)
        else:
            logger.error(f"Fichier exemple {example_path} introuvable")
            # Créer un fichier vide pour éviter les erreurs
            with open(output_path, 'w', encoding='utf-8') as f:
                json.dump([], f)
    
    # Générer les catégories et métadonnées
    generate_categories()
    
    # Pour les métadonnées, utiliser directement l'exemple
    example_metadata_path = 'scripts/example-data/metadata.json'
    output_metadata_path = f"tmp/{OUTPUT_FILES['metadata']}"
    
    if os.path.exists(example_metadata_path):
        try:
            with open(example_metadata_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            with open(output_metadata_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
        except Exception as e:
            logger.error(f"Erreur lors de la copie du fichier exemple de métadonnées: {e}")
            # Créer un fichier vide pour éviter les erreurs
            with open(output_metadata_path, 'w', encoding='utf-8') as f:
                json.dump({}, f)
    else:
        logger.error(f"Fichier exemple {example_metadata_path} introuvable")
        # Créer un fichier vide pour éviter les erreurs
        with open(output_metadata_path, 'w', encoding='utf-8') as f:
            json.dump({}, f)
    
    # Téléverser les fichiers vers S3
    upload_output_files()
    
    # Invalider le cache CloudFront
    invalidate_cloudfront_cache()
    
    return True


def upload_output_files():
    """Téléverse tous les fichiers de sortie vers S3"""
    success = True
    
    for file_type, filename in OUTPUT_FILES.items():
        local_path = f"tmp/{filename}"
        s3_key = f"data/{filename}"
        
        if os.path.exists(local_path):
            if not upload_to_s3(S3_BUCKET, s3_key, local_path):
                success = False
        else:
            logger.error(f"Fichier local {local_path} introuvable")
            success = False
    
    return success


def cleanup():
    """Nettoie les fichiers temporaires"""
    try:
        import shutil
        if os.path.exists('tmp'):
            shutil.rmtree('tmp')
        return True
    except Exception as e:
        logger.error(f"Erreur lors du nettoyage des fichiers temporaires: {e}")
        return False


def main():
    """Fonction principale"""
    logger.info("Démarrage de la génération de contenu agrégé...")
    
    try:
        # Traiter les données
        if process_raw_data():
            logger.info("Génération de contenu terminée avec succès")
        else:
            logger.error("Échec de la génération de contenu")
        
        # Nettoyer les fichiers temporaires
        cleanup()
    except Exception as e:
        logger.error(f"Erreur lors de l'exécution du script: {e}")
        return 1
    
    return 0


if __name__ == "__main__":
    exit(main())
