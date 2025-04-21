#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Script de vérification du statut de scraping FloDrama AWS
Ce script permet de vérifier l'état d'avancement du scraping et d'analyser les données collectées.
"""

import os
import json
import boto3
import argparse
import logging
import time
from datetime import datetime
from pathlib import Path
from tabulate import tabulate
import matplotlib.pyplot as plt
from collections import Counter, defaultdict

# Configuration du logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('FloDrama-ScrapingMonitor')

def setup_aws_clients():
    """Initialise les clients AWS nécessaires"""
    try:
        # Récupérer la région AWS des variables d'environnement ou utiliser une valeur par défaut
        aws_region = os.environ.get('AWS_REGION', 'us-east-1')
        
        # Initialiser les clients AWS
        s3_client = boto3.client('s3', region_name=aws_region)
        lambda_client = boto3.client('lambda', region_name=aws_region)
        dynamo_client = boto3.client('dynamodb', region_name=aws_region)
        cloudwatch_client = boto3.client('logs', region_name=aws_region)
        
        logger.info(f"✅ Clients AWS initialisés pour la région {aws_region}")
        return s3_client, lambda_client, dynamo_client, cloudwatch_client
    
    except Exception as e:
        logger.error(f"❌ Erreur lors de l'initialisation des clients AWS: {str(e)}")
        raise

def get_lambda_status(lambda_client, function_name):
    """Récupère le statut de la fonction Lambda"""
    try:
        # Obtenir les informations sur la fonction
        function_info = lambda_client.get_function(FunctionName=function_name)
        
        # Obtenir les invocations récentes
        response = lambda_client.list_functions()
        
        # Vérifier si la fonction est active
        last_modified = function_info['Configuration']['LastModified']
        state = function_info['Configuration']['State']
        
        print(f"\n=== Statut de la fonction Lambda {function_name} ===")
        print(f"État actuel: {state}")
        print(f"Dernière modification: {last_modified}")
        print(f"Mémoire allouée: {function_info['Configuration']['MemorySize']} MB")
        print(f"Timeout: {function_info['Configuration']['Timeout']} secondes")
        
        return function_info
    
    except Exception as e:
        logger.error(f"❌ Erreur lors de la récupération du statut Lambda: {str(e)}")
        return None

def get_cloudwatch_logs(cloudwatch_client, function_name, start_time=None, limit=100):
    """Récupère les logs CloudWatch pour la fonction Lambda"""
    try:
        # Définir le nom du groupe de logs
        log_group_name = f"/aws/lambda/{function_name}"
        
        # Obtenir les flux de logs
        log_streams_response = cloudwatch_client.describe_log_streams(
            logGroupName=log_group_name,
            orderBy='LastEventTime',
            descending=True,
            limit=5  # Limiter aux 5 derniers flux
        )
        
        if not log_streams_response.get('logStreams'):
            print("\n⚠️ Aucun flux de logs trouvé pour cette fonction Lambda")
            return []
        
        all_events = []
        
        # Pour chaque flux, récupérer les événements
        for stream in log_streams_response['logStreams']:
            stream_name = stream['logStreamName']
            
            log_events_response = cloudwatch_client.get_log_events(
                logGroupName=log_group_name,
                logStreamName=stream_name,
                limit=limit,
                startFromHead=False
            )
            
            # Ajouter les événements à la liste
            all_events.extend(log_events_response.get('events', []))
        
        # Trier les événements par timestamp
        all_events.sort(key=lambda x: x['timestamp'])
        
        return all_events
    
    except Exception as e:
        logger.error(f"❌ Erreur lors de la récupération des logs CloudWatch: {str(e)}")
        return []

def display_cloudwatch_logs(events, max_lines=50):
    """Affiche les logs CloudWatch de manière formatée"""
    if not events:
        return
    
    print(f"\n=== Derniers logs CloudWatch ({min(len(events), max_lines)} lignes) ===")
    
    # Limiter le nombre de lignes affichées
    events = events[-max_lines:] if len(events) > max_lines else events
    
    for event in events:
        timestamp = datetime.fromtimestamp(event['timestamp'] / 1000).strftime('%Y-%m-%d %H:%M:%S')
        message = event['message'].strip()
        
        # Formater différemment selon le type de message
        if "ERROR" in message or "❌" in message:
            print(f"\033[91m{timestamp} - {message}\033[0m")  # Rouge pour les erreurs
        elif "WARNING" in message or "⚠️" in message:
            print(f"\033[93m{timestamp} - {message}\033[0m")  # Jaune pour les avertissements
        elif "INFO" in message or "✅" in message:
            print(f"\033[92m{timestamp} - {message}\033[0m")  # Vert pour les infos
        else:
            print(f"{timestamp} - {message}")

def check_s3_content(s3_client, bucket_name):
    """Vérifie le contenu du bucket S3"""
    try:
        # Vérifier si le bucket existe
        s3_client.head_bucket(Bucket=bucket_name)
        
        # Lister les objets dans le bucket
        response = s3_client.list_objects_v2(
            Bucket=bucket_name,
            Prefix='content/'
        )
        
        if 'Contents' not in response:
            print(f"\n⚠️ Aucun contenu trouvé dans s3://{bucket_name}/content/")
            return []
        
        contents = response['Contents']
        total_size = sum(item['Size'] for item in contents)
        
        print(f"\n=== Contenu du bucket S3 {bucket_name} ===")
        print(f"Nombre total de fichiers: {len(contents)}")
        print(f"Taille totale: {total_size / (1024 * 1024):.2f} MB")
        
        # Regrouper les fichiers par type
        file_types = defaultdict(int)
        for item in contents:
            key = item['Key']
            if '/' in key:
                file_type = key.split('/')[1] if len(key.split('/')) > 1 else 'unknown'
                file_types[file_type] += 1
        
        print("\nRépartition par type:")
        for file_type, count in file_types.items():
            print(f"- {file_type}: {count} fichiers")
        
        return contents
    
    except Exception as e:
        logger.error(f"❌ Erreur lors de la vérification du contenu S3: {str(e)}")
        return []

def analyze_s3_data(s3_client, bucket_name):
    """Analyse les données dans le bucket S3"""
    try:
        # Lister tous les objets dans le bucket
        response = s3_client.list_objects_v2(
            Bucket=bucket_name,
            Prefix='content/'
        )
        
        if 'Contents' not in response:
            print(f"\n⚠️ Aucun contenu à analyser dans s3://{bucket_name}/content/")
            return
        
        contents = response['Contents']
        
        # Analyser les fichiers JSON
        sources_stats = defaultdict(lambda: {'count': 0, 'size': 0, 'types': Counter()})
        content_types = Counter()
        languages = Counter()
        total_items = 0
        
        for item in contents:
            key = item['Key']
            
            # Ignorer les fichiers non-JSON ou les dossiers
            if not key.endswith('.json'):
                continue
            
            # Télécharger et analyser le fichier JSON
            try:
                response = s3_client.get_object(Bucket=bucket_name, Key=key)
                data = json.loads(response['Body'].read().decode('utf-8'))
                
                # Déterminer le type de données (liste ou objet)
                if isinstance(data, list):
                    # C'est une liste d'éléments
                    items = data
                    # Extraire la source et le type à partir du chemin
                    # Format attendu: content/TYPE/SOURCE/items.json
                    path_parts = key.split('/')
                    if len(path_parts) >= 3:
                        content_type = path_parts[1]
                        source = path_parts[2]
                    else:
                        content_type = 'unknown'
                        source = 'unknown'
                else:
                    # C'est un objet avec des métadonnées
                    if 'results' in data:
                        items = data['results']
                    elif 'items' in data:
                        items = data['items']
                    else:
                        # Statistiques ou autre objet
                        continue
                    
                    # Essayer d'extraire la source et le type
                    source = data.get('source', 'unknown')
                    content_type = data.get('type', 'unknown')
                
                # Traiter chaque élément
                for item_data in items:
                    # Extraire les informations
                    item_source = item_data.get('source', source)
                    item_type = item_data.get('type', content_type)
                    item_language = item_data.get('language', 'unknown')
                    
                    # Mettre à jour les statistiques
                    sources_stats[item_source]['count'] += 1
                    sources_stats[item_source]['types'][item_type] += 1
                    
                    content_types[item_type] += 1
                    languages[item_language] += 1
                    total_items += 1
                
            except Exception as e:
                logger.warning(f"⚠️ Erreur lors de l'analyse du fichier {key}: {str(e)}")
        
        # Afficher les résultats
        print("\n=== Analyse des données scrapées ===")
        print(f"Nombre total d'éléments: {total_items}")
        
        # Tableau des sources
        sources_table = []
        for source, stats in sources_stats.items():
            sources_table.append([
                source,
                stats['count'],
                f"{stats['size'] / 1024:.2f} KB" if stats['size'] > 0 else "N/A",
                ', '.join(f"{t}:{c}" for t, c in stats['types'].most_common())
            ])
        
        print("\nStatistiques par source:")
        print(tabulate(
            sources_table,
            headers=["Source", "Nombre d'éléments", "Taille", "Types de contenu"],
            tablefmt="grid"
        ))
        
        # Tableau des types de contenu
        print("\nRépartition par type de contenu:")
        content_table = [[content, count] for content, count in content_types.most_common()]
        print(tabulate(
            content_table,
            headers=["Type de contenu", "Nombre"],
            tablefmt="grid"
        ))
        
        # Tableau des langues
        print("\nRépartition par langue:")
        language_table = [[lang, count] for lang, count in languages.most_common()]
        print(tabulate(
            language_table,
            headers=["Langue", "Nombre"],
            tablefmt="grid"
        ))
        
        # Générer des graphiques si matplotlib est disponible
        try:
            # Graphique des sources
            plt.figure(figsize=(12, 6))
            sources = [s for s, _ in Counter({s: stats['count'] for s, stats in sources_stats.items()}).most_common()]
            counts = [stats['count'] for s, stats in sorted(sources_stats.items(), key=lambda x: -x[1]['count'])]
            
            if sources and counts:
                plt.bar(sources, counts)
                plt.title('Nombre d\'éléments par source')
                plt.xlabel('Source')
                plt.ylabel('Nombre d\'éléments')
                plt.xticks(rotation=45, ha='right')
                plt.tight_layout()
                
                # Sauvegarder le graphique
                output_dir = Path('reports')
                output_dir.mkdir(exist_ok=True)
                plt.savefig(output_dir / 'sources_distribution.png')
                print(f"\n✅ Graphique sauvegardé dans {output_dir / 'sources_distribution.png'}")
            else:
                print("\n⚠️ Pas assez de données pour générer un graphique")
            
        except Exception as e:
            logger.warning(f"⚠️ Impossible de générer les graphiques: {str(e)}")
    
    except Exception as e:
        logger.error(f"❌ Erreur lors de l'analyse des données: {str(e)}")

def check_dynamo_tables(dynamo_client, table_names):
    """Vérifie les tables DynamoDB"""
    try:
        results = []
        
        for table_name in table_names:
            try:
                # Obtenir les informations sur la table
                response = dynamo_client.describe_table(TableName=table_name)
                table_info = response['Table']
                
                # Obtenir le nombre d'éléments (approximatif)
                item_count = table_info['ItemCount']
                size_bytes = table_info['TableSizeBytes']
                
                results.append({
                    'name': table_name,
                    'status': 'Active' if table_info['TableStatus'] == 'ACTIVE' else table_info['TableStatus'],
                    'items': item_count,
                    'size': f"{size_bytes / 1024:.2f} KB"
                })
                
            except dynamo_client.exceptions.ResourceNotFoundException:
                results.append({
                    'name': table_name,
                    'status': 'Not Found',
                    'items': 0,
                    'size': '0 KB'
                })
        
        # Afficher les résultats
        print("\n=== Tables DynamoDB ===")
        table_data = [[r['name'], r['status'], r['items'], r['size']] for r in results]
        print(tabulate(
            table_data,
            headers=["Nom de la table", "Statut", "Nombre d'éléments", "Taille"],
            tablefmt="grid"
        ))
        
        return results
    
    except Exception as e:
        logger.error(f"❌ Erreur lors de la vérification des tables DynamoDB: {str(e)}")
        return []

def load_config():
    """Charge la configuration depuis le fichier config/api_config.json"""
    try:
        config_path = Path(__file__).parent / 'config' / 'api_config.json'
        
        if not config_path.exists():
            logger.warning(f"⚠️ Fichier de configuration non trouvé: {config_path}")
            return None
        
        with open(config_path, 'r') as f:
            config = json.load(f)
        
        return config
    
    except Exception as e:
        logger.error(f"❌ Erreur lors du chargement de la configuration: {str(e)}")
        return None

def main():
    """Fonction principale"""
    parser = argparse.ArgumentParser(description="Vérification du statut de scraping FloDrama AWS")
    parser.add_argument('--bucket', type=str, help="Nom du bucket S3 à vérifier")
    parser.add_argument('--lambda-name', type=str, default="FloDramaContentScraper", help="Nom de la fonction Lambda")
    parser.add_argument('--analyze', action='store_true', help="Analyser les données en détail")
    parser.add_argument('--logs', action='store_true', help="Afficher les logs CloudWatch")
    parser.add_argument('--log-lines', type=int, default=50, help="Nombre de lignes de logs à afficher")
    args = parser.parse_args()
    
    # Charger la configuration
    config = load_config()
    
    # Utiliser les valeurs de la configuration si disponibles
    bucket_name = args.bucket or (config['bucket'] if config else None)
    lambda_name = args.lambda_name or (config['lambda'] if config else "FloDramaContentScraper")
    
    if not bucket_name:
        print("❌ Veuillez spécifier un nom de bucket avec --bucket ou via le fichier de configuration")
        return
    
    # Initialiser les clients AWS
    s3_client, lambda_client, dynamo_client, cloudwatch_client = setup_aws_clients()
    
    # Afficher l'en-tête
    print("\n╔════════════════════════════════════════════════╗")
    print("║                                                ║")
    print("║   Vérification du scraping FloDrama sur AWS   ║")
    print("║                                                ║")
    print("╚════════════════════════════════════════════════╝\n")
    
    # Vérifier le statut de la fonction Lambda
    lambda_info = get_lambda_status(lambda_client, lambda_name)
    
    # Afficher les logs CloudWatch si demandé
    if args.logs and lambda_info:
        events = get_cloudwatch_logs(cloudwatch_client, lambda_name, limit=args.log_lines)
        display_cloudwatch_logs(events, max_lines=args.log_lines)
    
    # Vérifier le contenu du bucket S3
    s3_contents = check_s3_content(s3_client, bucket_name)
    
    # Vérifier les tables DynamoDB
    check_dynamo_tables(dynamo_client, ['FloDramaContent', 'FloDramaMetadata'])
    
    # Analyser les données en détail si demandé
    if args.analyze and s3_contents:
        analyze_s3_data(s3_client, bucket_name)
    
    print("\n✅ Vérification terminée")

if __name__ == "__main__":
    main()
