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
from datetime import datetime
import requests
from bs4 import BeautifulSoup
import re
from supabase import create_client, Client
from urllib.parse import urljoin

# Configuration du logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('mydramalist_scraper')

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

# Récupération des variables d'environnement
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")
TARGET_TABLE = os.environ.get("TARGET_TABLE", "dramas")
SOURCE_ID = os.environ.get("SOURCE_ID", "mydramalist")

# Initialisation du client Supabase
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

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
    
    # Extraction des informations de base
    title_elem = soup.select_one('h1.film-title')
    title = title_elem.text.strip() if title_elem else "Titre inconnu"
    
    # Image du poster
    poster_elem = soup.select_one('.poster img')
    poster = poster_elem.get('src') if poster_elem else None
    
    # Informations de base
    details_box = soup.select_one('.box-body')
    details_text = details_box.text if details_box else ""
    
    # Extraction des métadonnées avec regex
    year_match = re.search(r'Date de sortie: (\d{4})', details_text)
    year = int(year_match.group(1)) if year_match else None
    
    # Note
    rating_elem = soup.select_one('.score')
    rating = float(rating_elem.text) if rating_elem and rating_elem.text.strip() else None
    
    # Synopsis
    synopsis_elem = soup.select_one('#synopsis')
    synopsis = synopsis_elem.text.strip() if synopsis_elem else ""
    
    # Genres
    genres_elem = soup.select('.genres a')
    genres = [genre.text.strip() for genre in genres_elem] if genres_elem else []
    
    # Episodes
    episodes_match = re.search(r'Épisodes: (\d+)', details_text)
    episodes = int(episodes_match.group(1)) if episodes_match else None
    
    # Pays
    country_elem = soup.select_one('.country a')
    country = country_elem.text.strip() if country_elem else "Corée du Sud"
    
    # Détection de la langue
    language = "ko"  # Par défaut coréen
    if "Japon" in country or "Japan" in country:
        language = "ja"
    elif "Chine" in country or "China" in country or "Taiwan" in country or "Hong Kong" in country:
        language = "zh"
    elif "Thaïlande" in country or "Thailand" in country:
        language = "th"
    
    # Données structurées pour Supabase
    drama_data = {
        "title": title,
        "poster": poster,
        "year": year,
        "rating": rating,
        "language": language,
        "description": synopsis[:200] + "..." if len(synopsis) > 200 else synopsis,
        "synopsis": synopsis,
        "genres": genres,
        "episodes": episodes,
        "streaming_urls": [{"quality": "HD", "url": drama_url}],
        "source": SOURCE_ID,
        "created_at": datetime.now().isoformat(),
    }
    
    return drama_data

def get_recently_added_dramas(page_count=10):
    """Récupère les dramas récemment ajoutés"""
    drama_urls = []
    
    for page in range(1, page_count + 1):
        page_url = f"{BASE_URL}/rankings?page={page}"
        html = fetch_page(page_url)
        if not html:
            continue
        
        soup = BeautifulSoup(html, 'html.parser')
        drama_items = soup.select('.ranking-box .title a')
        
        for item in drama_items:
            if item and item.get('href'):
                drama_url = urljoin(BASE_URL, item.get('href'))
                drama_urls.append(drama_url)
    
    logger.info(f"Trouvé {len(drama_urls)} dramas")
    return drama_urls

def scrape_and_upload_dramas():
    """Processus principal: scraping et upload vers Supabase"""
    start_time = time.time()
    drama_urls = get_recently_added_dramas()
    
    # Initialisation des compteurs pour le rapport
    total_dramas = len(drama_urls)
    scraped_count = 0
    success_count = 0
    error_count = 0
    
    # Journalisation de début
    logger.info(f"Début du scraping de {total_dramas} dramas depuis MyDramaList")
    
    # Enregistrement du début du scraping dans Supabase
    scraping_log = {
        "source": SOURCE_ID,
        "content_type": TARGET_TABLE,
        "items_count": 0,
        "status": "processing",
        "started_at": datetime.now().isoformat(),
    }
    scraping_log_response = supabase.table("scraping_logs").insert(scraping_log).execute()
    scraping_log_id = scraping_log_response.data[0]["id"] if scraping_log_response.data else None
    
    # Traitement de chaque drama jusqu'à atteindre le minimum requis
    for drama_url in drama_urls:
        scraped_count += 1
        logger.info(f"Traitement du drama {scraped_count}/{total_dramas}: {drama_url}")
        
        # Si nous avons déjà atteint le minimum requis, arrêter
        if success_count >= MIN_ITEMS:
            logger.info(f"Minimum requis atteint ({MIN_ITEMS} dramas). Arrêt du scraping.")
            break
            
        try:
            drama_data = extract_drama_details(drama_url)
            if not drama_data:
                error_count += 1
                continue
            
            # Vérification si le drama existe déjà (par titre et année)
            existing_query = supabase.table(TARGET_TABLE) \
                .select("id") \
                .eq("title", drama_data["title"]) \
                .eq("source", SOURCE_ID) \
                .execute()
            
            if existing_query.data:
                # Mise à jour du drama existant
                drama_id = existing_query.data[0]["id"]
                logger.info(f"Mise à jour du drama existant: {drama_data['title']} (ID: {drama_id})")
                supabase.table(TARGET_TABLE).update(drama_data).eq("id", drama_id).execute()
            else:
                # Insertion d'un nouveau drama
                logger.info(f"Ajout d'un nouveau drama: {drama_data['title']}")
                supabase.table(TARGET_TABLE).insert(drama_data).execute()
            
            success_count += 1
        except Exception as e:
            logger.error(f"Erreur lors du traitement de {drama_url}: {str(e)}")
            error_count += 1
    
    # Mise à jour du log de scraping
    duration = time.time() - start_time
    supabase.table("scraping_logs").update({
        "items_count": success_count,
        "status": "completed",
        "error_message": f"{error_count} erreurs" if error_count > 0 else None,
        "duration_seconds": duration,
        "finished_at": datetime.now().isoformat(),
        "details": {
            "total": total_dramas,
            "scraped": scraped_count,
            "success": success_count,
            "errors": error_count
        }
    }).eq("id", scraping_log_id).execute()
    
    # Rapport final
    logger.info(f"Scraping terminé en {duration:.2f} secondes")
    logger.info(f"Résultats: {success_count} dramas ajoutés/mis à jour, {error_count} erreurs")
    
    # Vérification de l'objectif
    if success_count < MIN_ITEMS:
        logger.error(f"❌ ÉCHEC: {success_count}/{MIN_ITEMS} dramas récupérés")
        exit(1)
    else:
        logger.info(f"✅ SUCCÈS: {success_count}/{MIN_ITEMS} dramas récupérés")
    
    return {
        "success": success_count,
        "errors": error_count,
        "total": total_dramas,
        "duration": duration
    }

if __name__ == "__main__":
    # Vérification de la configuration
    if not SUPABASE_URL or not SUPABASE_KEY:
        logger.error("Les variables d'environnement SUPABASE_URL et SUPABASE_KEY doivent être définies")
        exit(1)
    
    # Exécution du scraping
    results = scrape_and_upload_dramas()
    
    # Génération d'un rapport JSON
    report = {
        "source": SOURCE_ID,
        "table": TARGET_TABLE,
        "timestamp": datetime.now().isoformat(),
        "results": results
    }
    
    with open(f"scraping/{SOURCE_ID}_report.json", "w") as f:
        json.dump(report, f, indent=4)
    
    logger.info(f"Rapport généré: scraping/{SOURCE_ID}_report.json")
