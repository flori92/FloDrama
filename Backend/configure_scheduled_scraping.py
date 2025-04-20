#!/usr/bin/env python3
"""
Script de configuration de l'exécution régulière du scraping FloDrama
Ce script configure une règle EventBridge pour déclencher la fonction Lambda à intervalles réguliers
"""
import boto3
import json
import logging
from datetime import datetime

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
    
    return True

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
        print("\nVous pouvez vérifier la configuration dans la console AWS:")
        print("https://console.aws.amazon.com/events/home?region=us-east-1#/rules/FloDrama-Scraping-Schedule")
    else:
        print("\n❌ Échec de la configuration")
        print("Veuillez vérifier les logs pour plus d'informations.")

if __name__ == '__main__':
    main()
