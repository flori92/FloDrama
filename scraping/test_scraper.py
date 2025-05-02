#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Script de test pour valider un scraper individuel - FloDrama
"""

import os
import sys
import logging
from datetime import datetime
from dotenv import load_dotenv
import requests
from bs4 import BeautifulSoup
from supabase import create_client

# Configuration du logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('test_scraper')

# Chargement des variables d'environnement
load_dotenv()

# Variables de configuration
SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://fffgoqubrbgppcqqkyod.supabase.co")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_KEY")
SOURCE_ID = "voirdrama"  # ID de la source à scraper
TARGET_TABLE = "dramas"  # Table cible dans Supabase
LIMIT = 5  # Nombre d'éléments à scraper pour le test

# Initialisation client Supabase
supabase = None
if SUPABASE_URL and SUPABASE_KEY:
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
else:
    logger.error("Les variables d'environnement SUPABASE_URL et SUPABASE_SERVICE_KEY sont requises.")
    sys.exit(1)

# Fonction pour appliquer les migrations
def appliquer_migration():
    """Applique la migration à la table scraping_logs"""
    
    # Commandes SQL pour mettre à jour la table
    sql_commands = [
        """
        ALTER TABLE public.scraping_logs 
        ADD COLUMN IF NOT EXISTS started_at TIMESTAMP WITH TIME ZONE,
        ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE,
        ADD COLUMN IF NOT EXISTS success BOOLEAN DEFAULT false,
        ADD COLUMN IF NOT EXISTS total_items INTEGER DEFAULT 0
        """
    ]
    
    # Exécuter chaque commande SQL directement via Supabase
    for i, command in enumerate(sql_commands):
        try:
            logger.info(f"Exécution de la migration SQL {i+1}/{len(sql_commands)}")
            # Utiliser la méthode rpc pour exécuter le SQL
            response = supabase.postgrest.schema("public").execute(command)
            logger.info(f"Migration {i+1} exécutée avec succès")
        except Exception as e:
            logger.error(f"Erreur lors de l'exécution de la migration {i+1}: {str(e)}")
            logger.info("Poursuite de l'exécution des autres migrations...")
    
    logger.info("Migrations terminées")

# Fonction pour récupérer les URLs des dramas
def get_drama_urls(base_url="https://voirdrama.org", limit=5):
    """Récupère les URLs des dramas depuis VoirDrama"""
    drama_urls = []
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Referer': 'https://www.google.com/'
    }
    
    try:
        logger.info(f"Récupération des dramas depuis {base_url}")
        response = requests.get(base_url, headers=headers, timeout=10)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, 'html.parser')
        article_items = soup.select('article.item')
        
        for item in article_items[:limit]:
            link = item.select_one('h3 a')
            if link and link.get('href'):
                drama_urls.append(link.get('href'))
                logger.info(f"URL ajoutée: {link.get('href')}")
        
        logger.info(f"Récupération terminée: {len(drama_urls)} URLs")
        return drama_urls
    
    except Exception as e:
        logger.error(f"Erreur lors de la récupération des dramas: {str(e)}")
        return []

# Fonction pour extraire les détails d'un drama
def extract_drama_details(drama_url):
    """Extrait les détails d'un drama depuis VoirDrama"""
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Referer': 'https://www.google.com/'
    }
    
    try:
        logger.info(f"Extraction des détails depuis {drama_url}")
        response = requests.get(drama_url, headers=headers, timeout=10)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Extraction des informations de base
        title_elem = soup.select_one('h1.entry-title')
        title = title_elem.text.strip() if title_elem else "Titre inconnu"
        
        # Image du poster
        poster_elem = soup.select_one('.thumb img')
        poster = poster_elem.get('src') if poster_elem else None
        
        # Information de base
        info_div = soup.select_one('.info')
        info_text = info_div.text if info_div else ""
        
        # Synopsis
        synopsis_elem = soup.select_one('.entry-content')
        synopsis = synopsis_elem.text.strip() if synopsis_elem else ""
        
        # Données structurées pour Supabase
        drama_data = {
            "title": title,
            "poster": poster,
            "description": synopsis[:200] + "..." if len(synopsis) > 200 else synopsis,
            "synopsis": synopsis,
            "source": SOURCE_ID,
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat(),
            "streaming_urls": [{"quality": "HD", "url": drama_url}],
        }
        
        logger.info(f"Extraction terminée pour: {title}")
        return drama_data
        
    except Exception as e:
        logger.error(f"Erreur lors de l'extraction des détails: {str(e)}")
        return None

# Fonction pour insérer un drama dans Supabase
def insert_drama_to_supabase(drama_data):
    """Insère un drama dans Supabase"""
    try:
        logger.info(f"Insertion dans Supabase: {drama_data['title']}")
        response = supabase.table(TARGET_TABLE).upsert(drama_data).execute()
        logger.info(f"Insertion réussie")
        return True
    except Exception as e:
        logger.error(f"Erreur lors de l'insertion dans Supabase: {str(e)}")
        return False

# Fonction principale
def main():
    """Fonction principale pour tester le scraping"""
    start_time = datetime.now()
    
    # Enregistrement du début du scraping
    scraping_log = {
        "source": SOURCE_ID,
        "target_table": TARGET_TABLE,
        "started_at": start_time.isoformat(),
        "total_items": 0,
        "success": False
    }
    
    try:
        # Appliquer les migrations
        logger.info("Application des migrations...")
        appliquer_migration()
        
        # Insérer le log de début de scraping
        scraping_log_id = supabase.table("scraping_logs").insert(scraping_log).execute()
        logger.info(f"Log de scraping créé")
        
        # Récupérer les URLs des dramas
        drama_urls = get_drama_urls(limit=LIMIT)
        
        success_count = 0
        error_count = 0
        
        # Extraire et insérer chaque drama
        for url in drama_urls:
            drama_data = extract_drama_details(url)
            if drama_data:
                if insert_drama_to_supabase(drama_data):
                    success_count += 1
                else:
                    error_count += 1
            else:
                error_count += 1
        
        # Mettre à jour le log de scraping
        end_time = datetime.now()
        supabase.table("scraping_logs").update({
            "completed_at": end_time.isoformat(),
            "total_items": success_count,
            "success": success_count > 0,
            "error_count": error_count
        }).eq("id", scraping_log_id[0]['id']).execute()
        
        # Résumé
        duration = (end_time - start_time).total_seconds()
        logger.info(f"Scraping terminé en {duration:.2f} secondes")
        logger.info(f"Résultats: {success_count} dramas ajoutés/mis à jour, {error_count} erreurs")
        
    except Exception as e:
        logger.error(f"Erreur lors du scraping: {str(e)}")
        
        # Mettre à jour le log de scraping en cas d'erreur
        end_time = datetime.now()
        if 'scraping_log_id' in locals():
            supabase.table("scraping_logs").update({
                "completed_at": end_time.isoformat(),
                "success": False,
                "error_message": str(e)
            }).eq("id", scraping_log_id[0]['id']).execute()

if __name__ == "__main__":
    main()
