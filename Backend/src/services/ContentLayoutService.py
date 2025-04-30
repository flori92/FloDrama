import asyncio
from typing import Dict, List, Optional
from datetime import datetime, timedelta
from motor.motor_asyncio import AsyncIOMotorClient
from redis import Redis
import logging
import json

class ContentLayoutService:
    def __init__(self, mongodb_uri: str, redis_host: str):
        self.mongodb = AsyncIOMotorClient(mongodb_uri)
        self.db = self.mongodb.flodrama
        self.redis = Redis(host=redis_host, decode_responses=True)
        self.logger = logging.getLogger(__name__)

        # Configuration des widgets par catégorie
        self.widget_configs = {
            'drama': {
                'sections': [
                    {
                        'name': 'Derniers K-Dramas',
                        'query': {'type': 'drama', 'language': 'ko'},
                        'sort': [('release_date', -1)],
                        'limit': 10
                    },
                    {
                        'name': 'Dramas Japonais Populaires',
                        'query': {'type': 'drama', 'language': 'ja'},
                        'sort': [('popularity_score', -1)],
                        'limit': 8
                    },
                    {
                        'name': 'C-Dramas Tendance',
                        'query': {'type': 'drama', 'language': 'zh'},
                        'sort': [('popularity_score', -1)],
                        'limit': 8
                    }
                ],
                'refresh_interval': 3600  # 1 heure
            },
            'anime': {
                'sections': [
                    {
                        'name': 'Nouveaux Animes',
                        'query': {'type': 'anime', 'status': 'ongoing'},
                        'sort': [('release_date', -1)],
                        'limit': 10
                    },
                    {
                        'name': 'Animes Populaires',
                        'query': {'type': 'anime'},
                        'sort': [('popularity_score', -1)],
                        'limit': 8
                    },
                    {
                        'name': 'Donghua Recommandés',
                        'query': {'type': 'anime', 'language': 'zh'},
                        'sort': [('quality_score', -1)],
                        'limit': 6
                    }
                ],
                'refresh_interval': 7200  # 2 heures
            },
            'film': {
                'sections': [
                    {
                        'name': 'Films Coréens Récents',
                        'query': {'type': 'film', 'language': 'ko'},
                        'sort': [('release_date', -1)],
                        'limit': 8
                    },
                    {
                        'name': 'Films Japonais Cultes',
                        'query': {'type': 'film', 'language': 'ja'},
                        'sort': [('popularity_score', -1)],
                        'limit': 6
                    },
                    {
                        'name': 'Films Chinois à Découvrir',
                        'query': {'type': 'film', 'language': 'zh'},
                        'sort': [('quality_score', -1)],
                        'limit': 6
                    }
                ],
                'refresh_interval': 14400  # 4 heures
            },
            'bollywood': {
                'sections': [
                    {
                        'name': 'Nouveautés Bollywood',
                        'query': {'type': 'bollywood'},
                        'sort': [('release_date', -1)],
                        'limit': 8
                    },
                    {
                        'name': 'Classiques Bollywood',
                        'query': {
                            'type': 'bollywood',
                            'release_date': {'$lt': '2010-01-01'}
                        },
                        'sort': [('popularity_score', -1)],
                        'limit': 6
                    }
                ],
                'refresh_interval': 14400  # 4 heures
            }
        }

    async def generate_homepage_layout(self) -> Dict:
        """Génère la mise en page complète de la page d'accueil"""
        cache_key = 'homepage_layout'
        cached_layout = self.redis.get(cache_key)

        if cached_layout:
            return json.loads(cached_layout)

        try:
            layout = {
                'hero_section': await self.get_hero_content(),
                'trending_now': await self.get_trending_content(),
                'category_sections': {}
            }

            # Génération des sections par catégorie
            for category in self.widget_configs.keys():
                layout['category_sections'][category] = await self.generate_category_widgets(category)

            # Mise en cache du layout
            self.redis.setex(
                cache_key,
                1800,  # TTL 30 minutes
                json.dumps(layout)
            )

            return layout
        except Exception as e:
            self.logger.error(f"Erreur lors de la génération du layout: {str(e)}")
            return {}

    async def get_hero_content(self) -> Dict:
        """Sélectionne le contenu pour la section héro"""
        try:
            # Priorité aux nouveaux contenus populaires
            hero_content = await self.db.contents.find_one({
                'poster_url': {'$exists': True},
                'trailer_url': {'$exists': True},
                'quality_score': {'$gt': 80}
            }, sort=[
                ('release_date', -1),
                ('popularity_score', -1)
            ])

            if hero_content:
                return {
                    'id': str(hero_content['_id']),
                    'title': hero_content['title'],
                    'description': hero_content['description'],
                    'poster_url': hero_content['poster_url'],
                    'trailer_url': hero_content['trailer_url'],
                    'type': hero_content['type'],
                    'genres': hero_content['genres'][:3]
                }
            return None
        except Exception as e:
            self.logger.error(f"Erreur lors de la récupération du contenu héro: {str(e)}")
            return None

    async def get_trending_content(self, limit: int = 10) -> List[Dict]:
        """Récupère le contenu tendance toutes catégories confondues"""
        cache_key = f'trending_content:{limit}'
        cached_content = self.redis.get(cache_key)

        if cached_content:
            return json.loads(cached_content)

        try:
            # Calcul du score de tendance basé sur la popularité récente
            week_ago = datetime.utcnow() - timedelta(days=7)
            trending = await self.db.contents.find({
                'release_date': {'$gte': week_ago.isoformat()},
                'popularity_score': {'$gt': 50}
            }).sort([
                ('popularity_score', -1),
                ('quality_score', -1)
            ]).limit(limit).to_list(length=limit)

            result = [{
                'id': str(content['_id']),
                'title': content['title'],
                'poster_url': content['poster_url'],
                'type': content['type'],
                'popularity_score': content['popularity_score']
            } for content in trending]

            # Mise en cache
            self.redis.setex(
                cache_key,
                1800,  # TTL 30 minutes
                json.dumps(result)
            )

            return result
        except Exception as e:
            self.logger.error(f"Erreur lors de la récupération du contenu tendance: {str(e)}")
            return []

    async def generate_category_widgets(self, category: str) -> Dict:
        """Génère tous les widgets pour une catégorie spécifique"""
        cache_key = f'category_widgets:{category}'
        cached_widgets = self.redis.get(cache_key)

        if cached_widgets:
            return json.loads(cached_widgets)

        try:
            config = self.widget_configs.get(category)
            if not config:
                return {}

            widgets = {}
            for section in config['sections']:
                widgets[section['name']] = await self.get_section_content(section)

            # Mise en cache
            self.redis.setex(
                cache_key,
                config['refresh_interval'],
                json.dumps(widgets)
            )

            return widgets
        except Exception as e:
            self.logger.error(f"Erreur lors de la génération des widgets: {str(e)}")
            return {}

    async def get_section_content(self, section_config: Dict) -> List[Dict]:
        """Récupère le contenu pour une section spécifique"""
        try:
            content = await self.db.contents.find(
                section_config['query']
            ).sort(
                section_config['sort']
            ).limit(
                section_config['limit']
            ).to_list(length=section_config['limit'])

            return [{
                'id': str(item['_id']),
                'title': item['title'],
                'poster_url': item['poster_url'],
                'genres': item.get('genres', [])[:3],
                'rating': item.get('rating'),
                'release_date': item.get('release_date'),
                'language': item.get('language')
            } for item in content]
        except Exception as e:
            self.logger.error(f"Erreur lors de la récupération du contenu de section: {str(e)}")
            return []

    async def generate_category_page(self, category: str, page: int = 1, limit: int = 24) -> Dict:
        """Génère une page de catégorie complète"""
        cache_key = f'category_page:{category}:{page}:{limit}'
        cached_page = self.redis.get(cache_key)

        if cached_page:
            return json.loads(cached_page)

        try:
            # Configuration des filtres de base
            base_query = {'type': category}
            
            # Récupération du contenu paginé
            skip = (page - 1) * limit
            total = await self.db.contents.count_documents(base_query)
            
            content = await self.db.contents.find(
                base_query
            ).sort(
                [('release_date', -1)]
            ).skip(skip).limit(limit).to_list(length=limit)

            result = {
                'total': total,
                'page': page,
                'total_pages': (total + limit - 1) // limit,
                'items': [{
                    'id': str(item['_id']),
                    'title': item['title'],
                    'original_title': item.get('original_title'),
                    'poster_url': item['poster_url'],
                    'genres': item.get('genres', [])[:3],
                    'rating': item.get('rating'),
                    'release_date': item.get('release_date'),
                    'language': item.get('language'),
                    'episodes': item.get('episodes'),
                    'status': item.get('status')
                } for item in content]
            }

            # Mise en cache
            self.redis.setex(
                cache_key,
                3600,  # TTL 1 heure
                json.dumps(result)
            )

            return result
        except Exception as e:
            self.logger.error(f"Erreur lors de la génération de la page de catégorie: {str(e)}")
            return {
                'total': 0,
                'page': page,
                'total_pages': 0,
                'items': []
            }

    async def get_featured_content(self, category: str) -> List[Dict]:
        """Récupère le contenu mis en avant pour une catégorie"""
        cache_key = f'featured:{category}'
        cached_featured = self.redis.get(cache_key)

        if cached_featured:
            return json.loads(cached_featured)

        try:
            # Sélection du contenu de haute qualité avec des médias complets
            featured = await self.db.contents.find({
                'type': category,
                'quality_score': {'$gt': 85},
                'poster_url': {'$exists': True},
                'trailer_url': {'$exists': True}
            }).sort([
                ('popularity_score', -1),
                ('release_date', -1)
            ]).limit(5).to_list(length=5)

            result = [{
                'id': str(content['_id']),
                'title': content['title'],
                'description': content['description'],
                'poster_url': content['poster_url'],
                'trailer_url': content['trailer_url'],
                'genres': content.get('genres', [])[:3],
                'rating': content.get('rating'),
                'language': content.get('language')
            } for content in featured]

            # Mise en cache
            self.redis.setex(
                cache_key,
                7200,  # TTL 2 heures
                json.dumps(result)
            )

            return result
        except Exception as e:
            self.logger.error(f"Erreur lors de la récupération du contenu mis en avant: {str(e)}")
            return []

    async def refresh_all_layouts(self):
        """Rafraîchit tous les layouts et widgets"""
        try:
            # Suppression des caches existants
            keys_to_delete = []
            for key in self.redis.scan_iter("*layout*"):
                keys_to_delete.append(key)
            for key in self.redis.scan_iter("*widgets*"):
                keys_to_delete.append(key)
            if keys_to_delete:
                self.redis.delete(*keys_to_delete)

            # Régénération des layouts
            await self.generate_homepage_layout()
            
            # Régénération des pages de catégories
            for category in self.widget_configs.keys():
                await self.generate_category_page(category)
                await self.get_featured_content(category)

            self.logger.info("Rafraîchissement complet des layouts terminé")
        except Exception as e:
            self.logger.error(f"Erreur lors du rafraîchissement des layouts: {str(e)}")

    async def get_similar_content_widget(self, content_id: str, limit: int = 6) -> List[Dict]:
        """Génère un widget de contenu similaire"""
        cache_key = f'similar:{content_id}:{limit}'
        cached_similar = self.redis.get(cache_key)

        if cached_similar:
            return json.loads(cached_similar)

        try:
            # Récupération du contenu de référence
            content = await self.db.contents.find_one({'_id': content_id})
            if not content:
                return []

            # Recherche de contenu similaire
            similar = await self.db.contents.find({
                '_id': {'$ne': content_id},
                'type': content['type'],
                'genres': {'$in': content.get('genres', [])}
            }).sort([
                ('popularity_score', -1)
            ]).limit(limit).to_list(length=limit)

            result = [{
                'id': str(item['_id']),
                'title': item['title'],
                'poster_url': item['poster_url'],
                'genres': item.get('genres', [])[:3],
                'rating': item.get('rating')
            } for item in similar]

            # Mise en cache
            self.redis.setex(
                cache_key,
                3600,  # TTL 1 heure
                json.dumps(result)
            )

            return result
        except Exception as e:
            self.logger.error(f"Erreur lors de la récupération du contenu similaire: {str(e)}")
            return []
