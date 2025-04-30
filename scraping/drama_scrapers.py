#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Scrapers pour les dramas asiatiques - FloDrama Migration Supabase
Ce module contient tous les scrapers pour les dramas asiatiques (8 sources).
"""

import re
from bs4 import BeautifulSoup
from urllib.parse import urljoin
from datetime import datetime
from typing import Dict, List, Any, Optional

from scraper_base import BaseScraper, ScraperUtils

class VoirDramaScraper(BaseScraper):
    """Scraper pour VoirDrama"""
    
    def __init__(self):
        super().__init__(
            source_id="voirdrama",
            target_table="dramas",
            base_url="https://voirdrama.org"
        )
    
    def get_content_urls(self, limit: int = 300) -> List[str]:
        """Récupère les URLs des dramas depuis VoirDrama"""
        drama_urls = []
        page_count = min(10, limit // 30 + 1)  # Environ 30 dramas par page
        
        for page in range(1, page_count + 1):
            page_url = f"{self.base_url}/page/{page}/" if page > 1 else self.base_url
            html = ScraperUtils.fetch_page(page_url, self.base_url)
            if not html:
                continue
            
            soup = BeautifulSoup(html, 'html.parser')
            article_items = soup.select('article.item')
            
            for item in article_items:
                link = item.select_one('h3 a')
                if link and link.get('href'):
                    drama_urls.append(link.get('href'))
                    
                    # Limiter le nombre d'URLs
                    if len(drama_urls) >= limit:
                        break
            
            if len(drama_urls) >= limit:
                break
        
        self.logger.info(f"Trouvé {len(drama_urls)} dramas sur VoirDrama")
        return drama_urls
    
    def extract_content_details(self, drama_url: str) -> Optional[Dict[str, Any]]:
        """Extrait les détails d'un drama depuis VoirDrama"""
        html = ScraperUtils.fetch_page(drama_url, self.base_url)
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

class DramaCoolScraper(BaseScraper):
    """Scraper pour DramaCool"""
    
    def __init__(self):
        super().__init__(
            source_id="dramacool",
            target_table="dramas",
            base_url="https://dramacool.cr"
        )
    
    def get_content_urls(self, limit: int = 300) -> List[str]:
        """Récupère les URLs des dramas depuis DramaCool"""
        drama_urls = []
        page_count = min(10, limit // 30 + 1)  # Environ 30 dramas par page
        
        for page in range(1, page_count + 1):
            page_url = f"{self.base_url}/drama-list/page/{page}/"
            html = ScraperUtils.fetch_page(page_url, self.base_url)
            if not html:
                continue
            
            soup = BeautifulSoup(html, 'html.parser')
            drama_items = soup.select('.list-drama .item')
            
            for item in drama_items:
                link = item.select_one('a')
                if link and link.get('href'):
                    drama_url = urljoin(self.base_url, link.get('href'))
                    drama_urls.append(drama_url)
                    
                    # Limiter le nombre d'URLs
                    if len(drama_urls) >= limit:
                        break
            
            if len(drama_urls) >= limit:
                break
        
        self.logger.info(f"Trouvé {len(drama_urls)} dramas sur DramaCool")
        return drama_urls
    
    def extract_content_details(self, drama_url: str) -> Optional[Dict[str, Any]]:
        """Extrait les détails d'un drama depuis DramaCool"""
        html = ScraperUtils.fetch_page(drama_url, self.base_url)
        if not html:
            return None
        
        soup = BeautifulSoup(html, 'html.parser')
        
        # Extraction des informations de base
        title_elem = soup.select_one('.info .title')
        title = title_elem.text.strip() if title_elem else "Titre inconnu"
        
        # Image du poster
        poster_elem = soup.select_one('.img img')
        poster = poster_elem.get('src') if poster_elem else None
        
        # Informations détaillées
        details = {}
        detail_items = soup.select('.info .meta .item')
        for item in detail_items:
            label = item.select_one('.type')
            value = item.select_one('.val')
            if label and value:
                details[label.text.strip().lower()] = value.text.strip()
        
        # Extraction des métadonnées
        year = ScraperUtils.extract_year(details.get('released', ''))
        
        # Note
        rating_elem = soup.select_one('.rating')
        rating = ScraperUtils.extract_float(rating_elem.text) if rating_elem else None
        
        # Synopsis
        synopsis_elem = soup.select_one('.desc')
        synopsis = synopsis_elem.text.strip() if synopsis_elem else ""
        
        # Genres
        genres = []
        genre_elem = details.get('genres', '')
        if genre_elem:
            genres = [g.strip() for g in genre_elem.split(',')]
        
        # Pays
        country = details.get('country', 'South Korea')
        language = ScraperUtils.detect_language_from_country(country)
        
        # Episodes
        episodes = ScraperUtils.extract_number(details.get('episodes', ''))
        
        # Statut
        status = details.get('status', '')
        
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
            "status": status,
            "streaming_urls": [{"quality": "HD", "url": drama_url}],
        }
        
        return drama_data

class KdramaScraper(BaseScraper):
    """Scraper pour Kdrama"""
    
    def __init__(self):
        super().__init__(
            source_id="kdrama",
            target_table="dramas",
            base_url="https://kdrama.com"
        )
    
    def get_content_urls(self, limit: int = 300) -> List[str]:
        """Récupère les URLs des dramas depuis Kdrama"""
        # Implémentation similaire à VoirDrama ou DramaCool
        # Adaptée pour le site Kdrama
        return []  # À implémenter
    
    def extract_content_details(self, drama_url: str) -> Optional[Dict[str, Any]]:
        """Extrait les détails d'un drama depuis Kdrama"""
        # Implémentation similaire à VoirDrama ou DramaCool
        # Adaptée pour le site Kdrama
        return None  # À implémenter

class DramaFeverScraper(BaseScraper):
    """Scraper pour DramaFever"""
    
    def __init__(self):
        super().__init__(
            source_id="dramafever",
            target_table="dramas",
            base_url="https://dramafever.com"
        )
    
    def get_content_urls(self, limit: int = 300) -> List[str]:
        """Récupère les URLs des dramas depuis DramaFever"""
        # Implémentation similaire aux autres scrapers
        return []  # À implémenter
    
    def extract_content_details(self, drama_url: str) -> Optional[Dict[str, Any]]:
        """Extrait les détails d'un drama depuis DramaFever"""
        # Implémentation similaire aux autres scrapers
        return None  # À implémenter

class MyDramaListScraper(BaseScraper):
    """Scraper pour MyDramaList"""
    
    def __init__(self):
        super().__init__(
            source_id="mydramalist",
            target_table="dramas",
            base_url="https://mydramalist.com"
        )
    
    def get_content_urls(self, limit: int = 300) -> List[str]:
        """Récupère les URLs des dramas depuis MyDramaList"""
        drama_urls = []
        page_count = min(10, limit // 30 + 1)  # Environ 30 dramas par page
        
        for page in range(1, page_count + 1):
            page_url = f"{self.base_url}/rankings?page={page}"
            html = ScraperUtils.fetch_page(page_url, self.base_url)
            if not html:
                continue
            
            soup = BeautifulSoup(html, 'html.parser')
            drama_items = soup.select('.ranking-box .title a')
            
            for item in drama_items:
                if item and item.get('href'):
                    drama_url = urljoin(self.base_url, item.get('href'))
                    drama_urls.append(drama_url)
                    
                    # Limiter le nombre d'URLs
                    if len(drama_urls) >= limit:
                        break
            
            if len(drama_urls) >= limit:
                break
        
        self.logger.info(f"Trouvé {len(drama_urls)} dramas sur MyDramaList")
        return drama_urls
    
    def extract_content_details(self, drama_url: str) -> Optional[Dict[str, Any]]:
        """Extrait les détails d'un drama depuis MyDramaList"""
        html = ScraperUtils.fetch_page(drama_url, self.base_url)
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
        language = ScraperUtils.detect_language_from_country(country)
        
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
        }
        
        return drama_data

class AsianCrushScraper(BaseScraper):
    """Scraper pour AsianCrush"""
    
    def __init__(self):
        super().__init__(
            source_id="asiancrush",
            target_table="dramas",
            base_url="https://www.asiancrush.com"
        )
    
    def get_content_urls(self, limit: int = 300) -> List[str]:
        """Récupère les URLs des dramas depuis AsianCrush"""
        # Implémentation similaire aux autres scrapers
        return []  # À implémenter
    
    def extract_content_details(self, drama_url: str) -> Optional[Dict[str, Any]]:
        """Extrait les détails d'un drama depuis AsianCrush"""
        # Implémentation similaire aux autres scrapers
        return None  # À implémenter

class DramaPassionScraper(BaseScraper):
    """Scraper pour DramaPassion"""
    
    def __init__(self):
        super().__init__(
            source_id="dramapassion",
            target_table="dramas",
            base_url="https://dramapassion.com"
        )
    
    def get_content_urls(self, limit: int = 300) -> List[str]:
        """Récupère les URLs des dramas depuis DramaPassion"""
        # Implémentation similaire aux autres scrapers
        return []  # À implémenter
    
    def extract_content_details(self, drama_url: str) -> Optional[Dict[str, Any]]:
        """Extrait les détails d'un drama depuis DramaPassion"""
        # Implémentation similaire aux autres scrapers
        return None  # À implémenter

class KissAsianScraper(BaseScraper):
    """Scraper pour KissAsian"""
    
    def __init__(self):
        super().__init__(
            source_id="kissasian",
            target_table="dramas",
            base_url="https://kissasian.li"
        )
    
    def get_content_urls(self, limit: int = 300) -> List[str]:
        """Récupère les URLs des dramas depuis KissAsian"""
        # Implémentation similaire aux autres scrapers
        return []  # À implémenter
    
    def extract_content_details(self, drama_url: str) -> Optional[Dict[str, Any]]:
        """Extrait les détails d'un drama depuis KissAsian"""
        # Implémentation similaire aux autres scrapers
        return None  # À implémenter

# Fonction pour obtenir tous les scrapers de dramas
def get_all_drama_scrapers():
    """Retourne tous les scrapers de dramas disponibles"""
    return [
        VoirDramaScraper(),
        DramaCoolScraper(),
        KdramaScraper(),
        DramaFeverScraper(),
        MyDramaListScraper(),
        AsianCrushScraper(),
        DramaPassionScraper(),
        KissAsianScraper()
    ]
