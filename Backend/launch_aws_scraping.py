#!/usr/bin/env python3
"""
Script de lancement du scraping AWS pour FloDrama
Ce script invoque la fonction Lambda pour lancer un scraping général
"""
import boto3
import json
import logging
import time
from datetime import datetime

# Configuration du logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('FloDrama-Scraping')

def get_aws_session():
    """Crée une session AWS avec le profil flodrama-scraping"""
    try:
        session = boto3.Session(profile_name='flodrama-scraping')
        return session
    except Exception as e:
        logger.error(f"Erreur lors de la création de la session AWS: {e}")
        return None

def invoke_lambda_function(session, function_name, payload):
    """Invoque la fonction Lambda avec le payload spécifié"""
    try:
        lambda_client = session.client('lambda')
        
        response = lambda_client.invoke(
            FunctionName=function_name,
            InvocationType='RequestResponse',  # Synchrone
            LogType='Tail',  # Inclure les logs
            Payload=json.dumps(payload)
        )
        
        # Récupération des logs
        logs = response.get('LogResult', '')
        if logs:
            import base64
            logs = base64.b64decode(logs).decode('utf-8')
            logger.info(f"Logs de la fonction Lambda:\n{logs}")
        
        # Récupération de la réponse
        if response.get('StatusCode') == 200:
            payload_response = json.loads(response.get('Payload').read().decode('utf-8'))
            return payload_response
        else:
            logger.error(f"Erreur lors de l'invocation de la fonction Lambda: {response}")
            return None
    
    except Exception as e:
        logger.error(f"Erreur lors de l'invocation de la fonction Lambda: {e}")
        return None

def launch_scraping_for_source(session, function_name, source, category):
    """Lance le scraping pour une source et une catégorie spécifiques"""
    logger.info(f"Lancement du scraping pour la source {source} (catégorie: {category})...")
    
    payload = {
        'source': source,
        'category': category,
        'action': 'scrape'
    }
    
    response = invoke_lambda_function(session, function_name, payload)
    
    if response:
        status_code = response.get('statusCode', 500)
        if status_code == 200:
            body = json.loads(response.get('body', '{}'))
            items_count = body.get('items_count', 0)
            logger.info(f"✅ Scraping réussi pour {source} ({category}): {items_count} éléments récupérés")
            return True
        else:
            error_message = response.get('body', 'Erreur inconnue')
            logger.error(f"❌ Échec du scraping pour {source} ({category}): {error_message}")
            return False
    else:
        logger.error(f"❌ Échec de l'invocation de la fonction Lambda pour {source} ({category})")
        return False

def main():
    """Fonction principale"""
    print("\n╔════════════════════════════════════════════════╗")
    print("║                                                ║")
    print("║   Lancement du scraping AWS FloDrama          ║")
    print("║                                                ║")
    print("╚════════════════════════════════════════════════╝\n")
    
    # Obtention de la session AWS
    session = get_aws_session()
    if not session:
        logger.error("Impossible de créer une session AWS. Vérifiez vos identifiants.")
        return
    
    # Nom de la fonction Lambda
    function_name = "flodrama-scraper"
    
    # Sources de scraping
    sources = {
        'drama': ['vostfree', 'dramacool', 'myasiantv', 'voirdrama', 'viki', 'wetv', 'iqiyi', 'kocowa'],
        'anime': ['gogoanime', 'voiranime', 'neko-sama'],
        'bollywood': ['bollywoodmdb', 'zee5', 'hotstar'],
        'metadata': ['mydramalist']
    }
    
    # Statistiques
    total_sources = sum(len(sources_list) for sources_list in sources.values())
    successful_sources = 0
    failed_sources = 0
    
    start_time = time.time()
    
    print(f"Lancement du scraping pour {total_sources} sources...")
    print("Ce processus peut prendre plusieurs minutes.\n")
    
    # Lancement du scraping pour chaque source
    for category, sources_list in sources.items():
        print(f"\n=== Catégorie: {category.upper()} ===")
        
        for source in sources_list:
            success = launch_scraping_for_source(session, function_name, source, category)
            
            if success:
                successful_sources += 1
            else:
                failed_sources += 1
            
            # Pause pour éviter de surcharger l'API
            time.sleep(2)
    
    # Calcul de la durée totale
    duration = time.time() - start_time
    minutes = int(duration // 60)
    seconds = int(duration % 60)
    
    # Affichage du résumé
    print("\n=== Résumé du scraping ===")
    print(f"Durée totale: {minutes} minutes et {seconds} secondes")
    print(f"Sources traitées: {total_sources}")
    print(f"Sources réussies: {successful_sources}")
    print(f"Sources échouées: {failed_sources}")
    
    if successful_sources > 0:
        success_rate = (successful_sources / total_sources) * 100
        print(f"Taux de réussite: {success_rate:.1f}%")
    
    if successful_sources == total_sources:
        print("\n✅ Scraping général terminé avec succès")
    elif successful_sources > 0:
        print("\n⚠️ Scraping général terminé avec des avertissements")
    else:
        print("\n❌ Échec du scraping général")

if __name__ == '__main__':
    main()
