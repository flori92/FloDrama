#!/usr/bin/env python3
"""
Script de configuration de l'exécution régulière du scraping FloDrama
Ce script configure une règle EventBridge pour déclencher la fonction Lambda à intervalles réguliers
"""
import boto3
import json
import logging
import os
import sys
from datetime import datetime
from pathlib import Path

# Configuration du logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('FloDrama-Scheduler')

def get_aws_session():
    """Crée une session AWS avec le profil flodrama-scraping"""
    try:
        session = boto3.Session(profile_name='flodrama-scraping')
        return session
    except Exception as e:
        logger.error(f"Erreur lors de la création de la session AWS: {e}")
        return None

def create_event_rule(session, rule_name, schedule_expression, lambda_arn):
    """Crée une règle EventBridge pour déclencher la fonction Lambda à intervalles réguliers"""
    try:
        # Création du client EventBridge
        events_client = session.client('events')
        
        # Vérifier si la règle existe déjà
        try:
            response = events_client.describe_rule(Name=rule_name)
            rule_exists = True
            logger.info(f"La règle {rule_name} existe déjà")
        except events_client.exceptions.ResourceNotFoundException:
            rule_exists = False
            logger.info(f"La règle {rule_name} n'existe pas encore")
        
        # Création ou mise à jour de la règle
        if rule_exists:
            response = events_client.put_rule(
                Name=rule_name,
                ScheduleExpression=schedule_expression,
                State='ENABLED',
                Description='Règle pour déclencher le scraping FloDrama à intervalles réguliers'
            )
        else:
            response = events_client.put_rule(
                Name=rule_name,
                ScheduleExpression=schedule_expression,
                State='ENABLED',
                Description='Règle pour déclencher le scraping FloDrama à intervalles réguliers'
            )
        
        rule_arn = response['RuleArn']
        logger.info(f"Règle EventBridge créée/mise à jour: {rule_arn}")
        
        # Création du client Lambda
        lambda_client = session.client('lambda')
        
        # Ajouter la permission à la fonction Lambda
        try:
            lambda_client.add_permission(
                FunctionName=lambda_arn,
                StatementId=f'EventBridge-{rule_name}',
                Action='lambda:InvokeFunction',
                Principal='events.amazonaws.com',
                SourceArn=rule_arn
            )
            logger.info(f"Permission ajoutée à la fonction Lambda: {lambda_arn}")
        except lambda_client.exceptions.ResourceConflictException:
            logger.info(f"La permission existe déjà pour la fonction Lambda: {lambda_arn}")
        
        # Configurer la cible de la règle
        target_input = {
            'source': 'scheduled',
            'category': 'all',
            'action': 'scrape_all'
        }
        
        events_client.put_targets(
            Rule=rule_name,
            Targets=[
                {
                    'Id': 'FloDramaScraper',
                    'Arn': lambda_arn,
                    'Input': json.dumps(target_input)
                }
            ]
        )
        
        logger.info(f"Cible configurée pour la règle {rule_name}")
        return rule_arn
    
    except Exception as e:
        logger.error(f"Erreur lors de la création de la règle EventBridge: {e}")
        return None

def configure_scheduled_scraping(lambda_arn, schedule="rate(6 hours)"):
    """Configure l'exécution régulière du scraping"""
    # Obtention de la session AWS
    session = get_aws_session()
    if not session:
        logger.error("Impossible de créer une session AWS. Vérifiez vos identifiants.")
        return False
    
    # Création de la règle EventBridge
    rule_name = "FloDrama-Scraping-Schedule"
    rule_arn = create_event_rule(session, rule_name, schedule, lambda_arn)
    
    if not rule_arn:
        logger.error("Impossible de créer la règle EventBridge.")
        return False
    
    # Configuration de l'exportation des données vers le frontend
    configure_frontend_export(session, rule_name, lambda_arn)
    
    return True

def configure_frontend_export(session, rule_name, lambda_arn):
    """Configure l'exportation des données vers le frontend après le scraping"""
    try:
        # Création du client Lambda
        lambda_client = session.client('lambda')
        
        # Création du client S3
        s3_client = session.client('s3')
        
        # Vérifier si le bucket S3 pour les données exportées existe
        bucket_name = 'flodrama-exported-data'
        try:
            s3_client.head_bucket(Bucket=bucket_name)
            logger.info(f"Le bucket S3 {bucket_name} existe déjà")
        except Exception as e:
            logger.info(f"Création du bucket S3 {bucket_name}")
            s3_client.create_bucket(Bucket=bucket_name)
            
            # Configurer le bucket pour l'hébergement de site web statique
            s3_client.put_bucket_website(
                Bucket=bucket_name,
                WebsiteConfiguration={
                    'IndexDocument': {'Suffix': 'index.html'},
                    'ErrorDocument': {'Key': 'error.html'}
                }
            )
            
            # Configurer la politique du bucket pour permettre l'accès public en lecture
            bucket_policy = {
                'Version': '2012-10-17',
                'Statement': [{
                    'Sid': 'PublicReadGetObject',
                    'Effect': 'Allow',
                    'Principal': '*',
                    'Action': ['s3:GetObject'],
                    'Resource': [f'arn:aws:s3:::{bucket_name}/*']
                }]
            }
            s3_client.put_bucket_policy(
                Bucket=bucket_name,
                Policy=json.dumps(bucket_policy)
            )
        
        # Créer un script Lambda pour l'exportation des données
        export_script_path = Path(__file__).parent.parent / 'scripts' / 'export_content_for_frontend.py'
        if not export_script_path.exists():
            logger.error(f"Le script d'exportation n'existe pas: {export_script_path}")
            return False
        
        logger.info(f"Script d'exportation trouvé: {export_script_path}")
        
        # Créer une fonction Lambda pour l'exportation des données
        export_lambda_name = 'flodrama-data-exporter'
        
        # Vérifier si la fonction Lambda existe déjà
        try:
            lambda_client.get_function(FunctionName=export_lambda_name)
            logger.info(f"La fonction Lambda {export_lambda_name} existe déjà")
        except lambda_client.exceptions.ResourceNotFoundException:
            logger.info(f"Création de la fonction Lambda {export_lambda_name}")
            
            # Code de la fonction Lambda
            lambda_code = """
import boto3
import json
import logging
import os
import sys
import tempfile
from datetime import datetime
from pathlib import Path

# Configuration du logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('FloDrama-Exporter')

def lambda_handler(event, context):
    \"\"\"Fonction principale de la Lambda d'exportation\"\"\"
    logger.info("Démarrage de l'exportation des données pour le frontend")
    
    # Récupérer les données depuis S3
    s3_client = boto3.client('s3')
    bucket_name = 'flodrama-scraping-data'
    export_bucket = 'flodrama-exported-data'
    
    # Créer un répertoire temporaire
    with tempfile.TemporaryDirectory() as temp_dir:
        data_dir = Path(temp_dir) / 'data'
        data_dir.mkdir(exist_ok=True)
        
        export_dir = Path(temp_dir) / 'export'
        export_dir.mkdir(exist_ok=True)
        
        # Télécharger tous les fichiers de contenu
        logger.info("Téléchargement des fichiers de contenu depuis S3")
        content_files = []
        
        # Liste des sources de contenu
        sources = [
            'vostfree', 'dramacool', 'myasiantv', 'voirdrama', 'viki', 
            'wetv', 'iqiyi', 'kocowa', 'gogoanime', 'voiranime', 
            'neko-sama', 'bollywoodmdb', 'zee5', 'hotstar', 'mydramalist'
        ]
        
        for source in sources:
            file_key = f"{source}_content.json"
            local_file = data_dir / file_key
            
            try:
                s3_client.download_file(bucket_name, file_key, str(local_file))
                content_files.append(local_file)
                logger.info(f"Téléchargé {file_key}")
            except Exception as e:
                logger.warning(f"Impossible de télécharger {file_key}: {e}")
        
        if not content_files:
            logger.error("Aucun fichier de contenu trouvé")
            return {
                'statusCode': 500,
                'body': json.dumps('Aucun fichier de contenu trouvé')
            }
        
        # Charger les données
        all_content = []
        for file_path in content_files:
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content_data = json.load(f)
                    logger.info(f"Chargé {len(content_data)} éléments depuis {file_path.name}")
                    all_content.extend(content_data)
            except Exception as e:
                logger.error(f"Erreur lors du chargement de {file_path}: {e}")
        
        logger.info(f"Total: {len(all_content)} éléments chargés")
        
        # Optimiser les données pour le frontend
        logger.info("Optimisation des données pour le frontend")
        
        optimized_content = []
        search_index = []
        
        for item in all_content:
            # Créer une version optimisée pour l'affichage
            optimized_item = {
                "id": item.get("id", ""),
                "title": item.get("title", ""),
                "type": item.get("type", ""),
                "source": item.get("source", ""),
                "url": item.get("url", ""),
                "timestamp": item.get("timestamp", ""),
                "synopsis": item.get("synopsis", ""),
                "metadata": item.get("metadata", {}),
                "images": {
                    "poster": item.get("images", {}).get("poster", ""),
                    "thumbnail": item.get("images", {}).get("thumbnail", "")
                },
                "ratings": {
                    "average": item.get("ratings", {}).get("average", 0),
                    "count": item.get("ratings", {}).get("count", 0)
                }
            }
            
            # Ajouter des informations sur les épisodes si disponibles
            if "episodes" in item and item["episodes"]:
                seasons_count = len(item["episodes"])
                episodes_count = sum(season.get("episodes_count", 0) for season in item["episodes"])
                
                optimized_item["episodes_info"] = {
                    "seasons_count": seasons_count,
                    "episodes_count": episodes_count,
                    "latest_season": item["episodes"][-1]["number"] if seasons_count > 0 else 0
                }
            
            optimized_content.append(optimized_item)
            
            # Créer une entrée d'index de recherche
            search_entry = {
                "id": item.get("id", ""),
                "title": item.get("title", ""),
                "type": item.get("type", ""),
                "source": item.get("source", ""),
                "synopsis": item.get("synopsis", ""),
                "metadata": {
                    k: v for k, v in item.get("metadata", {}).items() 
                    if k in ["country", "year", "genre", "episodes", "status"]
                }
            }
            
            # Ajouter les acteurs à l'index de recherche
            if "cast" in item and item["cast"]:
                search_entry["cast"] = [actor["actor"] for actor in item["cast"]]
            
            search_index.append(search_entry)
        
        logger.info(f"Données optimisées: {len(optimized_content)} éléments")
        
        # Créer des index par catégorie
        logger.info("Création des index par catégorie")
        
        # Définir les catégories principales
        categories = {
            "drama": [],
            "anime": [],
            "bollywood": [],
            "trending": [],
            "latest": [],
            "top_rated": []
        }
        
        # Catégories par pays pour les dramas
        drama_countries = {
            "korean": [],
            "chinese": [],
            "japanese": [],
            "thai": []
        }
        
        # Trier par date pour les plus récents
        sorted_by_date = sorted(
            optimized_content, 
            key=lambda x: x.get("timestamp", ""), 
            reverse=True
        )
        
        # Trier par note pour les mieux notés
        sorted_by_rating = sorted(
            optimized_content, 
            key=lambda x: x.get("ratings", {}).get("average", 0), 
            reverse=True
        )
        
        # Remplir les catégories
        for item in optimized_content:
            item_type = item.get("type", "")
            item_id = item.get("id", "")
            
            # Catégories principales
            if item_type == "drama":
                categories["drama"].append(item_id)
                
                # Sous-catégories par pays
                country = item.get("metadata", {}).get("country", "").lower()
                if "coreens" in country or "korean" in country:
                    drama_countries["korean"].append(item_id)
                elif "chinois" in country or "chinese" in country:
                    drama_countries["chinese"].append(item_id)
                elif "japonais" in country or "japanese" in country:
                    drama_countries["japanese"].append(item_id)
                elif "thailandais" in country or "thai" in country:
                    drama_countries["thai"].append(item_id)
                    
            elif item_type == "anime":
                categories["anime"].append(item_id)
            elif item_type == "bollywood":
                categories["bollywood"].append(item_id)
        
        # Remplir les catégories transversales
        categories["latest"] = [item.get("id") for item in sorted_by_date[:100]]
        categories["top_rated"] = [item.get("id") for item in sorted_by_rating[:100]]
        
        # Créer une liste de tendances (mélange de contenus récents et bien notés)
        trending_set = set()
        for i, item in enumerate(sorted_by_date[:50]):
            trending_set.add(item.get("id"))
        
        for i, item in enumerate(sorted_by_rating[:50]):
            if len(trending_set) >= 100:
                break
            trending_set.add(item.get("id"))
        
        categories["trending"] = list(trending_set)
        
        # Combiner toutes les catégories
        all_categories = {
            **categories,
            **{f"drama_{k}": v for k, v in drama_countries.items()}
        }
        
        logger.info(f"Index par catégorie créés: {len(all_categories)} catégories")
        
        # Exporter les fichiers
        content_file = export_dir / "content.json"
        with open(content_file, 'w', encoding='utf-8') as f:
            json.dump(optimized_content, f, ensure_ascii=False)
        
        search_file = export_dir / "search_index.json"
        with open(search_file, 'w', encoding='utf-8') as f:
            json.dump(search_index, f, ensure_ascii=False)
        
        categories_file = export_dir / "categories.json"
        with open(categories_file, 'w', encoding='utf-8') as f:
            json.dump(all_categories, f, ensure_ascii=False)
        
        # Créer un fichier de métadonnées
        metadata = {
            "timestamp": datetime.now().isoformat(),
            "content_count": len(optimized_content),
            "categories_count": len(all_categories),
            "search_index_count": len(search_index)
        }
        
        metadata_file = export_dir / "metadata.json"
        with open(metadata_file, 'w', encoding='utf-8') as f:
            json.dump(metadata, f, ensure_ascii=False)
        
        # Créer un fichier d'index pour la recherche
        search_index_file = export_dir / "index.txt"
        with open(search_index_file, 'w', encoding='utf-8') as f:
            f.write(f"FloDrama Search Index - Generated on {datetime.now().isoformat()}")
        
        # Téléverser les fichiers vers S3
        logger.info("Téléversement des fichiers vers S3")
        
        # Téléverser les fichiers principaux
        s3_client.upload_file(str(content_file), export_bucket, "data/content.json")
        s3_client.upload_file(str(search_file), export_bucket, "data/search_index.json")
        s3_client.upload_file(str(categories_file), export_bucket, "data/categories.json")
        s3_client.upload_file(str(metadata_file), export_bucket, "data/metadata.json")
        s3_client.upload_file(str(search_index_file), export_bucket, "recherche/index.txt")
        
        logger.info("Exportation des données terminée avec succès")
        
        return {
            'statusCode': 200,
            'body': json.dumps('Exportation des données terminée avec succès')
        }
"""
            
            # Créer un fichier ZIP temporaire pour le code Lambda
            with tempfile.NamedTemporaryFile(suffix='.zip') as temp_zip:
                import zipfile
                with zipfile.ZipFile(temp_zip.name, 'w') as zipf:
                    zipf.writestr('lambda_function.py', lambda_code)
                
                # Lire le contenu du fichier ZIP
                with open(temp_zip.name, 'rb') as f:
                    zip_content = f.read()
                
                # Créer la fonction Lambda
                lambda_client.create_function(
                    FunctionName=export_lambda_name,
                    Runtime='python3.9',
                    Role='arn:aws:iam::108782079729:role/lambda-scraping-role',
                    Handler='lambda_function.lambda_handler',
                    Code={'ZipFile': zip_content},
                    Description='Fonction Lambda pour exporter les données FloDrama vers le frontend',
                    Timeout=300,
                    MemorySize=512,
                    Publish=True
                )
        
        # Récupérer l'ARN de la fonction Lambda d'exportation
        export_lambda_response = lambda_client.get_function(FunctionName=export_lambda_name)
        export_lambda_arn = export_lambda_response['Configuration']['FunctionArn']
        
        # Créer une règle EventBridge pour déclencher l'exportation après le scraping
        events_client = session.client('events')
        
        # Configurer la règle pour s'exécuter après la fonction de scraping
        export_rule_name = "FloDrama-Export-After-Scraping"
        
        # Vérifier si la règle existe déjà
        try:
            events_client.describe_rule(Name=export_rule_name)
            rule_exists = True
            logger.info(f"La règle {export_rule_name} existe déjà")
        except events_client.exceptions.ResourceNotFoundException:
            rule_exists = False
            logger.info(f"La règle {export_rule_name} n'existe pas encore")
        
        # Création ou mise à jour de la règle
        if rule_exists:
            response = events_client.put_rule(
                Name=export_rule_name,
                EventPattern=json.dumps({
                    "source": ["aws.lambda"],
                    "detail-type": ["Lambda Function Invocation Result - Success"],
                    "detail": {
                        "requestContext": {
                            "functionArn": [lambda_arn]
                        }
                    }
                }),
                State='ENABLED',
                Description='Règle pour déclencher l\'exportation des données après le scraping'
            )
        else:
            response = events_client.put_rule(
                Name=export_rule_name,
                EventPattern=json.dumps({
                    "source": ["aws.lambda"],
                    "detail-type": ["Lambda Function Invocation Result - Success"],
                    "detail": {
                        "requestContext": {
                            "functionArn": [lambda_arn]
                        }
                    }
                }),
                State='ENABLED',
                Description='Règle pour déclencher l\'exportation des données après le scraping'
            )
        
        export_rule_arn = response['RuleArn']
        logger.info(f"Règle EventBridge créée/mise à jour: {export_rule_arn}")
        
        # Ajouter la permission à la fonction Lambda d'exportation
        try:
            lambda_client.add_permission(
                FunctionName=export_lambda_arn,
                StatementId=f'EventBridge-{export_rule_name}',
                Action='lambda:InvokeFunction',
                Principal='events.amazonaws.com',
                SourceArn=export_rule_arn
            )
            logger.info(f"Permission ajoutée à la fonction Lambda: {export_lambda_arn}")
        except lambda_client.exceptions.ResourceConflictException:
            logger.info(f"La permission existe déjà pour la fonction Lambda: {export_lambda_arn}")
        
        # Configurer la cible de la règle
        events_client.put_targets(
            Rule=export_rule_name,
            Targets=[
                {
                    'Id': 'FloDramaExporter',
                    'Arn': export_lambda_arn
                }
            ]
        )
        
        logger.info(f"Cible configurée pour la règle {export_rule_name}")
        logger.info("Configuration de l'exportation des données terminée avec succès")
        
        return True
        
    except Exception as e:
        logger.error(f"Erreur lors de la configuration de l'exportation des données: {e}")
        return False

def main():
    """Fonction principale"""
    print("\n╔════════════════════════════════════════════════╗")
    print("║                                                ║")
    print("║   Configuration de l'exécution régulière      ║")
    print("║   FloDrama - Scraping                         ║")
    print("║                                                ║")
    print("╚════════════════════════════════════════════════╝\n")
    
    # ARN de la fonction Lambda
    lambda_arn = "arn:aws:lambda:us-east-1:108782079729:function:flodrama-scraper"
    
    # Options de planification disponibles
    schedules = {
        "1": "rate(1 hour)",
        "2": "rate(3 hours)",
        "3": "rate(6 hours)",
        "4": "rate(12 hours)",
        "5": "rate(1 day)",
        "6": "cron(0 */6 * * ? *)"  # Toutes les 6 heures (00:00, 06:00, 12:00, 18:00)
    }
    
    print("Options de planification disponibles:")
    print("1. Toutes les heures")
    print("2. Toutes les 3 heures")
    print("3. Toutes les 6 heures (recommandé)")
    print("4. Toutes les 12 heures")
    print("5. Une fois par jour")
    print("6. À heures fixes (00:00, 06:00, 12:00, 18:00)")
    
    choice = input("\nChoisissez une option (1-6) [3]: ").strip() or "3"
    
    if choice not in schedules:
        print(f"Option invalide: {choice}. Utilisation de l'option par défaut (3).")
        choice = "3"
    
    schedule = schedules[choice]
    print(f"\nConfiguration de l'exécution avec la planification: {schedule}")
    
    # Configuration de l'exécution régulière
    success = configure_scheduled_scraping(lambda_arn, schedule)
    
    if success:
        print("\n✅ Configuration réussie")
        print(f"Le scraping sera exécuté selon la planification: {schedule}")
        print("Les données seront automatiquement exportées vers le frontend après chaque scraping")
        print("\nVous pouvez vérifier la configuration dans la console AWS:")
        print("https://console.aws.amazon.com/events/home?region=us-east-1#/rules/FloDrama-Scraping-Schedule")
        print("https://console.aws.amazon.com/events/home?region=us-east-1#/rules/FloDrama-Export-After-Scraping")
    else:
        print("\n❌ Échec de la configuration")
        print("Veuillez vérifier les logs pour plus d'informations.")

if __name__ == '__main__':
    main()
