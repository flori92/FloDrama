#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script de scraping Top-Stream pour FloDrama
Ce script extrait les dramas depuis Top-Stream et les enregistre dans Supabase.
"""

import os
import json
import time
import random
import logging
from datetime import datetime
import requests
from bs4 import BeautifulSoup
from dotenv import load_dotenv
from pathlib import Path

try:
    from scraping.utils.supabase_storage import download_and_upload_image
    from scraping.utils.supabase_database import supabase_database as supabase_db
except ImportError:
    import sys
    sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
    from scraping.utils.supabase_storage import download_and_upload_image
    from scraping.utils.supabase_database import supabase_database as supabase_db

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('topstream_scraper')

load_dotenv()

BASE_URL = "https://top-stream.io"
USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.107 Safari/537.36",
]
RATE_LIMIT_DELAY = 2
MAX_RETRIES = 3
MIN_ITEMS = int(os.environ.get("MIN_ITEMS", "200"))

scraped_titles = set()

def get_random_headers(referer=None):
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
    headers = get_random_headers(referer)
    for attempt in range(1, retries + 1):
        try:
            response = requests.get(url, headers=headers, timeout=30)
            response.raise_for_status()
            time.sleep(RATE_LIMIT_DELAY)
            return response.text
        except requests.exceptions.RequestException as e:
            logger.warning(f"Erreur lors de la récupération de {url}: {str(e)}")
            if attempt < retries:
                wait_time = RATE_LIMIT_DELAY * attempt
                logger.info(f"Nouvelle tentative dans {wait_time} secondes...")
                time.sleep(wait_time)
            else:
                logger.error(f"Echec après {retries} tentatives pour {url}")
    return None

def extract_drama_list(page_html):
    soup = BeautifulSoup(page_html, 'html.parser')
    items = []
    for card in soup.select('.film-poster'):
        link = card.find('a', href=True)
        title = card.get('data-name') or card.get('title') or (link and link.get('title'))
        url = link['href'] if link else None
        if url and not url.startswith('http'):
            url = BASE_URL + url
        if title and url:
            items.append({'title': title.strip(), 'url': url})
    return items

def extract_drama_details(drama_url):
    html = fetch_page(drama_url)
    if not html:
        return None
    soup = BeautifulSoup(html, 'html.parser')
    title = soup.find('h1')
    poster = soup.find('img', class_='film-poster-img')
    synopsis = soup.find('div', class_='description')
    return {
        'title': title.text.strip() if title else '',
        'poster_url': poster['src'] if poster and poster.has_attr('src') else '',
        'synopsis': synopsis.text.strip() if synopsis else '',
        'source': 'top-stream',
        'source_url': drama_url
    }

def scrape_and_upload_dramas():
    logger.info(f"Début du scraping Top-Stream")
    session_id = supabase_db.log_scraping_start('top-stream', 'dramas')
    start_time = time.time()
    scraped_count = 0
    error_count = 0
    page = 1
    while scraped_count < MIN_ITEMS:
        page_url = f"{BASE_URL}/series?page={page}"
        html = fetch_page(page_url)
        if not html:
            break
        new_items = extract_drama_list(html)
        if not new_items:
            break
        for item in new_items:
            if item['title'].lower() in scraped_titles:
                continue
            details = extract_drama_details(item['url'])
            if not details:
                error_count += 1
                continue
            poster_url = details.get('poster_url')
            if poster_url:
                try:
                    image_path = download_and_upload_image(poster_url, 'drama')
                    if image_path:
                        details['image_url'] = image_path
                except Exception as e:
                    logger.error(f"Erreur image: {str(e)}")
            try:
                result = supabase_db.store_content('dramas', details)
                if result and result.get('id'):
                    scraped_count += 1
                    scraped_titles.add(details['title'].lower())
                    logger.info(f"Drama '{details['title']}' enregistré ({scraped_count}/{MIN_ITEMS})")
                    if scraped_count >= MIN_ITEMS:
                        break
            except Exception as e:
                error_count += 1
                logger.error(f"Erreur stockage '{details['title']}': {str(e)}")
        page += 1
    execution_time = time.time() - start_time
    supabase_db.update_scraping_log(session_id, {
        'items_count': scraped_count,
        'errors_count': error_count,
        'duration': execution_time
    })
    logger.info(f"Fin du scraping: {scraped_count} dramas, {error_count} erreurs, durée {execution_time:.2f}s")
    if scraped_count < MIN_ITEMS:
        logger.warning(f"⚠️ Objectif non atteint: {scraped_count}/{MIN_ITEMS} dramas récupérés")
    else:
        logger.info(f"Objectif atteint: {scraped_count}/{MIN_ITEMS} dramas récupérés")

if __name__ == "__main__":
    scrape_and_upload_dramas()
