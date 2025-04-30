#!/usr/bin/env python3
"""
Script de déploiement du scraping FloDrama sur AWS
Ce script déploie le scraper directement sur AWS Lambda et lance le processus
"""
import os
import sys
import json
import boto3
import zipfile
import tempfile
import subprocess
from pathlib import Path
from datetime import datetime

# Configuration du projet
PROJECT_NAME = "FloDrama"
LAMBDA_FUNCTION_NAME = f"{PROJECT_NAME}ContentScraper"
S3_BUCKET_NAME = f"{PROJECT_NAME.lower()}-content-{int(datetime.now().timestamp())}"
ROLE_NAME = f"{PROJECT_NAME}ScraperRole"
DYNAMODB_CONTENT_TABLE = f"{PROJECT_NAME}Content"
DYNAMODB_METADATA_TABLE = f"{PROJECT_NAME}Metadata"

def load_aws_credentials():
    """Charge les identifiants AWS depuis ~/.aws/credentials"""
    try:
        # Vérifier si AWS CLI est configuré
        print("Vérification de la configuration AWS...")
        
        # Utiliser les variables d'environnement si elles existent
        aws_access_key = os.environ.get('AWS_ACCESS_KEY_ID')
        aws_secret_key = os.environ.get('AWS_SECRET_ACCESS_KEY')
        aws_region = os.environ.get('AWS_REGION', 'us-east-1')
        
        if aws_access_key and aws_secret_key:
            print("✅ Identifiants AWS trouvés dans les variables d'environnement")
            return aws_access_key, aws_secret_key, aws_region
        
        # Sinon, essayer de charger depuis ~/.aws/credentials
        home_dir = str(Path.home())
        aws_credentials_path = os.path.join(home_dir, '.aws', 'credentials')
        
        if os.path.exists(aws_credentials_path):
            print(f"✅ Fichier de configuration AWS trouvé: {aws_credentials_path}")
            
            # Lire le fichier credentials
            credentials = {}
            current_profile = None
            
            with open(aws_credentials_path, 'r') as f:
                for line in f:
                    line = line.strip()
                    if not line or line.startswith('#'):
                        continue
                    
                    if line.startswith('[') and line.endswith(']'):
                        current_profile = line[1:-1]
                        credentials[current_profile] = {}
                    elif '=' in line and current_profile:
                        key, value = line.split('=', 1)
                        credentials[current_profile][key.strip()] = value.strip()
            
            # Utiliser le profile 'default' ou demander à l'utilisateur
            profile = input(f"Quel profile AWS souhaitez-vous utiliser? ({', '.join(credentials.keys())}) [default]: ").strip() or 'default'
            
            if profile in credentials:
                aws_access_key = credentials[profile].get('aws_access_key_id')
                aws_secret_key = credentials[profile].get('aws_secret_access_key')
                aws_region = credentials[profile].get('region', 'us-east-1')
                
                if aws_access_key and aws_secret_key:
                    # Définir les variables d'environnement
                    os.environ['AWS_ACCESS_KEY_ID'] = aws_access_key
                    os.environ['AWS_SECRET_ACCESS_KEY'] = aws_secret_key
                    os.environ['AWS_REGION'] = aws_region
                    
                    print(f"✅ Utilisation du profile AWS '{profile}'")
                    return aws_access_key, aws_secret_key, aws_region
        
        # Si on arrive ici, demander manuellement
        print("❌ Identifiants AWS non trouvés")
        aws_access_key = input("AWS Access Key ID: ").strip()
        aws_secret_key = input("AWS Secret Access Key: ").strip()
        aws_region = input("AWS Region [us-east-1]: ").strip() or 'us-east-1'
        
        # Définir les variables d'environnement
        os.environ['AWS_ACCESS_KEY_ID'] = aws_access_key
        os.environ['AWS_SECRET_ACCESS_KEY'] = aws_secret_key
        os.environ['AWS_REGION'] = aws_region
        
        return aws_access_key, aws_secret_key, aws_region
    
    except Exception as e:
        print(f"❌ Erreur lors du chargement des identifiants AWS: {str(e)}")
        sys.exit(1)

def get_aws_account_id(session):
    """Récupère l'ID du compte AWS"""
    try:
        sts_client = session.client('sts')
        return sts_client.get_caller_identity()['Account']
    except Exception as e:
        print(f"❌ Erreur lors de la récupération de l'ID du compte AWS: {str(e)}")
        sys.exit(1)

def prepare_scraper_package():
    """Prépare le package Lambda pour le déploiement"""
    try:
        print("\n=== Préparation du package de déploiement ===")
        
        # Créer un répertoire temporaire
        temp_dir = tempfile.mkdtemp()
        zip_path = os.path.join(temp_dir, 'scraper_lambda_package.zip')
        
        # Chemin vers le script de scraping
        current_dir = os.path.dirname(os.path.abspath(__file__))
        scraper_path = os.path.join(current_dir, 'scrape_content.py')
        
        if not os.path.exists(scraper_path):
            print(f"❌ Script de scraping non trouvé: {scraper_path}")
            sys.exit(1)
        
        # Créer le fichier lambda_handler.py
        lambda_handler_path = os.path.join(temp_dir, 'lambda_handler.py')
        
        with open(lambda_handler_path, 'w') as f:
            f.write("""import json
import scrape_content

def lambda_handler(event, context):
    # Gestionnaire Lambda pour le scraping de contenu FloDrama
    try:
        # Extraire les paramètres de l'événement
        sources = event.get('sources', [])
        limit = event.get('limit', 100)
        
        # Lancer le scraping
        results = scrape_content.lambda_handler(sources, limit)
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Scraping terminé avec succès',
                'items_count': len(results)
            })
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({
                'message': f'Erreur lors du scraping: {str(e)}'
            })
        }
""")
        
        # Modifier le scrape_content.py pour ajouter la fonction lambda_handler
        # Pour le déploiement AWS Lambda
        with open(scraper_path, 'r') as f:
            scraper_content = f.read()
        
        # Vérifier si la fonction lambda_handler existe déjà
        if 'def lambda_handler(' not in scraper_content:
            # Ajouter la fonction lambda_handler à la fin du fichier
            lambda_function = """
# Fonction d'entrée pour AWS Lambda
def lambda_handler(sources=None, limit=100):
    try:
        print("Lancement du scraping depuis AWS Lambda")
        
        # Charger les sources
        all_sources = load_scraping_sources()
        
        # Filtrer les sources si spécifiées
        if sources:
            selected_sources = {name: config for name, config in all_sources.items() if name in sources}
        else:
            selected_sources = all_sources
        
        if not selected_sources:
            print("Aucune source valide spécifiée")
            return []
        
        # Résultats
        results = []
        
        # Scraper chaque source
        for name, config in selected_sources.items():
            print(f"Scraping de {name}...")
            try:
                items = scrape_source(name, config, limit)
                results.extend(items)
                print(f"✅ {len(items)} éléments scrapés depuis {name}")
            except Exception as e:
                print(f"❌ Erreur lors du scraping de {name}: {str(e)}")
        
        print(f"Scraping terminé: {len(results)} éléments au total")
        return results
    
    except Exception as e:
        print(f"❌ Erreur générale: {str(e)}")
        return []
"""
            
            # Ajouter la fonction au fichier
            with open(os.path.join(temp_dir, 'scrape_content.py'), 'w') as f:
                f.write(scraper_content + lambda_function)
            
            # Utiliser la version modifiée
            scraper_path = os.path.join(temp_dir, 'scrape_content.py')
        
        # Créer un fichier ZIP
        with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
            # Ajouter le script de scraping
            zipf.write(scraper_path, os.path.basename(scraper_path))
            
            # Ajouter le gestionnaire Lambda
            zipf.write(lambda_handler_path, os.path.basename(lambda_handler_path))
            
            # Ajouter un fichier de requirements.txt
            requirements_path = os.path.join(temp_dir, 'requirements.txt')
            
            with open(requirements_path, 'w') as f:
                f.write("""requests==2.28.2
beautifulsoup4==4.11.2
boto3==1.26.115
fake-useragent==1.1.3
""")
            
            zipf.write(requirements_path, os.path.basename(requirements_path))
        
        print(f"✅ Package de déploiement créé: {zip_path}")
        return zip_path
    
    except Exception as e:
        print(f"❌ Erreur lors de la préparation du package: {str(e)}")
        sys.exit(1)

def deploy_aws_infrastructure(session, lambda_zip_path):
    """Déploie l'infrastructure AWS pour le scraping"""
    try:
        # Récupérer les clients AWS
        aws_region = session.region_name
        s3_client = session.client('s3')
        lambda_client = session.client('lambda')
        dynamodb_client = session.client('dynamodb')
        iam_client = session.client('iam')
        
        account_id = get_aws_account_id(session)
        
        # Créer le bucket S3
        print(f"\n=== Création du bucket S3: {S3_BUCKET_NAME} ===")
        
        try:
            s3_client.head_bucket(Bucket=S3_BUCKET_NAME)
            print(f"Le bucket S3 {S3_BUCKET_NAME} existe déjà")
        except:
            # Correction pour éviter l'erreur MalformedXML
            if aws_region == 'us-east-1':
                # Pour us-east-1, ne pas spécifier de LocationConstraint
                s3_client.create_bucket(Bucket=S3_BUCKET_NAME)
            else:
                # Pour les autres régions, spécifier la contrainte de localisation
                s3_client.create_bucket(
                    Bucket=S3_BUCKET_NAME,
                    CreateBucketConfiguration={'LocationConstraint': aws_region}
                )
            
            print(f"✅ Bucket S3 {S3_BUCKET_NAME} créé avec succès")
        
        # Définir une politique de bucket pour accès public
        bucket_policy = {
            'Version': '2012-10-17',
            'Statement': [{
                'Sid': 'PublicReadGetObject',
                'Effect': 'Allow',
                'Principal': '*',
                'Action': ['s3:GetObject'],
                'Resource': [f'arn:aws:s3:::{S3_BUCKET_NAME}/*']
            }]
        }
        
        s3_client.put_bucket_policy(
            Bucket=S3_BUCKET_NAME,
            Policy=json.dumps(bucket_policy)
        )
        
        print(f"✅ Politique d'accès configurée pour {S3_BUCKET_NAME}")
        
        # Activer le site web statique
        s3_client.put_bucket_website(
            Bucket=S3_BUCKET_NAME,
            WebsiteConfiguration={
                'IndexDocument': {'Suffix': 'index.html'},
                'ErrorDocument': {'Key': 'error.html'}
            }
        )
        
        print(f"✅ Site web statique configuré pour {S3_BUCKET_NAME}")
        website_url = f"http://{S3_BUCKET_NAME}.s3-website-{aws_region}.amazonaws.com"
        
        # Télécharger le package Lambda
        package_key = 'lambda/scraper_package.zip'
        
        with open(lambda_zip_path, 'rb') as f:
            s3_client.upload_fileobj(f, S3_BUCKET_NAME, package_key)
        
        print(f"✅ Package Lambda téléchargé vers s3://{S3_BUCKET_NAME}/{package_key}")
        
        # Créer le rôle IAM pour Lambda
        print(f"\n=== Configuration du rôle IAM: {ROLE_NAME} ===")
        
        role_arn = None
        
        # Vérifier si le rôle existe déjà
        try:
            response = iam_client.get_role(RoleName=ROLE_NAME)
            role_arn = response['Role']['Arn']
            print(f"Le rôle {ROLE_NAME} existe déjà: {role_arn}")
        except:
            # Créer un nouveau rôle
            trust_policy = {
                'Version': '2012-10-17',
                'Statement': [{
                    'Effect': 'Allow',
                    'Principal': {'Service': 'lambda.amazonaws.com'},
                    'Action': 'sts:AssumeRole'
                }]
            }
            
            response = iam_client.create_role(
                RoleName=ROLE_NAME,
                AssumeRolePolicyDocument=json.dumps(trust_policy),
                Description=f'Rôle pour la fonction Lambda {LAMBDA_FUNCTION_NAME}'
            )
            
            role_arn = response['Role']['Arn']
            print(f"✅ Rôle {ROLE_NAME} créé: {role_arn}")
            
            # Attacher les politiques nécessaires
            iam_client.attach_role_policy(
                RoleName=ROLE_NAME,
                PolicyArn='arn:aws:iam::aws:policy/AmazonS3FullAccess'
            )
            
            iam_client.attach_role_policy(
                RoleName=ROLE_NAME,
                PolicyArn='arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess'
            )
            
            iam_client.attach_role_policy(
                RoleName=ROLE_NAME,
                PolicyArn='arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'
            )
            
            print("✅ Politiques attachées au rôle")
            
            # Attendre que le rôle soit disponible
            print("Attente de la propagation du rôle...")
            import time
            time.sleep(10)
        
        # Créer les tables DynamoDB
        print(f"\n=== Configuration des tables DynamoDB ===")
        
        # Table de contenu
        try:
            dynamodb_client.describe_table(TableName=DYNAMODB_CONTENT_TABLE)
            print(f"La table {DYNAMODB_CONTENT_TABLE} existe déjà")
        except:
            dynamodb_client.create_table(
                TableName=DYNAMODB_CONTENT_TABLE,
                KeySchema=[
                    {'AttributeName': 'id', 'KeyType': 'HASH'}
                ],
                AttributeDefinitions=[
                    {'AttributeName': 'id', 'AttributeType': 'S'}
                ],
                BillingMode='PAY_PER_REQUEST'
            )
            
            print(f"✅ Table {DYNAMODB_CONTENT_TABLE} créée avec succès")
        
        # Table de métadonnées
        try:
            dynamodb_client.describe_table(TableName=DYNAMODB_METADATA_TABLE)
            print(f"La table {DYNAMODB_METADATA_TABLE} existe déjà")
        except:
            dynamodb_client.create_table(
                TableName=DYNAMODB_METADATA_TABLE,
                KeySchema=[
                    {'AttributeName': 'key', 'KeyType': 'HASH'}
                ],
                AttributeDefinitions=[
                    {'AttributeName': 'key', 'AttributeType': 'S'}
                ],
                BillingMode='PAY_PER_REQUEST'
            )
            
            print(f"✅ Table {DYNAMODB_METADATA_TABLE} créée avec succès")
        
        # Déployer la fonction Lambda
        print(f"\n=== Déploiement de la fonction Lambda: {LAMBDA_FUNCTION_NAME} ===")
        
        # Vérifier si la fonction existe déjà
        try:
            lambda_client.get_function(FunctionName=LAMBDA_FUNCTION_NAME)
            
            # Mettre à jour la fonction existante
            response = lambda_client.update_function_code(
                FunctionName=LAMBDA_FUNCTION_NAME,
                S3Bucket=S3_BUCKET_NAME,
                S3Key=package_key,
                Publish=True
            )
            
            lambda_arn = response['FunctionArn']
            print(f"✅ Fonction Lambda {LAMBDA_FUNCTION_NAME} mise à jour: {lambda_arn}")
        
        except lambda_client.exceptions.ResourceNotFoundException:
            # Créer une nouvelle fonction
            response = lambda_client.create_function(
                FunctionName=LAMBDA_FUNCTION_NAME,
                Runtime='python3.9',
                Role=role_arn,
                Handler='lambda_handler.lambda_handler',
                Code={
                    'S3Bucket': S3_BUCKET_NAME,
                    'S3Key': package_key
                },
                Timeout=900,  # 15 minutes (maximum)
                MemorySize=1024,
                Environment={
                    'Variables': {
                        'OUTPUT_BUCKET': S3_BUCKET_NAME,
                        'CONTENT_TABLE': DYNAMODB_CONTENT_TABLE,
                        'METADATA_TABLE': DYNAMODB_METADATA_TABLE
                    }
                },
                Tags={
                    'Project': PROJECT_NAME,
                    'Component': 'ContentScraping'
                }
            )
            
            lambda_arn = response['FunctionArn']
            print(f"✅ Fonction Lambda {LAMBDA_FUNCTION_NAME} créée: {lambda_arn}")
        
        # Mettre à jour la configuration API dans le frontend
        update_frontend_api_config(website_url)
        
        return {
            'lambda_arn': lambda_arn,
            'bucket_name': S3_BUCKET_NAME,
            'website_url': website_url,
            'dynamodb_content_table': DYNAMODB_CONTENT_TABLE,
            'dynamodb_metadata_table': DYNAMODB_METADATA_TABLE
        }
    
    except Exception as e:
        print(f"❌ Erreur lors du déploiement AWS: {str(e)}")
        sys.exit(1)

def invoke_lambda_scraper(session, sources=None, limit=100):
    """Invoque la fonction Lambda pour lancer le scraping"""
    try:
        print(f"\n=== Lancement du scraping sur AWS Lambda ===")
        
        lambda_client = session.client('lambda')
        
        # Préparer le payload
        payload = {
            'sources': sources if sources else [],
            'limit': limit
        }
        
        # Invoquer la fonction
        response = lambda_client.invoke(
            FunctionName=LAMBDA_FUNCTION_NAME,
            InvocationType='Event',  # Asynchrone
            Payload=json.dumps(payload)
        )
        
        if response['StatusCode'] == 202:
            print(f"✅ Scraping lancé avec succès sur AWS Lambda")
            print(f"Le scraping s'exécute en arrière-plan et peut prendre plusieurs minutes.")
            
            if not sources:
                print("Toutes les sources configurées seront scrapées")
            else:
                print(f"Sources à scraper: {', '.join(sources)}")
            
            print(f"Limite par source: {limit} éléments")
            
            return True
        else:
            print(f"❌ Erreur lors du lancement du scraping: {response}")
            return False
    
    except Exception as e:
        print(f"❌ Erreur lors de l'invocation de Lambda: {str(e)}")
        return False

def update_frontend_api_config(api_endpoint):
    """Met à jour la configuration frontend avec l'endpoint API"""
    try:
        print("\n=== Mise à jour de la configuration frontend ===")
        
        # Chemin vers le fichier de configuration
        current_dir = os.path.dirname(os.path.abspath(__file__))
        frontend_dir = os.path.join(os.path.dirname(current_dir), 'Frontend')
        config_path = os.path.join(frontend_dir, 'src', 'config.ts')
        
        if not os.path.exists(config_path):
            print(f"⚠️ Fichier de configuration frontend non trouvé: {config_path}")
            return False
        
        # Lire le fichier config.ts
        with open(config_path, 'r') as f:
            config_content = f.read()
        
        # Mettre à jour l'URL de l'API
        import re
        updated_content = re.sub(
            r'baseUrl: [^,]+,',
            f"baseUrl: process.env.NEXT_PUBLIC_API_URL || '{api_endpoint}',",
            config_content
        )
        
        # Sauvegarder la configuration mise à jour
        with open(config_path, 'w') as f:
            f.write(updated_content)
        
        print(f"✅ Configuration frontend mise à jour avec l'endpoint API: {api_endpoint}")
        return True
    
    except Exception as e:
        print(f"❌ Erreur lors de la mise à jour de la configuration: {str(e)}")
        return False

def main():
    """Fonction principale"""
    print("\n╔════════════════════════════════════════════════╗")
    print("║                                                ║")
    print("║   Déploiement du scraping FloDrama sur AWS    ║")
    print("║                                                ║")
    print("╚════════════════════════════════════════════════╝\n")
    
    # Charger les identifiants AWS
    aws_access_key, aws_secret_key, aws_region = load_aws_credentials()
    
    # Créer la session AWS
    session = boto3.Session(
        aws_access_key_id=aws_access_key,
        aws_secret_access_key=aws_secret_key,
        region_name=aws_region
    )
    
    # Préparer le package Lambda
    lambda_zip_path = prepare_scraper_package()
    
    # Demander confirmation
    print("\nCette opération va configurer et déployer l'infrastructure de scraping sur AWS.")
    print("Les ressources suivantes seront créées ou mises à jour:")
    print(f"- Bucket S3: {S3_BUCKET_NAME}")
    print(f"- Fonction Lambda: {LAMBDA_FUNCTION_NAME}")
    print(f"- Tables DynamoDB: {DYNAMODB_CONTENT_TABLE}, {DYNAMODB_METADATA_TABLE}")
    print(f"- Rôle IAM: {ROLE_NAME}\n")
    
    confirmation = input("Voulez-vous continuer? (o/N): ").strip().lower()
    
    if confirmation != 'o':
        print("Opération annulée.")
        sys.exit(0)
    
    # Déployer l'infrastructure AWS
    config = deploy_aws_infrastructure(session, lambda_zip_path)
    
    # Demander quelles sources scraper
    print("\n=== Configuration du scraping ===")
    
    source_choice = input("Voulez-vous scraper toutes les sources ou spécifier certaines sources? (toutes/spécifier): ").strip().lower()
    
    sources = None
    if source_choice == 'spécifier':
        sources_input = input("Entrez les noms des sources à scraper, séparés par des virgules: ").strip()
        sources = [s.strip() for s in sources_input.split(',') if s.strip()]
    
    limit = int(input("Combien d'éléments maximum par source? [100]: ").strip() or "100")
    
    # Lancer le scraping
    invoke_lambda_scraper(session, sources, limit)
    
    print("\n=== Résumé du déploiement ===")
    print(f"Bucket S3: {config['bucket_name']}")
    print(f"URL du site: {config['website_url']}")
    print(f"Fonction Lambda: {LAMBDA_FUNCTION_NAME}")
    print(f"Tables DynamoDB: {config['dynamodb_content_table']}, {config['dynamodb_metadata_table']}")
    
    print("\n✅ Le déploiement et le lancement du scraping sont terminés.")
    print("Vous pouvez suivre la progression dans la console AWS Lambda ou CloudWatch.")
    print(f"Les données scrapées seront disponibles via: {config['website_url']}/api/")

if __name__ == '__main__':
    main()
