#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Script de scraping Dramacool pour FloDrama - Migration Supabase
Ce script extrait les dramas asiatiques depuis Dramacool et les enregistre dans Supabase.
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
logger = logging.getLogger('dramacool_scraper')

# Chargement des variables d'environnement
load_dotenv()

# Configuration des constantes
BASE_URL = "https://dramacool.com.pa"  # URL de base, peut changer car le site change souvent de domaine
USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.107 Safari/537.36",
]
RATE_LIMIT_DELAY = 3  # secondes entre les requêtes
MAX_RETRIES = 3  # nombre maximal de tentatives en cas d'échec
MIN_ITEMS = int(os.environ.get("MIN_ITEMS", "200"))

# Catégories de dramas sur Dramacool
CATEGORIES = {
    "kdrama": f"{BASE_URL}/drama/category/korean-drama/",
    "jdrama": f"{BASE_URL}/drama/category/japanese-drama/",
    "cdrama": f"{BASE_URL}/drama/category/chinese-drama/",
    "tdrama": f"{BASE_URL}/drama/category/thai-drama/",
    "recent": f"{BASE_URL}/drama/recently-added/"
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
                wait_time = attempt * 2  # Attente exponentielle
                logger.info(f"Nouvelle tentative dans {wait_time} secondes...")
                time.sleep(wait_time)
                logger.info(f"Récupération de la page: {url} (tentative {attempt+1}/{retries})")
            else:
                logger.error(f"Échec après {retries} tentatives pour {url}")
                return None

def extract_drama_details(drama_url):
    """Extrait les détails d'un drama à partir de son URL"""
    try:
        logger.info(f"Extraction des détails pour {drama_url}")
        html = fetch_page(drama_url)
        if not html:
            logger.error(f"Impossible de récupérer la page {drama_url}")
            return None

        soup = BeautifulSoup(html, 'html.parser')

        # Extraction du titre
        title_elem = soup.select_one('div.info h1.title, h1.entry-title')
        title = title_elem.text.strip() if title_elem else None
        if not title:
            logger.error(f"Titre non trouvé pour {drama_url}")
            raise ValueError(f"Titre non trouvé pour {drama_url}")
        logger.info(f"Titre extrait: {title}")

        # Extraction de l'image poster
        poster_selectors = [
            'div.details div.img img',
            'div.thumbs_info img',
            'div.poster img',
            'img.poster',
            'img[src*="poster"]',
        ]
        poster_url = None
        for selector in poster_selectors:
            poster_elem = soup.select_one(selector)
            if poster_elem and poster_elem.has_attr('src'):
                poster_url = poster_elem['src']
                break
        if not poster_url:
            logger.warning(f"Poster non trouvé pour {drama_url}")
        else:
            logger.info(f"Poster extrait: {poster_url}")

        # Extraction du synopsis
        synopsis_elem = soup.select_one('.synopsis, .description, .plot-summary')
        synopsis = synopsis_elem.text.strip() if synopsis_elem else ''
        if not synopsis:
            logger.warning(f"Synopsis non trouvé pour {drama_url}")
        else:
            logger.info(f"Synopsis extrait: {synopsis[:60]}...")

        # Extraction des genres
        genres = []
        genres_elem = soup.select('div.info .genres a, .genres a')
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
                logger.warning(f"Année mal formatée pour {drama_url}: {e}")
        if not year:
            logger.warning(f"Année non trouvée pour {drama_url}")
        else:
            logger.info(f"Année extraite: {year}")

        # Extraction du pays
        country = ''
        country_elem = soup.select_one('.country, .info-country')
        if country_elem:
            country = country_elem.text.strip()
        logger.info(f"Pays extrait: {country}")

        # Construction des données du drama
        drama_data = {
            "title": title,
            "poster_url": poster_url,
            "synopsis": synopsis,
            "genres": genres,
            "year": year,
            "country": country,
            "source": "dramacool",
            "source_url": drama_url,
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        }
        return drama_data
    except Exception as e:
        logger.error(f"Erreur lors de l'extraction des détails pour {drama_url}: {str(e)}")
        logger.exception(e)
        return None

def get_recently_added_dramas(page_count=5):
    """Récupère les dramas récemment ajoutés depuis Dramacool"""
    drama_urls = set()  # Utiliser un set pour éviter les doublons
    
    # Explorer chaque catégorie
    for category_name, category_url in CATEGORIES.items():
        if len(drama_urls) >= MIN_ITEMS * 2:  # 2x pour compenser les erreurs potentielles
            break
            
        logger.info(f"Exploration de la catégorie {category_name}: {category_url}")
        
        html = fetch_page(category_url)
        if not html:
            continue
            
        soup = BeautifulSoup(html, 'html.parser')
        
        # Extraction des liens vers les dramas
        drama_item_selectors = [
            'ul.list-episode-item li a',
            'div.items div.item a',
            'div.drama-list div.drama a',
            'div.list-drama div.item a',
        ]
        
        for selector in drama_item_selectors:
            drama_items = soup.select(selector)
            if drama_items:
                logger.info(f"Trouvé {len(drama_items)} dramas avec le sélecteur '{selector}'")
                
                for item in drama_items:
                    url = item.get('href')
                    if url and ('/drama-detail/' in url or '/watch/' in url):
                        if not url.startswith(('http://', 'https://')):
                            url = urljoin(BASE_URL, url)
                        
                        # Vérifier que c'est bien une page de détails et non un épisode
                        if not re.search(r'episode-\d+', url):
                            drama_urls.add(url)
                
                # Si on a trouvé des dramas, pas besoin de chercher avec d'autres sélecteurs
                if drama_items:
                    break
        
        logger.info(f"Trouvé {len(drama_urls)} dramas sur {category_url}")
        
        # Explorer les pages suivantes
        for page in range(2, page_count + 1):
            if len(drama_urls) >= MIN_ITEMS * 2:
                break
                
            # Différents formats de pagination
            pagination_formats = [
                f"{category_url}page/{page}/",
                f"{category_url}?page={page}",
                f"{category_url}&page={page}"
            ]
            
            for page_url in pagination_formats:
                logger.info(f"Exploration de la pagination: {page_url}")
                
                page_html = fetch_page(page_url)
                if not page_html:
                    continue
                    
                page_soup = BeautifulSoup(page_html, 'html.parser')
                
                count_before = len(drama_urls)
                
                for selector in drama_item_selectors:
                    page_items = page_soup.select(selector)
                    if page_items:
                        for item in page_items:
                            url = item.get('href')
                            if url and ('/drama-detail/' in url or '/watch/' in url):
                                if not url.startswith(('http://', 'https://')):
                                    url = urljoin(BASE_URL, url)
                                
                                # Vérifier que c'est bien une page de détails et non un épisode
                                if not re.search(r'episode-\d+', url):
                                    drama_urls.add(url)
                        break
                
                new_count = len(drama_urls) - count_before
                logger.info(f"Trouvé {new_count} nouveaux dramas sur {page_url}")
                
                # Si la page a apporté de nouveaux dramas, ce format de pagination fonctionne
                if new_count > 0:
                    break
    
    logger.info(f"Total: {len(drama_urls)} URLs de dramas uniques trouvées")
    return list(drama_urls)

def scrape_and_upload_dramas():
    """Processus principal: scraping et upload vers Supabase"""
    global scraped_ids, scraped_titles
    
    # Initialisation des collections pour suivre les éléments scrapés
    scraped_ids = set()
    scraped_titles = set()
    
    # Récupération des URLs des dramas
    drama_urls = get_recently_added_dramas()
    
    # Récupération des dramas existants pour éviter les doublons
    existing_dramas = supabase_db.get_existing_content('dramacool', 'dramas')
    existing_titles = {drama['title'].lower() for drama in existing_dramas if 'title' in drama}
    existing_ids = {drama['id'] for drama in existing_dramas if 'id' in drama}
    
    # Mise à jour de nos collections avec les dramas existants
    scraped_ids.update(existing_ids)
    scraped_titles.update(existing_titles)
    
    # Mise à jour avec les IDs et titres déjà vus par d'autres scrapers
    if seen_ids:
        scraped_ids.update(seen_ids)
    if seen_titles:
        scraped_titles.update(seen_titles)
    
    logger.info(f"Début du scraping de {len(drama_urls)} dramas depuis Dramacool")
    
    # Enregistrement de la session de scraping
    session_id = supabase_db.log_scraping_session('dramas', 'dramacool')
    
    start_time = time.time()
    scraped_count = 0
    error_count = 0
    
    # Pour chaque URL de drama, on récupère les détails et on les sauvegarde
    for i, drama_url in enumerate(drama_urls, 1):
        try:
            logger.info(f"Traitement du drama {i}/{len(drama_urls)}: {drama_url}")
            
            drama_data = extract_drama_details(drama_url)
            
            if not drama_data:
                continue
                
            # Vérifier si ce drama a déjà été vu (par titre)
            drama_title = drama_data.get('title', '').lower()
            if drama_title in scraped_titles:
                logger.info(f"Drama '{drama_data.get('title')}' déjà scrapé, ignoré")
                continue
                
            # Télécharger et sauvegarder l'image du poster si disponible
            poster_url = drama_data.get('poster_url')
            if poster_url:
                try:
                    image_path = download_and_upload_image(poster_url, 'drama')
                    if image_path:
                        drama_data['image_url'] = image_path
                except Exception as e:
                    logger.error(f"Erreur lors du téléchargement/upload de l'image {poster_url}: {str(e)}")
            
            # Ajout des informations de source
            drama_data['source'] = 'dramacool'
            drama_data['source_url'] = drama_url
            
            # Sauvegarde dans Supabase
            result = supabase_db.store_content('dramas', drama_data)
            
            if result and result.get('id'):
                scraped_count += 1
                scraped_ids.add(result.get('id'))
                scraped_titles.add(drama_title)
                logger.info(f"Drama '{drama_data.get('title')}' enregistré avec succès ({scraped_count}/{len(drama_urls)})")
                
        except Exception as e:
            error_count += 1
            logger.error(f"Erreur lors du traitement de {drama_url}: {str(e)}")
            logger.exception(e)
    
    # Mise à jour du log de scraping avec les résultats
    execution_time = time.time() - start_time
    supabase_db.update_scraping_log(session_id, {
        'items_scraped': scraped_count,
        'errors': error_count,
        'execution_time': execution_time
    })
    
    logger.info(f"Fin du scraping: {scraped_count} dramas récupérés, {error_count} erreurs")
    logger.info(f"Durée totale: {execution_time:.2f} secondes")
    
    # Génération du rapport de scraping
    report = {
        'source': 'dramacool',
        'category': 'dramas',
        'date': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        'items_scraped': scraped_count,
        'errors': error_count,
        'execution_time': execution_time,
        'session_id': session_id
    }
    
    # Enregistrement du rapport dans un fichier JSON
    log_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'logs')
    os.makedirs(log_dir, exist_ok=True)
    report_file = os.path.join(log_dir, f"dramacool_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json")
    
    with open(report_file, 'w', encoding='utf-8') as f:
        json.dump(report, f, indent=2, ensure_ascii=False)
    
    logger.info(f"Rapport généré: {report_file}")
    
    # Vérification de l'objectif minimum
    if scraped_count < MIN_ITEMS:
        logger.warning(f"⚠️ Objectif non atteint: {scraped_count}/{MIN_ITEMS} dramas récupérés")
    
    return scraped_count

# Point d'entrée principal
if __name__ == "__main__":
    # Lancement du scraping
    scrape_and_upload_dramas()
