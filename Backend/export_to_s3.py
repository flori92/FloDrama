#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Script d'exportation des données scrappées vers S3 pour FloDrama
Ce script :
1. Récupère les données scrappées par scrape_content.py
2. Les transforme au format attendu par le frontend
3. Les exporte vers le bucket S3 pour être utilisées par le frontend
"""

import os
import sys
import json
import logging
import boto3
import time
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Any, Optional

# Configuration
PROJECT_ROOT = Path(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
BACKEND_ROOT = PROJECT_ROOT / "Backend"
SCRAPED_DATA_DIR = BACKEND_ROOT / "data"
S3_BUCKET_NAME = "flodrama-exported-data"
AWS_REGION = "eu-west-3"
TEMP_DATA_DIR = PROJECT_ROOT / "temp_data"

# Configuration du logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('FloDrama-S3Export')

def print_step(message: str) -> None:
    """Affiche un message d'étape avec formatage."""
    print(f"\n{'='*80}\n{message}\n{'='*80}")

def load_env():
    """Charge les variables d'environnement depuis .env"""
    env_vars = {}
    env_path = BACKEND_ROOT / '.env'
    
    if env_path.exists():
        with open(env_path, 'r') as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith('#'):
                    continue
                key, value = line.split('=', 1)
                env_vars[key.strip()] = value.strip()
    
    # Définir les variables d'environnement
    for key, value in env_vars.items():
        os.environ[key] = value
    
    return env_vars

def load_scraped_data():
    """Charge les données scrappées depuis les fichiers JSON"""
    print_step("Chargement des données scrappées")
    
    data = {
        'drama': [],
        'anime': [],
        'bollywood': [],
        'all': []
    }
    
    # Vérifier si le répertoire existe
    if not SCRAPED_DATA_DIR.exists():
        print(f"❌ Le répertoire {SCRAPED_DATA_DIR} n'existe pas")
        return data
    
    # Parcourir les fichiers JSON
    for file_path in SCRAPED_DATA_DIR.glob('*.json'):
        source_name = file_path.stem
        
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                source_data = json.load(f)
            
            # Déterminer le type de contenu
            content_type = None
            if 'drama' in source_name.lower() or 'viki' in source_name.lower() or 'wetv' in source_name.lower() or 'iqiyi' in source_name.lower() or 'kocowa' in source_name.lower():
                content_type = 'drama'
            elif 'anime' in source_name.lower() or 'gogoanime' in source_name.lower() or 'neko' in source_name.lower():
                content_type = 'anime'
            elif 'bollywood' in source_name.lower() or 'zee5' in source_name.lower() or 'hotstar' in source_name.lower():
                content_type = 'bollywood'
            else:
                content_type = 'drama'  # Par défaut
            
            # Ajouter les données à la catégorie correspondante
            if content_type:
                data[content_type].extend(source_data)
                data['all'].extend(source_data)
            
            print(f"✅ {len(source_data)} éléments chargés depuis {source_name}.json ({content_type})")
        
        except Exception as e:
            print(f"❌ Erreur lors du chargement de {source_name}.json: {str(e)}")
    
    # Afficher le résumé
    print("\nRésumé des données chargées:")
    print(f"- Dramas: {len(data['drama'])} éléments")
    print(f"- Animes: {len(data['anime'])} éléments")
    print(f"- Bollywood: {len(data['bollywood'])} éléments")
    print(f"- Total: {len(data['all'])} éléments")
    
    return data

def transform_data_for_frontend(data):
    """Transforme les données au format attendu par le frontend"""
    print_step("Transformation des données pour le frontend")
    
    # Créer le répertoire temporaire s'il n'existe pas
    if TEMP_DATA_DIR.exists():
        import shutil
        shutil.rmtree(TEMP_DATA_DIR)
    TEMP_DATA_DIR.mkdir(parents=True)
    
    # Transformer les données pour featured.json (séries en vedette)
    featured = []
    for item in data['all'][:10]:  # Prendre les 10 premiers éléments
        featured_item = {
            "id": str(item.get('id', '')),
            "title": item.get('title', ''),
            "subtitle": item.get('subtitle', 'Série Originale'),
            "description": item.get('synopsis', ''),
            "imageUrl": item.get('poster_url', '') or item.get('cover_url', ''),
            "videoPreviewUrl": item.get('trailer_url', ''),
            "year": item.get('year', 2023),
            "rating": item.get('rating', 8.5),
            "duration": item.get('duration', '45 min'),
            "category": item.get('category', 'Drame'),
            "tags": item.get('tags', [])
        }
        featured.append(featured_item)
    
    # Transformer les données pour popular.json (dramas populaires)
    popular = []
    for item in data['drama'][:20]:  # Prendre les 20 premiers dramas
        popular_item = {
            "id": str(item.get('id', '')),
            "title": item.get('title', ''),
            "description": item.get('synopsis', ''),
            "imageUrl": item.get('poster_url', '') or item.get('cover_url', ''),
            "year": item.get('year', 2023),
            "rating": item.get('rating', 8.5),
            "duration": item.get('duration', '45 min')
        }
        popular.append(popular_item)
    
    # Transformer les données pour recently.json (ajouts récents)
    recently = []
    # Trier par date d'ajout (si disponible)
    sorted_items = sorted(data['all'], key=lambda x: x.get('date_added', ''), reverse=True)
    for item in sorted_items[:15]:  # Prendre les 15 éléments les plus récents
        recent_item = {
            "id": str(item.get('id', '')),
            "title": item.get('title', ''),
            "description": item.get('synopsis', ''),
            "imageUrl": item.get('poster_url', '') or item.get('cover_url', ''),
            "year": item.get('year', 2023),
            "rating": item.get('rating', 8.5),
            "duration": item.get('duration', '45 min')
        }
        recently.append(recent_item)
    
    # Transformer les données pour topRated.json (mieux notés)
    top_rated = []
    # Trier par note (si disponible)
    sorted_items = sorted(data['all'], key=lambda x: x.get('rating', 0), reverse=True)
    for item in sorted_items[:15]:  # Prendre les 15 éléments les mieux notés
        top_item = {
            "id": str(item.get('id', '')),
            "title": item.get('title', ''),
            "description": item.get('synopsis', ''),
            "imageUrl": item.get('poster_url', '') or item.get('cover_url', ''),
            "year": item.get('year', 2023),
            "rating": item.get('rating', 8.5),
            "duration": item.get('duration', '45 min')
        }
        top_rated.append(top_item)
    
    # Transformer les données pour content.json (tous les contenus)
    content = []
    for item in data['all']:
        content_item = {
            "id": str(item.get('id', '')),
            "title": item.get('title', ''),
            "description": item.get('synopsis', ''),
            "imageUrl": item.get('poster_url', '') or item.get('cover_url', ''),
            "year": item.get('year', 2023),
            "rating": item.get('rating', 8.5),
            "duration": item.get('duration', '45 min'),
            "category": item.get('category', 'Drame')
        }
        content.append(content_item)
    
    # Transformer les données pour categories.json
    categories = [
        {
            "id": "drama",
            "name": "Dramas",
            "description": "Séries dramatiques asiatiques"
        },
        {
            "id": "movie",
            "name": "Films",
            "description": "Films asiatiques"
        },
        {
            "id": "anime",
            "name": "Animes",
            "description": "Animation japonaise"
        },
        {
            "id": "bollywood",
            "name": "Bollywood",
            "description": "Cinéma indien"
        }
    ]
    
    # Créer l'index de recherche
    search_index = []
    for item in data['all']:
        search_line = f"{item.get('title', '')}|{item.get('category', 'Drame')}|{item.get('year', '')}|{item.get('synopsis', '')[:50]}|{item.get('id', '')}"
        search_index.append(search_line)
    
    # Écrire les fichiers JSON
    files_to_write = {
        'featured.json': featured,
        'popular.json': popular,
        'recently.json': recently,
        'topRated.json': top_rated,
        'content.json': content,
        'categories.json': categories
    }
    
    for filename, data_to_write in files_to_write.items():
        file_path = TEMP_DATA_DIR / filename
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data_to_write, f, ensure_ascii=False, indent=2)
        print(f"✅ Fichier {filename} créé")
    
    # Écrire l'index de recherche
    index_path = TEMP_DATA_DIR / "index.txt"
    with open(index_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(search_index))
    print(f"✅ Fichier index.txt créé")
    
    return True

def upload_to_s3():
    """Uploade les fichiers vers S3."""
    print_step("Upload des fichiers vers S3")
    
    try:
        # Initialiser le client S3
        s3 = boto3.client('s3', region_name=AWS_REGION)
        
        # Uploader chaque fichier
        for file_path in TEMP_DATA_DIR.glob('*'):
            file_name = file_path.name
            content_type = 'application/json' if file_name.endswith('.json') else 'text/plain'
            
            print(f"Upload de {file_name} vers s3://{S3_BUCKET_NAME}/{file_name}...")
            
            with open(file_path, 'rb') as f:
                s3.upload_fileobj(
                    f, 
                    S3_BUCKET_NAME, 
                    file_name,
                    ExtraArgs={
                        'ContentType': content_type,
                        # Pas d'ACL pour éviter l'erreur AccessControlListNotSupported
                    }
                )
            
            print(f"✅ {file_name} uploadé avec succès")
        
        return True
    except Exception as e:
        print(f"❌ Erreur lors de l'upload vers S3: {str(e)}")
        return False

def main():
    """Fonction principale qui orchestre toutes les étapes."""
    print("\n╔════════════════════════════════════════════════╗")
    print("║                                                ║")
    print("║   Export des données FloDrama vers S3         ║")
    print("║                                                ║")
    print("╚════════════════════════════════════════════════╝\n")
    
    # 1. Charger les variables d'environnement
    env_vars = load_env()
    
    # Vérifier les identifiants AWS
    aws_access_key = env_vars.get('AWS_ACCESS_KEY_ID')
    aws_secret_key = env_vars.get('AWS_SECRET_ACCESS_KEY')
    aws_region = env_vars.get('AWS_REGION')
    
    if not aws_access_key or not aws_secret_key:
        print("❌ Identifiants AWS manquants dans le fichier .env")
        print("Veuillez configurer AWS_ACCESS_KEY_ID et AWS_SECRET_ACCESS_KEY")
        return
    
    print(f"✅ Identifiants AWS configurés")
    print(f"✅ Région AWS: {aws_region or 'us-east-1'}")
    
    # 2. Charger les données scrappées
    data = load_scraped_data()
    
    if not data['all']:
        print("❌ Aucune donnée scrappée trouvée")
        print("Veuillez exécuter scrape_content.py avant de lancer ce script")
        return
    
    # 3. Transformer les données
    transform_success = transform_data_for_frontend(data)
    
    if not transform_success:
        print("❌ Erreur lors de la transformation des données")
        return
    
    # 4. Uploader vers S3
    s3_success = upload_to_s3()
    
    # Résumé
    print_step("RÉSUMÉ")
    print(f"Données chargées: ✅ ({len(data['all'])} éléments)")
    print(f"Transformation: ✅")
    print(f"Upload vers S3: {'✅' if s3_success else '❌'}")
    
    # Nettoyage
    if TEMP_DATA_DIR.exists():
        import shutil
        shutil.rmtree(TEMP_DATA_DIR)
        print("✅ Nettoyage des fichiers temporaires effectué")
    
    print_step("FIN DE L'EXPORT")
    
    if s3_success:
        print("\n✅ Les données ont été exportées avec succès vers S3")
        print("Le frontend devrait maintenant afficher les données réelles scrappées")
    else:
        print("\n❌ L'export vers S3 a échoué")
        print("Veuillez vérifier les erreurs et réessayer")

if __name__ == "__main__":
    main()
