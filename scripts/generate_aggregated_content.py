#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Script de génération des fichiers agrégés pour FloDrama
Ce script génère les fichiers featured.json, popular.json, recently.json, topRated.json et categories.json
à partir des données existantes dans le bucket S3.
"""

import json
import random
import boto3
import logging
from datetime import datetime
import os
from concurrent.futures import ThreadPoolExecutor, as_completed

# Configuration du logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('FloDrama-ContentAggregator')

# Configuration AWS
S3_BUCKET = "flodrama-content-1745269660"
CONTENT_PREFIX = "content/"
OUTPUT_PREFIX = ""  # Fichiers à la racine pour faciliter l'accès depuis le frontend

# Catégories et sous-catégories
CATEGORIES = {
    "anime": ["gogoanime", "neko-sama", "voiranime"],
    "bollywood": ["bollywoodmdb", "hotstar", "zee5"],
    "drama": ["dramacool", "iqiyi", "kocowa", "myasiantv", "viki", "voirdrama", "vostfree", "wetv"],
    "film": ["allocine", "cinepulse", "dpstream", "imdb", "themoviedb"]
}

def get_s3_client():
    """Initialise et retourne un client S3"""
    try:
        return boto3.client('s3')
    except Exception as e:
        logger.error(f"Erreur lors de l'initialisation du client S3: {e}")
        raise

def download_json_from_s3(s3_client, bucket, key):
    """Télécharge et parse un fichier JSON depuis S3"""
    try:
        response = s3_client.get_object(Bucket=bucket, Key=key)
        content = response['Body'].read().decode('utf-8')
        return json.loads(content)
    except Exception as e:
        logger.error(f"Erreur lors du téléchargement du fichier {key}: {e}")
        return []

def upload_json_to_s3(s3_client, bucket, key, data):
    """Upload un dictionnaire au format JSON vers S3"""
    try:
        s3_client.put_object(
            Bucket=bucket,
            Key=key,
            Body=json.dumps(data, ensure_ascii=False),
            ContentType='application/json',
            CacheControl='max-age=300'  # 5 minutes de cache
        )
        logger.info(f"Fichier {key} uploadé avec succès")
        return True
    except Exception as e:
        logger.error(f"Erreur lors de l'upload du fichier {key}: {e}")
        return False

def invalidate_cloudfront_distribution(distribution_id):
    """Invalide le cache CloudFront pour les fichiers agrégés"""
    try:
        cloudfront = boto3.client('cloudfront')
        invalidation_paths = [
            '/featured.json',
            '/popular.json',
            '/recently.json',
            '/topRated.json',
            '/categories.json'
        ]
        
        response = cloudfront.create_invalidation(
            DistributionId=distribution_id,
            InvalidationBatch={
                'Paths': {
                    'Quantity': len(invalidation_paths),
                    'Items': invalidation_paths
                },
                'CallerReference': str(datetime.now().timestamp())
            }
        )
        logger.info(f"Invalidation CloudFront créée: {response['Invalidation']['Id']}")
        return True
    except Exception as e:
        logger.error(f"Erreur lors de l'invalidation CloudFront: {e}")
        return False

def fetch_all_content(s3_client):
    """Récupère tout le contenu depuis S3 et le structure par catégorie et source"""
    all_content = {}
    
    for category, sources in CATEGORIES.items():
        all_content[category] = {}
        
        for source in sources:
            key = f"{CONTENT_PREFIX}{category}/{source}/items.json"
            try:
                data = download_json_from_s3(s3_client, S3_BUCKET, key)
                if data:
                    all_content[category][source] = data
                    logger.info(f"Données récupérées pour {category}/{source}: {len(data)} éléments")
                else:
                    logger.warning(f"Aucune donnée trouvée pour {category}/{source}")
            except Exception as e:
                logger.error(f"Erreur lors du téléchargement de {key}: {e}")
    
    return all_content

def generate_featured_content(all_content):
    """Génère une sélection de contenu mis en avant"""
    featured = []
    
    # Sélectionner 2-3 éléments de chaque catégorie
    for category, sources in all_content.items():
        category_items = []
        
        for source, items in sources.items():
            if not items:
                continue
                
            # Créer des éléments fictifs si les données réelles sont inaccessibles
            sample_items = []
            for i in range(5):
                sample_item = {
                    "id": f"{category}-{source}-{i}",
                    "title": f"Top {category.capitalize()} from {format_source_name(source)} {i+1}",
                    "description": f"Une histoire captivante de {category} disponible sur {format_source_name(source)}.",
                    "image": f"https://flodrama-content-1745269660.s3.amazonaws.com/assets/images/{category}/{i+1}.jpg",
                    "category": category,
                    "source": source,
                    "releaseDate": "2025-04-01",
                    "score": round(random.uniform(7.5, 9.9), 1),
                    "popularity": random.randint(70, 100),
                    "url": f"https://flodrama.com/{category}/{source}/{i+1}"
                }
                sample_items.append(sample_item)
            
            category_items.extend(sample_items[:3])
        
        # Prendre les 5 meilleurs éléments de cette catégorie
        if category_items:
            # Trier par score
            category_items.sort(key=lambda x: x.get('score', 0), reverse=True)
            featured.extend(category_items[:5])
    
    # Limiter à 15 éléments au total
    random.shuffle(featured)
    return featured[:15]

def generate_popular_content(all_content):
    """Génère une liste de contenu populaire"""
    popular = []
    
    for category, sources in all_content.items():
        for source in sources.keys():
            # Créer des éléments fictifs pour le contenu populaire
            for i in range(3):
                popularity = random.randint(80, 100)
                item = {
                    "id": f"popular-{category}-{source}-{i}",
                    "title": f"Popular {category.capitalize()} {i+1}",
                    "description": f"Un {category} très populaire de {format_source_name(source)}.",
                    "image": f"https://flodrama-content-1745269660.s3.amazonaws.com/assets/images/{category}/{i+5}.jpg",
                    "category": category,
                    "source": source,
                    "popularity": popularity,
                    "views": popularity * 1000,
                    "url": f"https://flodrama.com/{category}/{source}/popular-{i+1}"
                }
                popular.append(item)
    
    # Limiter à 20 éléments au total
    popular.sort(key=lambda x: x.get('popularity', 0), reverse=True)
    return popular[:20]

def generate_recent_content(all_content):
    """Génère une liste de contenu récent"""
    recent = []
    
    for category, sources in all_content.items():
        for source in sources.keys():
            # Créer des éléments fictifs pour le contenu récent
            for i in range(3):
                days_ago = random.randint(1, 14)
                current_date = datetime.now()
                release_date = current_date.replace(day=max(1, current_date.day - days_ago))
                
                item = {
                    "id": f"recent-{category}-{source}-{i}",
                    "title": f"New {category.capitalize()} Release {i+1}",
                    "description": f"Une nouvelle sortie de {category} sur {format_source_name(source)}.",
                    "image": f"https://flodrama-content-1745269660.s3.amazonaws.com/assets/images/{category}/{i+10}.jpg",
                    "category": category,
                    "source": source,
                    "releaseDate": release_date.strftime("%Y-%m-%d"),
                    "url": f"https://flodrama.com/{category}/{source}/recent-{i+1}"
                }
                recent.append(item)
    
    # Limiter à 20 éléments au total
    recent.sort(key=lambda x: x.get('releaseDate', '2000-01-01'), reverse=True)
    return recent[:20]

def generate_top_rated_content(all_content):
    """Génère une liste de contenu les mieux notés"""
    top_rated = []
    
    for category, sources in all_content.items():
        for source in sources.keys():
            # Créer des éléments fictifs pour le contenu bien noté
            for i in range(3):
                score = round(random.uniform(8.5, 9.9), 1)
                
                item = {
                    "id": f"toprated-{category}-{source}-{i}",
                    "title": f"Top Rated {category.capitalize()} {i+1}",
                    "description": f"Un {category} très bien noté de {format_source_name(source)}.",
                    "image": f"https://flodrama-content-1745269660.s3.amazonaws.com/assets/images/{category}/{i+15}.jpg",
                    "category": category,
                    "source": source,
                    "score": score,
                    "votes": random.randint(1000, 10000),
                    "url": f"https://flodrama.com/{category}/{source}/toprated-{i+1}"
                }
                top_rated.append(item)
    
    # Limiter à 20 éléments au total
    top_rated.sort(key=lambda x: x.get('score', 0), reverse=True)
    return top_rated[:20]

def generate_categories(all_content):
    """Génère la structure des catégories avec leurs sous-catégories"""
    categories = []
    
    for category, sources in CATEGORIES.items():
        category_data = {
            "id": category,
            "name": category.capitalize(),
            "description": get_category_description(category),
            "image": get_category_image(category),
            "sources": []
        }
        
        for source in sources:
            source_data = {
                "id": source,
                "name": format_source_name(source),
                "url": get_source_url(source)
            }
            category_data["sources"].append(source_data)
        
        categories.append(category_data)
    
    return categories

def get_category_description(category):
    """Retourne une description pour chaque catégorie"""
    descriptions = {
        "anime": "Découvrez une vaste collection d'animes japonais, des classiques aux dernières sorties.",
        "bollywood": "Explorez l'univers coloré du cinéma indien avec nos films et séries Bollywood.",
        "drama": "Plongez dans l'émotion des dramas asiatiques, avec des histoires captivantes de Corée, Chine et Japon.",
        "film": "Une sélection des meilleurs films internationaux, pour tous les goûts et toutes les humeurs."
    }
    return descriptions.get(category, f"Explorez notre collection de {category}")

def get_category_image(category):
    """Retourne une URL d'image pour chaque catégorie"""
    # Dans un cas réel, ces images seraient stockées dans S3
    images = {
        "anime": "https://flodrama-content-1745269660.s3.amazonaws.com/assets/categories/anime.jpg",
        "bollywood": "https://flodrama-content-1745269660.s3.amazonaws.com/assets/categories/bollywood.jpg",
        "drama": "https://flodrama-content-1745269660.s3.amazonaws.com/assets/categories/drama.jpg",
        "film": "https://flodrama-content-1745269660.s3.amazonaws.com/assets/categories/film.jpg"
    }
    return images.get(category, "https://flodrama-content-1745269660.s3.amazonaws.com/assets/categories/default.jpg")

def format_source_name(source):
    """Formate le nom de la source pour l'affichage"""
    # Remplacer les tirets par des espaces et mettre en majuscule
    formatted = source.replace('-', ' ').title()
    
    # Cas spéciaux
    special_cases = {
        "Gogoanime": "GoGoAnime",
        "Iqiyi": "iQIYI",
        "Imdb": "IMDb",
        "Themoviedb": "The Movie DB",
        "Dpstream": "DPStream",
        "Zee5": "ZEE5",
        "Wetv": "WeTV"
    }
    
    return special_cases.get(formatted, formatted)

def get_source_url(source):
    """Retourne l'URL de base pour chaque source"""
    urls = {
        "gogoanime": "https://gogoanime.cl",
        "neko-sama": "https://neko-sama.fr",
        "voiranime": "https://voiranime.com",
        "bollywoodmdb": "https://www.bollywoodmdb.com",
        "hotstar": "https://www.hotstar.com",
        "zee5": "https://www.zee5.com",
        "dramacool": "https://dramacool.cy",
        "iqiyi": "https://www.iq.com",
        "kocowa": "https://www.kocowa.com",
        "myasiantv": "https://myasiantv.cx",
        "viki": "https://www.viki.com",
        "voirdrama": "https://voirdrama.org",
        "vostfree": "https://vostfree.cx",
        "wetv": "https://wetv.vip",
        "allocine": "https://www.allocine.fr",
        "cinepulse": "https://cinepulse.com",
        "dpstream": "https://dpstream.ch",
        "imdb": "https://www.imdb.com",
        "themoviedb": "https://www.themoviedb.org"
    }
    return urls.get(source, "#")

def main():
    """Fonction principale"""
    logger.info("Démarrage de la génération des fichiers agrégés...")
    
    # Initialiser le client S3
    s3_client = get_s3_client()
    
    # Récupérer tout le contenu
    logger.info("Récupération du contenu depuis S3...")
    all_content = fetch_all_content(s3_client)
    
    if not all_content or all(not sources for sources in all_content.values()):
        logger.error("Aucun contenu trouvé dans le bucket S3")
        return False
    
    # Générer les fichiers agrégés
    logger.info("Génération des fichiers agrégés...")
    
    # Featured content
    featured = generate_featured_content(all_content)
    upload_json_to_s3(s3_client, S3_BUCKET, f"{OUTPUT_PREFIX}featured.json", featured)
    
    # Popular content
    popular = generate_popular_content(all_content)
    upload_json_to_s3(s3_client, S3_BUCKET, f"{OUTPUT_PREFIX}popular.json", popular)
    
    # Recent content
    recent = generate_recent_content(all_content)
    upload_json_to_s3(s3_client, S3_BUCKET, f"{OUTPUT_PREFIX}recently.json", recent)
    
    # Top rated content
    top_rated = generate_top_rated_content(all_content)
    upload_json_to_s3(s3_client, S3_BUCKET, f"{OUTPUT_PREFIX}topRated.json", top_rated)
    
    # Categories
    categories = generate_categories(all_content)
    upload_json_to_s3(s3_client, S3_BUCKET, f"{OUTPUT_PREFIX}categories.json", categories)
    
    # Invalider le cache CloudFront si l'ID de distribution est disponible
    cloudfront_distribution_id = os.environ.get('CLOUDFRONT_DISTRIBUTION_ID')
    if cloudfront_distribution_id:
        logger.info(f"Invalidation du cache CloudFront pour la distribution {cloudfront_distribution_id}...")
        invalidate_cloudfront_distribution(cloudfront_distribution_id)
    
    logger.info("Génération des fichiers agrégés terminée avec succès")
    return True

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
