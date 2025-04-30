#!/usr/bin/env python3
"""
Script de préparation des données pour le frontend FloDrama
Ce script traite les données générées par quick_scraper.py et les prépare pour le frontend
"""
import os
import json
import sys
import logging
import shutil
from datetime import datetime
from pathlib import Path
import requests
import random
import uuid

# Configuration du logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('FloDrama-DataPreparation')

# Configuration des chemins
BACKEND_DIR = Path(__file__).parent
PROJECT_DIR = BACKEND_DIR.parent
FRONTEND_DIR = PROJECT_DIR / "Frontend"
FRONTEND_DATA_DIR = FRONTEND_DIR / "src" / "data"
CONTENT_DIR = FRONTEND_DATA_DIR / "content"

# Configuration CloudFront
CLOUDFRONT_DOMAIN = "d1n5vqbvnwvvrr.cloudfront.net"

def download_and_save_image(image_url, content_type, content_id, image_type="poster"):
    """
    Télécharge une image et la sauvegarde localement
    
    Args:
        image_url (str): URL de l'image à télécharger
        content_type (str): Type de contenu (drama, film, etc.)
        content_id (str): ID du contenu
        image_type (str): Type d'image (poster, banner, etc.)
    
    Returns:
        str: URL CloudFront simulée pour l'image
    """
    if not image_url or "placeholder" not in image_url:
        # Générer une URL CloudFront simulée
        return f"https://{CLOUDFRONT_DOMAIN}/images/{content_type}/{content_id}/{image_type}.jpg"
    
    try:
        # Créer le répertoire pour les images
        images_dir = FRONTEND_DATA_DIR / "images" / content_type
        images_dir.mkdir(parents=True, exist_ok=True)
        
        # Générer un nom de fichier
        filename = f"{content_id}_{image_type}.jpg"
        filepath = images_dir / filename
        
        # Si l'image est une URL placeholder, on la télécharge
        if "placeholder" in image_url:
            response = requests.get(image_url, stream=True)
            if response.status_code == 200:
                with open(filepath, 'wb') as f:
                    for chunk in response.iter_content(1024):
                        f.write(chunk)
                logger.info(f"✅ Image téléchargée: {filepath}")
            else:
                logger.error(f"❌ Erreur lors du téléchargement de l'image: {response.status_code}")
        
        # Retourner l'URL CloudFront simulée
        return f"https://{CLOUDFRONT_DOMAIN}/images/{content_type}/{content_id}/{image_type}.jpg"
    
    except Exception as e:
        logger.error(f"❌ Erreur lors du téléchargement de l'image: {str(e)}")
        return image_url

def process_content_item(item, content_type):
    """
    Traite un élément de contenu pour le frontend
    
    Args:
        item (dict): Élément de contenu
        content_type (str): Type de contenu (drama, film, etc.)
    
    Returns:
        dict: Élément de contenu traité
    """
    # S'assurer que l'élément a un ID
    if "id" not in item:
        item["id"] = f"{content_type}-{uuid.uuid4().hex[:8]}"
    
    # Traiter l'image du poster
    if "poster" in item:
        item["poster"] = download_and_save_image(item["poster"], content_type, item["id"], "poster")
    
    # Traiter les images supplémentaires
    if "images" in item and isinstance(item["images"], list):
        for i, image in enumerate(item["images"]):
            if isinstance(image, dict) and "url" in image:
                image_type = image.get("type", "screenshot")
                image["url"] = download_and_save_image(
                    image["url"], content_type, item["id"], f"{image_type}_{i}"
                )
            elif isinstance(image, str):
                item["images"][i] = download_and_save_image(
                    image, content_type, item["id"], f"image_{i}"
                )
    
    # S'assurer que les propriétés requises sont présentes
    if "year" not in item:
        item["year"] = random.randint(2010, 2025)
    
    if "rating" not in item:
        item["rating"] = round(random.uniform(6.0, 9.5), 1)
    
    if "language" not in item:
        item["language"] = random.choice(["ko", "ja", "zh", "en", "hi"])
    
    # Convertir les propriétés numériques si nécessaire
    if "duration" in item and not isinstance(item["duration"], (int, float)):
        item["duration"] = random.randint(30, 180)
    
    if "episodes" in item and not isinstance(item["episodes"], (int, float)):
        item["episodes"] = random.randint(1, 24)
    
    if "seasons" in item and not isinstance(item["seasons"], (int, float)):
        item["seasons"] = random.randint(1, 4)
    
    return item

def prepare_frontend_data(scraping_results_file):
    """
    Prépare les données pour le frontend
    
    Args:
        scraping_results_file (str): Chemin vers le fichier de résultats du scraping
    """
    logger.info(f"Préparation des données pour le frontend à partir de {scraping_results_file}")
    
    # Charger les données du scraping
    with open(scraping_results_file, 'r', encoding='utf-8') as f:
        scraping_data = json.load(f)
    
    # Créer les répertoires nécessaires
    CONTENT_DIR.mkdir(parents=True, exist_ok=True)
    
    # Préparer les données par type de contenu
    content_types = {
        "drama": [],
        "film": [],
        "anime": [],
        "bollywood": []
    }
    
    # Traiter les données
    for item in scraping_data.get("data", []):
        # Déterminer le type de contenu
        item_type = item.get("type", "unknown")
        if item_type == "movie":
            item_type = "film"
        
        # Ignorer les types inconnus
        if item_type not in content_types:
            continue
        
        # Traiter l'élément
        processed_item = process_content_item(item, item_type)
        content_types[item_type].append(processed_item)
    
    # Créer les fichiers JSON par type de contenu
    for content_type, items in content_types.items():
        if not items:
            continue
        
        # Créer le répertoire pour ce type
        type_dir = CONTENT_DIR / content_type
        type_dir.mkdir(exist_ok=True)
        
        # Créer le fichier index.json
        index_data = {
            "type": content_type,
            "items": items
        }
        
        with open(type_dir / "index.json", 'w', encoding='utf-8') as f:
            json.dump(index_data, f, ensure_ascii=False, indent=2)
        
        logger.info(f"✅ Fichier index.json créé pour {content_type} avec {len(items)} éléments")
        
        # Créer les fichiers par source
        sources = {}
        for item in items:
            source = item.get("source", "unknown")
            if source not in sources:
                sources[source] = []
            sources[source].append(item)
        
        for source, source_items in sources.items():
            with open(type_dir / f"{source}.json", 'w', encoding='utf-8') as f:
                json.dump(source_items, f, ensure_ascii=False, indent=2)
            
            logger.info(f"✅ Fichier {source}.json créé pour {content_type} avec {len(source_items)} éléments")
    
    # Créer le fichier metadata.json
    metadata = {
        "lastUpdated": datetime.now().isoformat(),
        "totalItems": sum(len(items) for items in content_types.values()),
        "sources": []
    }
    
    # Ajouter les sources
    for source_name in scraping_data.get("stats", {}).get("by_source", {}):
        for content_type in content_types:
            if any(item.get("source") == source_name for item in content_types[content_type]):
                metadata["sources"].append({
                    "name": source_name,
                    "type": content_type
                })
    
    with open(FRONTEND_DATA_DIR / "metadata.json", 'w', encoding='utf-8') as f:
        json.dump(metadata, f, ensure_ascii=False, indent=2)
    
    logger.info(f"✅ Fichier metadata.json créé avec {metadata['totalItems']} éléments")
    
    # Créer le fichier carousels.json
    carousels = {
        "featured": {
            "title": "À l'affiche",
            "type": "featured",
            "items": []
        },
        "trending": {
            "title": "Tendances",
            "type": "trending",
            "items": []
        },
        "new_releases": {
            "title": "Nouveautés",
            "type": "new_releases",
            "items": []
        },
        "popular": {
            "title": "Populaires",
            "type": "popular",
            "items": []
        }
    }
    
    # Remplir les carousels avec des éléments aléatoires
    all_items = []
    for items in content_types.values():
        all_items.extend(items)
    
    if all_items:
        # Featured: éléments avec les meilleures notes
        featured_items = sorted(all_items, key=lambda x: x.get("rating", 0), reverse=True)[:10]
        carousels["featured"]["items"] = featured_items
        
        # Trending: éléments récents
        trending_items = sorted(all_items, key=lambda x: x.get("year", 0), reverse=True)[:10]
        carousels["trending"]["items"] = trending_items
        
        # New releases: éléments aléatoires
        new_releases = random.sample(all_items, min(10, len(all_items)))
        carousels["new_releases"]["items"] = new_releases
        
        # Popular: éléments populaires
        popular_items = sorted(all_items, key=lambda x: x.get("rating", 0) * random.uniform(0.8, 1.2), reverse=True)[:10]
        carousels["popular"]["items"] = popular_items
    
    with open(FRONTEND_DATA_DIR / "carousels.json", 'w', encoding='utf-8') as f:
        json.dump(carousels, f, ensure_ascii=False, indent=2)
    
    logger.info(f"✅ Fichier carousels.json créé")
    
    # Créer le fichier hero_banners.json
    hero_banners = {
        "banners": []
    }
    
    # Sélectionner les meilleurs éléments pour les bannières
    if all_items:
        top_items = sorted(all_items, key=lambda x: x.get("rating", 0), reverse=True)[:5]
        for item in top_items:
            hero_banners["banners"].append({
                "id": item["id"],
                "title": item["title"],
                "image": item.get("poster", f"https://{CLOUDFRONT_DOMAIN}/images/{item.get('type', 'drama')}/{item['id']}/poster.jpg")
            })
    
    with open(FRONTEND_DATA_DIR / "hero_banners.json", 'w', encoding='utf-8') as f:
        json.dump(hero_banners, f, ensure_ascii=False, indent=2)
    
    logger.info(f"✅ Fichier hero_banners.json créé avec {len(hero_banners['banners'])} bannières")
    
    logger.info("✅ Préparation des données terminée")

if __name__ == "__main__":
    # Vérifier les arguments
    if len(sys.argv) > 1:
        scraping_results_file = sys.argv[1]
    else:
        # Trouver le fichier de résultats le plus récent
        scraping_files = list(BACKEND_DIR.glob("scraping_results_*.json"))
        if not scraping_files:
            logger.error("❌ Aucun fichier de résultats de scraping trouvé")
            sys.exit(1)
        
        # Trier par date de modification (le plus récent en premier)
        scraping_results_file = str(sorted(scraping_files, key=os.path.getmtime, reverse=True)[0])
    
    # Préparer les données
    prepare_frontend_data(scraping_results_file)
