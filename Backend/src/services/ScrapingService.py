import asyncio
import aiohttp
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional
from bs4 import BeautifulSoup
from langdetect import detect
from motor.motor_asyncio import AsyncIOMotorClient
from redis import Redis
from opensearchpy import AsyncOpenSearch

class ScrapingService:
    def __init__(self, mongodb_uri: str, redis_host: str, opensearch_endpoint: str):
        self.mongodb = AsyncIOMotorClient(mongodb_uri)
        self.db = self.mongodb.flodrama
        self.redis = Redis(host=redis_host, decode_responses=True)
        self.opensearch = AsyncOpenSearch(hosts=[opensearch_endpoint])
        self.logger = logging.getLogger(__name__)

        self.base_urls = {
            'vostfree': 'https://vostfree.cx',
            'dramacool': 'https://dramacool.cy',
            'myasiantv': 'https://myasiantv.cx',
            'dramabus': 'https://dramabus.cx'
        }
        
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'fr,fr-FR;q=0.8,en-US;q=0.5,en;q=0.3',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Cache-Control': 'max-age=0'
        }
        
        self.quality_patterns = {
            '1080p': r'1080[pP]|HD|HIGH',
            '720p': r'720[pP]|HD',
            '480p': r'480[pP]|SD',
            '360p': r'360[pP]|LOW'
        }

    async def classify_content(self, metadata: Dict) -> str:
        """Classifie le contenu en fonction des métadonnées"""
        title = metadata.get('title', '').lower()
        description = metadata.get('description', '').lower()
        tags = metadata.get('tags', [])
        
        # Détection de la langue
        try:
            language = detect(description if description else title)
        except:
            language = 'unknown'

        # Classification par type
        if any(tag in ['kdrama', 'k-drama', 'korean drama'] for tag in tags):
            return 'drama'
        elif any(tag in ['anime', 'animation japonaise'] for tag in tags):
            return 'anime'
        elif any(tag in ['bollywood', 'film indien'] for tag in tags):
            return 'bollywood'
        elif language in ['ja', 'ko', 'zh'] and 'movie' in tags:
            return 'film'
        
        # Classification avancée basée sur le contenu
        content_indicators = {
            'drama': ['드라마', 'ドラマ', 'drama', 'série coréenne'],
            'anime': ['アニメ', '애니메이션', 'anime'],
            'bollywood': ['बॉलीवुड', 'bollywood', 'फिल्म'],
            'film': ['映画', '영화', 'movie', 'film']
        }

        for category, indicators in content_indicators.items():
            if any(indicator in title.lower() or indicator in description.lower() 
                  for indicator in indicators):
                return category

        return 'unknown'

    async def process_metadata(self, raw_metadata: Dict) -> Dict:
        """Traite et enrichit les métadonnées"""
        try:
            # Extraction des URLs de streaming
            streaming_data = await self.extract_streaming_urls(raw_metadata.get('source_url', ''))

            processed = {
                # Métadonnées de base
                'title': raw_metadata.get('title'),
                'original_title': raw_metadata.get('original_title'),
                'description': raw_metadata.get('description'),
                'type': await self.classify_content(raw_metadata),
                'language': detect(raw_metadata.get('description', '')),
                
                # Informations temporelles
                'release_date': raw_metadata.get('release_date'),
                'duration': raw_metadata.get('duration'),
                'last_updated': datetime.utcnow().isoformat(),
                
                # Catégorisation
                'genres': raw_metadata.get('genres', []),
                'tags': raw_metadata.get('tags', []),
                
                # Équipe de production
                'cast': raw_metadata.get('cast', []),
                'director': raw_metadata.get('director'),
                
                # Médias
                'poster_url': raw_metadata.get('poster_url'),
                'backdrop_url': raw_metadata.get('backdrop_url'),
                'trailer_url': raw_metadata.get('trailer_url'),
                'screenshots': raw_metadata.get('screenshots', [])[:5],  # Limite à 5 captures
                
                # Informations de série
                'total_episodes': raw_metadata.get('total_episodes'),
                'current_episode': raw_metadata.get('current_episode'),
                'season_number': raw_metadata.get('season_number'),
                'episode_title': raw_metadata.get('episode_title'),
                
                # Statut et notation
                'status': raw_metadata.get('status', 'available'),
                'rating': raw_metadata.get('rating'),
                'age_rating': raw_metadata.get('age_rating'),
                
                # URLs de streaming et qualités disponibles
                'streaming_sources': streaming_data,
                
                # Scores et statistiques
                'popularity_score': 0,
                'quality_score': 0,
                'view_count': 0,
                'like_count': 0,
                'dislike_count': 0
            }

            # Calcul des scores
            processed['popularity_score'] = await self.calculate_popularity_score(processed)
            processed['quality_score'] = await self.calculate_quality_score(processed)

            return processed
        except Exception as e:
            self.logger.error(f"Erreur lors du traitement des métadonnées: {str(e)}")
            return raw_metadata

    async def extract_streaming_urls(self, source_url: str) -> Dict:
        """Extrait les URLs de streaming et leurs métadonnées"""
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(source_url, headers=self.headers) as response:
                    if response.status != 200:
                        return {'sources': [], 'last_checked': datetime.utcnow().isoformat()}

                    soup = BeautifulSoup(await response.text(), 'html.parser')
                    streaming_sources = []

                    # Recherche des sources de streaming
                    for player in soup.find_all(['iframe', 'video', 'source']):
                        url = player.get('src') or player.get('data-src')
                        if url and await self.validate_stream_url(url):
                            source = {
                                'url': url,
                                'quality': self.detect_quality(url, player),
                                'provider': self.get_provider_name(url),
                                'format': player.get('type', 'video/mp4'),
                                'subtitle_url': player.get('data-subtitle'),
                                'is_dubbed': 'dub' in url.lower(),
                                'valid_until': (datetime.utcnow() + timedelta(hours=24)).isoformat()
                            }
                            streaming_sources.append(source)

                    return {
                        'sources': streaming_sources,
                        'last_checked': datetime.utcnow().isoformat(),
                        'next_check': (datetime.utcnow() + timedelta(hours=6)).isoformat()
                    }

        except Exception as e:
            self.logger.error(f"Erreur lors de l'extraction des URLs de streaming: {str(e)}")
            return {'sources': [], 'last_checked': datetime.utcnow().isoformat()}

    async def validate_stream_url(self, url: str) -> bool:
        """Valide une URL de streaming"""
        try:
            # Liste des domaines de streaming autorisés
            valid_domains = ['vidcloud', 'streamtape', 'fembed', 'mixdrop', 'upstream']
            domain = url.split('/')[2].lower()
            
            return any(provider in domain for provider in valid_domains)
        except:
            return False

    def detect_quality(self, url: str, player_tag) -> str:
        """Détecte la qualité du stream"""
        quality_indicators = {
            '4k': ['2160p', '4k', 'uhd'],
            '1080p': ['1080p', 'fhd'],
            '720p': ['720p', 'hd'],
            '480p': ['480p', 'sd']
        }

        # Vérification des attributs du player
        player_quality = player_tag.get('data-quality', '').lower()
        
        # Vérification de l'URL et des attributs
        url_lower = url.lower()
        for quality, indicators in quality_indicators.items():
            if any(indicator in url_lower for indicator in indicators) or any(indicator in player_quality for indicator in indicators):
                return quality

        return '480p'  # Qualité par défaut

    def get_provider_name(self, url: str) -> str:
        """Extrait le nom du fournisseur de streaming"""
        try:
            domain = url.split('/')[2]
            provider = domain.split('.')[0]
            return provider.lower()
        except:
            return 'unknown'

    async def calculate_quality_score(self, metadata: Dict) -> float:
        """Calcule un score de qualité pour les métadonnées"""
        score = 0.0
        
        # Vérification des éléments essentiels
        required_fields = [
            ('title', 10),
            ('description', 15),
            ('poster_url', 10),
            ('backdrop_url', 5),
            ('trailer_url', 10),
            ('cast', 10),
            ('director', 5),
            ('genres', 5),
            ('streaming_sources', 20)
        ]

        for field, weight in required_fields:
            if field in metadata and metadata[field]:
                if isinstance(metadata[field], list):
                    score += weight * min(len(metadata[field]) / 3, 1)
                elif isinstance(metadata[field], dict):
                    score += weight * (len(metadata[field].get('sources', [])) > 0)
                else:
                    score += weight

        # Bonus pour les médias supplémentaires
        if metadata.get('screenshots'):
            score += 5 * min(len(metadata['screenshots']) / 5, 1)

        # Bonus pour la qualité des streams
        if 'streaming_sources' in metadata:
            sources = metadata['streaming_sources'].get('sources', [])
            hd_sources = sum(1 for s in sources if s.get('quality', '') in ['1080p', '720p'])
            score += 10 * min(hd_sources / 2, 1)

        return min(score, 100)

    async def calculate_popularity_score(self, metadata: Dict) -> float:
        """Calcule un score de popularité basé sur plusieurs facteurs"""
        score = 0.0
        
        # Score basé sur la date de sortie
        if metadata.get('release_date'):
            release_date = datetime.strptime(metadata['release_date'], '%Y-%m-%d')
            days_old = (datetime.utcnow() - release_date).days
            if days_old <= 30:  # Contenu récent
                score += 20
            elif days_old <= 90:
                score += 10
            elif days_old <= 180:
                score += 5

        # Score basé sur les interactions (depuis Redis)
        content_id = str(metadata.get('_id'))
        views = int(self.redis.get(f'views:{content_id}') or 0)
        likes = int(self.redis.get(f'likes:{content_id}') or 0)
        comments = int(self.redis.get(f'comments:{content_id}') or 0)

        score += min(views / 100, 30)  # Max 30 points pour les vues
        score += min(likes / 10, 25)   # Max 25 points pour les likes
        score += min(comments / 5, 15) # Max 15 points pour les commentaires

        # Score basé sur la complétude des métadonnées
        metadata_fields = ['description', 'genres', 'cast', 'director', 'poster_url']
        score += sum(2 for field in metadata_fields if metadata.get(field)) # Max 10 points

        return min(score, 100)  # Score maximum de 100

    async def update_search_index(self, content_id: str, metadata: Dict):
        """Met à jour l'index de recherche"""
        search_doc = {
            'content_id': content_id,
            'title': metadata['title'],
            'original_title': metadata.get('original_title', ''),
            'description': metadata['description'],
            'type': metadata['type'],
            'genres': metadata['genres'],
            'tags': metadata['tags'],
            'language': metadata['language'],
            'cast': metadata['cast'],
            'director': metadata['director'],
            'popularity_score': metadata['popularity_score'],
            'release_date': metadata['release_date'],
            'status': metadata['status']
        }

        await self.opensearch.index(
            index='content',
            id=content_id,
            body=search_doc,
            refresh=True
        )

    async def store_content(self, metadata: Dict):
        """Stocke le contenu dans MongoDB et met à jour les index"""
        processed_metadata = await self.process_metadata(metadata)
        
        # Stockage dans MongoDB
        result = await self.db.contents.insert_one(processed_metadata)
        content_id = str(result.inserted_id)

        # Mise à jour du cache Redis
        cache_key = f'content:{content_id}'
        self.redis.setex(
            cache_key,
            3600,  # TTL 1 heure
            str(processed_metadata)
        )

        # Mise à jour de l'index de recherche
        await self.update_search_index(content_id, processed_metadata)

        # Mise à jour des compteurs par catégorie
        category_key = f'category_count:{processed_metadata["type"]}'
        self.redis.incr(category_key)

        return content_id

    async def update_content_widgets(self):
        """Met à jour les widgets de contenu"""
        categories = ['drama', 'anime', 'bollywood', 'film']
        
        for category in categories:
            # Récupération des contenus populaires par catégorie
            popular_content = await self.db.contents.find(
                {'type': category},
                sort=[('popularity_score', -1)],
                limit=10
            ).to_list(length=10)

            # Mise en cache des widgets
            widget_key = f'widget:popular:{category}'
            self.redis.setex(
                widget_key,
                3600,  # TTL 1 heure
                str([{
                    'id': str(content['_id']),
                    'title': content['title'],
                    'poster_url': content['poster_url'],
                    'rating': content['rating']
                } for content in popular_content])
            )

    async def generate_content_cards(self, category: str, limit: int = 20) -> List[Dict]:
        """Génère les cartes de contenu pour une catégorie"""
        cache_key = f'content_cards:{category}'
        cached_cards = self.redis.get(cache_key)

        if cached_cards:
            return eval(cached_cards)

        # Récupération des contenus avec tri intelligent
        contents = await self.db.contents.find(
            {'type': category},
            sort=[
                ('popularity_score', -1),
                ('release_date', -1)
            ],
            limit=limit
        ).to_list(length=limit)

        cards = [{
            'id': str(content['_id']),
            'title': content['title'],
            'original_title': content.get('original_title'),
            'poster_url': content['poster_url'],
            'rating': content['rating'],
            'genres': content['genres'][:3],  # Limite à 3 genres
            'release_year': content['release_date'][:4] if content.get('release_date') else None
        } for content in contents]

        # Mise en cache des cartes
        self.redis.setex(
            cache_key,
            1800,  # TTL 30 minutes
            str(cards)
        )

        return cards

    async def schedule_scraping_tasks(self):
        """Planifie les tâches de scraping"""
        current_hour = datetime.utcnow().hour
        
        # Définition des périodes de scraping optimales
        scraping_schedule = {
            'drama': [2, 8, 14, 20],    # Toutes les 6 heures
            'anime': [1, 13],           # Deux fois par jour
            'bollywood': [3, 15],       # Deux fois par jour
            'film': [4, 16]             # Deux fois par jour
        }

        for category, hours in scraping_schedule.items():
            if current_hour in hours:
                await self.queue_scraping_task(category)

    async def queue_scraping_task(self, category: str):
        """Ajoute une tâche de scraping à la file d'attente"""
        task = {
            'category': category,
            'timestamp': datetime.utcnow().isoformat(),
            'priority': 1 if category == 'drama' else 2
        }

        # Envoi à SQS via Lambda
        await self.db.scraping_tasks.insert_one(task)

    async def cleanup_old_content(self):
        """Nettoie les contenus obsolètes"""
        threshold = datetime.utcnow() - timedelta(days=90)
        
        old_content = await self.db.contents.find({
            'processed_at': {'$lt': threshold},
            'popularity_score': {'$lt': 10}
        }).to_list(length=None)

        for content in old_content:
            content_id = str(content['_id'])
            
            # Suppression des caches
            self.redis.delete(f'content:{content_id}')
            self.redis.delete(f'views:{content_id}')
            
            # Suppression de l'index de recherche
            await self.opensearch.delete(
                index='content',
                id=content_id,
                ignore=[404]
            )
            
            # Suppression de MongoDB
            await self.db.contents.delete_one({'_id': content['_id']})

    async def fetch_page(self, url: str) -> Optional[str]:
        try:
            async with aiohttp.ClientSession(headers=self.headers) as session:
                async with session.get(url, timeout=30) as response:
                    if response.status == 200:
                        return await response.text()
                    logging.warning(f"Erreur lors de la récupération de {url}: {response.status}")
                    return None
        except Exception as e:
            logging.error(f"Exception lors de la récupération de {url}: {str(e)}")
            return None

    async def extract_vostfree_content(self, url: str) -> Dict:
        html = await self.fetch_page(url)
        if not html:
            return {}

        soup = BeautifulSoup(html, 'html.parser')
        
        # Extraction des métadonnées de base
        title_elem = soup.find('h1', class_='title')
        title = title_elem.text.strip() if title_elem else ''
        
        # Extraction de l'image
        poster = soup.find('div', class_='poster')
        poster_url = poster.find('img')['src'] if poster and poster.find('img') else ''
        
        # Extraction des informations détaillées
        info_div = soup.find('div', class_='info')
        details = {}
        if info_div:
            for item in info_div.find_all('p'):
                label = item.find('span')
                if label:
                    key = label.text.strip().lower()
                    value = item.text.replace(label.text, '').strip()
                    details[key] = value

        # Extraction des URLs de streaming
        player_div = soup.find('div', class_='player')
        streaming_urls = []
        if player_div:
            for iframe in player_div.find_all('iframe'):
                stream_url = iframe.get('src', '')
                if stream_url:
                    quality = self.detect_quality(stream_url)
                    streaming_urls.append({
                        'url': stream_url,
                        'quality': quality,
                        'source': 'vostfree',
                        'language': 'VOSTFR'
                    })

        return {
            'title': title,
            'poster_url': poster_url,
            'details': details,
            'streaming_urls': streaming_urls,
            'source': 'vostfree'
        }

    async def extract_dramacool_content(self, url: str) -> Dict:
        html = await self.fetch_page(url)
        if not html:
            return {}

        soup = BeautifulSoup(html, 'html.parser')
        
        # Extraction des métadonnées
        title_elem = soup.find('h1', class_='title')
        title = title_elem.text.strip() if title_elem else ''
        
        info_div = soup.find('div', class_='info')
        details = {}
        if info_div:
            for item in info_div.find_all(['p', 'div']):
                label = item.find('span', class_='type')
                if label:
                    key = label.text.strip().lower()
                    value = item.text.replace(label.text, '').strip()
                    details[key] = value

        # Extraction de l'image et du synopsis
        poster = soup.find('div', class_='poster')
        poster_url = poster.find('img')['src'] if poster and poster.find('img') else ''
        
        synopsis = soup.find('div', class_='description')
        synopsis_text = synopsis.text.strip() if synopsis else ''

        # Extraction des URLs de streaming
        streaming_urls = []
        player_div = soup.find('div', id='player')
        if player_div:
            for source in player_div.find_all('source'):
                stream_url = source.get('src', '')
                if stream_url:
                    quality = source.get('label', '') or self.detect_quality(stream_url)
                    streaming_urls.append({
                        'url': stream_url,
                        'quality': quality,
                        'source': 'dramacool',
                        'language': 'VOSTFR'
                    })

        return {
            'title': title,
            'poster_url': poster_url,
            'synopsis': synopsis_text,
            'details': details,
            'streaming_urls': streaming_urls,
            'source': 'dramacool'
        }

    async def extract_myasiantv_content(self, url: str) -> Dict:
        html = await self.fetch_page(url)
        if not html:
            return {}

        soup = BeautifulSoup(html, 'html.parser')
        
        # Extraction des métadonnées
        title_elem = soup.find('h1', class_='video-title')
        title = title_elem.text.strip() if title_elem else ''
        
        # Extraction des détails
        info_div = soup.find('div', class_='video-info')
        details = {}
        if info_div:
            for item in info_div.find_all(['p', 'div']):
                label = item.find('span', class_='label')
                if label:
                    key = label.text.strip().lower()
                    value = item.text.replace(label.text, '').strip()
                    details[key] = value

        # Extraction de l'image
        poster = soup.find('div', class_='thumb')
        poster_url = poster.find('img')['src'] if poster and poster.find('img') else ''

        # Extraction des URLs de streaming
        streaming_urls = []
        player_div = soup.find('div', class_='player-video')
        if player_div:
            for source in player_div.find_all(['source', 'iframe']):
                stream_url = source.get('src', '')
                if stream_url:
                    quality = source.get('label', '') or self.detect_quality(stream_url)
                    streaming_urls.append({
                        'url': stream_url,
                        'quality': quality,
                        'source': 'myasiantv',
                        'language': 'VOSTFR'
                    })

        return {
            'title': title,
            'poster_url': poster_url,
            'details': details,
            'streaming_urls': streaming_urls,
            'source': 'myasiantv'
        }

    def detect_quality(self, url: str) -> str:
        url_lower = url.lower()
        for quality, pattern in self.quality_patterns.items():
            if re.search(pattern, url_lower):
                return quality
        return '480p'  # Qualité par défaut

    def validate_stream_url(self, url: str) -> bool:
        parsed_url = urlparse(url)
        allowed_domains = [
            'vostfree.cx', 'dramacool.cy', 'myasiantv.cx',
            'dramabus.cx', 'streamtape.com', 'vidstream.pro'
        ]
        return any(domain in parsed_url.netloc for domain in allowed_domains)

    async def extract_metadata(self, content: Dict) -> Dict:
        metadata = {
            'title': content.get('title', ''),
            'original_title': content.get('details', {}).get('original_title', ''),
            'poster_url': content.get('poster_url', ''),
            'synopsis': content.get('synopsis', ''),
            'year': self.extract_year(content),
            'country': content.get('details', {}).get('country', ''),
            'genres': self.extract_genres(content),
            'duration': content.get('details', {}).get('duration', ''),
            'rating': self.extract_rating(content),
            'episodes': self.extract_episodes(content),
            'status': content.get('details', {}).get('status', ''),
            'language': self.detect_content_language(content),
            'streaming_urls': content.get('streaming_urls', []),
            'source': content.get('source', ''),
            'last_updated': datetime.now().isoformat()
        }
        
        # Calcul du score de qualité des métadonnées
        metadata['quality_score'] = self.calculate_quality_score(metadata)
        
        return metadata

    def extract_year(self, content: Dict) -> Optional[int]:
        year_str = content.get('details', {}).get('year', '')
        if not year_str:
            # Tentative d'extraction depuis le titre ou la description
            matches = re.findall(r'\b(19|20)\d{2}\b', str(content))
            year_str = matches[0] if matches else ''
        
        try:
            return int(year_str)
        except (ValueError, TypeError):
            return None

    def extract_genres(self, content: Dict) -> List[str]:
        genres_str = content.get('details', {}).get('genres', '')
        if not genres_str:
            return []
        
        # Nettoyage et normalisation des genres
        genres = [g.strip() for g in re.split(r'[,|]', genres_str)]
        return [g for g in genres if g]

    def extract_rating(self, content: Dict) -> Optional[float]:
        rating_str = content.get('details', {}).get('rating', '')
        try:
            rating = float(re.search(r'\d+\.?\d*', rating_str)[0])
            return min(max(rating, 0.0), 10.0)
        except (ValueError, TypeError, AttributeError):
            return None

    def extract_episodes(self, content: Dict) -> Optional[int]:
        episodes_str = content.get('details', {}).get('episodes', '')
        try:
            return int(re.search(r'\d+', episodes_str)[0])
        except (ValueError, TypeError, AttributeError):
            return None

    def detect_content_language(self, content: Dict) -> str:
        # Détection de la langue à partir du synopsis ou du titre
        text = content.get('synopsis', '') or content.get('title', '')
        try:
            return detect(text)
        except:
            return 'unknown'

    def calculate_quality_score(self, metadata: Dict) -> float:
        score = 0.0
        weights = {
            'title': 1.0,
            'original_title': 0.5,
            'poster_url': 0.8,
            'synopsis': 0.7,
            'year': 0.6,
            'country': 0.4,
            'genres': 0.6,
            'duration': 0.5,
            'rating': 0.7,
            'episodes': 0.6,
            'streaming_urls': 1.0
        }

        for field, weight in weights.items():
            value = metadata.get(field)
            if value:
                if isinstance(value, list):
                    score += weight * (1 if value else 0)
                elif isinstance(value, (str, int, float)):
                    score += weight
                    
        # Bonus pour les URLs de streaming de haute qualité
        streaming_urls = metadata.get('streaming_urls', [])
        if streaming_urls:
            hd_streams = sum(1 for url in streaming_urls if '720p' in url['quality'] or '1080p' in url['quality'])
            score += 0.5 * (hd_streams / len(streaming_urls))

        return min(score / sum(weights.values()), 1.0) * 100

    async def scrape_content(self, url: str) -> Dict:
        domain = urlparse(url).netloc
        
        scraping_methods = {
            'vostfree.cx': self.extract_vostfree_content,
            'dramacool.cy': self.extract_dramacool_content,
            'myasiantv.cx': self.extract_myasiantv_content
        }

        if domain not in scraping_methods:
            logging.error(f"Source non supportée: {domain}")
            return {}

        content = await scraping_methods[domain](url)
        if not content:
            return {}

        metadata = await self.extract_metadata(content)
        return metadata
