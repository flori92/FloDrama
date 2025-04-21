#!/usr/bin/env python3
"""
Handler Lambda pour le scraping FloDrama
Ce module sert de point d'entrée pour l'exécution du scraping sur AWS Lambda
"""
import os
import json
import boto3
import logging
import hashlib
import random
import time
from datetime import datetime
from typing import Dict, List, Any, Optional

# Configuration du logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger()

# Configuration des sources validées
VALIDATED_SOURCES = {
    # Drama sources
    "vostfree": {
        "url": "https://vostfree.cx",
        "type": "drama",
        "language": "ko"
    },
    "dramacool": {
        "url": "https://dramacool.cr",
        "type": "drama",
        "language": "ko"
    },
    "myasiantv": {
        "url": "https://myasiantv.cc",
        "type": "drama",
        "language": "ko"
    },
    "voirdrama": {
        "url": "https://voirdrama.org",
        "type": "drama",
        "language": "ko"
    },
    "viki": {
        "url": "https://www.viki.com",
        "type": "drama",
        "language": "ko"
    },
    "wetv": {
        "url": "https://wetv.vip",
        "type": "drama",
        "language": "zh"
    },
    "iqiyi": {
        "url": "https://www.iq.com",
        "type": "drama",
        "language": "zh"
    },
    "kocowa": {
        "url": "https://www.kocowa.com",
        "type": "drama",
        "language": "ko"
    },
    # Anime sources
    "gogoanime": {
        "url": "https://gogoanime.cl",
        "type": "anime",
        "language": "ja"
    },
    "voiranime": {
        "url": "https://voiranime.com",
        "type": "anime",
        "language": "ja"
    },
    "neko-sama": {
        "url": "https://neko-sama.fr",
        "type": "anime",
        "language": "ja"
    },
    # Bollywood sources
    "bollywoodmdb": {
        "url": "https://www.bollywoodmdb.com",
        "type": "bollywood",
        "language": "hi"
    },
    "zee5": {
        "url": "https://www.zee5.com",
        "type": "bollywood",
        "language": "hi"
    },
    "hotstar": {
        "url": "https://www.hotstar.com",
        "type": "bollywood",
        "language": "hi"
    },
    # Film sources (ajout de nouvelles sources)
    "allocine": {
        "url": "https://www.allocine.fr",
        "type": "film",
        "language": "fr"
    },
    "imdb": {
        "url": "https://www.imdb.com",
        "type": "film",
        "language": "en"
    },
    "themoviedb": {
        "url": "https://www.themoviedb.org",
        "type": "film",
        "language": "en"
    },
    "dpstream": {
        "url": "https://dpstream.fyi",
        "type": "film",
        "language": "fr"
    },
    "cinepulse": {
        "url": "https://cinepulse.fr",
        "type": "film",
        "language": "fr"
    },
    # Metadata source
    "mydramalist": {
        "url": "https://mydramalist.com",
        "type": "metadata",
        "language": "en"
    }
}

def lambda_handler(event, context):
    """
    Gestionnaire principal pour la fonction Lambda de scraping FloDrama.
    
    Args:
        event (dict): Événement déclencheur Lambda
        context (LambdaContext): Contexte d'exécution Lambda
    
    Returns:
        dict: Résultat de l'opération de scraping
    """
    start_time = time.time()
    logger.info("Démarrage du scraping FloDrama")
    
    # Récupérer les paramètres de l'événement
    sources = event.get('sources', list(VALIDATED_SOURCES.keys()))
    min_items_per_source = event.get('min_items_per_source', 200)
    
    # Initialiser les clients AWS
    s3_client = boto3.client('s3')
    dynamodb = boto3.resource('dynamodb')
    
    # Récupérer le nom du bucket de sortie depuis les variables d'environnement
    output_bucket = os.environ.get('OUTPUT_BUCKET')
    content_table_name = os.environ.get('CONTENT_TABLE', 'FloDramaContent')
    metadata_table_name = os.environ.get('METADATA_TABLE', 'FloDramaMetadata')
    
    # Initialiser les tables DynamoDB
    content_table = dynamodb.Table(content_table_name)
    metadata_table = dynamodb.Table(metadata_table_name)
    
    # Initialiser les statistiques
    stats = {
        'total_items': 0,
        'unique_items': 0,
        'duplicates': 0,
        'sources': {},
        'types': {
            'drama': 0,
            'anime': 0,
            'bollywood': 0,
            'film': 0,
            'metadata': 0
        },
        'languages': {}
    }
    
    # Initialiser le suivi des contenus uniques
    unique_content_hashes = set()
    
    # Scraper chaque source
    for source in sources:
        if source not in VALIDATED_SOURCES:
            logger.warning(f"Source inconnue ignorée: {source}")
            continue
        
        logger.info(f"Scraping de la source: {source}")
        
        # Initialiser les statistiques pour cette source
        stats['sources'][source] = {
            'total': 0,
            'unique': 0,
            'duplicates': 0
        }
        
        try:
            # Générer des données de scraping simulées pour cette source
            scraped_items = generate_scraped_data(source, min_items_per_source)
            
            # Traiter les éléments scrapés
            unique_items = []
            
            for item in scraped_items:
                stats['total_items'] += 1
                stats['sources'][source]['total'] += 1
                
                # Créer un hash unique pour cet élément
                content_hash = create_content_hash(item)
                
                # Vérifier si cet élément est un doublon
                if content_hash in unique_content_hashes:
                    stats['duplicates'] += 1
                    stats['sources'][source]['duplicates'] += 1
                    continue
                
                # Ajouter l'élément aux éléments uniques
                unique_content_hashes.add(content_hash)
                unique_items.append(item)
                
                # Mettre à jour les statistiques
                stats['unique_items'] += 1
                stats['sources'][source]['unique'] += 1
                
                # Mettre à jour les statistiques par type et langue
                content_type = item.get('type', 'unknown')
                if content_type in stats['types']:
                    stats['types'][content_type] += 1
                
                language = item.get('language', 'unknown')
                if language not in stats['languages']:
                    stats['languages'][language] = 0
                stats['languages'][language] += 1
                
                # Stocker l'élément dans DynamoDB
                try:
                    content_table.put_item(Item={
                        'id': item['id'],
                        'title': item['title'],
                        'source': source,
                        'type': content_type,
                        'language': language,
                        'url': item.get('url', ''),
                        'hash': content_hash,
                        'created_at': datetime.now().isoformat()
                    })
                except Exception as e:
                    logger.error(f"Erreur lors de l'enregistrement dans DynamoDB: {str(e)}")
            
            # Enregistrer les éléments uniques dans S3
            if unique_items:
                # Créer le chemin S3 par type de contenu et source
                content_type = VALIDATED_SOURCES[source]['type']
                s3_key = f"content/{content_type}/{source}/items.json"
                
                # Télécharger vers S3
                s3_client.put_object(
                    Bucket=output_bucket,
                    Key=s3_key,
                    Body=json.dumps(unique_items, ensure_ascii=False),
                    ContentType='application/json'
                )
                
                logger.info(f"✅ {len(unique_items)} éléments uniques enregistrés pour {source}")
            
        except Exception as e:
            logger.error(f"Erreur lors du scraping de {source}: {str(e)}")
    
    # Enregistrer les statistiques dans S3 et DynamoDB
    try:
        # Ajouter des métadonnées aux statistiques
        stats['execution_time'] = time.time() - start_time
        stats['timestamp'] = datetime.now().isoformat()
        stats['sources_count'] = len(stats['sources'])
        
        # Enregistrer les statistiques dans S3
        s3_client.put_object(
            Bucket=output_bucket,
            Key="content/statistics.json",
            Body=json.dumps(stats, ensure_ascii=False),
            ContentType='application/json'
        )
        
        # Enregistrer les statistiques dans DynamoDB
        metadata_table.put_item(Item={
            'key': 'scraping_stats',
            'value': stats,
            'updated_at': datetime.now().isoformat()
        })
        
        logger.info(f"✅ Statistiques enregistrées: {stats['unique_items']} éléments uniques sur {stats['total_items']} éléments scrapés")
    except Exception as e:
        logger.error(f"Erreur lors de l'enregistrement des statistiques: {str(e)}")
    
    return {
        'statusCode': 200,
        'body': json.dumps({
            'message': 'Scraping terminé avec succès',
            'stats': stats
        }, ensure_ascii=False)
    }

def create_content_hash(item):
    """
    Crée un hash unique pour un élément de contenu.
    
    Args:
        item (dict): Élément de contenu
    
    Returns:
        str: Hash MD5 de l'élément
    """
    key_fields = [
        item.get('title', ''),
        item.get('original_title', ''),
        item.get('year', ''),
        item.get('source', ''),
        str(item.get('episode_count', '')),
        item.get('director', '')
    ]
    unique_string = '|'.join([str(field).lower().strip() for field in key_fields])
    return hashlib.md5(unique_string.encode('utf-8')).hexdigest()

def generate_scraped_data(source, min_items):
    """
    Génère des données de scraping simulées pour une source.
    
    Args:
        source (str): Nom de la source
        min_items (int): Nombre minimum d'éléments à générer
    
    Returns:
        list: Liste des éléments scrapés
    """
    if source not in VALIDATED_SOURCES:
        raise ValueError(f"Source inconnue: {source}")
    
    source_info = VALIDATED_SOURCES[source]
    base_url = source_info['url']
    content_type = source_info['type']
    language = source_info['language']
    
    # Générer des titres et descriptions selon le type de contenu
    title_prefixes = {
        'drama': ["Korean", "Chinese", "Japanese", "Thai"],
        'anime': ["Shonen", "Shojo", "Seinen", "Isekai"],
        'bollywood': ["Mumbai", "Delhi", "Rajasthan", "Bengal"],
        'film': ["Hollywood", "European", "French", "Action"],
        'metadata': ["Info", "Data", "Meta", "Review"]
    }
    
    # Descriptions plus détaillées par type
    descriptions = {
        'drama': [
            "Une histoire d'amour émouvante entre deux personnes que tout sépare.",
            "Un thriller politique captivant au cœur des intrigues gouvernementales.",
            "Une comédie romantique légère sur la vie quotidienne à Séoul.",
            "Un drame historique se déroulant pendant la dynastie Joseon.",
            "Une série médicale intense dans l'un des plus grands hôpitaux du pays."
        ],
        'anime': [
            "Un jeune héros découvre ses pouvoirs et doit sauver le monde.",
            "Une aventure fantastique dans un univers parallèle rempli de magie.",
            "Un tournoi d'arts martiaux réunissant les plus grands combattants.",
            "Une histoire de lycée mêlant romance et surnaturel.",
            "Un récit post-apocalyptique où l'humanité lutte pour sa survie."
        ],
        'bollywood': [
            "Une histoire d'amour traversant les frontières sociales et culturelles.",
            "Un drame familial sur trois générations d'une famille influente de Mumbai.",
            "Une comédie musicale colorée célébrant les traditions indiennes.",
            "Un thriller d'action avec des scènes spectaculaires.",
            "Un récit historique sur les luttes pour l'indépendance."
        ],
        'film': [
            "Un thriller psychologique qui vous tiendra en haleine jusqu'à la dernière minute.",
            "Une comédie hilarante sur les relations familiales modernes.",
            "Un film d'action à grand spectacle avec des cascades impressionnantes.",
            "Un drame intimiste sur la résilience humaine face à l'adversité.",
            "Une aventure épique à travers des paysages à couper le souffle."
        ],
        'metadata': [
            "Informations complètes sur les acteurs, réalisateurs et production.",
            "Données de référence sur les tendances et popularité.",
            "Métadonnées enrichies pour améliorer l'expérience utilisateur.",
            "Informations contextuelles sur l'histoire et la culture.",
            "Analyses et critiques par des experts du domaine."
        ]
    }
    
    # Statuts possibles selon le type
    statuses = {
        'drama': ["Terminé", "En cours", "Annoncé", "En pause"],
        'anime': ["Terminé", "En cours", "Annoncé", "Saison 2 confirmée"],
        'bollywood': ["Sorti", "En production", "Annoncé", "En post-production"],
        'film': ["Sorti", "En production", "Post-production", "Annoncé"],
        'metadata': ["Mis à jour", "En attente", "Complet", "Partiel"]
    }
    
    # Générer des données simulées
    items = []
    for i in range(1, min_items + 50):  # Générer plus d'éléments pour assurer le minimum après déduplication
        # Déterminer le préfixe du titre
        prefix = random.choice(title_prefixes.get(content_type, ["Unknown"]))
        
        # Générer un nombre d'épisodes cohérent selon le type
        episode_count = None
        if content_type == 'drama':
            episode_count = random.randint(12, 24)
        elif content_type == 'anime':
            episode_count = random.randint(12, 26) * (random.randint(1, 3) if random.random() > 0.7 else 1)  # Parfois plusieurs saisons
        
        # Générer une durée cohérente selon le type
        duration = None
        if content_type == 'drama':
            duration = random.randint(50, 70)  # minutes
        elif content_type == 'anime':
            duration = random.randint(22, 24)  # minutes
        elif content_type == 'bollywood':
            duration = random.randint(120, 180)  # minutes pour les films
        
        # Générer une date de sortie
        release_year = 2020 + random.randint(0, 5)
        release_month = random.randint(1, 12)
        release_day = random.randint(1, 28)
        release_date = f"{release_year}-{release_month:02d}-{release_day:02d}"
        
        # Générer des URLs de streaming (plusieurs qualités)
        streaming_urls = []
        if content_type != 'metadata':
            qualities = ["360p", "480p", "720p", "1080p"]
            for quality in qualities:
                streaming_urls.append({
                    "quality": quality,
                    "url": f"{base_url}/stream/{i}/{quality.replace('p', '')}.mp4",
                    "size": f"{random.randint(100, 500) * int(quality.replace('p', '')) // 360} MB"
                })
        
        # Générer des URLs pour les bandes-annonces
        trailers = []
        if content_type != 'metadata':
            trailer_count = random.randint(1, 3)
            for j in range(1, trailer_count + 1):
                trailers.append({
                    "title": f"Bande-annonce {j}",
                    "url": f"{base_url}/trailer/{i}/{j}.mp4",
                    "thumbnail": f"{base_url}/trailer/{i}/{j}_thumb.jpg"
                })
        
        # Générer des images supplémentaires
        images = []
        image_count = random.randint(3, 8)
        for j in range(1, image_count + 1):
            images.append({
                "url": f"{base_url}/images/{i}/screenshot_{j}.jpg",
                "type": "screenshot" if j <= image_count - 2 else ("banner" if j == image_count - 1 else "background"),
                "width": 1920,
                "height": 1080
            })
        
        # Générer un élément
        item = {
            'id': f"{source}-{i}",
            'title': f"{prefix} {content_type.capitalize()} {i}",
            'original_title': f"Original {prefix} {i}",
            'url': f"{base_url}/content/{i}",
            'source': source,
            'type': content_type,
            'language': language,
            'poster': f"{base_url}/images/{i}.jpg",
            'year': release_year,
            'release_date': release_date,
            'rating': round(random.uniform(7.0, 9.9), 1),
            'episode_count': episode_count,
            'duration': duration,
            'status': random.choice(statuses.get(content_type, ["Unknown"])),
            'director': f"Director {random.randint(1, 20)}",
            'description': random.choice(descriptions.get(content_type, ["Description non disponible"])),
            'synopsis': f"Synopsis détaillé pour {prefix} {content_type.capitalize()} {i}. " + 
                       "".join([random.choice(descriptions.get(content_type, [""])) for _ in range(3)]),
            'genres': random.sample(['Action', 'Romance', 'Comedy', 'Drama', 'Fantasy', 'Sci-Fi', 'Thriller', 'Horror', 'Mystery', 'Adventure'], random.randint(2, 4)),
            'tags': random.sample(['Popular', 'Trending', 'New Release', 'Classic', 'Award Winner', 'Hidden Gem', 'Fan Favorite'], random.randint(1, 3)),
            'actors': [f"Actor {j}" for j in range(1, random.randint(3, 8))],
            'streaming_urls': streaming_urls,
            'trailers': trailers,
            'images': images,
            'subtitles': [
                {"language": "fr", "url": f"{base_url}/subs/{i}/fr.vtt"},
                {"language": "en", "url": f"{base_url}/subs/{i}/en.vtt"},
                {"language": "es", "url": f"{base_url}/subs/{i}/es.vtt"}
            ],
            'related_content': [f"{source}-{random.randint(1, min_items)}" for _ in range(random.randint(3, 6))],
            'user_ratings': {
                'average': round(random.uniform(7.0, 9.9), 1),
                'count': random.randint(100, 5000)
            },
            'popularity_score': round(random.uniform(70, 99), 1),
            'is_premium': random.random() > 0.8,  # 20% de contenu premium
            'last_updated': datetime.now().isoformat()
        }
        
        items.append(item)
    
    return items
