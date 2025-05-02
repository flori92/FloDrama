#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Script de test pour valider le scraping VoirDrama et l'insertion dans Supabase
"""

import os
import sys
import logging
import time
from datetime import datetime
import re
import requests
from bs4 import BeautifulSoup
from supabase import create_client
from typing import Dict, List, Any, Optional
from dotenv import load_dotenv

# Configuration du logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('test_voirdrama')

# Chargement des variables d'environnement
load_dotenv()

# Configuration
SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://fffgoqubrbgppcqqkyod.supabase.co")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_KEY")
SOURCE_ID = "voirdrama"
TARGET_TABLE = "dramas"
BASE_URL = "https://voirdrama.org"
LIMIT = 5

# Initialisation client Supabase
supabase = None
if SUPABASE_URL and SUPABASE_KEY:
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    logger.info(f"Client Supabase initialisé pour {SUPABASE_URL}")
else:
    logger.error("Variables d'environnement SUPABASE_URL et SUPABASE_SERVICE_KEY requises")
    sys.exit(1)

def get_random_user_agent() -> str:
    """Retourne un User-Agent aléatoire"""
    user_agents = [
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15",
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.107 Safari/537.36"
    ]
    return user_agents[0]  # Pour les tests, utilisez un user agent fixe

def fetch_page(url: str) -> Optional[str]:
    """Récupère le contenu d'une page web"""
    headers = {
        'User-Agent': get_random_user_agent(),
        'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Referer': BASE_URL
    }
    
    try:
        logger.info(f"Récupération de la page {url}")
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        return response.text
    except requests.RequestException as e:
        logger.error(f"Erreur lors de la récupération de {url}: {str(e)}")
        return None

def get_drama_urls(limit: int = 5) -> List[str]:
    """Récupère les URLs des dramas depuis VoirDrama"""
    drama_urls = []
    
    html = fetch_page(BASE_URL)
    if not html:
        return []
    
    soup = BeautifulSoup(html, 'html.parser')
    article_items = soup.select('article.item')
    
    for item in article_items[:limit]:
        link = item.select_one('h3 a')
        if link and link.get('href'):
            drama_urls.append(link.get('href'))
            logger.info(f"Drama URL trouvée: {link.get('href')}")
    
    logger.info(f"Total URLs trouvées: {len(drama_urls)}")
    return drama_urls

def extract_year(text: str) -> Optional[int]:
    """Extrait une année (4 chiffres) d'un texte"""
    if not text:
        return None
    if year_match := re.search(r'(\d{4})', text):
        return int(year_match.group(1))
    return None

def extract_drama_details(url: str) -> Optional[Dict[str, Any]]:
    """Extrait les détails d'un drama depuis VoirDrama"""
    html = fetch_page(url)
    if not html:
        return None
    
    soup = BeautifulSoup(html, 'html.parser')
    
    # Extraction du titre
    title_elem = soup.select_one('h1.entry-title')
    if not title_elem:
        logger.error(f"Titre non trouvé pour {url}")
        return None
    
    title = title_elem.text.strip()
    logger.info(f"Titre trouvé: {title}")
    
    # Image du poster
    poster_elem = soup.select_one('.thumb img')
    poster = poster_elem.get('src') if poster_elem else None
    
    # Information de base
    info_div = soup.select_one('.info')
    info_text = info_div.text if info_div else ""
    
    # Extraction des métadonnées avec regex
    year = extract_year(info_text)
    
    # Note
    rating_elem = soup.select_one('.rtg')
    rating = float(rating_elem.text) if rating_elem and rating_elem.text.strip() else None
    
    # Synopsis
    synopsis_elem = soup.select_one('.entry-content')
    synopsis = synopsis_elem.text.strip() if synopsis_elem else ""
    
    # Genres
    genres_elem = soup.select('.genxed a')
    genres = [genre.text.strip() for genre in genres_elem] if genres_elem else []
    
    # Épisodes
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
        "streaming_urls": [{"quality": "HD", "url": url}],
        "source": SOURCE_ID,
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat()
    }
    
    # Détection de la langue à partir des genres
    if any(g.lower() in ["coréen", "korean"] for g in genres):
        drama_data["language"] = "ko"
    elif any(g.lower() in ["japonais", "japanese"] for g in genres):
        drama_data["language"] = "ja"
    elif any(g.lower() in ["chinois", "chinese"] for g in genres):
        drama_data["language"] = "zh"
    elif any(g.lower() in ["thaïlandais", "thai"] for g in genres):
        drama_data["language"] = "th"
    
    return drama_data

def insert_drama_to_supabase(drama_data: Dict[str, Any]) -> bool:
    """Insère un drama dans Supabase"""
    try:
        logger.info(f"Insertion de '{drama_data['title']}' dans Supabase")
        # Utilisation de upsert pour éviter les doublons (Si le titre existe déjà, mise à jour)
        response = supabase.table(TARGET_TABLE).upsert(drama_data).execute()
        logger.info(f"Insertion réussie pour '{drama_data['title']}'")
        return True
    except Exception as e:
        logger.error(f"Erreur lors de l'insertion dans Supabase: {str(e)}")
        return False

def log_scraping_start() -> str:
    """Enregistre le début du scraping dans la table scraping_logs"""
    try:
        log_data = {
            "source": SOURCE_ID,
            "target_table": TARGET_TABLE,
            "started_at": datetime.now().isoformat(),
            "success": False
        }
        
        response = supabase.table("scraping_logs").insert(log_data).execute()
        log_id = response.data[0]['id'] if response.data else None
        logger.info(f"Log de scraping créé avec ID: {log_id}")
        return log_id
    except Exception as e:
        logger.error(f"Erreur lors de la création du log de scraping: {str(e)}")
        return None

def log_scraping_end(log_id: str, success: bool, total_items: int, error_message: str = None) -> bool:
    """Met à jour le log de scraping pour indiquer la fin"""
    if not log_id:
        logger.warning("Impossible de mettre à jour le log de scraping: ID manquant")
        return False
        
    try:
        update_data = {
            "completed_at": datetime.now().isoformat(),
            "success": success,
            "total_items": total_items
        }
        
        if error_message:
            update_data["error_message"] = error_message
            
        response = supabase.table("scraping_logs").update(update_data).eq("id", log_id).execute()
        logger.info(f"Log de scraping mis à jour: success={success}, total_items={total_items}")
        return True
    except Exception as e:
        logger.error(f"Erreur lors de la mise à jour du log de scraping: {str(e)}")
        return False

def main():
    """Fonction principale"""
    start_time = time.time()
    logger.info(f"Démarrage du test de scraping pour {SOURCE_ID}")
    
    # Enregistrement du début du scraping
    log_id = log_scraping_start()
    
    try:
        # Récupération des URLs
        drama_urls = get_drama_urls(LIMIT)
        if not drama_urls:
            logger.error("Aucune URL de drama trouvée")
            if log_id:
                log_scraping_end(log_id, False, 0, "Aucune URL de drama trouvée")
            return
        
        # Extraction et insertion des dramas
        success_count = 0
        error_count = 0
        
        for url in drama_urls:
            drama_data = extract_drama_details(url)
            if drama_data:
                if insert_drama_to_supabase(drama_data):
                    success_count += 1
                else:
                    error_count += 1
            else:
                error_count += 1
                logger.error(f"Impossible d'extraire les données pour {url}")
        
        # Mise à jour du log de scraping
        if log_id:
            log_scraping_end(log_id, success_count > 0, success_count)
        
        # Affichage des résultats
        duration = time.time() - start_time
        logger.info(f"Test terminé en {duration:.2f} secondes")
        logger.info(f"Résultats: {success_count} dramas ajoutés, {error_count} erreurs")
        
    except Exception as e:
        logger.error(f"Erreur lors du test de scraping: {str(e)}")
        if log_id:
            log_scraping_end(log_id, False, 0, str(e))

if __name__ == "__main__":
    main()
