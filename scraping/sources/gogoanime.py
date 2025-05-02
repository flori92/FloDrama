#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Script de scraping GogoAnime pour FloDrama - Migration Supabase
Ce script extrait les animés depuis GogoAnime et les enregistre dans Supabase.
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
logger = logging.getLogger('gogoanime_scraper')

# Chargement des variables d'environnement
load_dotenv()

# Configuration des constantes
BASE_URL = "https://gogoanime3.net"
USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.107 Safari/537.36",
]
RATE_LIMIT_DELAY = 3  # secondes entre les requêtes
MAX_RETRIES = 3  # nombre maximal de tentatives en cas d'échec
MIN_ITEMS = int(os.environ.get("MIN_ITEMS", "200"))

# Catégories d'animés sur GogoAnime
CATEGORIES = {
    "recent": f"{BASE_URL}/recently-added-anime",
    "popular": f"{BASE_URL}/popular.html",
    "movies": f"{BASE_URL}/anime-movies.html",
    "ongoing": f"{BASE_URL}/ongoing-anime.html",
    "completed": f"{BASE_URL}/completed-anime.html"
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

def extract_anime_details(anime_url):
    """Extrait les détails d'un animé à partir de son URL"""
    try:
        logger.info(f"Extraction des détails pour {anime_url}")
        html = fetch_page(anime_url)
        if not html:
            logger.error(f"Impossible de récupérer la page {anime_url}")
            return None

        soup = BeautifulSoup(html, 'html.parser')

        # Extraction du titre
        title_elem = soup.select_one('div.anime_info_body h1')
        title = title_elem.text.strip() if title_elem else None
        if not title:
            logger.error(f"Titre non trouvé pour {anime_url}")
            raise ValueError(f"Titre non trouvé pour {anime_url}")
        logger.info(f"Titre extrait: {title}")

        # Image du poster
        poster_elem = soup.select_one('div.anime_info_body_bg img')
        poster_url = poster_elem.get('src') if poster_elem else None
        if not poster_url:
            logger.warning(f"Poster non trouvé pour {anime_url}")
        else:
            logger.info(f"Poster extrait: {poster_url}")

        # Extraction du synopsis
        synopsis_elem = soup.select_one('.description, .synopsis, .plot-summary')
        synopsis = synopsis_elem.text.strip() if synopsis_elem else ''
        if not synopsis:
            logger.warning(f"Synopsis non trouvé pour {anime_url}")
        else:
            logger.info(f"Synopsis extrait: {synopsis[:60]}...")

        # Extraction des genres
        genres = []
        genres_elem = soup.select('p.type a, .genres a')
        if genres_elem:
            genres = [g.text.strip() for g in genres_elem]
        logger.info(f"Genres extraits: {genres}")

        # Extraction de l'année
        year = None
        year_elem = soup.select_one('.year, .date')
        if year_elem:
            try:
                year = int(year_elem.text.strip())
            except Exception as e:
                logger.warning(f"Année mal formatée pour {anime_url}: {e}")
        if not year:
            logger.warning(f"Année non trouvée pour {anime_url}")
        else:
            logger.info(f"Année extraite: {year}")

        # Construction des données pour Supabase
        anime_data = {
            "title": title,
            "poster_url": poster_url,
            "year": year,
            "genres": genres,
            "description": synopsis[:200] + "..." if len(synopsis) > 200 else synopsis,
            "synopsis": synopsis,
            "streaming_urls": [{"quality": "HD", "url": anime_url}],
        }
        return anime_data
    except Exception as e:
        logger.error(f"Erreur lors de l'extraction des détails pour {anime_url}: {str(e)}")
        logger.exception(e)
        return None

def get_recently_added_animes(page_count=5):
    """Récupère les animés récemment ajoutés depuis GogoAnime"""
    anime_urls = []
    seen_urls = set()
    
    # Parcours des catégories
    for category_name, category_url in CATEGORIES.items():
        logger.info(f"Exploration de la catégorie: {category_url}")
        
        # Parcours des pages de la catégorie
        for page in range(1, page_count + 1):
            page_url = f"{category_url}?page={page}" if page > 1 else category_url
            html = fetch_page(page_url)
            
            if not html:
                continue
                
            soup = BeautifulSoup(html, 'html.parser')
            anime_items = soup.select('div.last_episodes ul.items li')
            
            new_urls_count = 0
            for item in anime_items:
                link = item.select_one('p.name a')
                if link and link.get('href'):
                    anime_url = urljoin(BASE_URL, link.get('href'))
                    
                    # Vérifier si l'URL a déjà été vue
                    if anime_url in seen_urls:
                        continue
                        
                    anime_urls.append(anime_url)
                    seen_urls.add(anime_url)
                    new_urls_count += 1
            
            logger.info(f"Trouvé {new_urls_count} nouveaux animés sur {'la page ' + str(page) + ' de ' if page > 1 else ''}{category_url}")
            
            # Si on a assez d'URLs, on arrête
            if len(anime_urls) >= MIN_ITEMS:
                break
                
        # Si on a assez d'URLs, on arrête
        if len(anime_urls) >= MIN_ITEMS:
            break
    
    logger.info(f"Total: {len(anime_urls)} URLs d'animés uniques trouvées")
    return anime_urls[:MIN_ITEMS]

def scrape_and_upload_animes():
    """Processus principal: scraping et upload vers Supabase"""
    # Récupération des URLs d'animés
    anime_urls = get_recently_added_animes()
    
    # Récupération des animés existants pour éviter les doublons
    try:
        existing_animes = supabase_db.get_existing_content('animes', 'anime')
        existing_ids = [anime.get('id') for anime in existing_animes if anime.get('id')]
        existing_titles = [anime.get('title', '').lower() for anime in existing_animes if anime.get('title')]
        
        logger.info(f"Trouvé {len(existing_animes)} animés existants dans la base de données")
        
    except Exception as e:
        logger.error(f"Erreur lors de la récupération des animés existants: {str(e)}")
        existing_animes = []
        existing_ids = []
        existing_titles = []
    
    # Mise à jour de nos collections avec les animés existants
    scraped_ids.update(existing_ids)
    scraped_titles.update(existing_titles)
    
    # Mise à jour avec les IDs et titres déjà vus par d'autres scrapers
    if seen_ids:
        scraped_ids.update(seen_ids)
    if seen_titles:
        scraped_titles.update(seen_titles)
    
    logger.info(f"Début du scraping de {len(anime_urls)} animés depuis GogoAnime")
    
    # Enregistrement de la session de scraping
    session_id = supabase_db.log_scraping_session('animes', 'gogoanime')
    
    start_time = time.time()
    scraped_count = 0
    error_count = 0
    
    # Pour chaque URL d'animé, on récupère les détails et on les sauvegarde
    for i, anime_url in enumerate(anime_urls, 1):
        try:
            logger.info(f"Traitement de l'animé {i}/{len(anime_urls)}: {anime_url}")
            
            anime_data = extract_anime_details(anime_url)
            
            if not anime_data:
                continue
                
            # Vérifier si cet animé a déjà été vu (par titre)
            anime_title = anime_data.get('title', '').lower()
            if anime_title in scraped_titles:
                logger.info(f"Animé '{anime_data.get('title')}' déjà scrapé, ignoré")
                continue
                
            # Télécharger et sauvegarder l'image du poster si disponible
            poster_url = anime_data.get('poster_url')
            if poster_url:
                try:
                    image_path = download_and_upload_image(poster_url, 'anime')
                    if image_path:
                        anime_data['image_url'] = image_path
                except Exception as e:
                    logger.error(f"Erreur lors du téléchargement/upload de l'image {poster_url}: {str(e)}")
            
            # Ajout des informations de source
            anime_data['source'] = 'gogoanime'
            anime_data['source_url'] = anime_url
            
            # Sauvegarde dans Supabase
            result = supabase_db.store_content('animes', anime_data)
            
            if result and result.get('id'):
                scraped_count += 1
                scraped_ids.add(result.get('id'))
                scraped_titles.add(anime_title)
                logger.info(f"Animé '{anime_data.get('title')}' enregistré avec succès ({scraped_count}/{len(anime_urls)})")
                
        except Exception as e:
            error_count += 1
            logger.error(f"Erreur lors du traitement de {anime_url}: {str(e)}")
            logger.exception(e)
    
    # Mise à jour du log de scraping avec les résultats
    execution_time = time.time() - start_time
    supabase_db.update_scraping_log(session_id, {
        'items_scraped': scraped_count,
        'errors': error_count,
        'execution_time': execution_time
    })
    
    logger.info(f"Fin du scraping: {scraped_count} animés récupérés, {error_count} erreurs")
    logger.info(f"Durée totale: {execution_time:.2f} secondes")
    
    # Génération du rapport de scraping
    report = {
        'source': 'gogoanime',
        'category': 'animes',
        'date': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        'items_scraped': scraped_count,
        'errors': error_count,
        'execution_time': execution_time,
        'session_id': session_id
    }
    
    # Enregistrement du rapport dans un fichier JSON
    log_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'logs')
    os.makedirs(log_dir, exist_ok=True)
    report_file = os.path.join(log_dir, f"gogoanime_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json")
    
    with open(report_file, 'w', encoding='utf-8') as f:
        json.dump(report, f, indent=2, ensure_ascii=False)
    
    logger.info(f"Rapport généré: {report_file}")
    
    # Vérification de l'objectif minimum
    if scraped_count < MIN_ITEMS:
        logger.warning(f"⚠️ Objectif non atteint: {scraped_count}/{MIN_ITEMS} animés récupérés")
    
    return scraped_count

# Point d'entrée principal
if __name__ == "__main__":
    # Lancement du scraping
    scrape_and_upload_animes()
