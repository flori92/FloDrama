#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Scrapers pour les animes et films - FloDrama Migration Supabase
Ce module contient tous les scrapers pour les animes (4 sources) et films (4 sources).
"""

import re
from bs4 import BeautifulSoup
from urllib.parse import urljoin
from datetime import datetime
from typing import Dict, List, Any, Optional
import json
import logging
import requests

from scraper_base import BaseScraper

class ScraperUtils:
    """Classe utilitaire pour les scrapers"""
    
    @staticmethod
    def fetch_page(url: str, referer: str = None) -> Optional[str]:
        """Récupère le contenu d'une page web"""
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Referer': referer or 'https://www.google.com/'
        }
        
        try:
            response = requests.get(url, headers=headers, timeout=10)
            response.raise_for_status()
            return response.text
        except requests.RequestException as e:
            logging.error(f"Erreur lors de la récupération de {url}: {e}")
            return None
    
    @staticmethod
    def parse_year(text: str) -> Optional[int]:
        """Extrait une année (4 chiffres) d'un texte"""
        if not text:
            return None
        if year_match := re.search(r'(\d{4})', text):
            return int(year_match[1])
        return None
    
    @staticmethod
    def parse_duration(text: str) -> Optional[int]:
        """Extrait une durée en minutes d'un texte"""
        if not text:
            return None
        
        # Format "X min"
        if duration_match := re.search(r'(\d+)\s*min', text):
            return int(duration_match[1])
        
        # Format "Xh Ymin"
        hours = 0
        minutes = 0
        if hours_match := re.search(r'(\d+)\s*h', text):
            hours = int(hours_match[1])
        if minutes_match := re.search(r'(\d+)\s*min', text):
            minutes = int(minutes_match[1])
        
        return hours * 60 + minutes if hours > 0 or minutes > 0 else None
    
    @staticmethod
    def create_description(synopsis: str, max_length: int = 200) -> str:
        """Crée une description courte à partir d'un synopsis"""
        if not synopsis:
            return ""
        return f"{synopsis[:max_length]}..." if len(synopsis) > max_length else synopsis
    
    @staticmethod
    def safe_float_parse(text: str) -> Optional[float]:
        """Convertit un texte en float de manière sécurisée"""
        if not text or not text.strip():
            return None
            
        from contextlib import suppress
        with suppress(ValueError):
            # Remplacer la virgule par un point pour les formats européens
            return float(text.strip().replace(',', '.').split('/')[0])
        return None

#######################
# SCRAPERS POUR ANIMES
#######################

class MyAnimeListScraper(BaseScraper):
    """Scraper pour MyAnimeList"""
    
    def __init__(self):
        super().__init__(
            source_id="myanimelist",
            target_table="animes",
            base_url="https://myanimelist.net"
        )
        self.rate_limit_delay = 3  # Plus lent pour éviter les blocages
    
    def get_content_urls(self, limit: int = 300) -> List[str]:
        """Récupère les URLs des animes depuis MyAnimeList"""
        anime_urls = []
        
        # Top animes
        top_url = f"{self.base_url}/topanime.php"
        html = ScraperUtils.fetch_page(top_url, self.base_url)
        if html and (soup := BeautifulSoup(html, 'html.parser')):
            anime_items = soup.select('.ranking-list .title a')
            
            for item in anime_items:
                if (anime_url := item.get('href')):
                    anime_url = urljoin(self.base_url, anime_url)
                    anime_urls.append(anime_url)
        
        # Animes par saison
        seasons = ["2025/spring", "2025/winter", "2024/fall", "2024/summer"]
        for season in seasons:
            season_url = f"{self.base_url}/anime/season/{season}"
            html = ScraperUtils.fetch_page(season_url, self.base_url)
            if html and (soup := BeautifulSoup(html, 'html.parser')):
                anime_items = soup.select('.seasonal-anime .link-title')
                
                for item in anime_items:
                    if (anime_url := item.get('href')):
                        anime_url = urljoin(self.base_url, anime_url)
                        if anime_url not in anime_urls:
                            anime_urls.append(anime_url)
                            
                            # Limiter le nombre d'URLs
                            if len(anime_urls) >= limit:
                                break
            
            if len(anime_urls) >= limit:
                break
        
        self.logger.info(f"Trouvé {len(anime_urls)} animes sur MyAnimeList")
        return anime_urls
    
    def extract_content_details(self, anime_url: str) -> Optional[Dict[str, Any]]:
        """Extrait les détails d'un anime depuis MyAnimeList"""
        html = ScraperUtils.fetch_page(anime_url, self.base_url)
        if not html:
            return None
        
        soup = BeautifulSoup(html, 'html.parser')
        
        # Extraction des informations de base
        title_elem = soup.select_one('.title-name')
        title = title_elem.text.strip() if title_elem else "Titre inconnu"
        
        # Titre original (japonais)
        original_title_elem = soup.select_one('.title-english')
        original_title = original_title_elem.text.strip() if original_title_elem else None
        
        # Image du poster
        poster_elem = soup.select_one('.leftside img')
        poster = poster_elem.get('data-src') or poster_elem.get('src') if poster_elem else None
        
        # Informations détaillées
        info_elem = soup.select_one('.leftside .spaceit_pad')
        info_text = info_elem.text if info_elem else ""
        
        # Année
        year_match = re.search(r'Aired:\s*.*?(\d{4})', info_text, re.DOTALL)
        year = int(year_match[1]) if year_match else None
        
        # Note
        score_elem = soup.select_one('.score-label')
        rating = float(score_elem.text) if score_elem and score_elem.text.strip() else None
        
        # Synopsis
        synopsis_elem = soup.select_one('[itemprop="description"]')
        synopsis = synopsis_elem.text.strip() if synopsis_elem else ""
        
        # Description courte
        description = ScraperUtils.create_description(synopsis)
        
        # Genres
        genres_elem = soup.select('[itemprop="genre"]')
        genres = [genre.text.strip() for genre in genres_elem] if genres_elem else []
        
        # Episodes
        episodes_elem = soup.select_one('.spaceit:contains("Episodes:")')
        episodes = None
        if episodes_elem and (match := re.search(r'Episodes:\s*(\d+)', episodes_elem.parent.text if episodes_elem else "")):
            episodes = int(match[1])
        
        # Statut
        status_elem = soup.select_one('.spaceit:contains("Status:")')
        status = status_elem.text.replace("Status:", "").strip() if status_elem else None
        
        # Données structurées pour Supabase
        return {
            "title": title,
            "original_title": original_title,
            "poster": poster,
            "year": year,
            "rating": rating,
            "language": "ja",  # Japonais par défaut pour les animes
            "description": description,
            "synopsis": synopsis,
            "genres": genres,
            "episodes": episodes,
            "status": status,
            "streaming_urls": [{"quality": "HD", "url": anime_url}],
        }

class VoirAnimeScraper(BaseScraper):
    """Scraper pour VoirAnime"""
    
    def __init__(self):
        super().__init__(
            source_id="voiranime",
            target_table="animes",
            base_url="https://voiranime.com"
        )
    
    def get_content_urls(self, limit: int = 300) -> List[str]:
        """Récupère les URLs des animes depuis VoirAnime"""
        anime_urls = []
        page_count = min(10, limit // 30 + 1)  # Environ 30 animes par page
        
        for page in range(1, page_count + 1):
            page_url = f"{self.base_url}/page/{page}/" if page > 1 else self.base_url
            html = ScraperUtils.fetch_page(page_url, self.base_url)
            if not html:
                continue
            
            soup = BeautifulSoup(html, 'html.parser')
            anime_items = soup.select('.listupd .bs .bsx a')
            
            for item in anime_items:
                if (anime_url := item.get('href')):
                    anime_url = urljoin(self.base_url, anime_url)
                    anime_urls.append(anime_url)
                    
                    # Limiter le nombre d'URLs
                    if len(anime_urls) >= limit:
                        break
            
            if len(anime_urls) >= limit:
                break
        
        self.logger.info(f"Trouvé {len(anime_urls)} animes sur VoirAnime")
        return anime_urls
    
    def extract_content_details(self, anime_url: str) -> Optional[Dict[str, Any]]:
        """Extrait les détails d'un anime depuis VoirAnime"""
        html = ScraperUtils.fetch_page(anime_url, self.base_url)
        if not html:
            return None
        
        soup = BeautifulSoup(html, 'html.parser')
        
        # Extraction des informations de base
        title_elem = soup.select_one('.entry-title')
        title = title_elem.text.strip() if title_elem else "Titre inconnu"
        
        # Image du poster
        poster_elem = soup.select_one('.thumb img')
        poster = poster_elem.get('src') if poster_elem else None
        
        # Informations détaillées
        info_div = soup.select_one('.info-content')
        info_text = info_div.text if info_div else ""
        
        # Année
        year_match = re.search(r'Année de production:\s*(\d{4})', info_text)
        year = int(year_match[1]) if year_match else None
        
        # Note (pas toujours présent)
        rating_elem = soup.select_one('.rating .num')
        rating = None
        if rating_elem and rating_elem.text.strip():
            rating = ScraperUtils.safe_float_parse(rating_elem.text)
        else:
            rating = None
        
        # Synopsis
        synopsis_elem = soup.select_one('.entry-content')
        synopsis = synopsis_elem.text.strip() if synopsis_elem else ""
        
        # Description courte
        description = ScraperUtils.create_description(synopsis)
        
        # Genres
        genres_elem = soup.select('.genxed a')
        genres = [genre.text.strip() for genre in genres_elem] if genres_elem else []
        
        # Episodes
        episodes_match = re.search(r'Épisodes:\s*(\d+)', info_text)
        episodes = int(episodes_match[1]) if episodes_match else None
        
        # Statut
        status_match = re.search(r'Statut:\s*([^\n]+)', info_text)
        status = status_match[1].strip() if status_match else None
        
        # Données structurées pour Supabase
        return {
            "title": title,
            "poster": poster,
            "year": year,
            "rating": rating,
            "language": "ja",  # Japonais par défaut pour les animes
            "description": description,
            "synopsis": synopsis,
            "genres": genres,
            "episodes": episodes,
            "status": status,
            "streaming_urls": [{"quality": "HD", "url": anime_url}],
        }

class AnimeNewsScraper(BaseScraper):
    """Scraper pour AnimeNews"""
    
    def __init__(self):
        super().__init__(
            source_id="animenews",
            target_table="animes",
            base_url="https://www.animenewsnetwork.com"
        )
    
    def get_content_urls(self, limit: int = 300) -> List[str]:
        """Récupère les URLs des animes depuis AnimeNews"""
        anime_urls = []
        
        # Page des animes populaires
        popular_url = f"{self.base_url}/encyclopedia/ratings-anime.php?top=500"
        html = ScraperUtils.fetch_page(popular_url, self.base_url)
        if not html:
            return anime_urls
            
        soup = BeautifulSoup(html, 'html.parser')
        anime_rows = soup.select('table.encyclopedia-ratings tr')
        
        # Ignorer la première ligne (en-têtes)
        for row in anime_rows[1:]:
            link = row.select_one('td:nth-child(2) a')
            if (anime_url := link.get('href')):
                anime_url = urljoin(self.base_url, anime_url)
                anime_urls.append(anime_url)
                
                # Limiter le nombre d'URLs
                if len(anime_urls) >= limit:
                    break
        
        self.logger.info(f"Trouvé {len(anime_urls)} animes sur AnimeNews")
        return anime_urls
    
    def extract_content_details(self, anime_url: str) -> Optional[Dict[str, Any]]:
        """Extrait les détails d'un anime depuis AnimeNews"""
        html = ScraperUtils.fetch_page(anime_url, self.base_url)
        if not html:
            return None
        
        soup = BeautifulSoup(html, 'html.parser')
        
        # Extraction des informations de base
        title = "Titre inconnu"
        if (title_elem := soup.select_one('h1.page-header')):
            title = title_elem.text.strip()
        
        # Image du poster
        poster = None
        if (poster_elem := soup.select_one('.anime-image img')):
            poster = poster_elem.get('src')
        
        # Informations détaillées
        info_box = soup.select_one('.anime-info')
        info_text = info_box.text if info_box else ""
        
        # Année
        year = None
        if (year_elem := soup.select_one('span:contains("Vintage:")')):
            if (parent := year_elem.parent):
                year_text = parent.text
                if (year_match := re.search(r'(\d{4})', year_text)):
                    year = int(year_match[1])
        
        # Synopsis
        synopsis = ""
        if (synopsis_elem := soup.select_one('.encyc-info-type + div')):
            synopsis = synopsis_elem.text.strip()
        
        # Description courte
        description = ScraperUtils.create_description(synopsis)
        
        # Genres
        genres_elem = soup.select('.encyc-info-type:contains("Genres:") ~ a')
        genres = [genre.text.strip() for genre in genres_elem] if genres_elem else []
        
        # Episodes
        episodes_elem = soup.select_one('.encyc-info-type:contains("Number of episodes:")')
        episodes = None
        if episodes_elem and (match := re.search(r'Number of episodes:\s*(\d+)', episodes_elem.parent.text if episodes_elem else "")):
            episodes = int(match[1])
        
        # Données structurées pour Supabase
        return {
            "title": title,
            "poster": poster,
            "year": year,
            "language": "ja",  # Japonais par défaut pour les animes
            "description": description,
            "synopsis": synopsis,
            "genres": genres,
            "episodes": episodes,
            "streaming_urls": [{"quality": "HD", "url": anime_url}],
        }

class AnimeDBScraper(BaseScraper):
    """Scraper pour AnimeDB"""
    
    def __init__(self):
        super().__init__(
            source_id="animedb",
            target_table="animes",
            base_url="https://anidb.net"
        )
        self.rate_limit_delay = 5  # Plus lent pour éviter les blocages
    
    def get_content_urls(self, limit: int = 300) -> List[str]:
        """Récupère les URLs des animes depuis AnimeDB"""
        anime_urls = []
        
        # Liste des animes populaires
        for page in range(1, 6):  # 5 pages devraient suffire pour atteindre la limite
            popular_url = f"{self.base_url}/anime/?h=1&noalias=1&orderby.name=1.1&orderby.rating=0.2&page={page}"
            html = ScraperUtils.fetch_page(popular_url, self.base_url)
            if not html:
                continue
                
            soup = BeautifulSoup(html, 'html.parser')
            anime_rows = soup.select('table.animelist tr.g_odd, table.animelist tr.g_even')
            
            for row in anime_rows:
                link = row.select_one('td.name a')
                if (anime_url := link.get('href')):
                    anime_id = anime_url.split('=')[-1]
                    anime_url = f"{self.base_url}/anime/{anime_id}"
                    anime_urls.append(anime_url)
                    
                    # Limiter le nombre d'URLs
                    if len(anime_urls) >= limit:
                        break
            
            if len(anime_urls) >= limit:
                break
        
        self.logger.info(f"Trouvé {len(anime_urls)} animes sur AnimeDB")
        return anime_urls
    
    def extract_content_details(self, anime_url: str) -> Optional[Dict[str, Any]]:
        """Extrait les détails d'un anime depuis AnimeDB"""
        html = ScraperUtils.fetch_page(anime_url, self.base_url)
        if not html:
            return None
        
        soup = BeautifulSoup(html, 'html.parser')
        
        # Extraction des informations de base
        title_elem = soup.select_one('h1.anime')
        title = title_elem.text.strip() if title_elem else "Titre inconnu"
        
        # Titre japonais/original
        original_title_elem = soup.select_one('.titles span.ja')
        original_title = original_title_elem.text.strip() if original_title_elem else None
        
        # Image du poster
        poster_elem = soup.select_one('.image img')
        poster = urljoin(self.base_url, poster_elem.get('src')) if poster_elem and poster_elem.get('src') else None
        
        # Année et date de sortie
        year = None
        date_elem = soup.select_one('span.year')
        if date_elem and (year_match := re.search(r'(\d{4})', date_elem.text)):
            year = int(year_match[1])
        
        # Note
        rating_elem = soup.select_one('span.rating span.value')
        rating = float(rating_elem.text) if rating_elem and rating_elem.text.strip() else None
        
        # Synopsis
        synopsis_elem = soup.select_one('div.desc')
        synopsis = synopsis_elem.text.strip() if synopsis_elem else ""
        
        # Description courte
        description = ScraperUtils.create_description(synopsis)
        
        # Genres
        genres_elem = soup.select('span.tags a')
        genres = [genre.text.strip() for genre in genres_elem] if genres_elem else []
        
        # Episodes
        episodes_elem = soup.select_one('span.eps')
        episodes = None
        if episodes_elem and (match := re.search(r'(\d+)', episodes_elem.text)):
            episodes = int(match[1])
        
        # Statut
        status_elem = soup.select_one('span.status')
        status = status_elem.text.strip() if status_elem else None
        
        # Données structurées pour Supabase
        return {
            "title": title,
            "original_title": original_title,
            "poster": poster,
            "year": year,
            "rating": rating,
            "language": "ja",  # Japonais par défaut pour les animes
            "description": description,
            "synopsis": synopsis,
            "genres": genres,
            "episodes": episodes,
            "status": status,
            "streaming_urls": [{"quality": "HD", "url": anime_url}],
        }

#######################
# SCRAPERS POUR FILMS
#######################

class KaedeAPIScraper(BaseScraper):
    """Scraper pour l'API Kaede (Films)"""
    
    def __init__(self):
        super().__init__(
            source_id="kaede_api",
            target_table="films",
            base_url="https://api.kaede-no-ki.dev"
        )
    
    def get_content_urls(self, limit: int = 300) -> List[str]:
        """Récupère les IDs des films depuis l'API Kaede"""
        film_ids = []
        
        # Récupérer les films populaires
        self._fetch_films_from_endpoint(f"{self.base_url}/v1/movie/popular", film_ids, "films populaires")
        
        # Récupérer les films les mieux notés
        self._fetch_films_from_endpoint(f"{self.base_url}/v1/movie/top_rated", film_ids, "films les mieux notés")
        
        # Récupérer les films à venir
        self._fetch_films_from_endpoint(f"{self.base_url}/v1/movie/upcoming", film_ids, "films à venir", limit)
        
        self.logger.info(f"Trouvé {len(film_ids)} IDs de films sur Kaede API")
        return film_ids
    
    def _fetch_films_from_endpoint(self, endpoint_url: str, film_ids: List[str], endpoint_name: str, limit: int = None) -> None:
        """Récupère les IDs des films depuis un endpoint de l'API Kaede"""
        if not (response := ScraperUtils.fetch_page(endpoint_url)):
            return
            
        try:
            if not (data := json.loads(response)):
                return
            results = data.get('results', [])
            for film in results:
                if (film_id := film.get('id')):
                    if str(film_id) not in film_ids:
                        film_ids.append(str(film_id))
                        
                        # Limiter le nombre d'IDs si une limite est spécifiée
                        if limit and len(film_ids) >= limit:
                            break
                
            if limit and len(film_ids) >= limit:
                return
                    
        except json.JSONDecodeError:
            self.logger.error(f"Erreur lors du décodage JSON des {endpoint_name}")
    
    def extract_content_details(self, film_id: str) -> Optional[Dict[str, Any]]:
        """Extrait les détails d'un film depuis l'API Kaede"""
        film_url = f"{self.base_url}/v1/movie/{film_id}"
        
        if not (response := ScraperUtils.fetch_page(film_url)):
            return None
        
        try:
            if not (data := json.loads(response)):
                return None
            
            # Extraction des informations de base
            title = data.get('title', "Titre inconnu")
            original_title = data.get('original_title')
            poster_path = data.get('poster_path')
            poster = f"https://image.tmdb.org/t/p/w500{poster_path}" if poster_path else None
            backdrop_path = data.get('backdrop_path')
            backdrop = f"https://image.tmdb.org/t/p/original{backdrop_path}" if backdrop_path else None
            
            # Informations détaillées
            year = None
            release_date = data.get('release_date')
            if release_date and (year_match := re.search(r'(\d{4})', release_date)):
                year = int(year_match[1])
        
            # Note
            rating = ScraperUtils.safe_float_parse(str(data.get('vote_average')))
            
            # Synopsis
            if (overview := data.get('overview', "")):
                # Description courte
                description = ScraperUtils.create_description(overview)
            else:
                overview = ""
                description = ""
            
            # Genres
            genres = []
            genres_data = data.get('genres', [])
            for genre in genres_data:
                genre_name = genre.get('name')
                if genre_name:
                    genres.append(genre_name)
            
            # Langue
            language = data.get('original_language', 'en')
            
            # Durée
            runtime = data.get('runtime')
            
            # Données structurées pour Supabase
            return {
                "title": title,
                "original_title": original_title,
                "poster": poster,
                "backdrop": backdrop,
                "year": year,
                "rating": rating,
                "language": language,
                "description": description,
                "synopsis": overview,
                "genres": genres,
                "duration": runtime,
                "streaming_urls": [{"quality": "HD", "url": f"https://www.themoviedb.org/movie/{film_id}"}],
            }
            
        except json.JSONDecodeError:
            self.logger.error(f"Erreur lors du décodage JSON du film {film_id}")
            return None

class FilmWebScraper(BaseScraper):
    """Scraper pour FilmWeb"""
    
    def __init__(self):
        super().__init__(
            source_id="filmweb",
            target_table="films",
            base_url="https://www.filmweb.pl"
        )
    
    def get_content_urls(self, limit: int = 300) -> List[str]:
        """Récupère les URLs des films depuis FilmWeb"""
        film_urls = []
        
        # Top films
        top_url = f"{self.base_url}/rankings/film/top"
        html = ScraperUtils.fetch_page(top_url, self.base_url)
        if not html:
            return film_urls
            
        soup = BeautifulSoup(html, 'html.parser')
        film_items = soup.select('.rankingType__title a')
        
        for item in film_items:
            if (film_url := item.get('href')):
                film_url = urljoin(self.base_url, film_url)
                film_urls.append(film_url)
                
                # Limiter le nombre d'URLs
                if len(film_urls) >= limit:
                    break
        
        # Films récents
        if len(film_urls) < limit:
            recent_url = f"{self.base_url}/films/search?orderBy=DATE_DESC"
            if not (html := ScraperUtils.fetch_page(recent_url, self.base_url)) or not (soup := BeautifulSoup(html, 'html.parser')):
                return film_urls
            
            film_items = soup.select('.filmPreview__title a')
            
            for item in film_items:
                if (film_url := item.get('href')):
                    film_url = urljoin(self.base_url, film_url)
                    if film_url not in film_urls:
                        film_urls.append(film_url)
                        
                        # Limiter le nombre d'URLs
                        if len(film_urls) >= limit:
                            break
        
        self.logger.info(f"Trouvé {len(film_urls)} films sur FilmWeb")
        return film_urls
    
    def extract_content_details(self, film_url: str) -> Optional[Dict[str, Any]]:
        """Extrait les détails d'un film depuis FilmWeb"""
        html = ScraperUtils.fetch_page(film_url, self.base_url)
        if not html:
            return None
        
        soup = BeautifulSoup(html, 'html.parser')
        
        # Extraction des informations de base
        title_elem = soup.select_one('h1.filmCoverSection__title')
        title = title_elem.text.strip() if title_elem else "Titre inconnu"
        
        # Titre original
        original_title_elem = soup.select_one('.filmCoverSection__originalTitle')
        original_title = original_title_elem.text.strip() if original_title_elem else None
        
        # Image du poster
        poster_elem = soup.select_one('.filmPoster__image')
        poster = poster_elem.get('src') if poster_elem and poster_elem.get('src') else None
        
        # Année
        year_elem = soup.select_one('.filmCoverSection__year')
        year = None
        if year_elem and (year_match := re.search(r'(\d{4})', year_elem.text)):
            year = int(year_match[1])
        
        # Note
        rating_elem = soup.select_one('.filmRating__rateValue')
        rating = None
        if rating_elem and rating_elem.text.strip():
            rating = ScraperUtils.safe_float_parse(rating_elem.text.replace(',', '.'))
        
        # Synopsis
        synopsis_elem = soup.select_one('.filmPosterSection__plot')
        synopsis = synopsis_elem.text.strip() if synopsis_elem else ""
        
        # Description courte
        description = ScraperUtils.create_description(synopsis)
        
        # Genres
        genres_elem = soup.select('.filmInfo__info--genres a')
        genres = [genre.text.strip() for genre in genres_elem] if genres_elem else []
        
        # Durée
        duration = None
        duration_elem = soup.select_one('.filmCoverSection__duration')
        if duration_elem and (duration_match := re.search(r'(\d+)\s*min', duration_elem.text)):
            duration = int(duration_match[1])
        
        # Pays
        if (country_elem := soup.select_one('.filmInfo__info--countries a')):
            country = country_elem.text.strip()
        else:
            country = None
        
        # Langue
        language = country or "en"  # Utiliser la valeur fournie ou "en" par défaut
        
        # Données structurées pour Supabase
        return {
            "title": title,
            "original_title": original_title,
            "poster": poster,
            "year": year,
            "rating": rating,
            "language": language,
            "description": description,
            "synopsis": synopsis,
            "genres": genres,
            "duration": duration,
            "streaming_urls": [{"quality": "HD", "url": film_url}],
        }

class AlloCineScraper(BaseScraper):
    """Scraper pour AlloCine"""
    
    def __init__(self):
        super().__init__(
            source_id="allocine",
            target_table="films",
            base_url="https://www.allocine.fr"
        )
    
    def get_content_urls(self, limit: int = 300) -> List[str]:
        """Récupère les URLs des films depuis AlloCine"""
        film_urls = []
        
        # Films par catégorie
        categories = ["top", "recent", "popular"]
        self._fetch_films_by_categories(categories, film_urls, limit)
        
        self.logger.info(f"Trouvé {len(film_urls)} films sur AlloCine")
        return film_urls
    
    def _fetch_films_by_categories(self, categories: List[str], film_urls: List[str], limit: int) -> None:
        """Récupère les films par catégories"""
        for category in categories:
            category_url = f"{self.base_url}/film/{category}"
            html = ScraperUtils.fetch_page(category_url, self.base_url)
            if html and (soup := BeautifulSoup(html, 'html.parser')):
                film_items = soup.select('.card-entity .meta-title-link')
                
                for item in film_items:
                    if (film_url := item.get('href')):
                        film_url = urljoin(self.base_url, film_url)
                        if film_url not in film_urls:
                            film_urls.append(film_url)
                            
                            # Limiter le nombre d'URLs
                            if len(film_urls) >= limit:
                                break
                
                if len(film_urls) >= limit:
                    break
    
    def extract_content_details(self, film_url: str) -> Optional[Dict[str, Any]]:
        """Extrait les détails d'un film depuis AlloCine"""
        html = ScraperUtils.fetch_page(film_url, self.base_url)
        if not html:
            return None
        
        soup = BeautifulSoup(html, 'html.parser')
        
        # Extraction des informations de base
        title = "Titre inconnu"
        if (title_elem := soup.select_one('.titlebar-title')):
            title = title_elem.text.strip()
        
        # Image du poster
        poster = None
        if (poster_elem := soup.select_one('.poster img')):
            poster = poster_elem.get('src')
        
        # Année
        year = None
        if (date_elem := soup.select_one('span.date')):
            year = ScraperUtils.parse_year(date_elem.text)
        
        # Note
        rating = None
        if (rating_elem := soup.select_one('span[data-testid="hero-rating-bar__aggregate-rating__score"]')):
            rating = ScraperUtils.safe_float_parse(rating_elem.text)
        
        # Synopsis
        synopsis = ""
        if (synopsis_elem := soup.select_one('div.content-txt')):
            synopsis = synopsis_elem.text.strip()
        elif (synopsis_elem := soup.select_one('span[data-testid="plot-l"]')):
            synopsis = synopsis_elem.text.strip()
        
        # Description courte
        description = ScraperUtils.create_description(synopsis)
        
        # Genres
        genres = []
        if (genres_elem := soup.select('.meta-body-item span.blue-link')):
            genres = [genre.text.strip() for genre in genres_elem]
        
        # Durée
        duration = None
        if (duration_elem := soup.select_one('.meta-body-item .meta-body-info')):
            duration = ScraperUtils.parse_duration(duration_elem.text)
        
        # Réalisateur
        director = None
        if (director_elem := soup.select_one('.meta-body-item .blue-link[href*="/personne/"]')):
            director = director_elem.text.strip()
        
        # Acteurs
        actors = []
        if (actors_elem := soup.select('.meta-body-item .blue-link[href*="/personne/"]')):
            actors = [actor.text.strip() for actor in actors_elem[1:4]]  # Prendre les 3 premiers acteurs
        
        # Pays
        country = None
        if (country_elem := soup.select_one('.meta-body-item:contains("Nationalité") .blue-link')):
            country = country_elem.text.strip()
        
        # Langue
        language = "fr"  # Français par défaut pour AlloCine
        
        # Données structurées pour Supabase
        return {
            "title": title,
            "poster": poster,
            "year": year,
            "rating": rating,
            "language": language,
            "description": description,
            "synopsis": synopsis,
            "genres": genres,
            "duration": duration,
            "director": director,
            "actors": actors,
            "streaming_urls": [{"quality": "HD", "url": film_url}],
        }

class IMDBScraper(BaseScraper):
    """Scraper pour IMDB"""
    
    def __init__(self):
        super().__init__(
            source_id="imdb",
            target_table="films",
            base_url="https://www.imdb.com"
        )
        self.rate_limit_delay = 3  # Plus lent pour éviter les blocages
    
    def get_content_urls(self, limit: int = 300) -> List[str]:
        """Récupère les URLs des films depuis IMDB"""
        film_urls = []
        
        # Films par catégorie
        categories = ["top", "popular", "upcoming"]
        for category in categories:
            category_url = f"{self.base_url}/chart/{category}"
            html = ScraperUtils.fetch_page(category_url, self.base_url)
            if html and (soup := BeautifulSoup(html, 'html.parser')):
                film_items = soup.select('.ipc-title-link-wrapper')
                
                for item in film_items:
                    if (film_url := item.get('href')):
                        film_url = urljoin(self.base_url, film_url)
                        if film_url not in film_urls:
                            film_urls.append(film_url)
                            
                            # Limiter le nombre d'URLs
                            if len(film_urls) >= limit:
                                break
                
                if len(film_urls) >= limit:
                    break
        
        self.logger.info(f"Trouvé {len(film_urls)} films sur IMDB")
        return film_urls
    
    def extract_content_details(self, film_url: str) -> Optional[Dict[str, Any]]:
        """Extrait les détails d'un film depuis IMDB"""
        html = ScraperUtils.fetch_page(film_url, self.base_url)
        if not html:
            return None
        
        soup = BeautifulSoup(html, 'html.parser')
        
        # Extraction des informations de base
        title = "Titre inconnu"
        if (title_elem := soup.select_one('h1[data-testid="hero__pageTitle"]')):
            title = title_elem.text.strip()
        
        # Image du poster
        poster = None
        if (poster_elem := soup.select_one('img.ipc-image')):
            poster = poster_elem.get('src')
        
        # Année
        year = None
        if (year_elem := soup.select_one('a[href*="/releaseinfo"]')):
            year = ScraperUtils.parse_year(year_elem.text)
        
        # Note
        rating = None
        if (rating_elem := soup.select_one('span[data-testid="hero-rating-bar__aggregate-rating__score"]')):
            rating = ScraperUtils.safe_float_parse(rating_elem.text)
        
        # Synopsis
        synopsis = ""
        if (synopsis_elem := soup.select_one('span[data-testid="plot-xl"]')):
            synopsis = synopsis_elem.text.strip()
        elif (synopsis_elem := soup.select_one('span[data-testid="plot-l"]')):
            synopsis = synopsis_elem.text.strip()
        
        # Description courte
        description = ScraperUtils.create_description(synopsis)
        
        # Genres
        genres = []
        if (genres_elem := soup.select('a[href*="/genres/"]')):
            genres = [genre.text.strip() for genre in genres_elem]
        
        # Durée
        duration = None
        if (duration_elem := soup.select_one('div[data-testid="title-techspecs-section"] li:contains("Runtime")')):
            duration = ScraperUtils.parse_duration(duration_elem.text)
        
        # Réalisateur
        director = None
        if (director_elem := soup.select_one('a[href*="/name/"][href*="?ref_=tt_ov_dr"]')):
            director = director_elem.text.strip()
        
        # Acteurs
        actors = []
        if (actors_elem := soup.select('a[href*="/name/"][href*="?ref_=tt_ov_st"]')):
            actors = [actor.text.strip() for actor in actors_elem]
        
        # Pays
        country = None
        if (country_elem := soup.select_one('a[href*="/country/"]')):
            country = country_elem.text.strip()
        
        # Langue
        language = "en"  # Anglais par défaut pour IMDB
        if (language_elem := soup.select_one('a[href*="/language/"]')):
            language_text = language_elem.text.strip().lower()
            language_map = {
                "english": "en",
                "french": "fr",
                "german": "de",
                "italian": "it",
                "spanish": "es",
                "japanese": "ja",
                "korean": "ko",
                "chinese": "zh",
                "hindi": "hi",
                "russian": "ru"
            }
            language = language_map.get(language_text, "en")
        
        # Données structurées pour Supabase
        return {
            "title": title,
            "poster": poster,
            "year": year,
            "rating": rating,
            "language": language,
            "description": description,
            "synopsis": synopsis,
            "genres": genres,
            "duration": duration,
            "director": director,
            "actors": actors,
            "streaming_urls": [{"quality": "HD", "url": film_url}],
        }

# Fonction pour obtenir tous les scrapers d'animes
def get_all_anime_scrapers():
    """Retourne tous les scrapers d'animes disponibles"""
    return [
        MyAnimeListScraper(),
        VoirAnimeScraper(),
        AnimeNewsScraper(),
        AnimeDBScraper()
    ]

# Fonction pour obtenir tous les scrapers de films
def get_all_film_scrapers():
    """Retourne tous les scrapers de films disponibles"""
    return [
        KaedeAPIScraper(),
        FilmWebScraper(),
        AlloCineScraper(),
        IMDBScraper()
    ]
