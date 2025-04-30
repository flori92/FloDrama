#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Scrapers pour les films Bollywood - FloDrama Migration Supabase
Ce module contient tous les scrapers pour les films Bollywood (3 sources).
"""

import re
from bs4 import BeautifulSoup
from urllib.parse import urljoin
from datetime import datetime
from typing import Dict, List, Any, Optional

from scraper_base import BaseScraper, ScraperUtils

class BollywoodHungamaScraper(BaseScraper):
    """Scraper pour BollywoodHungama"""
    
    def __init__(self):
        super().__init__(
            source_id="bollywoodhungama",
            target_table="bollywood",
            base_url="https://www.bollywoodhungama.com"
        )
    
    def get_content_urls(self, limit: int = 300) -> List[str]:
        """Récupère les URLs des films Bollywood depuis BollywoodHungama"""
        film_urls = []
        page_count = min(10, limit // 30 + 1)  # Environ 30 films par page
        
        for page in range(1, page_count + 1):
            page_url = f"{self.base_url}/movies/page/{page}/" if page > 1 else f"{self.base_url}/movies/"
            html = ScraperUtils.fetch_page(page_url, self.base_url)
            if not html:
                continue
            
            soup = BeautifulSoup(html, 'html.parser')
            film_items = soup.select('.movie-card a.movie-name')
            
            for item in film_items:
                if (film_url := item.get('href')):
                    film_urls.append(film_url)
                    
                    # Limiter le nombre d'URLs
                    if len(film_urls) >= limit:
                        break
            
            if len(film_urls) >= limit:
                break
        
        self.logger.info(f"Trouvé {len(film_urls)} films Bollywood sur BollywoodHungama")
        return film_urls
    
    def extract_content_details(self, film_url: str) -> Optional[Dict[str, Any]]:
        """Extrait les détails d'un film Bollywood depuis BollywoodHungama"""
        html = ScraperUtils.fetch_page(film_url, self.base_url)
        if not html:
            return None
        
        if not (soup := BeautifulSoup(html, 'html.parser')):
            return None
        
        # Extraction des informations de base
        title_elem = soup.select_one('h1.movie-title')
        title = title_elem.text.strip() if title_elem else "Titre inconnu"
        
        # Image du poster
        poster_elem = soup.select_one('.movie-poster img')
        poster = poster_elem.get('src') if poster_elem and poster_elem.get('src') else None
        
        # Informations détaillées
        info_div = soup.select_one('.movie-info')
        info_text = info_div.text if info_div else ""
        
        # Année
        year_match = re.search(r'Release Date:\s*.*?(\d{4})', info_text, re.DOTALL)
        year = int(year_match[1]) if year_match else None
        
        # Note
        rating_elem = soup.select_one('.rating-value')
        rating = float(rating_elem.text) if rating_elem and rating_elem.text.strip() else None
        
        # Synopsis
        synopsis_elem = soup.select_one('.movie-synopsis')
        synopsis = synopsis_elem.text.strip() if synopsis_elem else ""
        
        # Genres
        genres_elem = soup.select('.movie-genre a')
        genres = [genre.text.strip() for genre in genres_elem] if genres_elem else []
        
        # Durée
        duration_match = re.search(r'Duration:\s*(\d+)\s*min', info_text)
        duration = int(duration_match[1]) if duration_match else None
        
        # Réalisateur
        director_elem = soup.select_one('.director-name')
        director = director_elem.text.strip() if director_elem else None
        
        # Acteurs
        actors_elem = soup.select('.cast-member-name')
        actors = [actor.text.strip() for actor in actors_elem] if actors_elem else []
        
        # Données structurées pour Supabase
        return {
            "title": title,
            "poster": poster,
            "year": year,
            "rating": rating,
            "language": "hi",  # Hindi par défaut pour Bollywood
            "description": f"{synopsis[:200]}..." if len(synopsis) > 200 else synopsis,
            "synopsis": synopsis,
            "genres": genres,
            "duration": duration,
            "director": director,
            "actors": actors,
            "streaming_urls": [{"quality": "HD", "url": film_url}],
        }

class FilmiFanScraper(BaseScraper):
    """Scraper pour FilmiFan"""
    
    def __init__(self):
        super().__init__(
            source_id="filmifan",
            target_table="bollywood",
            base_url="https://www.filmifan.com"
        )
    
    def get_content_urls(self, limit: int = 300) -> List[str]:
        """Récupère les URLs des films Bollywood depuis FilmiFan"""
        film_urls = []
        
        # Films populaires
        popular_url = f"{self.base_url}/movies/popular"
        html = ScraperUtils.fetch_page(popular_url, self.base_url)
        if not html:
            return film_urls
            
        soup = BeautifulSoup(html, 'html.parser')
        film_items = soup.select('.movie-card a.title')
        
        for item in film_items:
            if (film_url := item.get('href')):
                film_url = urljoin(self.base_url, film_url)
                film_urls.append(film_url)
                
                # Limiter le nombre d'URLs
                if len(film_urls) >= limit // 2:
                    break
        
        # Films récents
        if len(film_urls) < limit:
            recent_url = f"{self.base_url}/movies/latest"
            html = ScraperUtils.fetch_page(recent_url, self.base_url)
            if html and (soup := BeautifulSoup(html, 'html.parser')):
                film_items = soup.select('.movie-card a.title')
                
                for item in film_items:
                    if (film_url := item.get('href')):
                        film_url = urljoin(self.base_url, film_url)
                        if film_url not in film_urls:
                            film_urls.append(film_url)
                            
                            # Limiter le nombre d'URLs
                            if len(film_urls) >= limit:
                                break
        
        self.logger.info(f"Trouvé {len(film_urls)} films Bollywood sur FilmiFan")
        return film_urls
    
    def extract_content_details(self, url: str) -> Optional[Dict[str, Any]]:
        """Extrait les détails d'un film Bollywood depuis FilmiFan"""
        try:
            if soup := self.get_soup(url):
                title = soup.find('h1', class_='entry-title').text.strip() if soup.find('h1', class_='entry-title') else ''
                
                # Extract year from title
                year = ''
                if year_match := re.search(r'\((\d{4})\)', title):
                    year = year_match[1]
                
                # Clean title (remove year)
                title = re.sub(r'\s*\(\d{4}\)\s*', '', title).strip()
                
                # Extract poster
                poster = ''
                if poster_elem := soup.find('div', class_='entry-content').find('img'):
                    poster = poster_elem.get('src', '')
                
                # Extract rating
                rating = ''
                if rating_elem := soup.find('span', class_='rating-result'):
                    rating_text = rating_elem.text.strip()
                    if rating_match := re.search(r'(\d+(?:\.\d+)?)', rating_text):
                        rating = rating_match[1]
                
                # Extract synopsis
                synopsis = ''
                if synopsis_elem := soup.find('div', class_='entry-content'):
                    paragraphs = synopsis_elem.find_all('p')
                    if len(paragraphs) > 1:
                        synopsis = paragraphs[1].text.strip()
                
                # Extract genres, duration, actors
                genres = []
                duration = ''
                actors = []
                
                if info_elem := soup.find('div', class_='entry-content'):
                    text = info_elem.text.lower()
                    
                    # Extract genres
                    if genre_match := re.search(r'genre[s]?:([^|]+)', text, re.IGNORECASE):
                        genres_text = genre_match[1].strip()
                        genres = [g.strip() for g in genres_text.split(',') if g.strip()]
                    
                    # Extract duration
                    if duration_match := re.search(r'duration:([^|]+)', text, re.IGNORECASE):
                        duration = duration_match[1].strip()
                    
                    # Extract actors
                    if actors_match := re.search(r'starring:([^|]+)', text, re.IGNORECASE):
                        actors_text = actors_match[1].strip()
                        actors = [a.strip() for a in actors_text.split(',') if a.strip()]
                
                return {
                    'title': title,
                    'poster': poster,
                    'year': year,
                    'rating': rating,
                    'synopsis': synopsis,
                    'genres': genres,
                    'duration': duration,
                    'actors': actors,
                    'source': 'FilmiFan',
                    'url': url
                }
            else:
                return None
        except Exception as e:
            print(f"Error extracting details from {url}: {e}")
            return None

class BollywoodMDBScraper(BaseScraper):
    """Scraper pour BollywoodMDB"""
    
    def __init__(self):
        super().__init__(
            source_id="bollywoodmdb",
            target_table="bollywood",
            base_url="https://www.bollywoodmdb.com"
        )
    
    def get_content_urls(self, limit: int = 300) -> List[str]:
        """Récupère les URLs des films Bollywood depuis BollywoodMDB"""
        film_urls = []
        
        # Films populaires
        for page in range(1, 6):  # 5 pages devraient suffire pour atteindre la limite
            popular_url = f"{self.base_url}/movies/page/{page}/" if page > 1 else f"{self.base_url}/movies/"
            html = ScraperUtils.fetch_page(popular_url, self.base_url)
            if not html:
                continue
                
            soup = BeautifulSoup(html, 'html.parser')
            film_items = soup.select('.movie-card .card-title a')
            
            for item in film_items:
                if (film_url := item.get('href')):
                    film_urls.append(film_url)
                    
                    # Limiter le nombre d'URLs
                    if len(film_urls) >= limit:
                        break
            
            if len(film_urls) >= limit:
                break
        
        self.logger.info(f"Trouvé {len(film_urls)} films Bollywood sur BollywoodMDB")
        return film_urls
    
    def extract_content_details(self, film_url: str) -> Optional[Dict[str, Any]]:
        """Extrait les détails d'un film Bollywood depuis BollywoodMDB"""
        html = ScraperUtils.fetch_page(film_url, self.base_url)
        if not html:
            return None
        
        soup = BeautifulSoup(html, 'html.parser')
        if not soup:
            return None
        
        # Extraction des informations de base
        title_elem = soup.select_one('h1.movie-title')
        title = title_elem.text.strip() if title_elem else "Titre inconnu"
        
        # Image du poster
        poster_elem = soup.select_one('.movie-poster img')
        poster = poster_elem.get('src') if poster_elem and poster_elem.get('src') else None
        
        # Informations détaillées
        info_items = soup.select('.movie-info .info-item')
        info_dict = {}
        for item in info_items:
            label_elem = item.select_one('.info-label')
            value_elem = item.select_one('.info-value')
            if label_elem and value_elem:
                label = label_elem.text.strip().lower()
                value = value_elem.text.strip()
                info_dict[label] = value
        
        # Année
        year = None
        if 'release date' in info_dict:
            if (year_match := re.search(r'(\d{4})', info_dict['release date'])):
                year = int(year_match[1])
        
        # Note
        rating = None
        rating_elem = soup.select_one('.movie-rating .rating-value')
        if rating_elem:
            from contextlib import suppress
            with suppress(ValueError):
                rating = float(rating_elem.text.strip())
        
        # Synopsis
        synopsis_elem = soup.select_one('.movie-synopsis')
        synopsis = synopsis_elem.text.strip() if synopsis_elem else ""
        
        # Genres
        genres = []
        if 'genre' in info_dict:
            genres = [g.strip() for g in info_dict['genre'].split(',')]
        
        # Durée
        duration = None
        if 'runtime' in info_dict:
            if (duration_match := re.search(r'(\d+)\s*min', info_dict['runtime'])):
                duration = int(duration_match[1])
        
        # Réalisateur
        director = info_dict.get('director')
        
        # Acteurs
        actors = []
        if 'cast' in info_dict:
            actors = [a.strip() for a in info_dict['cast'].split(',')]
        
        # Données structurées pour Supabase
        return {
            "title": title,
            "poster": poster,
            "year": year,
            "rating": rating,
            "language": "hi",  # Hindi par défaut pour Bollywood
            "description": f"{synopsis[:200]}..." if len(synopsis) > 200 else synopsis,
            "synopsis": synopsis,
            "genres": genres,
            "duration": duration,
            "director": director,
            "actors": actors,
            "streaming_urls": [{"quality": "HD", "url": film_url}],
        }

# Fonction pour obtenir tous les scrapers de films Bollywood
def get_all_bollywood_scrapers():
    """Retourne tous les scrapers de films Bollywood disponibles"""
    return [
        BollywoodHungamaScraper(),
        FilmiFanScraper(),
        BollywoodMDBScraper()
    ]
