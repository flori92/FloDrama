#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Script de scraping AsianWiki pour FloDrama - Migration Supabase
Ce script extrait les films asiatiques depuis AsianWiki et les enregistre dans Supabase.
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
logger = logging.getLogger('asianwiki_scraper')

# Chargement des variables d'environnement
load_dotenv()

# Configuration des constantes
BASE_URL = "https://asianwiki.com"
USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.107 Safari/537.36",
]
RATE_LIMIT_DELAY = 3  # secondes entre les requêtes
MAX_RETRIES = 3  # nombre maximal de tentatives en cas d'échec
MIN_ITEMS = int(os.environ.get("MIN_ITEMS", "200"))

# Catégories de films sur AsianWiki
CATEGORIES = {
    "korean_movies": f"{BASE_URL}/wiki/Category:Korean_Movies",
    "japanese_movies": f"{BASE_URL}/wiki/Category:Japanese_Movies",
    "chinese_movies": f"{BASE_URL}/wiki/Category:Chinese_Movies",
    "thai_movies": f"{BASE_URL}/wiki/Category:Thai_Movies",
}

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

def get_random_headers(referer=None):
    """Génère des en-têtes HTTP aléatoires"""
    headers = {
        "User-Agent": random.choice(USER_AGENTS),
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "fr,fr-FR;q=0.8,en-US;q=0.5,en;q=0.3",
        "DNT": "1",
        "Connection": "keep-alive",
        "Upgrade-Insecure-Requests": "1",
    }
    
    if referer:
        headers["Referer"] = referer
        
    return headers

def fetch_page(url, referer=None, retries=MAX_RETRIES):
    """Récupère le contenu d'une page HTML avec gestion des erreurs"""
    logger.info(f"Récupération de la page: {url} (tentative 1/{retries})")
    
    headers = get_random_headers(referer)
    
    for attempt in range(1, retries + 1):
        try:
            response = requests.get(url, headers=headers, timeout=30)
            response.raise_for_status()
            
            # Attendre pour respecter le rate limiting
            time.sleep(RATE_LIMIT_DELAY)
            
            return response.text
            
        except requests.exceptions.RequestException as e:
            logger.warning(f"Erreur lors de la récupération de {url}: {str(e)}")
            
            if attempt < retries:
                wait_time = RATE_LIMIT_DELAY * attempt
                logger.info(f"Nouvelle tentative dans {wait_time} secondes...")
                time.sleep(wait_time)
            else:
                logger.error(f"Échec après {retries} tentatives pour {url}")
                return None

def extract_movie_details(movie_url):
    """Extrait les détails d'un film à partir de son URL"""
    html = fetch_page(movie_url)
    if not html:
        return None

    soup = BeautifulSoup(html, 'html.parser')
    
    # Extraction des informations de base
    title_elem = soup.select_one('h1.firstHeading')
    title = title_elem.text.strip() if title_elem else "Titre inconnu"
    
    # Image du poster
    poster_elem = soup.select_one('table.infobox img')
    poster_url = poster_elem.get('src') if poster_elem else None
    if poster_url and not poster_url.startswith('http'):
        poster_url = urljoin(BASE_URL, poster_url)
    
    # Information de base
    info_table = soup.select_one('table.infobox')
    info_text = info_table.text.strip() if info_table else ""
    
    # Extraction des métadonnées avec regex
    # Année
    release_date_match = re.search(r'Release Date:\s*([^\n]+)', info_text)
    release_date = release_date_match.group(1).strip() if release_date_match else ""
    year_match = re.search(r'(\d{4})', release_date)
    year = int(year_match.group(1)) if year_match else None
    
    # Durée
    runtime_match = re.search(r'Runtime:\s*(\d+)\s*min', info_text)
    runtime = int(runtime_match.group(1)) if runtime_match else None
    
    # Pays d'origine
    country_match = re.search(r'Country:\s*([^\n]+)', info_text)
    country = country_match.group(1).strip() if country_match else "South Korea"
    
    # Détection de la langue
    language_map = {
        "South Korea": "ko",
        "Japan": "ja",
        "China": "zh",
        "Taiwan": "zh",
        "Hong Kong": "zh",
        "Thailand": "th",
        "Vietnam": "vi",
        "Philippines": "tl",
        "Malaysia": "ms",
        "Singapore": "en",
        "Indonesia": "id"
    }
    language = language_map.get(country, "ko")
    
    # Synopsis
    synopsis_elem = soup.select_one('#mw-content-text > p')
    synopsis = synopsis_elem.text.strip() if synopsis_elem else ""
    
    # Genres (souvent pas disponibles directement, on peut les extraire du texte)
    genres_text = info_text.lower()
    possible_genres = ["action", "comedy", "drama", "romance", "thriller", "horror", "sci-fi", "fantasy", "adventure", "crime", "mystery"]
    genres = [genre for genre in possible_genres if genre in genres_text]
    
    # Données structurées pour Supabase
    movie_data = {
        "title": title,
        "poster_url": poster_url,
        "year": year,
        "runtime": runtime,
        "language": language,
        "description": synopsis[:200] + "..." if len(synopsis) > 200 else synopsis,
        "synopsis": synopsis,
        "genres": genres,
        "streaming_urls": [{"quality": "HD", "url": movie_url}],
    }
    
    return movie_data

def get_asian_movies(page_count=5):
    """Récupère les films asiatiques depuis AsianWiki"""
    movie_urls = []
    seen_urls = set()
    
    # Parcours des catégories
    for category_name, category_url in CATEGORIES.items():
        logger.info(f"Exploration de la catégorie: {category_url}")
        
        # Parcours des pages de la catégorie
        for page in range(1, page_count + 1):
            # AsianWiki utilise un format différent pour la pagination
            page_url = f"{category_url}" if page == 1 else f"{category_url}?pagefrom={page*200}"
            html = fetch_page(page_url)
            
            if not html:
                continue
                
            soup = BeautifulSoup(html, 'html.parser')
            movie_items = soup.select('div.mw-category-group ul li a')
            
            new_urls_count = 0
            for item in movie_items:
                if item and item.get('href'):
                    movie_url = urljoin(BASE_URL, item.get('href'))
                    
                    # Vérifier si l'URL a déjà été vue
                    if movie_url in seen_urls:
                        continue
                        
                    movie_urls.append(movie_url)
                    seen_urls.add(movie_url)
                    new_urls_count += 1
            
            logger.info(f"Trouvé {new_urls_count} nouveaux films sur {'la page ' + str(page) + ' de ' if page > 1 else ''}{category_url}")
            
            # Si on a assez d'URLs, on arrête
            if len(movie_urls) >= MIN_ITEMS:
                break
                
        # Si on a assez d'URLs, on arrête
        if len(movie_urls) >= MIN_ITEMS:
            break
    
    logger.info(f"Total: {len(movie_urls)} URLs de films asiatiques uniques trouvées")
    return movie_urls[:MIN_ITEMS]

def scrape_and_upload_movies():
    """Processus principal: scraping et upload vers Supabase"""
    # Récupération des URLs de films
    movie_urls = get_asian_movies()
    
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
    
    logger.info(f"Début du scraping de {len(movie_urls)} films depuis AsianWiki")
    
    # Enregistrement de la session de scraping
    session_id = supabase_db.log_scraping_session('films', 'asianwiki')
    
    start_time = time.time()
    scraped_count = 0
    error_count = 0
    
    # Pour chaque URL de film, on récupère les détails et on les sauvegarde
    for i, movie_url in enumerate(movie_urls, 1):
        try:
            logger.info(f"Traitement du film {i}/{len(movie_urls)}: {movie_url}")
            
            movie_data = extract_movie_details(movie_url)
            
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
            movie_data['source'] = 'asianwiki'
            movie_data['source_url'] = movie_url
            
            # Sauvegarde dans Supabase
            result = supabase_db.store_content('films', movie_data)
            
            if result and result.get('id'):
                scraped_count += 1
                scraped_ids.add(result.get('id'))
                scraped_titles.add(movie_title)
                logger.info(f"Film '{movie_data.get('title')}' enregistré avec succès ({scraped_count}/{len(movie_urls)})")
                
        except Exception as e:
            error_count += 1
            logger.error(f"Erreur lors du traitement de {movie_url}: {str(e)}")
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
        'source': 'asianwiki',
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
    report_file = os.path.join(log_dir, f"asianwiki_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json")
    
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
