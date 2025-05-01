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
BASE_URL = "https://v6.voiranime.com"
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
    "recent": f"{BASE_URL}/nouveaux-ajouts/",
    "liste": f"{BASE_URL}/liste-danimes/",
    "action": f"{BASE_URL}/anime-genre/action/",
    "adventure": f"{BASE_URL}/anime-genre/adventure/",
    "comedy": f"{BASE_URL}/anime-genre/comedy/",
    "drama": f"{BASE_URL}/anime-genre/drama/",
    "ecchi": f"{BASE_URL}/anime-genre/ecchi/",
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
    logger.info(f"Extraction des détails de l'animé: {anime_url}")
    
    try:
        html = fetch_page(anime_url)
        
        if not html:
            logger.error(f"Impossible de récupérer la page {anime_url}")
            return None
            
        soup = BeautifulSoup(html, 'html.parser')
        
        # Extraction du titre
        title_tag = soup.select_one('div.post-title h1') or soup.select_one('h1.entry-title')
        title = title_tag.text.strip() if title_tag else ""
        
        if not title:
            logger.warning(f"Titre non trouvé pour {anime_url}")
            return None
            
        logger.info(f"Titre trouvé: {title}")
        
        # Extraction de l'image du poster
        poster_tag = soup.select_one('div.summary_image img') or soup.select_one('div.thumb img')
        poster_url = poster_tag.get('src') or poster_tag.get('data-src') or "" if poster_tag else ""
        
        # Extraction de la description
        description_tag = soup.select_one('div.description-summary div.summary__content') or soup.select_one('div.summary__content')
        description = ""
        if description_tag:
            # Supprimer les balises script et style
            for script in description_tag.select('script, style'):
                script.decompose()
            description = description_tag.text.strip()
        
        # Extraction des genres
        genres = []
        genres_tags = soup.select('div.genres-content a') or soup.select('div.generes a')
        for tag in genres_tags:
            genre = tag.text.strip()
            if genre:
                genres.append(genre)
                
        # Extraction de la note
        rating_tag = soup.select_one('div.post-rating span.score') or soup.select_one('div.rating span.total_votes')
        rating = 0.0
        if rating_tag:
            try:
                rating_text = rating_tag.text.strip().replace(',', '.')
                rating = float(rating_text)
            except ValueError:
                logger.warning(f"Impossible de convertir la note: {rating_tag.text}")
                
        # Extraction de l'année
        year = 0
        year_tag = soup.select_one('div.post-content_item:contains("Année") span.summary-content') or soup.select_one('div.post-content_item:contains("Date de sortie") span.summary-content')
        if year_tag:
            year_text = year_tag.text.strip()
            # Extraction de l'année (4 chiffres)
            year_match = re.search(r'\b(19|20)\d{2}\b', year_text)
            if year_match:
                year = int(year_match.group(0))
                
        # Extraction du statut
        status_tag = soup.select_one('div.post-content_item:contains("Statut") span.summary-content') or soup.select_one('div.post-status span.summary-content')
        status = status_tag.text.strip() if status_tag else "Inconnu"
        
        # Extraction du type (TV, OVA, etc.)
        type_tag = soup.select_one('div.post-content_item:contains("Type") span.summary-content') or soup.select_one('div.post-content_item:contains("Format") span.summary-content')
        anime_type = type_tag.text.strip() if type_tag else "TV"
        
        # Création du modèle de données
        anime_data = create_drama_model(
            title=title,
            original_title="",  # Pas disponible sur VoirAnime
            description=description,
            poster=poster_url,
            backdrop="",  # Pas disponible sur VoirAnime
            genres=genres,
            tags=[],  # Pas disponible sur VoirAnime
            year=year,
            status=status,
            type=anime_type,
            rating=rating,
            source_url=anime_url,
            source="voiranime"
        )
        
        logger.info(f"Détails extraits avec succès pour {title}")
        return anime_data
        
    except Exception as e:
        logger.error(f"Erreur lors de l'extraction des détails de {anime_url}: {str(e)}")
        logger.exception(e)
        return None

def get_recently_added_animes(page_count=5):
    """Récupère les animés récemment ajoutés depuis VoirAnime"""
    logger.info(f"Récupération des animés récemment ajoutés (jusqu'à {page_count} pages)")
    
    anime_urls = []
    category_url = CATEGORIES["recent"]
    
    try:
        # Parcours des pages de la catégorie
        for page in range(1, page_count + 1):
            page_url = f"{category_url}?page={page}" if page > 1 else category_url
            logger.info(f"Tentative de récupération: {page_url}")
            html = fetch_page(page_url)
            
            if not html:
                logger.error(f"Échec après {MAX_RETRIES} tentatives pour {page_url}")
                continue
                
            soup = BeautifulSoup(html, 'html.parser')
            
            # Recherche des items d'anime dans la page
            anime_items = soup.select('div.page-listing-item')
            
            if not anime_items:
                logger.warning(f"Aucun animé trouvé sur la page {page_url}")
                # Essayer un autre sélecteur si le premier ne fonctionne pas
                anime_items = soup.select('div.page-item-detail')
                
                if not anime_items:
                    logger.warning("Aucun animé trouvé avec le sélecteur alternatif")
                    continue
            
            logger.info(f"Trouvé {len(anime_items)} animés sur la page {page}")
            
            # Extraction des URLs d'anime
            for item in anime_items:
                # Recherche du lien vers la page de détails de l'anime
                title_tag = item.select_one('h3.h5 a') or item.select_one('h3 a') or item.select_one('a.h5')
                
                if title_tag and title_tag.has_attr('href'):
                    anime_url = title_tag['href']
                    # S'assurer que l'URL est complète
                    if not anime_url.startswith(('http://', 'https://')):
                        anime_url = urljoin(BASE_URL, anime_url)
                        
                    logger.info(f"URL d'animé trouvée: {anime_url}")
                    
                    if anime_url not in anime_urls:
                        anime_urls.append(anime_url)
            
            if page < page_count:
                logger.info(f"Exploration de la page {page+1}: {category_url}?page={page+1}")
                
            # Pause pour éviter de surcharger le serveur
            time.sleep(RATE_LIMIT_DELAY)
                
    except Exception as e:
        logger.error(f"Erreur lors de la récupération des animés récents: {str(e)}")
        logger.exception(e)
        
    logger.info(f"Total d'URLs d'animés récupérées: {len(anime_urls)}")
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
