#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Script de scraping VoirDrama pour FloDrama - Migration Supabase
Ce script extrait les dramas asiatiques depuis VoirDrama et les enregistre dans Supabase.
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
except ImportError:
    # En cas d'import direct depuis le dossier sources
    import sys
    sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
    from scraping.utils.supabase_storage import download_and_upload_image
    from scraping.utils.supabase_database import supabase_db

# Configuration du logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('voirdrama_scraper')

# Chargement des variables d'environnement
load_dotenv()

# Configuration des constantes
BASE_URL = "https://voirdrama.org"
USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.107 Safari/537.36",
]
RATE_LIMIT_DELAY = 2  # secondes entre les requêtes
MAX_RETRIES = 3  # nombre maximal de tentatives en cas d'échec
MIN_ITEMS = int(os.environ.get("MIN_ITEMS", "200"))  # Minimum d'items à récupérer

# Récupération des variables d'environnement Supabase
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_KEY")  # Utiliser la clé de service
TARGET_TABLE = os.environ.get("TARGET_TABLE", "dramas")
SOURCE_ID = os.environ.get("SOURCE_ID", "voirdrama")

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

def init_supabase_client():
    """Initialise le client Supabase avec gestion d'erreurs"""
    if not SUPABASE_URL or not SUPABASE_KEY:
        logger.error("Les variables d'environnement SUPABASE_URL et SUPABASE_SERVICE_KEY doivent être définies")
        return None
    
    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        logger.info(f"Client Supabase initialisé pour {SUPABASE_URL}")
        return supabase
    except Exception as e:
        logger.error(f"Erreur lors de l'initialisation du client Supabase: {str(e)}")
        return None

def get_random_headers():
    """Génère des en-têtes aléatoires pour les requêtes HTTP"""
    return {
        "User-Agent": random.choice(USER_AGENTS),
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "fr,fr-FR;q=0.8,en-US;q=0.5,en;q=0.3",
        "Referer": BASE_URL,
        "DNT": "1",
        "Connection": "keep-alive",
        "Upgrade-Insecure-Requests": "1",
    }

def fetch_page(url, retries=MAX_RETRIES):
    """Récupère le contenu d'une page avec gestion des erreurs et retries"""
    for attempt in range(retries):
        try:
            logger.info(f"Récupération de la page: {url} (tentative {attempt+1}/{retries})")
            response = requests.get(url, headers=get_random_headers(), timeout=10)
            response.raise_for_status()
            time.sleep(RATE_LIMIT_DELAY)  # Respect du rate limiting
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
    html = fetch_page(drama_url)
    if not html:
        return None
    
    soup = BeautifulSoup(html, 'html.parser')
    
    # Extraction du titre - Nouveaux sélecteurs adaptés à la structure actuelle
    title_elem = None
    
    # Essayer plusieurs sélecteurs pour le titre
    title_selectors = [
        'h1.entry-title',
        'header h1',
        '.entry-title',
        '.post-title h1',
        '.film-name',
        'h1.title',
        '.info-title',
        '.detail-title'
    ]
    
    for selector in title_selectors:
        title_elem = soup.select_one(selector)
        if title_elem:
            break
    
    # Si toujours pas de titre, chercher le premier h1 de la page
    if not title_elem:
        title_elem = soup.find('h1')
    
    title = title_elem.text.strip() if title_elem else "Titre inconnu"
    
    # Ajouter un logging pour déboguer le problème des titres
    logger.info(f"Titre extrait: '{title}' depuis {drama_url}")
    
    # Image du poster - adaptation aux nouveaux sélecteurs
    poster_selectors = [
        '.sheader .poster img',
        '.poster img',
        '.bigcontent .poster img',
        '.entry-content img',
        '.cover img',
        'img.cover',
        'img[src*="poster"]',
        'img[src*="cover"]',
        'img.wp-post-image',
        'img[src*=".jpg"]',
        'img[src*=".png"]'
    ]
    
    poster_url = None
    for selector in poster_selectors:
        poster_elem = soup.select_one(selector)
        if poster_elem and poster_elem.get('src'):
            poster_url = poster_elem.get('src')
            if not poster_url.startswith(('http://', 'https://')):
                poster_url = urljoin(BASE_URL, poster_url)
            break
    
    # Si aucun poster n'est trouvé, vérifier les attributs data-src pour les images lazy-loaded
    if not poster_url:
        lazy_img = soup.select_one('img[data-src]')
        if lazy_img:
            poster_url = lazy_img.get('data-src')
            if not poster_url.startswith(('http://', 'https://')):
                poster_url = urljoin(BASE_URL, poster_url)
    
    if not poster_url:
        logger.warning(f"Aucune image trouvée pour {drama_url}")
    
    # Génération d'un identifiant unique pour le contenu
    content_id = str(uuid.uuid4())
    
    # Téléchargement et upload du poster vers Supabase Storage si disponible
    if poster_url:
        poster = download_and_upload_image(
            image_url=poster_url,
            content_type="drama",
            content_id=content_id,
            image_type="poster"
        )
    else:
        poster = None
    
    # Information de base - adaptation aux nouveaux sélecteurs
    info_div = None
    info_selectors = [
        '.info',
        '.entry-content',
        '.film-info',
        '.drama-details',
        '.content-area'
    ]
    
    for selector in info_selectors:
        info_div = soup.select_one(selector)
        if info_div:
            break
    
    info_text = info_div.text if info_div else ""
    
    # Extraction des métadonnées avec regex améliorés
    year_match = re.search(r'Année:?\s*(\d{4})|(\d{4})\)|Date:?\s*(\d{4})', info_text)
    year = None
    if year_match:
        for group in year_match.groups():
            if group:
                try:
                    year = int(group)
                    break
                except:
                    pass
    
    # Pays d'origine
    country_match = re.search(r'Pays:?\s*([^,\n]+)|Origine:?\s*([^,\n]+)|Nationalité:?\s*([^,\n]+)', info_text)
    country = "Inconnu"
    if country_match:
        for group in country_match.groups():
            if group:
                country = group.strip()
                break
    
    # Langue basée sur le pays
    language = "ko"  # Par défaut coréen
    if "japon" in country.lower() or "japan" in country.lower():
        language = "ja"
    elif "chine" in country.lower() or "china" in country.lower() or "taiwan" in country.lower() or "hong kong" in country.lower():
        language = "zh"
    elif "thaïlande" in country.lower() or "thailand" in country.lower():
        language = "th"
    elif "inde" in country.lower() or "india" in country.lower():
        language = "hi"
    
    # Synopsis
    synopsis_elem = None
    synopsis_selectors = [
        '.entry-content .content',
        '.entry-content p',
        '.synopsis',
        '.film-description',
        '.plot-summary'
    ]
    
    for selector in synopsis_selectors:
        synopsis_elem = soup.select_one(selector)
        if synopsis_elem:
            break
    
    synopsis = ""
    if synopsis_elem:
        synopsis = synopsis_elem.text.strip()
    else:
        # Si pas de contenu spécifique, prendre tout le contenu et filtrer
        all_content = soup.select_one('.entry-content')
        if all_content:
            all_text = all_content.text
            # Extraire le texte entre "Synopsis" et la prochaine section (si elle existe)
            synopsis_match = re.search(r'Synopsis[^\n]*\n(.*?)(?:\n\w+:|$)', all_text, re.DOTALL)
            if synopsis_match:
                synopsis = synopsis_match.group(1).strip()
    
    # Genres
    genres = []
    # Essayer différents sélecteurs pour les genres
    genres_selectors = [
        '.genxed a',
        '.genres a',
        '.entry-content a[href*="genre"]',
        '.tags a',
        '.categories a'
    ]
    
    for selector in genres_selectors:
        genres_elem = soup.select(selector)
        for elem in genres_elem:
            genre = elem.text.strip()
            if genre and genre not in genres:
                genres.append(genre)
    
    # Si aucun genre trouvé avec les sélecteurs, essayer une extraction par regex
    if not genres:
        genres_match = re.search(r'Genres?:?\s*([^,\n]+),?', info_text)
        if genres_match:
            genres_str = genres_match.group(1).strip()
            genres = [g.strip() for g in genres_str.split(',') if g.strip()]
    
    # Nombre d'épisodes
    episodes_match = re.search(r'Épisodes?:?\s*(\d+)|Episodes?:?\s*(\d+)', info_text)
    episodes = None
    if episodes_match:
        for group in episodes_match.groups():
            if group:
                try:
                    episodes = int(group)
                    break
                except:
                    pass
    
    # Statut
    status_match = re.search(r'Statut:?\s*([^,\n]+)|Status:?\s*([^,\n]+)', info_text)
    status = "Inconnu"
    if status_match:
        for group in status_match.groups():
            if group:
                status = group.strip()
                break
    
    # Notation - VoirDrama n'a pas de note explicite, on met une valeur par défaut
    rating = None
    
    # Constitution du dictionnaire final
    drama_data = {
        "id": content_id,
        "title": title,
        "year": year,
        "country": country,
        "language": language,
        "synopsis": synopsis,
        "genres": genres,
        "episodes_count": episodes,
        "status": status,
        "rating": rating,
        "image_url": poster,
        "source_url": drama_url,
        "source": SOURCE_ID,
        "scraped_at": datetime.now().isoformat()
    }
    
    return drama_data

def get_category_drama_urls(category_path, quota, max_pages=10):
    """
    Récupère jusqu'à `quota` URLs de dramas pour une catégorie donnée en parcourant jusqu'à `max_pages` pages.
    Utilise la pagination /page/X/ et sélecteur robuste.
    """
    urls = []
    seen = set()
    for page in range(1, max_pages + 1):
        if page == 1:
            url = urljoin(BASE_URL, category_path)
        else:
            url = urljoin(BASE_URL, category_path.rstrip('/') + f"/page/{page}/")
        logger.info(f"[CAT] Récupération page {page}: {url}")
        html = fetch_page(url)
        if not html:
            logger.warning(f"[CAT] Page vide ou erreur pour {url}")
            break
        soup = BeautifulSoup(html, 'html.parser')
        drama_links = soup.select('h3 a[href*="/drama/"]')
        logger.info(f"[CAT] {len(drama_links)} liens de dramas trouvés sur {url}")
        if not drama_links:
            logger.warning(f"[CAT] Aucun drama trouvé sur {url}, arrêt de la catégorie.")
            break
        for a in drama_links:
            link = a.get('href')
            if link and '/drama/' in link and not re.search(r'/drama/[^/]+/[^/]+', link):
                if not link.startswith('http'):
                    link = urljoin(BASE_URL, link)
                if link not in seen:
                    urls.append(link)
                    seen.add(link)
                    logger.info(f"[CAT] + {link}")
                    if len(urls) >= quota:
                        logger.info(f"[CAT] Quota atteint ({len(urls)}/{quota})")
                        return urls
    return urls


def get_recently_added_dramas(page_count=10):
    """
    Refonte : collecte les URLs de dramas par catégorie avec pagination robuste et logs détaillés.
    """
    drama_urls = []
    seen_urls = set()
    # Catégories principales
    categories = [
        "liste-de-dramas/",
        "categorie/kdrama/",
        "categorie/cdrama/",
        "categorie/tdrama/",
        "categorie/jdrama/",
        "categorie/hdrama/",
        "categorie/thdrama/",
    ]
    quota = MIN_ITEMS // len(categories)
    for cat in categories:
        urls = get_category_drama_urls(cat, quota, max_pages=10)
        logger.info(f"[CAT:{cat}] {len(urls)}/{quota} URLs collectées")
        for u in urls:
            if u not in seen_urls:
                drama_urls.append(u)
                seen_urls.add(u)
    # Compléter si besoin avec la catégorie générale
    if len(drama_urls) < MIN_ITEMS:
        logger.info(f"Complément avec 'liste-de-dramas/' ({len(drama_urls)}/{MIN_ITEMS})")
        urls = get_category_drama_urls('liste-de-dramas/', MIN_ITEMS - len(drama_urls), max_pages=10)
        for u in urls:
            if u not in seen_urls:
                drama_urls.append(u)
                seen_urls.add(u)
    logger.info(f"[TOTAL] {len(drama_urls)} URLs de dramas collectées.")
    return drama_urls

def scrape_and_upload_dramas():
    """Processus principal: scraping et upload vers Supabase"""
    global scraped_ids, scraped_titles
    
    # Initialisation des collections pour suivre les éléments scrapés
    scraped_ids = set()
    scraped_titles = set()
    
    # Récupération des URLs des dramas
    drama_urls = get_recently_added_dramas()
    
    # Récupération des dramas existants pour éviter les doublons
    try:
        existing_dramas = supabase_db.get_existing_content('dramas', 'drama')
        existing_ids = [drama.get('id') for drama in existing_dramas if drama.get('id')]
        existing_titles = [drama.get('title', '').lower() for drama in existing_dramas if drama.get('title')]
        
        logger.info(f"Trouvé {len(existing_dramas)} dramas existants dans la base de données")
        
    except Exception as e:
        logger.error(f"Erreur lors de la récupération des dramas existants: {str(e)}")
        existing_dramas = []
        existing_ids = []
        existing_titles = []
    
    # Mise à jour de nos collections avec les dramas existants
    scraped_ids.update(existing_ids)
    scraped_titles.update(existing_titles)
    
    # Mise à jour avec les IDs et titres déjà vus par d'autres scrapers
    if seen_ids:
        scraped_ids.update(seen_ids)
    if seen_titles:
        scraped_titles.update(seen_titles)
    
    logger.info(f"Début du scraping de {len(drama_urls)} dramas depuis VoirDrama")
    
    # Enregistrement de la session de scraping
    session_id = supabase_db.log_scraping_start('dramas', 'voirdrama')
    
    start_time = time.time()
    scraped_count = 0
    error_count = 0
    
    # Pour chaque URL de drama, on récupère les détails et on les sauvegarde
    for i, drama_url in enumerate(drama_urls, 1):
        try:
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
                    image_path = supabase_storage.download_and_upload_image(poster_url, 'drama')
                    if image_path:
                        drama_data['image_url'] = image_path
                except Exception as e:
                    logger.error(f"Erreur lors du téléchargement/upload de l'image {poster_url}: {str(e)}")
            
            # Ajout des informations de source
            drama_data['source'] = 'voirdrama'
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
        'source': 'voirdrama',
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
    report_file = os.path.join(log_dir, f"voirdrama_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json")
    
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
    supabase_db.initialize_client()
    
    # Lancement du scraping
    scrape_and_upload_dramas()
