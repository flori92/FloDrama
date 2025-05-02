#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Script d'exécution de migration SQL pour Supabase
Ce script exécute le fichier de migration pour corriger la structure de la table scraping_logs
"""

import os
import sys
import logging
from supabase import create_client
from dotenv import load_dotenv

# Configuration du logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('migration')

# Chargement des variables d'environnement
load_dotenv()

def execute_migration():
    """Exécute la migration SQL pour corriger la table scraping_logs"""
    # Récupération des variables d'environnement
    supabase_url = os.environ.get("SUPABASE_URL")
    supabase_key = os.environ.get("SUPABASE_SERVICE_KEY")  # Utilisation de la clé de service pour les opérations admin
    
    if not supabase_url or not supabase_key:
        logger.error("Variables d'environnement SUPABASE_URL et SUPABASE_SERVICE_KEY requises")
        sys.exit(1)
    
    # Lecture du fichier de migration
    migration_file = os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
        'migrations',
        '20250430_fix_scraping_logs.sql'
    )
    
    if not os.path.exists(migration_file):
        logger.error(f"Fichier de migration introuvable: {migration_file}")
        sys.exit(1)
    
    with open(migration_file, 'r') as f:
        sql_migration = f.read()
    
    logger.info(f"Exécution de la migration depuis {migration_file}")
    
    try:
        # Initialisation du client Supabase
        supabase = create_client(supabase_url, supabase_key)
        
        # Exécution de la migration via l'API REST Supabase
        # Nous utilisons une requête SQL brute pour exécuter les commandes d'ALTER TABLE
        result = supabase.rpc('exec_sql', {'query': sql_migration}).execute()
        
        logger.info("Migration exécutée avec succès!")
        logger.info(f"Résultat: {result}")
        return True
    except Exception as e:
        logger.error(f"Erreur lors de l'exécution de la migration: {e}")
        return False

if __name__ == "__main__":
    execute_migration()
