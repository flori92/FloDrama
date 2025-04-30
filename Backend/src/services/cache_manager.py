"""
Gestionnaire de cache pour le service de scraping
"""

import asyncio
from typing import Dict, Optional, Any
import json
from datetime import datetime, timedelta
import logging
from redis import asyncio as aioredis

from .exceptions import CacheError
from ..config.scraping_config import CACHE_CONFIG

class CacheManager:
    """Gestionnaire de cache utilisant Redis pour le stockage des données de scraping"""

    def __init__(self, redis_url: str):
        """
        Initialise le gestionnaire de cache
        
        Args:
            redis_url: URL de connexion Redis (ex: redis://localhost:6379/0)
        """
        self.redis = aioredis.from_url(redis_url)
        self.logger = logging.getLogger(__name__)

    async def get_metadata(self, content_id: str) -> Optional[Dict]:
        """
        Récupère les métadonnées du cache
        
        Args:
            content_id: Identifiant unique du contenu
            
        Returns:
            Dict des métadonnées ou None si non trouvé
        """
        try:
            key = f"metadata:{content_id}"
            data = await self.redis.get(key)
            if data:
                metadata = json.loads(data)
                # Vérification de la fraîcheur des données
                if self._is_data_fresh(metadata):
                    return metadata
                else:
                    # Suppression des données périmées
                    await self.redis.delete(key)
            return None
        except Exception as e:
            self.logger.error(f"Erreur lors de la récupération des métadonnées: {str(e)}")
            raise CacheError(f"Erreur de cache: {str(e)}")

    async def set_metadata(self, content_id: str, metadata: Dict) -> None:
        """
        Stocke les métadonnées dans le cache
        
        Args:
            content_id: Identifiant unique du contenu
            metadata: Dictionnaire des métadonnées
        """
        try:
            key = f"metadata:{content_id}"
            # Ajout de la date de mise en cache
            metadata['cached_at'] = datetime.now().isoformat()
            await self.redis.set(
                key,
                json.dumps(metadata),
                ex=CACHE_CONFIG['metadata_ttl']
            )
        except Exception as e:
            self.logger.error(f"Erreur lors du stockage des métadonnées: {str(e)}")
            raise CacheError(f"Erreur de cache: {str(e)}")

    async def get_streaming_urls(self, content_id: str) -> Optional[Dict]:
        """
        Récupère les URLs de streaming du cache
        
        Args:
            content_id: Identifiant unique du contenu
            
        Returns:
            Dict des URLs de streaming ou None si non trouvé
        """
        try:
            key = f"streaming:{content_id}"
            data = await self.redis.get(key)
            if data:
                urls_data = json.loads(data)
                if self._is_data_fresh(urls_data):
                    return urls_data
                else:
                    await self.redis.delete(key)
            return None
        except Exception as e:
            self.logger.error(f"Erreur lors de la récupération des URLs de streaming: {str(e)}")
            raise CacheError(f"Erreur de cache: {str(e)}")

    async def set_streaming_urls(self, content_id: str, urls_data: Dict) -> None:
        """
        Stocke les URLs de streaming dans le cache
        
        Args:
            content_id: Identifiant unique du contenu
            urls_data: Dictionnaire des URLs de streaming
        """
        try:
            key = f"streaming:{content_id}"
            urls_data['cached_at'] = datetime.now().isoformat()
            await self.redis.set(
                key,
                json.dumps(urls_data),
                ex=CACHE_CONFIG['streaming_urls_ttl']
            )
        except Exception as e:
            self.logger.error(f"Erreur lors du stockage des URLs de streaming: {str(e)}")
            raise CacheError(f"Erreur de cache: {str(e)}")

    async def get_search_results(self, query: str, source: str) -> Optional[Dict]:
        """
        Récupère les résultats de recherche du cache
        
        Args:
            query: Terme de recherche
            source: Source de streaming
            
        Returns:
            Dict des résultats ou None si non trouvé
        """
        try:
            key = f"search:{source}:{query}"
            data = await self.redis.get(key)
            if data:
                results = json.loads(data)
                if self._is_data_fresh(results):
                    return results
                else:
                    await self.redis.delete(key)
            return None
        except Exception as e:
            self.logger.error(f"Erreur lors de la récupération des résultats de recherche: {str(e)}")
            raise CacheError(f"Erreur de cache: {str(e)}")

    async def set_search_results(self, query: str, source: str, results: Dict) -> None:
        """
        Stocke les résultats de recherche dans le cache
        
        Args:
            query: Terme de recherche
            source: Source de streaming
            results: Dictionnaire des résultats
        """
        try:
            key = f"search:{source}:{query}"
            results['cached_at'] = datetime.now().isoformat()
            await self.redis.set(
                key,
                json.dumps(results),
                ex=CACHE_CONFIG['search_results_ttl']
            )
        except Exception as e:
            self.logger.error(f"Erreur lors du stockage des résultats de recherche: {str(e)}")
            raise CacheError(f"Erreur de cache: {str(e)}")

    async def invalidate_content(self, content_id: str) -> None:
        """
        Invalide toutes les données en cache pour un contenu
        
        Args:
            content_id: Identifiant unique du contenu
        """
        try:
            keys = [
                f"metadata:{content_id}",
                f"streaming:{content_id}"
            ]
            await asyncio.gather(*[self.redis.delete(key) for key in keys])
        except Exception as e:
            self.logger.error(f"Erreur lors de l'invalidation du cache: {str(e)}")
            raise CacheError(f"Erreur de cache: {str(e)}")

    async def clear_all(self) -> None:
        """Vide complètement le cache"""
        try:
            await self.redis.flushdb()
        except Exception as e:
            self.logger.error(f"Erreur lors de la purge du cache: {str(e)}")
            raise CacheError(f"Erreur de cache: {str(e)}")

    def _is_data_fresh(self, data: Dict) -> bool:
        """
        Vérifie si les données sont encore fraîches
        
        Args:
            data: Dictionnaire contenant les données et la date de mise en cache
            
        Returns:
            bool indiquant si les données sont encore valides
        """
        try:
            cached_at = datetime.fromisoformat(data.get('cached_at', ''))
            ttl = CACHE_CONFIG.get(
                f"{data.get('type', 'metadata')}_ttl",
                CACHE_CONFIG['metadata_ttl']
            )
            return datetime.now() - cached_at < timedelta(seconds=ttl)
        except:
            return False

    async def close(self) -> None:
        """Ferme la connexion Redis"""
        await self.redis.close()
