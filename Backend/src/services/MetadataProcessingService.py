import asyncio
from typing import Dict, List, Optional
from datetime import datetime, timedelta
import boto3
from botocore.exceptions import ClientError
from motor.motor_asyncio import AsyncIOMotorClient
from redis import Redis
from opensearchpy import AsyncOpenSearch
import json
import logging

class MetadataProcessingService:
    def __init__(self, mongodb_uri: str, redis_host: str, opensearch_endpoint: str):
        self.mongodb = AsyncIOMotorClient(mongodb_uri)
        self.db = self.mongodb.flodrama
        self.redis = Redis(host=redis_host, decode_responses=True)
        self.opensearch = AsyncOpenSearch(hosts=[opensearch_endpoint])
        self.personalize = boto3.client('personalize')
        self.comprehend = boto3.client('comprehend')
        self.logger = logging.getLogger(__name__)

        # Catégories principales
        self.categories = {
            'drama': {
                'keywords': ['kdrama', 'drama coréen', 'drama japonais', 'drama chinois'],
                'languages': ['ko', 'ja', 'zh'],
                'weight': 1.0
            },
            'film': {
                'keywords': ['film asiatique', 'movie', 'film coréen', 'film japonais'],
                'languages': ['ko', 'ja', 'zh'],
                'weight': 0.8
            },
            'anime': {
                'keywords': ['anime', 'animation japonaise', 'donghua'],
                'languages': ['ja', 'zh', 'ko'],
                'weight': 0.9
            },
            'bollywood': {
                'keywords': ['bollywood', 'film indien', 'série indienne'],
                'languages': ['hi', 'ta', 'te'],
                'weight': 0.7
            }
        }

    async def enrich_metadata(self, metadata: Dict) -> Dict:
        """Enrichit les métadonnées avec des informations supplémentaires"""
        try:
            # Analyse du sentiment et des entités avec Amazon Comprehend
            text_to_analyze = f"{metadata.get('title', '')} {metadata.get('description', '')}"
            
            sentiment_response = self.comprehend.detect_sentiment(
                Text=text_to_analyze,
                LanguageCode='fr'
            )
            
            entities_response = self.comprehend.detect_entities(
                Text=text_to_analyze,
                LanguageCode='fr'
            )

            # Enrichissement des métadonnées
            metadata['sentiment'] = sentiment_response['Sentiment']
            metadata['entities'] = [
                entity['Text'] for entity in entities_response['Entities']
                if entity['Score'] > 0.8
            ]

            # Calcul du score de qualité des métadonnées
            metadata['quality_score'] = await self.calculate_metadata_quality(metadata)

            # Ajout des recommandations similaires
            metadata['similar_content'] = await self.find_similar_content(metadata)

            return metadata
        except Exception as e:
            self.logger.error(f"Erreur lors de l'enrichissement des métadonnées: {str(e)}")
            return metadata

    async def calculate_metadata_quality(self, metadata: Dict) -> float:
        """Calcule un score de qualité pour les métadonnées"""
        score = 0.0
        required_fields = [
            ('title', 15),
            ('description', 25),
            ('poster_url', 10),
            ('release_date', 10),
            ('genres', 15),
            ('cast', 15),
            ('director', 10)
        ]

        for field, weight in required_fields:
            if field in metadata and metadata[field]:
                if isinstance(metadata[field], list):
                    score += weight * min(len(metadata[field]) / 3, 1)
                elif isinstance(metadata[field], str):
                    score += weight * min(len(metadata[field]) / 50, 1)
                else:
                    score += weight

        return min(score, 100)

    async def categorize_content(self, metadata: Dict) -> Dict:
        """Catégorise le contenu en fonction des métadonnées"""
        scores = {category: 0.0 for category in self.categories}
        
        # Analyse du texte pour la catégorisation
        text_to_analyze = f"{metadata.get('title', '')} {metadata.get('description', '')}"
        
        for category, props in self.categories.items():
            # Score basé sur les mots-clés
            keyword_matches = sum(
                1 for keyword in props['keywords']
                if keyword.lower() in text_to_analyze.lower()
            )
            scores[category] += keyword_matches * 2 * props['weight']

            # Score basé sur la langue
            if metadata.get('language') in props['languages']:
                scores[category] += 3 * props['weight']

            # Score basé sur les genres
            if 'genres' in metadata:
                genre_matches = sum(
                    1 for genre in metadata['genres']
                    if any(keyword.lower() in genre.lower() for keyword in props['keywords'])
                )
                scores[category] += genre_matches * props['weight']

        # Détermination de la catégorie principale
        primary_category = max(scores.items(), key=lambda x: x[1])[0]
        
        # Ajout des catégories secondaires si le score est proche
        max_score = scores[primary_category]
        secondary_categories = [
            category for category, score in scores.items()
            if score > max_score * 0.7 and category != primary_category
        ]

        return {
            'primary_category': primary_category,
            'secondary_categories': secondary_categories,
            'confidence_scores': scores
        }

    async def update_content_mappings(self):
        """Met à jour les mappings de contenu dans OpenSearch"""
        mapping = {
            'mappings': {
                'properties': {
                    'title': {'type': 'text', 'analyzer': 'standard'},
                    'original_title': {'type': 'text', 'analyzer': 'standard'},
                    'description': {'type': 'text', 'analyzer': 'standard'},
                    'type': {'type': 'keyword'},
                    'genres': {'type': 'keyword'},
                    'language': {'type': 'keyword'},
                    'cast': {'type': 'keyword'},
                    'director': {'type': 'keyword'},
                    'release_date': {'type': 'date'},
                    'popularity_score': {'type': 'float'},
                    'quality_score': {'type': 'float'},
                    'sentiment': {'type': 'keyword'},
                    'entities': {'type': 'keyword'},
                    'suggest': {
                        'type': 'completion',
                        'analyzer': 'standard'
                    }
                }
            },
            'settings': {
                'analysis': {
                    'analyzer': {
                        'title_analyzer': {
                            'type': 'custom',
                            'tokenizer': 'standard',
                            'filter': ['lowercase', 'asciifolding']
                        }
                    }
                }
            }
        }

        try:
            await self.opensearch.indices.create(
                index='content',
                body=mapping,
                ignore=400
            )
        except Exception as e:
            self.logger.error(f"Erreur lors de la mise à jour des mappings: {str(e)}")

    async def find_similar_content(self, metadata: Dict, limit: int = 5) -> List[Dict]:
        """Trouve du contenu similaire basé sur les métadonnées"""
        try:
            query = {
                'query': {
                    'bool': {
                        'should': [
                            {'match': {'genres': {'query': ' '.join(metadata.get('genres', [])), 'boost': 2}}},
                            {'match': {'cast': {'query': ' '.join(metadata.get('cast', [])), 'boost': 1.5}}},
                            {'match': {'director': {'query': metadata.get('director', ''), 'boost': 1.5}}},
                            {'match': {'description': {'query': metadata.get('description', ''), 'boost': 1}}}
                        ],
                        'must_not': [
                            {'term': {'_id': metadata.get('_id', '')}}
                        ],
                        'filter': [
                            {'term': {'type': metadata.get('type', '')}}
                        ]
                    }
                },
                'size': limit
            }

            results = await self.opensearch.search(
                index='content',
                body=query
            )

            return [hit['_source'] for hit in results['hits']['hits']]
        except Exception as e:
            self.logger.error(f"Erreur lors de la recherche de contenu similaire: {str(e)}")
            return []

    async def update_personalize_dataset(self, metadata: Dict):
        """Met à jour le dataset Amazon Personalize avec les nouvelles métadonnées"""
        try:
            # Préparation des données pour Personalize
            item_data = {
                'itemId': str(metadata.get('_id')),
                'genres': metadata.get('genres', []),
                'type': metadata.get('type'),
                'language': metadata.get('language'),
                'releaseYear': int(metadata.get('release_date', '').split('-')[0]),
                'quality_score': metadata.get('quality_score', 0),
                'popularity_score': metadata.get('popularity_score', 0)
            }

            # Mise à jour du dataset Personalize
            response = self.personalize.put_items(
                datasetArn='arn:aws:personalize:REGION:ACCOUNT:dataset/DATASET_ID',
                items=[item_data]
            )

            return response
        except ClientError as e:
            self.logger.error(f"Erreur lors de la mise à jour Personalize: {str(e)}")
            return None

    async def generate_content_suggestions(self, user_id: str, category: str = None) -> List[Dict]:
        """Génère des suggestions de contenu personnalisées"""
        cache_key = f'suggestions:{user_id}:{category or "all"}'
        cached_suggestions = self.redis.get(cache_key)

        if cached_suggestions:
            return json.loads(cached_suggestions)

        try:
            # Obtention des recommandations via Personalize
            response = self.personalize.get_recommendations(
                campaignArn='arn:aws:personalize:REGION:ACCOUNT:campaign/CAMPAIGN_ID',
                userId=user_id,
                numResults=20
            )

            # Filtrage par catégorie si spécifiée
            recommendations = []
            for item in response['itemList']:
                content = await self.db.contents.find_one({'_id': item['itemId']})
                if content and (not category or content['type'] == category):
                    recommendations.append({
                        'id': str(content['_id']),
                        'title': content['title'],
                        'poster_url': content['poster_url'],
                        'type': content['type'],
                        'score': item['score']
                    })

            # Mise en cache des suggestions
            self.redis.setex(
                cache_key,
                1800,  # TTL 30 minutes
                json.dumps(recommendations)
            )

            return recommendations
        except Exception as e:
            self.logger.error(f"Erreur lors de la génération des suggestions: {str(e)}")
            return []

    async def process_batch_metadata(self, batch: List[Dict]):
        """Traite un lot de métadonnées en parallèle"""
        tasks = []
        for metadata in batch:
            tasks.append(asyncio.create_task(self.process_single_metadata(metadata)))
        
        return await asyncio.gather(*tasks)

    async def process_single_metadata(self, metadata: Dict):
        """Traite une seule entrée de métadonnées"""
        try:
            # Enrichissement et catégorisation
            enriched_metadata = await self.enrich_metadata(metadata)
            categorization = await self.categorize_content(enriched_metadata)
            
            # Fusion des résultats
            final_metadata = {
                **enriched_metadata,
                **categorization
            }

            # Stockage dans MongoDB
            await self.db.contents.update_one(
                {'_id': metadata.get('_id')},
                {'$set': final_metadata},
                upsert=True
            )

            # Mise à jour des index de recherche
            await self.update_search_index(str(metadata.get('_id')), final_metadata)

            # Mise à jour du dataset Personalize
            await self.update_personalize_dataset(final_metadata)

            return final_metadata
        except Exception as e:
            self.logger.error(f"Erreur lors du traitement des métadonnées: {str(e)}")
            return None
