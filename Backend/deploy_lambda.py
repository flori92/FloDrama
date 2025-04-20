#!/usr/bin/env python3
"""
Script de déploiement de la fonction Lambda pour le scraping FloDrama
"""
import os
import sys
import boto3
import json
import logging
import shutil
import tempfile
import zipfile
from pathlib import Path

# Configuration du logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('FloDrama-Deploy')

def get_aws_session():
    """Crée une session AWS avec le profil flodrama-scraping"""
    try:
        session = boto3.Session(profile_name='flodrama-scraping')
        return session
    except Exception as e:
        logger.error(f"Erreur lors de la création de la session AWS: {e}")
        return None

def create_lambda_package():
    """Crée le package ZIP pour la fonction Lambda"""
    logger.info("Création du package Lambda...")
    
    # Création d'un répertoire temporaire
    temp_dir = tempfile.mkdtemp()
    try:
        # Chemin du répertoire src
        src_dir = Path(__file__).parent / 'src'
        if not src_dir.exists():
            logger.error(f"Le répertoire source {src_dir} n'existe pas")
            return None
        
        # Création du fichier lambda_function.py
        lambda_file = Path(temp_dir) / 'lambda_function.py'
        with open(lambda_file, 'w', encoding='utf-8') as f:
            f.write('''
import json
import logging
import os
import sys
from datetime import datetime

# Configuration du logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Ajout du répertoire courant au path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Import des modules de scraping
from src.services.ScrapingService import ScrapingService
from src.config.scraping_config import STREAMING_SOURCES

def lambda_handler(event, context):
    """Fonction handler Lambda pour le scraping"""
    logger.info(f"Événement reçu: {json.dumps(event)}")
    
    # Récupération des paramètres
    source = event.get('source')
    category = event.get('category')
    
    if not source or not category:
        logger.error("Paramètres manquants: source et category sont requis")
        return {
            'statusCode': 400,
            'body': json.dumps('Paramètres manquants')
        }
    
    # Vérification que la source existe
    if source not in STREAMING_SOURCES:
        logger.error(f"Source inconnue: {source}")
        return {
            'statusCode': 400,
            'body': json.dumps('Source inconnue')
        }
    
    # Récupération des variables d'environnement
    mongodb_uri = os.environ.get('MONGODB_URI')
    redis_host = os.environ.get('REDIS_HOST')
    opensearch_endpoint = os.environ.get('OPENSEARCH_ENDPOINT')
    
    if not mongodb_uri or not redis_host or not opensearch_endpoint:
        logger.error("Variables d'environnement manquantes")
        return {
            'statusCode': 500,
            'body': json.dumps('Configuration incomplète')
        }
    
    try:
        # Initialisation du service de scraping
        scraping_service = ScrapingService(
            mongodb_uri=mongodb_uri,
            redis_host=redis_host,
            opensearch_endpoint=opensearch_endpoint
        )
        
        # Configuration de la source
        source_config = STREAMING_SOURCES[source]
        base_url = source_config['base_url']
        
        # Détermination des URLs à scraper
        urls_to_scrape = []
        if category == 'drama':
            urls_to_scrape.append(source_config['latest_url'].format(base_url=base_url))
            urls_to_scrape.append(source_config['popular_url'].format(base_url=base_url))
        elif category == 'anime':
            urls_to_scrape.append(source_config['latest_url'].format(base_url=base_url))
            urls_to_scrape.append(source_config['popular_url'].format(base_url=base_url))
        else:
            urls_to_scrape.append(source_config['latest_url'].format(base_url=base_url))
        
        # Scraping des URLs
        results = []
        for url in urls_to_scrape:
            logger.info(f"Scraping de {url}")
            content = scraping_service.scrape_content(url)
            if content:
                results.append(content)
                # Stockage du contenu
                scraping_service.store_content(content)
        
        # Mise à jour des widgets
        scraping_service.update_content_widgets()
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'source': source,
                'category': category,
                'items_scraped': len(results),
                'timestamp': datetime.now().isoformat()
            })
        }
    except Exception as e:
        logger.error(f"Erreur lors du scraping: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps(f'Erreur: {str(e)}')
        }
''')
        
        # Copie du répertoire src
        shutil.copytree(src_dir, Path(temp_dir) / 'src')
        
        # Création du fichier requirements.txt
        requirements_file = Path(temp_dir) / 'requirements.txt'
        with open(requirements_file, 'w', encoding='utf-8') as f:
            f.write("""
aiohttp==3.8.5
beautifulsoup4==4.12.2
langdetect==1.0.9
motor==3.3.1
redis==5.0.1
opensearch-py==2.3.1
boto3==1.28.38
aws-lambda-powertools==2.26.0
""")
        
        # Création du package ZIP
        zip_path = Path(__file__).parent / 'flodrama-scraper.zip'
        with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
            # Ajout de lambda_function.py
            zipf.write(lambda_file, 'lambda_function.py')
            
            # Ajout du répertoire src
            for root, dirs, files in os.walk(Path(temp_dir) / 'src'):
                for file in files:
                    file_path = os.path.join(root, file)
                    arcname = os.path.relpath(file_path, temp_dir)
                    zipf.write(file_path, arcname)
        
        logger.info(f"Package Lambda créé: {zip_path}")
        return zip_path
    
    finally:
        # Nettoyage du répertoire temporaire
        shutil.rmtree(temp_dir)

def deploy_lambda(session, zip_path):
    """Déploie la fonction Lambda"""
    logger.info("Déploiement de la fonction Lambda...")
    
    lambda_client = session.client('lambda')
    
    # Vérification si la fonction existe déjà
    try:
        lambda_client.get_function(FunctionName='flodrama-scraper')
        function_exists = True
    except lambda_client.exceptions.ResourceNotFoundException:
        function_exists = False
    
    # Lecture du fichier ZIP
    with open(zip_path, 'rb') as zip_file:
        zip_content = zip_file.read()
    
    # Création du rôle IAM si nécessaire
    iam_client = session.client('iam')
    role_name = 'flodrama-scraper-role'
    role_arn = None
    
    try:
        # Vérification si le rôle existe
        response = iam_client.get_role(RoleName=role_name)
        role_arn = response['Role']['Arn']
        logger.info(f"Rôle IAM existant: {role_arn}")
    except iam_client.exceptions.NoSuchEntityException:
        # Création du rôle
        logger.info("Création du rôle IAM...")
        
        assume_role_policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Principal": {"Service": "lambda.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }
            ]
        }
        
        response = iam_client.create_role(
            RoleName=role_name,
            AssumeRolePolicyDocument=json.dumps(assume_role_policy),
            Description='Rôle pour la fonction Lambda de scraping FloDrama'
        )
        
        role_arn = response['Role']['Arn']
        
        # Attachement des politiques nécessaires
        iam_client.attach_role_policy(
            RoleName=role_name,
            PolicyArn='arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'
        )
        
        # Attendre que le rôle soit disponible
        import time
        time.sleep(10)
        
        logger.info(f"Rôle IAM créé: {role_arn}")
    
    # Variables d'environnement pour la fonction Lambda
    environment_variables = {
        'MONGODB_URI': os.environ.get('MONGODB_URI', 'mongodb://localhost:27017'),
        'REDIS_HOST': os.environ.get('REDIS_HOST', 'localhost'),
        'OPENSEARCH_ENDPOINT': os.environ.get('OPENSEARCH_ENDPOINT', 'localhost:9200'),
        'DEBUG': 'True'
    }
    
    if function_exists:
        # Mise à jour de la fonction existante
        response = lambda_client.update_function_code(
            FunctionName='flodrama-scraper',
            ZipFile=zip_content,
            Publish=True
        )
        
        # Mise à jour de la configuration
        lambda_client.update_function_configuration(
            FunctionName='flodrama-scraper',
            Timeout=300,  # 5 minutes
            MemorySize=512,  # 512 Mo
            Environment={
                'Variables': environment_variables
            }
        )
        
        logger.info("Fonction Lambda mise à jour avec succès")
    else:
        # Création de la fonction
        response = lambda_client.create_function(
            FunctionName='flodrama-scraper',
            Runtime='python3.9',
            Role=role_arn,
            Handler='lambda_function.lambda_handler',
            Code={'ZipFile': zip_content},
            Timeout=300,  # 5 minutes
            MemorySize=512,  # 512 Mo
            Environment={
                'Variables': environment_variables
            },
            Description='Fonction de scraping pour FloDrama'
        )
        
        logger.info("Fonction Lambda créée avec succès")
    
    return response['FunctionArn']

def main():
    """Fonction principale"""
    print("\n╔════════════════════════════════════════════════╗")
    print("║                                                ║")
    print("║   Déploiement de la fonction Lambda           ║")
    print("║   FloDrama - Scraping                         ║")
    print("║                                                ║")
    print("╚════════════════════════════════════════════════╝\n")
    
    # Obtention de la session AWS
    session = get_aws_session()
    if not session:
        logger.error("Impossible de créer une session AWS. Vérifiez vos identifiants.")
        return
    
    # Création du package Lambda
    zip_path = create_lambda_package()
    if not zip_path:
        logger.error("Impossible de créer le package Lambda.")
        return
    
    # Déploiement de la fonction Lambda
    try:
        function_arn = deploy_lambda(session, zip_path)
        print("\n✅ Déploiement réussi")
        print(f"ARN de la fonction: {function_arn}")
        print("\nVous pouvez maintenant lancer le scraping avec:")
        print("python3 launch_aws_scraping.py")
    except Exception as e:
        logger.error(f"Erreur lors du déploiement: {e}")
        print("\n❌ Échec du déploiement")
    
    # Nettoyage du fichier ZIP
    os.remove(zip_path)

if __name__ == '__main__':
    main()
