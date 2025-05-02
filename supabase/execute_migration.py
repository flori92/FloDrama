#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Script d'exécution de la migration SQL sur Supabase
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
logger = logging.getLogger('supabase_migration')

# Chargement des variables d'environnement
load_dotenv()

def execute_migration(migration_file):
    """
    Exécute un fichier de migration SQL sur Supabase
    
    Args:
        migration_file (str): Chemin vers le fichier de migration SQL
    """
    # Récupération des variables d'environnement
    supabase_url = os.getenv('SUPABASE_URL')
    supabase_key = os.getenv('SUPABASE_SERVICE_KEY')
    
    if not supabase_url or not supabase_key:
        logger.error("Les variables d'environnement SUPABASE_URL et SUPABASE_SERVICE_KEY doivent être définies")
        return False
    
    try:
        # Initialisation du client Supabase
        supabase = create_client(supabase_url, supabase_key)
        logger.info(f"Client Supabase initialisé pour {supabase_url}")
        
        # Vérification de la connexion
        try:
            result = supabase.table('dramas').select('id').limit(1).execute()
            logger.info("Connexion à Supabase établie avec succès")
        except Exception as e:
            if "relation" in str(e) and "does not exist" in str(e):
                logger.info("Table 'dramas' non existante, ce qui est normal si c'est la première migration")
            else:
                logger.warning(f"Attention: {str(e)}")
        
        # Lecture du fichier de migration
        with open(migration_file, 'r') as f:
            sql_query = f.read()
        
        # Exécution de la requête SQL
        logger.info(f"Exécution de la migration: {migration_file}")
        result = supabase.query(sql_query).execute()
        
        logger.info(f"✅ Migration exécutée avec succès")
        return True
        
    except Exception as e:
        logger.error(f"❌ Erreur lors de l'exécution de la migration: {str(e)}")
        return False

def main():
    """Fonction principale"""
    if len(sys.argv) > 1:
        migration_file = sys.argv[1]
    else:
        # Par défaut, utiliser la migration la plus récente
        migration_file = 'supabase/migrations/20250501_complete_schema.sql'
    
    if not os.path.exists(migration_file):
        logger.error(f"Le fichier de migration {migration_file} n'existe pas")
        return
    
    success = execute_migration(migration_file)
    if success:
        print(f"✅ Migration {migration_file} exécutée avec succès")
    else:
        print(f"❌ Échec de la migration {migration_file}")

if __name__ == "__main__":
    main()
