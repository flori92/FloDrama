"""
Gestionnaire de rate limiting pour le service de scraping
"""

import asyncio
from datetime import datetime, timedelta
from typing import Dict, Set, Optional
import logging
from redis import asyncio as aioredis

from .exceptions import RateLimitExceededError
from ..config.scraping_config import RATE_LIMIT

class RateLimiter:
    """
    Gestionnaire de rate limiting utilisant Redis pour suivre et limiter
    les requêtes vers les sources de streaming
    """

    def __init__(self, redis_url: str):
        """
        Initialise le gestionnaire de rate limiting
        
        Args:
            redis_url: URL de connexion Redis (ex: redis://localhost:6379/0)
        """
        self.redis = aioredis.from_url(redis_url)
        self.logger = logging.getLogger(__name__)
        self._concurrent_requests: Dict[str, Set[str]] = {}

    async def check_rate_limit(self, source: str) -> None:
        """
        Vérifie si une source a dépassé ses limites de requêtes
        
        Args:
            source: Nom de la source de streaming
            
        Raises:
            RateLimitExceededError: Si la limite est dépassée
        """
        try:
            # Vérification des requêtes par minute
            minute_key = f"ratelimit:minute:{source}:{self._get_time_bucket('minute')}"
            minute_count = await self.redis.incr(minute_key)
            if minute_count == 1:
                await self.redis.expire(minute_key, 60)
            
            # Vérification des requêtes par heure
            hour_key = f"ratelimit:hour:{source}:{self._get_time_bucket('hour')}"
            hour_count = await self.redis.incr(hour_key)
            if hour_count == 1:
                await self.redis.expire(hour_key, 3600)

            # Vérification des limites
            if minute_count > RATE_LIMIT['requests_per_minute']:
                raise RateLimitExceededError(
                    f"Limite de requêtes par minute dépassée pour {source}",
                    source=source
                )
            
            if hour_count > RATE_LIMIT['requests_per_hour']:
                raise RateLimitExceededError(
                    f"Limite de requêtes par heure dépassée pour {source}",
                    source=source
                )

            # Vérification des requêtes concurrentes
            await self._check_concurrent_requests(source)

        except RateLimitExceededError:
            raise
        except Exception as e:
            self.logger.error(f"Erreur lors de la vérification du rate limit: {str(e)}")
            # En cas d'erreur, on laisse passer pour éviter de bloquer le service
            return

    async def acquire_lock(self, source: str, request_id: str) -> None:
        """
        Acquiert un verrou pour une requête
        
        Args:
            source: Nom de la source de streaming
            request_id: Identifiant unique de la requête
        """
        if source not in self._concurrent_requests:
            self._concurrent_requests[source] = set()
        self._concurrent_requests[source].add(request_id)

    async def release_lock(self, source: str, request_id: str) -> None:
        """
        Libère le verrou d'une requête
        
        Args:
            source: Nom de la source de streaming
            request_id: Identifiant unique de la requête
        """
        if source in self._concurrent_requests:
            self._concurrent_requests[source].discard(request_id)
            if not self._concurrent_requests[source]:
                del self._concurrent_requests[source]

    async def _check_concurrent_requests(self, source: str) -> None:
        """
        Vérifie le nombre de requêtes concurrentes pour une source
        
        Args:
            source: Nom de la source de streaming
            
        Raises:
            RateLimitExceededError: Si trop de requêtes concurrentes
        """
        concurrent_count = len(self._concurrent_requests.get(source, set()))
        if concurrent_count >= RATE_LIMIT['concurrent_requests']:
            raise RateLimitExceededError(
                f"Trop de requêtes concurrentes pour {source}",
                source=source
            )

    async def wait_if_needed(self, source: str) -> None:
        """
        Attend si nécessaire avant d'autoriser une nouvelle requête
        
        Args:
            source: Nom de la source de streaming
        """
        try:
            minute_key = f"ratelimit:minute:{source}:{self._get_time_bucket('minute')}"
            minute_count = int(await self.redis.get(minute_key) or 0)
            
            if minute_count >= RATE_LIMIT['requests_per_minute']:
                # Calcul du temps d'attente
                ttl = await self.redis.ttl(minute_key)
                if ttl > 0:
                    self.logger.warning(f"Attente de {ttl} secondes pour {source}")
                    await asyncio.sleep(ttl)

        except Exception as e:
            self.logger.error(f"Erreur lors de l'attente du rate limit: {str(e)}")
            # En cas d'erreur, on attend une seconde par sécurité
            await asyncio.sleep(1)

    def _get_time_bucket(self, interval: str) -> str:
        """
        Obtient le bucket temporel pour l'intervalle spécifié
        
        Args:
            interval: 'minute' ou 'hour'
            
        Returns:
            Chaîne représentant le bucket temporel
        """
        now = datetime.now()
        if interval == 'minute':
            return now.strftime('%Y%m%d%H%M')
        elif interval == 'hour':
            return now.strftime('%Y%m%d%H')
        return now.strftime('%Y%m%d')

    async def get_remaining_requests(self, source: str) -> Dict[str, int]:
        """
        Obtient le nombre de requêtes restantes pour une source
        
        Args:
            source: Nom de la source de streaming
            
        Returns:
            Dict contenant les requêtes restantes par intervalle
        """
        try:
            minute_key = f"ratelimit:minute:{source}:{self._get_time_bucket('minute')}"
            hour_key = f"ratelimit:hour:{source}:{self._get_time_bucket('hour')}"
            
            minute_count = int(await self.redis.get(minute_key) or 0)
            hour_count = int(await self.redis.get(hour_key) or 0)
            
            return {
                'minute': max(0, RATE_LIMIT['requests_per_minute'] - minute_count),
                'hour': max(0, RATE_LIMIT['requests_per_hour'] - hour_count),
                'concurrent': max(0, RATE_LIMIT['concurrent_requests'] - 
                                len(self._concurrent_requests.get(source, set())))
            }
        except Exception as e:
            self.logger.error(f"Erreur lors de la récupération des requêtes restantes: {str(e)}")
            return {'minute': 0, 'hour': 0, 'concurrent': 0}

    async def reset_limits(self, source: str) -> None:
        """
        Réinitialise les compteurs pour une source
        
        Args:
            source: Nom de la source de streaming
        """
        try:
            minute_key = f"ratelimit:minute:{source}:{self._get_time_bucket('minute')}"
            hour_key = f"ratelimit:hour:{source}:{self._get_time_bucket('hour')}"
            
            await asyncio.gather(
                self.redis.delete(minute_key),
                self.redis.delete(hour_key)
            )
            
            if source in self._concurrent_requests:
                del self._concurrent_requests[source]
                
        except Exception as e:
            self.logger.error(f"Erreur lors de la réinitialisation des limites: {str(e)}")

    async def close(self) -> None:
        """Ferme la connexion Redis"""
        await self.redis.close()
