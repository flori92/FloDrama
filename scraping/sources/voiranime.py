#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Script de scraping VoirAnime pour FloDrama - Migration Supabase
Ce script extrait les animés depuis VoirAnime et les enregistre dans Supabase.
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
    from scraping.utils.data_models import create_drama_model
except ImportError:
    # En cas d'import direct depuis le dossier sources
    import sys
    sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
    from scraping.utils.supabase_storage import download_and_upload_image
    from scraping.utils.supabase_database import supabase_database as supabase_db
    from scraping.utils.data_models import create_drama_model

# Configuration du logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('voiranime_scraper')

# Chargement des variables d'environnement
load_dotenv()

# Configuration des constantes
BASE_URL = "https://voiranime.com"
USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.107 Safari/537.36",
]
RATE_LIMIT_DELAY = 3  # secondes entre les requêtes
MAX_RETRIES = 3  # nombre maximal de tentatives en cas d'échec
MIN_ITEMS = int(os.environ.get("MIN_ITEMS", "200"))

# Catégories d'animés sur VoirAnime
CATEGORIES = {
    "recent": f"{BASE_URL}/animes/",
    "popular": f"{BASE_URL}/animes/",
    "movies": f"{BASE_URL}/films/",
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
    
    # S'assurer que l'URL utilise le bon domaine
    url = url.replace("v6.voiranime.com", "voiranime.com")
    
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
        html_content = fetch_page(anime_url)
        if not html_content:
            return None
            
        soup = BeautifulSoup(html_content, 'html.parser')
        
        # Extraction du titre
        title_element = soup.select_one('h1.title')
        if not title_element:
            title_element = soup.select_one('h1.entry-title')
        if not title_element:
            logger.warning(f"Titre non trouvé pour {anime_url}")
            return None
            
        title = title_element.text.strip()
        
        # Extraction de l'image du poster
        poster_element = soup.select_one('.poster img')
        if not poster_element:
            poster_element = soup.select_one('.thumb img')
        poster_url = poster_element['src'] if poster_element and 'src' in poster_element.attrs else ""
        
        # Extraction de la description
        description_element = soup.select_one('.synopsis')
        if not description_element:
            description_element = soup.select_one('.entry-content')
        description = description_element.text.strip() if description_element else ""
        
        # Extraction des informations supplémentaires
        info_elements = soup.select('.info .info-item')
        if not info_elements:
            info_elements = soup.select('.anime-info .info-item')
        
        # Initialisation des valeurs par défaut
        year = None
        genres = []
        status = ""
        episodes_count = None
        studio = ""
        
        for item in info_elements:
            label = item.select_one('.info-label')
            value = item.select_one('.info-value')
            
            if not label or not value:
                continue
                
            label_text = label.text.strip().lower()
            value_text = value.text.strip()
            
            if "année" in label_text:
                try:
                    year = int(value_text)
                except ValueError:
                    year = None
            elif "genres" in label_text:
                genres = [g.strip() for g in value_text.split(',')]
            elif "status" in label_text or "statut" in label_text:
                status = value_text
            elif "épisodes" in label_text:
                try:
                    episodes_count = int(value_text.split()[0])
                except (ValueError, IndexError):
                    episodes_count = None
            elif "studio" in label_text:
                studio = value_text
        
        # Création du modèle de données unifié
        anime_data = create_drama_model(
            title=title,
            source="voiranime",
            source_url=anime_url,
            original_title="",
            poster=poster_url,
            backdrop="",
            year=year,
            rating=None,
            language="Japonais",
            description=description,
            genres=genres,
            episodes_count=episodes_count,
            duration=None,
            country="Japon",
            trailer_url="",
            watch_url=anime_url,
            status=status,
            actors=[],
            director="",
            studio=studio,
            tags=genres,
            popularity=None,
            season=None,
            age_rating="",
            has_subtitles=True,
            is_featured=False,
            is_trending=False,
            synopsis=description
        )
        
        return anime_data
        
    except Exception as e:
        logger.error(f"Erreur lors de l'extraction des détails pour {anime_url}: {str(e)}")
        logger.exception(e)
        return None

def get_recently_added_animes(page_count=5):
    """Récupère les animés récemment ajoutés depuis VoirAnime"""
    anime_urls = []
    seen_urls = set()
    
    # Parcours des catégories
    for category_name, category_url in CATEGORIES.items():
        logger.info(f"Exploration de la catégorie: {category_url}")
        
        # Parcours des pages de la catégorie
        for page in range(1, page_count + 1):
            # Correction du double slash dans l'URL
            page_url = f"{category_url}page/{page}/" if page > 1 else category_url
            # S'assurer que l'URL est correcte
            page_url = page_url.replace("v6.voiranime.com", "voiranime.com")
            logger.info(f"Tentative de récupération: {page_url}")
            html = fetch_page(page_url)
            
            if not html:
                continue
                
            soup = BeautifulSoup(html, 'html.parser')
            
            # Extraction des liens vers les animés - mise à jour des sélecteurs
            anime_links = soup.select('div.anime-item a.anime-title')
            if not anime_links:
                anime_links = soup.select('article.post h2.entry-title a')
            if not anime_links:
                anime_links = soup.select('div.item a.title')
            
            if not anime_links:
                logger.warning(f"Aucun lien d'animé trouvé sur {page_url}")
                continue
                
            logger.info(f"Trouvé {len(anime_links)} liens d'animés sur {page_url}")
            
            # Ajout des URLs uniques
            for link in anime_links:
                anime_url = link.get('href')
                # S'assurer que l'URL utilise le bon domaine
                if anime_url:
                    anime_url = anime_url.replace("v6.voiranime.com", "voiranime.com")
                    if anime_url not in seen_urls:
                        seen_urls.add(anime_url)
                        anime_urls.append(anime_url)
            
            if page < page_count:
                logger.info(f"Exploration de la page {page+1}: {category_url}page/{page+1}/")
                
            # Pause pour éviter de surcharger le serveur
            time.sleep(RATE_LIMIT_DELAY)
    
    logger.info(f"Total: {len(anime_urls)} URLs d'animés uniques trouvées")
    return anime_urls

def scrape_and_upload_animes():
    """Processus principal: scraping et upload vers Supabase"""
    # Récupération des URLs d'animés
    anime_urls = get_recently_added_animes()
    
    if not anime_urls:
        logger.warning("Aucun animé trouvé pour le scraping")
        return 0
        
    logger.info(f"Total: {len(anime_urls)} URLs d'animés uniques trouvées")
    
    # Récupération des contenus existants pour éviter les doublons
    existing_content = supabase_db.get_existing_content('animes', 'voiranime')
    existing_ids = set()
    existing_titles = set()
    
    if existing_content:
        existing_ids = {item.get('id') for item in existing_content if item.get('id')}
        existing_titles = {item.get('title', '').lower() for item in existing_content if item.get('title')}
        
        logger.info(f"Contenu existant: {len(existing_ids)} IDs, {len(existing_titles)} titres")
        
    # Mise à jour des sets de suivi
    scraped_ids.update(existing_ids)
    scraped_titles.update(existing_titles)
    
    # Mise à jour avec les IDs et titres déjà vus par d'autres scrapers
    if seen_ids:
        scraped_ids.update(seen_ids)
    if seen_titles:
        scraped_titles.update(seen_titles)
    
    logger.info(f"Début du scraping de {len(anime_urls)} animés depuis VoirAnime")
    
    # Enregistrement de la session de scraping
    session_id = supabase_db.log_scraping_start('animes', 'voiranime')
    
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
            poster_url = anime_data.get('poster')
            if poster_url:
                try:
                    image_path = download_and_upload_image(poster_url, 'anime')
                    if image_path:
                        anime_data['poster'] = image_path
                except Exception as e:
                    logger.error(f"Erreur lors du téléchargement/upload de l'image {poster_url}: {str(e)}")
            
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
        'items_count': scraped_count,
        'errors_count': error_count,
        'duration': execution_time
    })
    
    logger.info(f"Fin du scraping: {scraped_count} animés récupérés, {error_count} erreurs")
    logger.info(f"Durée totale: {execution_time:.2f} secondes")
    
    # Génération du rapport de scraping
    report = {
        'source': 'voiranime',
        'category': 'animes',
        'date': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        'items_count': scraped_count,
        'errors_count': error_count,
        'duration': execution_time,
        'session_id': session_id
    }
    
    # Enregistrement du rapport dans un fichier JSON
    log_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'logs')
    os.makedirs(log_dir, exist_ok=True)
    report_file = os.path.join(log_dir, f"voiranime_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json")
    
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
