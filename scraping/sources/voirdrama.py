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
logger = logging.getLogger('voirdrama_scraper')

# Configuration des constantes
BASE_URL = "https://voirdrama.org"
USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.107 Safari/537.36",
]
RATE_LIMIT_DELAY = 2  # secondes entre les requêtes
MAX_RETRIES = 3  # nombre maximal de tentatives en cas d'échec

# Récupération des variables d'environnement
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")
TARGET_TABLE = os.environ.get("TARGET_TABLE", "dramas")

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
    title_elem = soup.select_one('h1.entry-title')
    title = title_elem.text.strip() if title_elem else "Titre inconnu"
    
    # Image du poster
    poster_elem = soup.select_one('.thumb img')
    poster = poster_elem.get('src') if poster_elem else None
    
    # Information de base
    info_div = soup.select_one('.info')
    info_text = info_div.text if info_div else ""
    
    # Extraction des métadonnées avec regex
    year_match = re.search(r'Année: (\d{4})', info_text)
    year = int(year_match.group(1)) if year_match else None
    
    # Note
    rating_elem = soup.select_one('.rtg')
    rating = float(rating_elem.text) if rating_elem and rating_elem.text.strip() else None
    
    # Synopsis
    synopsis_elem = soup.select_one('.entry-content')
    synopsis = synopsis_elem.text.strip() if synopsis_elem else ""
    
    # Genres
    genres_elem = soup.select('.genxed a')
    genres = [genre.text.strip() for genre in genres_elem] if genres_elem else []
    
    # Episodes
    episodes_match = re.search(r'Episodes: (\d+)', info_text)
    episodes = int(episodes_match.group(1)) if episodes_match else None
    
    # Statut
    status_match = re.search(r'Statut: ([^\n]+)', info_text)
    status = status_match.group(1).strip() if status_match else None
    
    # Données structurées pour Supabase
    drama_data = {
        "title": title,
        "poster": poster,
        "year": year,
        "rating": rating,
        "language": "ko",  # Valeur par défaut pour les dramas coréens
        "description": synopsis[:200] + "..." if len(synopsis) > 200 else synopsis,
        "synopsis": synopsis,
        "genres": genres,
        "episodes": episodes,
        "status": status,
        "streaming_urls": [{"quality": "HD", "url": drama_url}],
        "source": "voirdrama",
        "created_at": datetime.now().isoformat(),
    }
    
    # Détection de la langue à partir des genres ou du titre
    if any(g.lower() in ["coréen", "korean"] for g in genres):
        drama_data["language"] = "ko"
    elif any(g.lower() in ["japonais", "japanese"] for g in genres):
        drama_data["language"] = "ja"
    elif any(g.lower() in ["chinois", "chinese"] for g in genres):
        drama_data["language"] = "zh"
    elif any(g.lower() in ["thaïlandais", "thai"] for g in genres):
        drama_data["language"] = "th"
    
    return drama_data

def get_recently_added_dramas(page_count=2):
    """Récupère les dramas récemment ajoutés depuis la page d'accueil"""
    drama_urls = []
    
    for page in range(1, page_count + 1):
        page_url = f"{BASE_URL}/page/{page}/" if page > 1 else BASE_URL
        html = fetch_page(page_url)
        if not html:
            continue
        
        soup = BeautifulSoup(html, 'html.parser')
        article_items = soup.select('article.item')
        
        for item in article_items:
            link = item.select_one('h3 a')
            if link and link.get('href'):
                drama_urls.append(link.get('href'))
    
    logger.info(f"Trouvé {len(drama_urls)} dramas récents")
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
    logger.info(f"Début du scraping de {total_dramas} dramas depuis VoirDrama")
    
    # Enregistrement du début du scraping dans Supabase
    scraping_log = {
        "source": "voirdrama",
        "content_type": TARGET_TABLE,
        "items_count": 0,
        "status": "processing",
        "started_at": datetime.now().isoformat(),
    }
    scraping_log_response = supabase.table("scraping_logs").insert(scraping_log).execute()
    scraping_log_id = scraping_log_response.data[0]["id"] if scraping_log_response.data else None
    
    # Traitement de chaque drama
    for drama_url in drama_urls:
        scraped_count += 1
        logger.info(f"Traitement du drama {scraped_count}/{total_dramas}: {drama_url}")
        
        try:
            drama_data = extract_drama_details(drama_url)
            if not drama_data:
                error_count += 1
                continue
            
            # Vérification si le drama existe déjà (par titre et année)
            existing_query = supabase.table(TARGET_TABLE) \
                .select("id") \
                .eq("title", drama_data["title"]) \
                .eq("year", drama_data["year"] or 0) \
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
        "source": "voirdrama",
        "table": TARGET_TABLE,
        "timestamp": datetime.now().isoformat(),
        "results": results
    }
    
    with open("scraping/voirdrama_report.json", "w") as f:
        json.dump(report, f, indent=4)
    
    logger.info("Rapport généré: scraping/voirdrama_report.json")
