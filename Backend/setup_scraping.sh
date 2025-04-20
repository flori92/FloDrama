#!/bin/bash

# Script de configuration du système de scraping FloDrama
# Ce script installe les dépendances nécessaires et configure l'environnement

echo "╔════════════════════════════════════════════════╗"
echo "║                                                ║"
echo "║   Configuration du système de scraping         ║"
echo "║   FloDrama - Installation et configuration     ║"
echo "║                                                ║"
echo "╚════════════════════════════════════════════════╝"

# Vérification de Python
if command -v python3 &>/dev/null; then
    echo "✅ Python 3 est installé"
    PYTHON_CMD="python3"
else
    echo "❌ Python 3 n'est pas installé. Installation nécessaire."
    exit 1
fi

# Vérification de pip
if command -v pip3 &>/dev/null; then
    echo "✅ pip3 est installé"
    PIP_CMD="pip3"
else
    echo "❌ pip3 n'est pas installé. Installation nécessaire."
    exit 1
fi

# Vérification de AWS CLI
if command -v aws &>/dev/null; then
    echo "✅ AWS CLI est installé"
else
    echo "❌ AWS CLI n'est pas installé. Installation nécessaire."
    echo "Veuillez installer AWS CLI: https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html"
    exit 1
fi

# Installation des dépendances Python
echo -e "\n📦 Installation des dépendances Python..."
$PIP_CMD install --upgrade pip
$PIP_CMD install aiohttp jinja2 beautifulsoup4 langdetect motor redis opensearch-py boto3 aws-lambda-powertools

# Création du répertoire de rapports s'il n'existe pas
mkdir -p "$(dirname "$0")/reports"

# Configuration de l'environnement AWS
echo -e "\n🔧 Configuration de l'environnement AWS..."
echo "Veuillez fournir vos identifiants AWS pour le scraping :"

read -p "AWS Access Key ID: " aws_access_key
read -p "AWS Secret Access Key: " aws_secret_key
read -p "AWS Region (par défaut: eu-west-3): " aws_region
aws_region=${aws_region:-eu-west-3}

# Création du fichier de configuration AWS
mkdir -p ~/.aws
cat > ~/.aws/credentials << EOL
[flodrama-scraping]
aws_access_key_id = $aws_access_key
aws_secret_access_key = $aws_secret_key
region = $aws_region
EOL

echo "✅ Configuration AWS enregistrée"

# Création du fichier .env pour le backend
cat > "$(dirname "$0")/.env" << EOL
# Configuration FloDrama Scraping
MONGODB_URI=mongodb://localhost:27017
REDIS_HOST=localhost
OPENSEARCH_ENDPOINT=localhost:9200

# Configuration AWS
AWS_PROFILE=flodrama-scraping
AWS_REGION=$aws_region

# Configuration du scraping
DEBUG=True
MIN_ITEMS_PER_CATEGORY=200
SCRAPING_INTERVAL=3600
EOL

echo "✅ Fichier .env créé"

# Création du script de lancement du scraping AWS
cat > "$(dirname "$0")/launch_aws_scraping.py" << EOL
#!/usr/bin/env python3
"""
Script de lancement du scraping sur AWS Lambda
"""
import os
import sys
import boto3
import json
import logging
from datetime import datetime
from pathlib import Path

# Configuration du logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('FloDrama-Scraping')

# Chargement de la configuration
sys.path.append(str(Path(__file__).parent))
try:
    from src.config.scraping_config import STREAMING_SOURCES
except ImportError:
    logger.error("Impossible de charger la configuration de scraping")
    sys.exit(1)

def get_aws_session():
    """Crée une session AWS avec le profil flodrama-scraping"""
    try:
        session = boto3.Session(profile_name='flodrama-scraping')
        return session
    except Exception as e:
        logger.error(f"Erreur lors de la création de la session AWS: {e}")
        return None

def invoke_lambda_scraper(session, source, category):
    """Invoque la fonction Lambda pour scraper une source"""
    lambda_client = session.client('lambda')
    
    payload = {
        'source': source,
        'category': category,
        'timestamp': datetime.now().isoformat()
    }
    
    try:
        response = lambda_client.invoke(
            FunctionName='flodrama-scraper',
            InvocationType='Event',  # Asynchrone
            Payload=json.dumps(payload)
        )
        status_code = response.get('StatusCode')
        if status_code == 202:
            logger.info(f"Scraping lancé pour {source} ({category})")
            return True
        else:
            logger.error(f"Erreur lors du lancement du scraping: {status_code}")
            return False
    except Exception as e:
        logger.error(f"Erreur lors de l'invocation de Lambda: {e}")
        return False

def main():
    """Fonction principale"""
    print("\n╔════════════════════════════════════════════════╗")
    print("║                                                ║")
    print("║   Lancement du scraping FloDrama sur AWS      ║")
    print("║                                                ║")
    print("╚════════════════════════════════════════════════╝\n")
    
    # Obtention de la session AWS
    session = get_aws_session()
    if not session:
        logger.error("Impossible de créer une session AWS. Vérifiez vos identifiants.")
        return
    
    # Vérification que la fonction Lambda existe
    try:
        lambda_client = session.client('lambda')
        lambda_client.get_function(FunctionName='flodrama-scraper')
        logger.info("✅ Fonction Lambda flodrama-scraper trouvée")
    except Exception as e:
        logger.error(f"❌ La fonction Lambda flodrama-scraper n'existe pas: {e}")
        logger.info("Veuillez d'abord déployer la fonction Lambda avec le script deploy_lambda.py")
        return
    
    # Lancement du scraping pour chaque source
    total_sources = 0
    launched_sources = 0
    
    for source_name, config in STREAMING_SOURCES.items():
        category = config.get('type', 'unknown')
        if category != 'metadata':  # Ne pas scraper les sources de métadonnées uniquement
            total_sources += 1
            if invoke_lambda_scraper(session, source_name, category):
                launched_sources += 1
    
    # Affichage du résumé
    print("\nRésumé du lancement :")
    print(f"Total des sources : {total_sources}")
    print(f"Sources lancées : {launched_sources}")
    print(f"Échecs : {total_sources - launched_sources}")
    
    if launched_sources > 0:
        print("\n✅ Scraping lancé avec succès sur AWS Lambda")
        print("Les résultats seront disponibles dans la base de données MongoDB")
        print("et dans l'index OpenSearch une fois le traitement terminé.")
    else:
        print("\n❌ Échec du lancement du scraping")

if __name__ == '__main__':
    main()
EOL

# Rendre les scripts exécutables
chmod +x "$(dirname "$0")/launch_aws_scraping.py"
chmod +x "$(dirname "$0")/setup_scraping.sh"

echo -e "\n✅ Configuration terminée avec succès"
echo "Vous pouvez maintenant tester les sources de scraping avec :"
echo "python3 $(dirname "$0")/src/scripts/test_scraping_sources.py"
echo ""
echo "Pour lancer le scraping sur AWS Lambda, utilisez :"
echo "python3 $(dirname "$0")/launch_aws_scraping.py"
echo ""
echo "Note: Assurez-vous d'avoir déployé la fonction Lambda 'flodrama-scraper' avant de lancer le scraping AWS."
