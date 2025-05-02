import asyncio
from typing import Dict, List, Optional
from datetime import datetime, timedelta
import aioboto3
from motor.motor_asyncio import AsyncIOMotorClient
from redis import Redis
import logging
import json

class ContentSchedulerService:
    def __init__(self, mongodb_uri: str, redis_host: str, sqs_queue_url: str):
        self.mongodb = AsyncIOMotorClient(mongodb_uri)
        self.db = self.mongodb.flodrama
        self.redis = Redis(host=redis_host, decode_responses=True)
        self.sqs_queue_url = sqs_queue_url
        self.logger = logging.getLogger(__name__)
        self.session = aioboto3.Session()

        # Configuration des sources par catégorie
        self.source_configs = {
            'drama': {
                'sources': [
                    {
                        'name': 'dramacool',
                        'priority': 1,
                        'update_interval': 6,  # heures
                        'language': ['ko', 'ja', 'zh']
                    },
                    {
                        'name': 'viki',
                        'priority': 2,
                        'update_interval': 12,
                        'language': ['ko', 'ja', 'zh']
                    }
                ],
                'update_frequency': 'high'
            },
            'anime': {
                'sources': [
                    {
                        'name': 'crunchyroll',
                        'priority': 1,
                        'update_interval': 12,
                        'language': ['ja']
                    },
                    {
                        'name': 'bilibili',
                        'priority': 2,
                        'update_interval': 24,
                        'language': ['zh']
                    }
                ],
                'update_frequency': 'medium'
            },
            'film': {
                'sources': [
                    {
                        'name': 'asianfilm',
                        'priority': 1,
                        'update_interval': 24,
                        'language': ['ko', 'ja', 'zh']
                    }
                ],
                'update_frequency': 'low'
            },
            'bollywood': {
                'sources': [
                    # 'name': 'bollywoodmdb',
                    {
                        'name': 'bollywoodmdb',
                        'priority': 1,
                        'update_interval': 24,
                        'language': ['hi']
                    }
                ],
                'update_frequency': 'low'
            }
        }

    async def schedule_scraping_tasks(self):
        """Planifie les tâches de scraping en fonction des priorités"""
        try:
            current_hour = datetime.utcnow().hour
            tasks_to_schedule = []

            for category, config in self.source_configs.items():
                for source in config['sources']:
                    # Vérification si une mise à jour est nécessaire
                    last_update_key = f'last_update:{category}:{source["name"]}'
                    last_update = self.redis.get(last_update_key)
                    
                    if last_update:
                        last_update_time = datetime.fromisoformat(last_update)
                        hours_since_update = (datetime.utcnow() - last_update_time).total_seconds() / 3600
                        
                        if hours_since_update < source['update_interval']:
                            continue

                    # Création de la tâche de scraping
                    task = {
                        'category': category,
                        'source': source['name'],
                        'priority': source['priority'],
                        'languages': source['language'],
                        'timestamp': datetime.utcnow().isoformat(),
                        'type': 'scraping'
                    }
                    tasks_to_schedule.append(task)

            # Envoi des tâches à SQS
            if tasks_to_schedule:
                await self.send_tasks_to_queue(tasks_to_schedule)

        except Exception as e:
            self.logger.error(f"Erreur lors de la planification des tâches: {str(e)}")

    async def send_tasks_to_queue(self, tasks: List[Dict]):
        """Envoie les tâches à la file d'attente SQS"""
        try:
            async with self.session.client('sqs') as sqs:
                for task in tasks:
                    await sqs.send_message(
                        QueueUrl=self.sqs_queue_url,
                        MessageBody=json.dumps(task),
                        MessageAttributes={
                            'Category': {
                                'DataType': 'String',
                                'StringValue': task['category']
                            },
                            'Priority': {
                                'DataType': 'Number',
                                'StringValue': str(task['priority'])
                            }
                        }
                    )

                    # Mise à jour du timestamp de dernière mise à jour
                    last_update_key = f'last_update:{task["category"]}:{task["source"]}'
                    self.redis.set(last_update_key, task['timestamp'])

        except Exception as e:
            self.logger.error(f"Erreur lors de l'envoi des tâches à SQS: {str(e)}")

    async def schedule_content_updates(self):
        """Planifie les mises à jour de contenu existant"""
        try:
            # Recherche du contenu nécessitant une mise à jour
            week_ago = datetime.utcnow() - timedelta(days=7)
            
            content_to_update = await self.db.contents.find({
                '$or': [
                    {'last_updated': {'$lt': week_ago}},
                    {'last_updated': {'$exists': False}},
                    {'status': 'ongoing'}
                ]
            }).to_list(length=None)

            update_tasks = []
            for content in content_to_update:
                task = {
                    'content_id': str(content['_id']),
                    'category': content['type'],
                    'source': content.get('source', 'unknown'),
                    'priority': 2 if content.get('status') == 'ongoing' else 3,
                    'timestamp': datetime.utcnow().isoformat(),
                    'type': 'update'
                }
                update_tasks.append(task)

            if update_tasks:
                await self.send_tasks_to_queue(update_tasks)

        except Exception as e:
            self.logger.error(f"Erreur lors de la planification des mises à jour: {str(e)}")

    async def schedule_metadata_enrichment(self):
        """Planifie l'enrichissement des métadonnées"""
        try:
            # Recherche du contenu avec des métadonnées incomplètes
            content_to_enrich = await self.db.contents.find({
                '$or': [
                    {'quality_score': {'$lt': 70}},
                    {'quality_score': {'$exists': False}},
                    {'entities': {'$exists': False}},
                    {'sentiment': {'$exists': False}}
                ]
            }).to_list(length=None)

            enrichment_tasks = []
            for content in content_to_enrich:
                task = {
                    'content_id': str(content['_id']),
                    'category': content['type'],
                    'priority': 3,
                    'timestamp': datetime.utcnow().isoformat(),
                    'type': 'enrichment'
                }
                enrichment_tasks.append(task)

            if enrichment_tasks:
                await self.send_tasks_to_queue(enrichment_tasks)

        except Exception as e:
            self.logger.error(f"Erreur lors de la planification de l'enrichissement: {str(e)}")

    async def schedule_popularity_updates(self):
        """Planifie les mises à jour des scores de popularité"""
        try:
            # Mise à jour des scores toutes les 6 heures
            content_to_update = await self.db.contents.find({
                '$or': [
                    {'popularity_score': {'$exists': False}},
                    {'last_popularity_update': {'$lt': datetime.utcnow() - timedelta(hours=6)}}
                ]
            }).to_list(length=None)

            popularity_tasks = []
            for content in content_to_update:
                task = {
                    'content_id': str(content['_id']),
                    'category': content['type'],
                    'priority': 4,
                    'timestamp': datetime.utcnow().isoformat(),
                    'type': 'popularity_update'
                }
                popularity_tasks.append(task)

            if popularity_tasks:
                await self.send_tasks_to_queue(popularity_tasks)

        except Exception as e:
            self.logger.error(f"Erreur lors de la planification des mises à jour de popularité: {str(e)}")

    async def cleanup_failed_tasks(self):
        """Nettoie et replanifie les tâches échouées"""
        try:
            async with self.session.client('sqs') as sqs:
                # Récupération des messages de la file d'attente des échecs
                response = await sqs.receive_message(
                    QueueUrl=f"{self.sqs_queue_url}-dlq",
                    MaxNumberOfMessages=10,
                    MessageAttributeNames=['All']
                )

                if 'Messages' in response:
                    for message in response['Messages']:
                        task = json.loads(message['Body'])
                        
                        # Incrémentation du compteur d'échecs
                        retry_count = int(message['MessageAttributes'].get('RetryCount', {}).get('StringValue', '0'))
                        
                        if retry_count < 3:  # Maximum 3 tentatives
                            # Replanification de la tâche
                            task['retry_count'] = retry_count + 1
                            await self.send_tasks_to_queue([task])
                        else:
                            # Enregistrement de l'échec permanent
                            await self.db.failed_tasks.insert_one({
                                'task': task,
                                'error_count': retry_count,
                                'final_failure_time': datetime.utcnow()
                            })

                        # Suppression du message de la DLQ
                        await sqs.delete_message(
                            QueueUrl=f"{self.sqs_queue_url}-dlq",
                            ReceiptHandle=message['ReceiptHandle']
                        )

        except Exception as e:
            self.logger.error(f"Erreur lors du nettoyage des tâches échouées: {str(e)}")

    async def monitor_task_progress(self):
        """Surveille la progression des tâches"""
        try:
            # Récupération des statistiques de la file d'attente
            async with self.session.client('sqs') as sqs:
                response = await sqs.get_queue_attributes(
                    QueueUrl=self.sqs_queue_url,
                    AttributeNames=['ApproximateNumberOfMessages', 'ApproximateNumberOfMessagesNotVisible']
                )

                stats = {
                    'pending_tasks': int(response['Attributes']['ApproximateNumberOfMessages']),
                    'in_progress_tasks': int(response['Attributes']['ApproximateNumberOfMessagesNotVisible']),
                    'timestamp': datetime.utcnow().isoformat()
                }

                # Stockage des statistiques dans Redis
                self.redis.setex(
                    'task_stats',
                    3600,  # TTL 1 heure
                    json.dumps(stats)
                )

                # Alerte si trop de tâches en attente
                if stats['pending_tasks'] > 1000:
                    self.logger.warning(f"Nombre élevé de tâches en attente: {stats['pending_tasks']}")

        except Exception as e:
            self.logger.error(f"Erreur lors de la surveillance des tâches: {str(e)}")

    async def run_scheduler(self):
        """Exécute toutes les tâches de planification"""
        while True:
            try:
                await asyncio.gather(
                    self.schedule_scraping_tasks(),
                    self.schedule_content_updates(),
                    self.schedule_metadata_enrichment(),
                    self.schedule_popularity_updates(),
                    self.cleanup_failed_tasks(),
                    self.monitor_task_progress()
                )

                # Attente avant le prochain cycle
                await asyncio.sleep(300)  # 5 minutes

            except Exception as e:
                self.logger.error(f"Erreur dans le cycle de planification: {str(e)}")
                await asyncio.sleep(60)  # Attente d'1 minute en cas d'erreur
