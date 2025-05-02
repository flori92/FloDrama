#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Script pour appliquer directement les migrations SQL sur Supabase
"""

import os
import sys
import logging
import requests
from dotenv import load_dotenv

# Configuration du logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('migration')

# Chargement des variables d'environnement
load_dotenv()

def appliquer_migration():
    """Applique la migration SQL pour corriger la table scraping_logs"""
    # Récupération des variables d'environnement
    supabase_url = os.environ.get("SUPABASE_URL")
    supabase_key = os.environ.get("SUPABASE_SERVICE_KEY")
    
    if not supabase_url or not supabase_key:
        logger.error("Variables d'environnement SUPABASE_URL et SUPABASE_SERVICE_KEY requises")
        return False
    
    # Lecture du fichier de migration
    migration_file = os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
        'migrations',
        '20250430_fix_scraping_logs.sql'
    )
    
    if not os.path.exists(migration_file):
        logger.error(f"Fichier de migration introuvable: {migration_file}")
        return False
    
    with open(migration_file, 'r') as f:
        sql_migration = f.read()
    
    logger.info(f"Exécution de la migration depuis {migration_file}")
    
    # Extraction des commandes SQL individuelles
    sql_commands = [cmd.strip() for cmd in sql_migration.split(';') if cmd.strip()]
    
    # URL de l'API Supabase pour les requêtes SQL
    api_url = f"{supabase_url}/rest/v1/"
    
    # En-têtes pour l'authentification
    headers = {
        "apikey": supabase_key,
        "Authorization": f"Bearer {supabase_key}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal"
    }
    
    success = True
    
    # Appliquer chaque commande SQL
    for i, command in enumerate(sql_commands, 1):
        # Ignorer les commentaires et les blocs DO
        if command.startswith('--') or command.startswith('DO'):
            continue
            
        logger.info(f"Exécution de la commande SQL {i}/{len(sql_commands)}")
        logger.debug(f"Commande: {command}")
        
        try:
            # Utiliser l'API REST pour exécuter la commande SQL
            # Pour les opérations ALTER TABLE, on doit utiliser la méthode POST avec les données SQL
            response = requests.post(
                f"{api_url}/alter_table",
                headers=headers,
                json={"command": command}
            )
            
            # Vérifier si la requête a réussi
            if response.status_code in (200, 201, 204):
                logger.info(f"Commande {i} exécutée avec succès")
            else:
                logger.error(f"Erreur lors de l'exécution de la commande {i}: {response.status_code} - {response.text}")
                success = False
                
        except Exception as e:
            logger.error(f"Exception lors de l'exécution de la commande {i}: {str(e)}")
            success = False
    
    if success:
        logger.info("Migration exécutée avec succès!")
    else:
        logger.warning("La migration a rencontré des erreurs, vérifiez les logs pour plus de détails.")
    
    return success

if __name__ == "__main__":
    appliquer_migration()
