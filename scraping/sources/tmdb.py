#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Script de scraping TMDB pour FloDrama - Migration Supabase
Ce script extrait les films asiatiques depuis TMDB et les enregistre dans Supabase.
"""

import os
import json
import time
import random
import logging
import uuid
from datetime import datetime
import requests
from bs4 import BeautifulSoup
import re
from urllib.parse import urljoin
from dotenv import load_dotenv
from pathlib import Path

# Import de l'utilitaire de stockage Supabase
try:
    from scraping.utils.supabase_storage import download_and_upload_image
    from scraping.utils.supabase_database import supabase_database as supabase_db
except ImportError:
    # En cas d'import direct depuis le dossier sources
    import sys
    sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
    from scraping.utils.supabase_storage import download_and_upload_image
    from scraping.utils.supabase_database import supabase_database as supabase_db

# Configuration du logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('tmdb_scraper')

# Chargement des variables d'environnement
load_dotenv()

# Configuration des constantes
BASE_URL = "https://api.themoviedb.org/3"
IMAGE_BASE_URL = "https://image.tmdb.org/t/p/original"
API_KEY = os.environ.get("TMDB_API_KEY", "1a97f3b8d5a0795e25e7f8bb66d728c6")  # Clé API par défaut
RATE_LIMIT_DELAY = 1  # secondes entre les requêtes
MAX_RETRIES = 3  # nombre maximal de tentatives en cas d'échec
MIN_ITEMS = int(os.environ.get("MIN_ITEMS", "200"))

# Pays asiatiques pour le filtrage
ASIAN_COUNTRIES = ['KR', 'JP', 'CN', 'TW', 'HK', 'TH', 'VN', 'PH', 'MY', 'SG', 'ID']

# Variables globales pour suivre les éléments scrapés
scraped_ids = set()
scraped_titles = set()
seen_ids = set()
seen_titles = set()

def set_seen_ids(ids):
    """Définit les IDs déjà vus par d'autres scrapers"""
    global seen_ids
    seen_ids = set(ids)

def set_seen_titles(titles):
    """Définit les titres déjà vus par d'autres scrapers"""
    global seen_titles
    seen_titles = set(titles)

def get_scraped_ids():
    """Retourne les IDs scrapés par ce module"""
    global scraped_ids
    return scraped_ids

def get_scraped_titles():
    """Retourne les titres scrapés par ce module"""
    global scraped_titles
    return scraped_titles

def fetch_from_api(endpoint, params=None):
    """Récupère les données depuis l'API TMDB avec gestion des erreurs"""
    url = f"{BASE_URL}/{endpoint}"
    default_params = {
        'api_key': API_KEY,
        'language': 'fr-FR'
    }
    
    if params:
        default_params.update(params)
    
    logger.info(f"Récupération depuis l'API: {url} (tentative 1/{MAX_RETRIES})")
    
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            response = requests.get(url, params=default_params, timeout=30)
            response.raise_for_status()
            
            # Attendre pour respecter le rate limiting
            time.sleep(RATE_LIMIT_DELAY)
            
            return response.json()
            
        except requests.exceptions.RequestException as e:
            logger.warning(f"Erreur lors de la récupération de {url}: {str(e)}")
            
            if attempt < MAX_RETRIES:
                wait_time = RATE_LIMIT_DELAY * attempt
                logger.info(f"Nouvelle tentative dans {wait_time} secondes...")
                time.sleep(wait_time)
            else:
                logger.error(f"Échec après {MAX_RETRIES} tentatives pour {url}")
                return None

def is_asian_movie(movie_data):
    """Vérifie si un film est asiatique en fonction de son pays d'origine"""
    if 'production_countries' in movie_data:
        for country in movie_data['production_countries']:
            if country['iso_3166_1'] in ASIAN_COUNTRIES:
                return True
    return False

def extract_movie_details(movie_id):
    """Extrait les détails d'un film à partir de son ID TMDB"""
    movie_data = fetch_from_api(f"movie/{movie_id}", {
        'append_to_response': 'videos,credits,keywords'
    })
    
    if not movie_data:
        return None
    
    # Vérifier si c'est un film asiatique
    if not is_asian_movie(movie_data):
        logger.info(f"Film {movie_data.get('title')} ignoré car non asiatique")
        return None
    
    # Extraction des informations de base
    title = movie_data.get('title', "Titre inconnu")
    original_title = movie_data.get('original_title', title)
    
    # Image du poster
    poster_path = movie_data.get('poster_path')
    poster_url = f"{IMAGE_BASE_URL}{poster_path}" if poster_path else None
    
    # Année de sortie
    release_date = movie_data.get('release_date', '')
    year = int(release_date[:4]) if release_date and len(release_date) >= 4 else None
    
    # Note
    rating = movie_data.get('vote_average')
    
    # Synopsis
    synopsis = movie_data.get('overview', '')
    
    # Genres
    genres = [genre['name'] for genre in movie_data.get('genres', [])]
    
    # Durée
    runtime = movie_data.get('runtime')
    
    # Pays d'origine
    production_countries = [country['iso_3166_1'] for country in movie_data.get('production_countries', [])]
    primary_country = next((c for c in production_countries if c in ASIAN_COUNTRIES), 'KR')
    
    # Détection de la langue
    language_map = {
        'KR': 'ko',
        'JP': 'ja',
        'CN': 'zh',
        'TW': 'zh',
        'HK': 'zh',
        'TH': 'th',
        'VN': 'vi',
        'PH': 'tl',
        'MY': 'ms',
        'SG': 'en',
        'ID': 'id'
    }
    language = language_map.get(primary_country, 'ko')
    
    # Données structurées pour Supabase
    movie_data_formatted = {
        "title": title,
        "original_title": original_title,
        "poster_url": poster_url,
        "year": year,
        "rating": rating,
        "language": language,
        "description": synopsis[:200] + "..." if len(synopsis) > 200 else synopsis,
        "synopsis": synopsis,
        "genres": genres,
        "runtime": runtime,
        "tmdb_id": movie_id,
        "production_countries": production_countries,
    }
    
    return movie_data_formatted

def get_asian_movies(page_count=10):
    """Récupère les films asiatiques depuis TMDB"""
    movie_ids = []
    seen_ids = set()
    
    # Catégories de recherche
    categories = [
        ('discover/movie', {'with_original_language': 'ko', 'sort_by': 'popularity.desc'}),
        ('discover/movie', {'with_original_language': 'ja', 'sort_by': 'popularity.desc'}),
        ('discover/movie', {'with_original_language': 'zh', 'sort_by': 'popularity.desc'}),
        ('discover/movie', {'with_original_language': 'th', 'sort_by': 'popularity.desc'}),
        ('discover/movie', {'with_keywords': '213', 'sort_by': 'popularity.desc'}),  # Keyword pour "asian"
    ]
    
    # Parcours des catégories
    for endpoint, params in categories:
        logger.info(f"Exploration de la catégorie: {endpoint} avec params {params}")
        
        # Parcours des pages
        for page in range(1, page_count + 1):
            page_params = params.copy()
            page_params['page'] = page
            
            results = fetch_from_api(endpoint, page_params)
            
            if not results or 'results' not in results:
                continue
                
            new_ids_count = 0
            for movie in results['results']:
                movie_id = movie.get('id')
                
                if movie_id and movie_id not in seen_ids:
                    movie_ids.append(movie_id)
                    seen_ids.add(movie_id)
                    new_ids_count += 1
            
            logger.info(f"Trouvé {new_ids_count} nouveaux films sur la page {page}")
            
            # Si on a assez d'IDs, on arrête
            if len(movie_ids) >= MIN_ITEMS:
                break
                
        # Si on a assez d'IDs, on arrête
        if len(movie_ids) >= MIN_ITEMS:
            break
    
    logger.info(f"Total: {len(movie_ids)} IDs de films uniques trouvés")
    return movie_ids[:MIN_ITEMS]

def scrape_and_upload_movies():
    """Processus principal: scraping et upload vers Supabase"""
    # Récupération des IDs de films
    movie_ids = get_asian_movies()
    
    # Récupération des films existants pour éviter les doublons
    try:
        existing_movies = supabase_db.get_existing_content('films', 'film')
        existing_ids = [movie.get('id') for movie in existing_movies if movie.get('id')]
        existing_titles = [movie.get('title', '').lower() for movie in existing_movies if movie.get('title')]
        
        logger.info(f"Trouvé {len(existing_movies)} films existants dans la base de données")
        
    except Exception as e:
        logger.error(f"Erreur lors de la récupération des films existants: {str(e)}")
        existing_movies = []
        existing_ids = []
        existing_titles = []
    
    # Mise à jour de nos collections avec les films existants
    scraped_ids.update(existing_ids)
    scraped_titles.update(existing_titles)
    
    # Mise à jour avec les IDs et titres déjà vus par d'autres scrapers
    if seen_ids:
        scraped_ids.update(seen_ids)
    if seen_titles:
        scraped_titles.update(seen_titles)
    
    logger.info(f"Début du scraping de {len(movie_ids)} films depuis TMDB")
    
    # Enregistrement de la session de scraping
    session_id = supabase_db.log_scraping_session('films', 'tmdb')
    
    start_time = time.time()
    scraped_count = 0
    error_count = 0
    
    # Pour chaque ID de film, on récupère les détails et on les sauvegarde
    for i, movie_id in enumerate(movie_ids, 1):
        try:
            logger.info(f"Traitement du film {i}/{len(movie_ids)}: {movie_id}")
            
            movie_data = extract_movie_details(movie_id)
            
            if not movie_data:
                continue
                
            # Vérifier si ce film a déjà été vu (par titre)
            movie_title = movie_data.get('title', '').lower()
            if movie_title in scraped_titles:
                logger.info(f"Film '{movie_data.get('title')}' déjà scrapé, ignoré")
                continue
                
            # Télécharger et sauvegarder l'image du poster si disponible
            poster_url = movie_data.get('poster_url')
            if poster_url:
                try:
                    image_path = download_and_upload_image(poster_url, 'film')
                    if image_path:
                        movie_data['image_url'] = image_path
                except Exception as e:
                    logger.error(f"Erreur lors du téléchargement/upload de l'image {poster_url}: {str(e)}")
            
            # Ajout des informations de source
            movie_data['source'] = 'tmdb'
            movie_data['source_url'] = f"https://www.themoviedb.org/movie/{movie_id}"
            
            # Sauvegarde dans Supabase
            result = supabase_db.store_content('films', movie_data)
            
            if result and result.get('id'):
                scraped_count += 1
                scraped_ids.add(result.get('id'))
                scraped_titles.add(movie_title)
                logger.info(f"Film '{movie_data.get('title')}' enregistré avec succès ({scraped_count}/{len(movie_ids)})")
                
        except Exception as e:
            error_count += 1
            logger.error(f"Erreur lors du traitement du film {movie_id}: {str(e)}")
            logger.exception(e)
    
    # Mise à jour du log de scraping avec les résultats
    execution_time = time.time() - start_time
    supabase_db.update_scraping_log(session_id, {
        'items_scraped': scraped_count,
        'errors': error_count,
        'execution_time': execution_time
    })
    
    logger.info(f"Fin du scraping: {scraped_count} films récupérés, {error_count} erreurs")
    logger.info(f"Durée totale: {execution_time:.2f} secondes")
    
    # Génération du rapport de scraping
    report = {
        'source': 'tmdb',
        'category': 'films',
        'date': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        'items_scraped': scraped_count,
        'errors': error_count,
        'execution_time': execution_time,
        'session_id': session_id
    }
    
    # Enregistrement du rapport dans un fichier JSON
    log_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'logs')
    os.makedirs(log_dir, exist_ok=True)
    report_file = os.path.join(log_dir, f"tmdb_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json")
    
    with open(report_file, 'w', encoding='utf-8') as f:
        json.dump(report, f, indent=2, ensure_ascii=False)
    
    logger.info(f"Rapport généré: {report_file}")
    
    # Vérification de l'objectif minimum
    if scraped_count < MIN_ITEMS:
        logger.warning(f"⚠️ Objectif non atteint: {scraped_count}/{MIN_ITEMS} films récupérés")
    
    return scraped_count

# Point d'entrée principal
if __name__ == "__main__":
    # Lancement du scraping
    scrape_and_upload_movies()
