#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Script de scraping MyDramaList pour FloDrama - Migration Supabase
Ce script extrait les dramas asiatiques depuis MyDramaList et les enregistre dans Supabase.
Exécution recommandée: toutes les 6 heures via GitHub Actions
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
from supabase import create_client, Client
from urllib.parse import urljoin
from dotenv import load_dotenv
from pathlib import Path

# Import de l'utilitaire de stockage Supabase
try:
    from scraping.utils.supabase_storage import download_and_upload_image
    from scraping.utils.supabase_database import supabase_db
    from scraping.utils.data_models import create_drama_model
except ImportError:
    # En cas d'import direct depuis le dossier sources
    import sys
    sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
    from scraping.utils.supabase_storage import download_and_upload_image
    from scraping.utils.supabase_database import supabase_db
    from scraping.utils.data_models import create_drama_model

# Configuration du logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('mydramalist_scraper')

# Chargement des variables d'environnement
load_dotenv()

# Configuration des constantes
BASE_URL = "https://mydramalist.com"
USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.107 Safari/537.36",
]
RATE_LIMIT_DELAY = 3  # secondes entre les requêtes
MAX_RETRIES = 3  # nombre maximal de tentatives en cas d'échec
MIN_ITEMS = int(os.environ.get("MIN_ITEMS", "200"))

# Récupération des variables d'environnement Supabase
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_KEY")  # Utiliser la clé de service
TARGET_TABLE = os.environ.get("TARGET_TABLE", "dramas")
SOURCE_ID = os.environ.get("SOURCE_ID", "mydramalist")

# Nouvelles URLs pour les recherches par pays/région
# Utilise maintenant le système de recherche avancée de MyDramaList
COUNTRY_SEARCH_URLS = {
    "korean": f"{BASE_URL}/search?adv=titles&ty=68,77,83&co=3&so=top",  # Corée
    "japanese": f"{BASE_URL}/search?adv=titles&ty=68,77,83&co=2&so=top",  # Japon
    "chinese": f"{BASE_URL}/search?adv=titles&ty=68,77,83&co=1&so=top",  # Chine
    "taiwanese": f"{BASE_URL}/search?adv=titles&ty=68,77,83&co=4&so=top",  # Taiwan
    "thai": f"{BASE_URL}/search?adv=titles&ty=68,77,83&co=5&so=top",  # Thaïlande
    "recent": f"{BASE_URL}/shows/recently-added"  # Récemment ajoutés
}

# Initialisation du client Supabase
supabase = None

def init_supabase_client():
    """Initialise le client Supabase avec gestion d'erreurs"""
    global supabase
    
    if not (SUPABASE_URL and SUPABASE_KEY):
        logger.error("Les variables d'environnement SUPABASE_URL et SUPABASE_SERVICE_KEY doivent être définies")
        return None
    
    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        logger.info(f"Client Supabase initialisé pour {SUPABASE_URL}")
        return supabase
    except Exception as e:
        logger.error(f"Erreur lors de l'initialisation du client Supabase: {str(e)}")
        return None

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
    for attempt in range(retries):
        try:
            logger.info(f"Récupération de la page: {url} (tentative {attempt+1}/{retries})")
            headers = get_random_headers(referer)
            response = requests.get(url, headers=headers, timeout=15)
            response.raise_for_status()
            
            # Respecter le rate limiting
            time.sleep(RATE_LIMIT_DELAY)
            
            return response.text
        except requests.exceptions.RequestException as e:
            logger.warning(f"Erreur lors de la récupération de {url}: {e}")
            if attempt < retries - 1:
                sleep_time = 2 ** attempt  # Backoff exponentiel
                logger.info(f"Nouvelle tentative dans {sleep_time} secondes...")
                time.sleep(sleep_time)
            else:
                logger.error(f"Échec après {retries} tentatives pour {url}")
                return None

def extract_drama_details(drama_url):
    """Extrait les détails d'un drama à partir de son URL"""
    try:
        logger.info(f"Extraction des détails pour {drama_url}")
        
        # Récupération de la page
        html = fetch_page(drama_url)
        if not html:
            logger.error(f"Impossible de récupérer la page {drama_url}")
            return None
        
        soup = BeautifulSoup(html, 'html.parser')
        
        # Extraction du titre
        title_element = soup.select_one('h1.film-title')
        title = title_element.text.strip() if title_element else "Titre inconnu"
        
        # Extraction du titre original (s'il existe)
        original_title = ""
        title_detail = soup.select_one('p.show-native-title')
        if title_detail:
            original_title = title_detail.text.strip()
        
        # Extraction de l'image du poster
        poster = ""
        poster_element = soup.select_one('div.film-poster img')
        if poster_element and 'src' in poster_element.attrs:
            poster = poster_element['src']
            # Remplacer les miniatures par les images en taille réelle
            poster = poster.replace('_3.jpg', '_1.jpg')
        
        # Extraction de l'image de fond
        backdrop = ""
        backdrop_element = soup.select_one('div.film-cover img')
        if backdrop_element and 'src' in backdrop_element.attrs:
            backdrop = backdrop_element['src']
        
        # Extraction de l'année
        year = None
        year_element = soup.select_one('span.year')
        if year_element:
            year_text = year_element.text.strip()
            year_match = re.search(r'\d{4}', year_text)
            if year_match:
                year = int(year_match.group(0))
        
        # Extraction de la note
        rating = None
        rating_element = soup.select_one('div.score')
        if rating_element:
            rating_text = rating_element.text.strip()
            try:
                rating = float(rating_text)
            except ValueError:
                pass
        
        # Extraction des détails (genres, pays, etc.)
        details = {}
        detail_elements = soup.select('li.list-item.p-a-0')
        
        for element in detail_elements:
            label_element = element.select_one('b.inline')
            if not label_element:
                continue
                
            label = label_element.text.strip().rstrip(':')
            value_element = element.select_one('a, span:not(b)')
            
            if value_element:
                value = value_element.text.strip()
                details[label.lower()] = value
        
        # Extraction du pays
        country = details.get('country') or ""
        
        # Extraction de la langue
        language = detect_language_from_country(country)
        
        # Extraction des genres
        genres = []
        genres_elements = soup.select('li.list-item.p-a-0:has(b:contains("Genre")) a')
        for genre_element in genres_elements:
            genre = genre_element.text.strip()
            if genre:
                genres.append(genre)
        
        # Extraction du nombre d'épisodes
        episodes_count = None
        episodes_text = details.get('episodes')
        if episodes_text:
            try:
                episodes_count = int(episodes_text)
            except ValueError:
                pass
        
        # Extraction de la durée
        duration = None
        duration_text = details.get('duration')
        if duration_text:
            duration_match = re.search(r'(\d+)', duration_text)
            if duration_match:
                try:
                    duration = int(duration_match.group(1))
                except ValueError:
                    pass
        
        # Extraction du statut
        status = details.get('status') or ""
        
        # Extraction du synopsis
        synopsis = ""
        synopsis_element = soup.select_one('div.show-synopsis')
        if synopsis_element:
            synopsis = synopsis_element.text.strip()
        
        # Extraction du réalisateur
        director = ""
        director_elements = soup.select('li.list-item.p-a-0:has(b:contains("Director")) a')
        if director_elements:
            director = director_elements[0].text.strip()
        
        # Extraction du studio
        studio = ""
        studio_elements = soup.select('li.list-item.p-a-0:has(b:contains("Network")) a')
        if studio_elements:
            studio = studio_elements[0].text.strip()
        
        # Extraction des acteurs
        actors = []
        actors_elements = soup.select('ul.list.no-border li.list-item div.text-primary a')
        for actor_element in actors_elements[:10]:  # Limiter à 10 acteurs
            actor = actor_element.text.strip()
            if actor:
                actors.append(actor)
        
        # Création du modèle de données pour le drama
        drama_data = create_drama_model(
            title=title,
            source="mydramalist",
            source_url=drama_url,
            original_title=original_title,
            poster=poster,
            backdrop=backdrop,
            year=year,
            rating=rating,
            language=language,
            description=synopsis[:200] if synopsis else "",  # Description courte
            genres=genres,
            episodes_count=episodes_count,
            duration=duration,
            country=country,
            status=status,
            actors=actors,
            director=director,
            studio=studio,
            synopsis=synopsis,
            image_url=poster  # Par défaut, utiliser le poster comme image principale
        )
        
        return drama_data
        
    except Exception as e:
        logger.error(f"Erreur lors de l'extraction des détails pour {drama_url}: {str(e)}")
        logger.exception(e)
        return None

def detect_language_from_country(country):
    """Détecte la langue en fonction du pays"""
    country_lower = country.lower()
    
    if any(jp in country_lower for jp in ["japon", "japan"]):
        return "ja"
    elif any(cn in country_lower for cn in ["chine", "china", "taiwan", "hong kong"]):
        return "zh"
    elif any(th in country_lower for th in ["thaïlande", "thailand"]):
        return "th"
    elif any(country_match in country_lower for country_match in ["inde", "india"]):
        return "hi"
    else:
        return "ko"  # Par défaut coréen

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

def get_country_drama_urls(search_url, quota, max_pages=10):
    """
    Récupère jusqu'à `quota` URLs de dramas pour une URL de recherche MyDramaList, en parcourant jusqu'à `max_pages` pages.
    Utilise la pagination &page=X et un sélecteur CSS robuste.
    """
    urls = []
    seen = set()
    drama_href_pattern = re.compile(r"^/\d+-[a-z0-9-]+$")
    for page in range(1, max_pages + 1):
        url = f"{search_url}&page={page}" if "&page=" not in search_url else re.sub(r'&page=\d+', f'&page={page}', search_url)
        logger.info(f"[MDL] Récupération page {page}: {url}")
        html = fetch_page(url)
        if not html:
            logger.warning(f"[MDL] Page vide ou erreur pour {url}")
            break
        soup = BeautifulSoup(html, 'html.parser')
        # Sélecteur robuste pour les liens de dramas
        all_links = soup.select('a[href]')
        drama_links = [a for a in all_links if drama_href_pattern.match(a.get('href',''))]
        logger.info(f"[MDL] {len(drama_links)} liens de dramas trouvés sur {url}")
        if not drama_links:
            logger.warning(f"[MDL] Aucun drama trouvé sur {url}, arrêt de la recherche.")
            break
        for a in drama_links:
            link = a.get('href')
            full_url = urljoin(BASE_URL, link)
            if full_url not in seen:
                urls.append(full_url)
                seen.add(full_url)
                logger.info(f"[MDL] + {full_url}")
                if len(urls) >= quota:
                    logger.info(f"[MDL] Quota atteint ({len(urls)}/{quota})")
                    return urls
    return urls

def get_recently_added_dramas(page_count=5):
    """
    Refonte : collecte les URLs de dramas par pays/genre avec pagination robuste et logs détaillés.
    """
    drama_urls = []
    seen_urls = set()
    # Pays/genres principaux
    countries = [
        "korean", "japanese", "chinese", "taiwanese", "thai"
    ]
    quota = MIN_ITEMS // len(countries)
    for country in countries:
        search_url = COUNTRY_SEARCH_URLS[country]
        urls = get_country_drama_urls(search_url, quota, max_pages=10)
        logger.info(f"[MDL:{country}] {len(urls)}/{quota} URLs collectées")
        for u in urls:
            if u not in seen_urls:
                drama_urls.append(u)
                seen_urls.add(u)
    # Compléter si besoin avec la catégorie 'recent'
    if len(drama_urls) < MIN_ITEMS:
        logger.info(f"Complément avec 'recent' ({len(drama_urls)}/{MIN_ITEMS})")
        urls = get_country_drama_urls(COUNTRY_SEARCH_URLS['recent'], MIN_ITEMS - len(drama_urls), max_pages=10)
        for u in urls:
            if u not in seen_urls:
                drama_urls.append(u)
                seen_urls.add(u)
    logger.info(f"[TOTAL] {len(drama_urls)} URLs de dramas collectées.")
    return drama_urls

def scrape_and_upload_dramas():
    """Processus principal: scraping et upload vers Supabase"""
    start_time = time.time()
    
    # Récupération des URLs des dramas
    drama_urls = get_recently_added_dramas()
    
    # Récupération des dramas existants pour éviter les doublons
    existing_dramas = supabase_db.get_existing_content('mydramalist', 'dramas')
    existing_titles = {drama['title'].lower() for drama in existing_dramas if 'title' in drama}
    existing_ids = {drama['id'] for drama in existing_dramas if 'id' in drama}
    
    # Mise à jour de nos collections avec les dramas existants
    scraped_ids.update(existing_ids)
    if seen_titles:
        scraped_titles.update(seen_titles)
    
    # Enregistrement de la session de scraping
    session_id = supabase_db.log_scraping_start('dramas', 'mydramalist')
    
    # Initialisation des compteurs
    total_dramas = len(drama_urls)
    scraped_count = 0
    error_count = 0
    
    logger.info(f"Début du scraping de {total_dramas} dramas depuis MyDramaList")
    
    # Traitement de chaque drama
    for i, drama_url in enumerate(drama_urls, 1):
        try:
            logger.info(f"Traitement du drama {i}/{total_dramas}: {drama_url}")
            
            # Extraction des détails
            drama_data = extract_drama_details(drama_url)
            if not drama_data:
                logger.warning(f"Impossible d'extraire les détails pour {drama_url}")
                continue
            
            # Vérifier si ce drama a déjà été vu (par titre)
            drama_title = drama_data.get('title', '').lower()
            if drama_title in scraped_titles:
                logger.info(f"Drama '{drama_data.get('title')}' déjà scrapé, ignoré")
                continue
            
            # Télécharger et sauvegarder l'image du poster si disponible
            poster_url = drama_data.get('poster')
            if poster_url:
                try:
                    image_path = download_and_upload_image(poster_url, 'drama')
                    if image_path:
                        drama_data['image_url'] = image_path
                except Exception as e:
                    logger.error(f"Erreur lors du téléchargement/upload de l'image {poster_url}: {str(e)}")
            
            # Sauvegarde dans Supabase
            result = supabase_db.store_content('dramas', drama_data)
            
            if result and result.get('id'):
                scraped_count += 1
                scraped_ids.add(result.get('id'))
                scraped_titles.add(drama_title)
                logger.info(f"Drama '{drama_data.get('title')}' enregistré avec succès ({scraped_count}/{total_dramas})")
            
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
        'source': 'mydramalist',
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
    report_file = os.path.join(log_dir, f"mydramalist_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json")
    
    with open(report_file, 'w', encoding='utf-8') as f:
        json.dump(report, f, indent=2, ensure_ascii=False)
    
    logger.info(f"Rapport généré: {report_file}")
    
    # Vérification de l'objectif minimum
    if scraped_count < MIN_ITEMS:
        logger.warning(f"⚠️ Objectif non atteint: {scraped_count}/{MIN_ITEMS} dramas récupérés")
    
    return scraped_count

# Point d'entrée principal
if __name__ == "__main__":
    # Initialisation du client Supabase
    init_supabase_client()
    
    # Lancement du scraping
    scrape_and_upload_dramas()
