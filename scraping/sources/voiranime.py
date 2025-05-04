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
    from scraping.utils.data_models import create_anime_model
except ImportError:
    # En cas d'import direct depuis le dossier sources
    import sys
    sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
    from scraping.utils.supabase_storage import download_and_upload_image
    from scraping.utils.supabase_database import supabase_database as supabase_db
    from scraping.utils.data_models import create_anime_model

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

# Catégories disponibles sur VoirAnime
CATEGORIES = {
    "recent": f"{BASE_URL}/nouveaux-ajouts/",
    "all": f"{BASE_URL}/liste-danimes/",
    "action": f"{BASE_URL}/anime-genre/action/",
    "adventure": f"{BASE_URL}/anime-genre/aventure/",
    "comedy": f"{BASE_URL}/anime-genre/comedie/",
    "drama": f"{BASE_URL}/anime-genre/drame/",
    "ecchi": f"{BASE_URL}/anime-genre/ecchi/",
    "fantasy": f"{BASE_URL}/anime-genre/fantaisie/",
    "horror": f"{BASE_URL}/anime-genre/horreur/",
    "mahou_shoujo": f"{BASE_URL}/anime-genre/mahou-shoujo/",
    "mecha": f"{BASE_URL}/anime-genre/mecha/",
    "music": f"{BASE_URL}/anime-genre/musique/",
    "mystery": f"{BASE_URL}/anime-genre/mystere/",
    "psychological": f"{BASE_URL}/anime-genre/psychologique/",
    "romance": f"{BASE_URL}/anime-genre/romance/",
    "sci_fi": f"{BASE_URL}/anime-genre/sci-fi/",
    "slice_of_life": f"{BASE_URL}/anime-genre/tranche-de-vie/",
    "sports": f"{BASE_URL}/anime-genre/sports/",
    "supernatural": f"{BASE_URL}/anime-genre/surnaturel/",
    "thriller": f"{BASE_URL}/anime-genre/thriller/",
}

# Quotas par genre (nombre d'animes à récupérer par genre)
GENRE_QUOTAS = {
    "action": 50,
    "adventure": 50,
    "comedy": 30,
    "drama": 50,
    "ecchi": 20,
    "fantasy": 50,
    "horror": 20,
    "mahou_shoujo": 10,
    "mecha": 20,
    "music": 10,
    "mystery": 20,
    "psychological": 20,
    "romance": 30,
    "sci_fi": 30,
    "slice_of_life": 20,
    "sports": 10,
    "supernatural": 20,
    "thriller": 20,
    # La catégorie "recent" n'a pas de quota spécifique car elle est utilisée pour compléter
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

def extract_anime_details(url):
    """Extrait les détails d'un animé depuis sa page VoirAnime"""
    logger.info(f"Extraction des détails de l'animé: {url}")
    
    html = fetch_page(url)
    if not html:
        logger.error(f"Impossible de récupérer la page {url}")
        return None
        
    soup = BeautifulSoup(html, 'html.parser')
    
    # Extraction du titre
    title_tag = soup.select_one('div.post-title h1') or soup.select_one('h1.entry-title')
    if not title_tag:
        logger.error(f"Titre non trouvé pour {url}")
        return None
        
    title = title_tag.text.strip()
    logger.info(f"Titre trouvé: {title}")
    
    # Extraction de l'image
    poster = ""
    if img_tag := (soup.select_one('div.summary_image img') or soup.select_one('div.thumb img')):
        if img_tag.has_attr('src'):
            poster = img_tag['src']
        elif img_tag.has_attr('data-src'):
            poster = img_tag['data-src']
        elif img_tag.has_attr('data-lazy-src'):
            poster = img_tag['data-lazy-src']
        
    # Extraction de la description
    description = ""
    description_tag = soup.select_one('div.description-summary div.summary__content') or soup.select_one('div.summary__content')
    if description_tag:
        description = description_tag.text.strip()
        
    # Extraction des informations supplémentaires
    info_dict = {}
    
    # Recherche des tableaux d'informations
    info_tables = soup.select('div.post-content_item')
    
    for table in info_tables:
        label_tag = table.select_one('div.summary-heading h5') or table.select_one('div.summary-heading')
        if not label_tag:
            continue
            
        label = label_tag.text.strip().lower()
        value_tag = table.select_one('div.summary-content') or table.select_one('div.summary-content a')
        
        if not value_tag:
            continue
            
        value = value_tag.text.strip()
        
        # Traitement spécifique selon le type d'information
        if "alternative" in label or "alternatif" in label:
            info_dict["original_title"] = value
        elif "année" in label or "annee" in label or "year" in label:
            try:
                info_dict["year"] = int(value)
            except ValueError:
                # Essayer d'extraire l'année d'une chaîne comme "Automne 2023"
                if year_match := re.search(r'(\d{4})', value):
                    info_dict["year"] = int(year_match[1])
        elif "statut" in label or "status" in label:
            info_dict["status"] = value
        elif "studio" in label:
            info_dict["studio"] = value
        elif "durée" in label or "duree" in label or "duration" in label:
            # Extraction de la durée en minutes
            duration_match = re.search(r'(\d+)', value)
            if duration_match:
                info_dict["duration"] = int(duration_match[1])
        elif "genre" in label:
            # Extraction des genres
            genres = [g.strip() for g in value.split(',')]
            info_dict["genres"] = genres
        elif "score" in label or "note" in label or "rating" in label:
            # Extraction de la note
            if rating_match := re.search(r'(\d+[,.]?\d*)', value):
                try:
                    rating = float(rating_match[1].replace(',', '.'))
                    info_dict["rating"] = min(10.0, rating)  # Limiter à 10
                except ValueError:
                    pass
        elif "saison" in label or "season" in label:
            # Extraction de la saison
            season_match = re.search(r'(\d+)', value)
            if season_match:
                info_dict["season"] = int(season_match[1])
        elif "épisode" in label or "episode" in label:
            # Extraction du nombre d'épisodes avec opérateur walrus et notation m[x]
            if episodes_match := re.search(r'(\d+)', value):
                info_dict["episodes_count"] = int(episodes_match[1])
    
    # Extraction des tags (mots-clés)
    tags = []
    tags_container = soup.select_one('div.genres-content') or soup.select_one('div.tags-content')
    
    if tags_container:
        tag_links = tags_container.select('a')
        for tag_link in tag_links:
            tag = tag_link.text.strip()
            if tag and tag not in tags:
                tags.append(tag)
    
    # Si aucun genre n'a été trouvé mais qu'on a des tags, utiliser les tags comme genres
    if not info_dict.get("genres") and tags:
        info_dict["genres"] = tags[:5]  # Limiter à 5 genres
    
    # Si on n'a toujours pas de genres, ajouter un genre par défaut
    if not info_dict.get("genres"):
        info_dict["genres"] = ["Animation"]
    
    # Extraction de l'URL de la bande-annonce
    trailer_url = ""
    iframe = soup.select_one('div.summary__content iframe') or soup.select_one('div.summary-content iframe')
    if iframe and iframe.has_attr('src'):
        trailer_src = iframe['src']
        if 'youtube' in trailer_src or 'youtu.be' in trailer_src:
            trailer_url = trailer_src
    
    # Création du modèle de données
    try:
        anime_data = create_anime_model(
            title=title,
            source="voiranime",
            source_url=url,
            original_title=info_dict.get("original_title", ""),
            poster=poster,
            backdrop="",  # Pas de backdrop disponible
            year=info_dict.get("year"),
            rating=info_dict.get("rating"),
            language="Japonais",  # Par défaut pour les animes
            description=description,
            genres=info_dict.get("genres", []),
            episodes_count=info_dict.get("episodes_count"),
            duration=info_dict.get("duration"),
            country="Japon",  # Par défaut pour les animes
            trailer_url=trailer_url,
            watch_url=url,
            status=info_dict.get("status", ""),
            actors=[],  # Pas d'acteurs pour les animes
            director="",  # Pas de réalisateur spécifié
            studio=info_dict.get("studio", ""),
            tags=tags,
            popularity=None,
            season=info_dict.get("season"),
            age_rating="",  # Pas d'information sur l'âge
            has_subtitles=True,  # Par défaut
            is_featured=False,
            is_trending=False,
            synopsis=description,  # Duplication pour compatibilité
            image_url=poster  # Duplication pour compatibilité
        )
        
        logger.info(f"Détails extraits avec succès pour {title}")
        return anime_data
        
    except Exception as e:
        logger.error(f"Erreur lors de la création du modèle pour {title}: {str(e)}")
        logger.exception(e)
        return None

def get_genre_anime_urls(genre, quota, max_pages=10):
    """
    Récupère jusqu’à `quota` URLs d’animes pour un genre donné en parcourant jusqu’à `max_pages` pages.
    Utilise la pagination /page/X/ et des sélecteurs robustes.
    """
    urls = []
    seen = set()
    base_url = CATEGORIES[genre]
    logger.info(f"[GENRE] {genre} | Quota : {quota} | URL : {base_url}")
    for page in range(1, max_pages + 1):
        url = base_url if page == 1 else base_url.rstrip('/') + f"/page/{page}/"
        logger.info(f"[GENRE:{genre}] Récupération page {page} : {url}")
        try:
            html = fetch_page(url)
            if not html:
                logger.warning(f"[GENRE:{genre}] Page vide ou erreur pour {url}")
                break
            soup = BeautifulSoup(html, 'html.parser')
            # Essayer plusieurs sélecteurs pour trouver les blocs d’anime
            anime_blocks = (
                soup.select('div.page-listing-item') or
                soup.select('div.page-item-detail') or
                soup.select('div.item') or
                soup.select('div.post') or
                soup.select('div.post-row')
            )
            logger.info(f"[GENRE:{genre}] {len(anime_blocks)} blocs d’anime trouvés sur {url}")
            if not anime_blocks:
                logger.warning(f"[GENRE:{genre}] Aucun bloc d’anime trouvé sur {url}, arrêt du genre.")
                break
            for block in anime_blocks:
                # Chercher le lien dans différents patterns
                link = None
                for sel in [
                    'h3.h5 a', 'h3 a', 'a.h5', 'a.post-title', 'a[href*="/anime/"]', 'a'
                ]:
                    a = block.select_one(sel)
                    if a and a.has_attr('href') and '/anime/' in a['href']:
                        link = a['href']
                        break
                if link:
                    if not link.startswith('http'):
                        link = urljoin(BASE_URL, link)
                    if link not in seen:
                        urls.append(link)
                        seen.add(link)
                        logger.info(f"[GENRE:{genre}] + {link}")
                        if len(urls) >= quota:
                            logger.info(f"[GENRE:{genre}] Quota atteint ({len(urls)}/{quota})")
                            return urls
        except Exception as e:
            logger.error(f"[GENRE:{genre}] Erreur sur {url} : {str(e)}")
            logger.exception(e)
            break
    return urls


def get_recently_added_animes(page_count=50):
    """
    Refonte : collecte les URLs d’animes par genre avec pagination robuste et logs détaillés.
    Complète avec la catégorie 'recent' si besoin.
    """
    anime_urls = []
    seen_urls = set()
    # Utiliser les quotas par genre
    for genre, quota in GENRE_QUOTAS.items():
        if genre not in CATEGORIES:
            logger.warning(f"Genre {genre} non trouvé dans les catégories disponibles")
            continue
        urls = get_genre_anime_urls(genre, quota, max_pages=10)
        logger.info(f"[GENRE:{genre}] {len(urls)}/{quota} URLs collectées")
        for u in urls:
            if u not in seen_urls:
                anime_urls.append(u)
                seen_urls.add(u)
    # Compléter avec la catégorie recent si besoin
    if len(anime_urls) < MIN_ITEMS:
        logger.info(f"Complément avec 'recent' ({len(anime_urls)}/{MIN_ITEMS})")
        recent_urls = get_genre_anime_urls('recent', MIN_ITEMS - len(anime_urls), max_pages=10)
        for u in recent_urls:
            if u not in seen_urls:
                anime_urls.append(u)
                seen_urls.add(u)
    logger.info(f"[TOTAL] {len(anime_urls)} URLs d’animes collectées.")
    return anime_urls

def scrape_and_upload_animes():
    """Processus principal: scraping et upload vers Supabase"""
    logger.info("Démarrage du processus de scraping VoirAnime")
    
    # Récupération des animés récemment ajoutés
    anime_urls = get_recently_added_animes(page_count=50)
    
    if not anime_urls:
        logger.error("Aucune URL d'animé récupérée, arrêt du processus")
        return 0
        
    # Récupération des IDs et titres déjà existants dans Supabase
    existing_ids = set()
    existing_titles = set()
    
    try:
        # Récupération des animés existants depuis Supabase
        if existing_animes := supabase_db.get_existing_content('animes', 'voiranime'):
            for anime in existing_animes:
                if 'id' in anime:
                    existing_ids.add(anime['id'])
                if 'title' in anime:
                    existing_titles.add(anime['title'].lower())
                    
            logger.info(f"Trouvé {len(existing_animes)} animés existants dans Supabase")
    except Exception as e:
        logger.error(f"Erreur lors de la récupération des animés existants: {str(e)}")
        
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
    
    # Liste des champs problématiques à supprimer du modèle de données
    problematic_fields = ['episodes_count', 'image_url', 'scraped_at', 'synopsis']
    
    # Pour chaque URL d'animé, on récupère les détails et on les sauvegarde
    for i, anime_url in enumerate(anime_urls, 1):
        try:
            logger.info(f"Traitement de l'animé {i}/{len(anime_urls)}: {anime_url}")
            
            # Extraction des détails de l'animé
            anime_data = extract_anime_details(anime_url)
            
            if not anime_data:
                logger.warning(f"Aucune donnée extraite pour {anime_url}")
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
            
            # Supprimer les champs problématiques du modèle de données
            for field in problematic_fields:
                if field in anime_data:
                    del anime_data[field]
            
            # Sauvegarde dans Supabase
            try:
                result = supabase_db.store_content('animes', anime_data)
                
                if result and result.get('id'):
                    scraped_count += 1
                    scraped_ids.add(result.get('id'))
                    scraped_titles.add(anime_title)
                    logger.info(f"Animé '{anime_data.get('title')}' enregistré avec succès ({scraped_count}/{MIN_ITEMS})")
                    
                    # Si on a atteint l'objectif, on peut s'arrêter
                    if scraped_count >= MIN_ITEMS:
                        logger.info(f"Objectif atteint: {scraped_count}/{MIN_ITEMS} animés récupérés")
                        break
            except Exception as e:
                error_count += 1
                logger.error(f"Erreur lors du stockage de l'animé '{anime_data.get('title')}': {str(e)}")
                
                # Si l'erreur contient un message sur un champ manquant, on l'ajoute à la liste des champs problématiques
                error_message = str(e)
                if "Could not find the" in error_message and "column" in error_message:
                    # Extraction du nom du champ problématique
                    import re
                    field_match = re.search(r"Could not find the '([^']+)' column", error_message)
                    if field_match and field_match[1] not in problematic_fields:
                        new_field = field_match[1]
                        problematic_fields.append(new_field)
                        logger.warning(f"Ajout du champ '{new_field}' à la liste des champs problématiques")
                
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
