#!/usr/bin/env python3
"""
Script de test pour vérifier la connexion à Supabase
Ce script valide les informations d'authentification et la connexion au bucket de stockage
"""
import os
import logging
from dotenv import load_dotenv
from supabase import create_client, Client

# Configuration du logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('test_supabase')

def test_supabase_auth():
    """Teste l'authentification à Supabase avec les variables d'environnement"""
    # Chargement des variables d'environnement
    load_dotenv()
    
    # Récupération des identifiants
    supabase_url = os.getenv('SUPABASE_URL')
    supabase_key = os.getenv('SUPABASE_SERVICE_KEY')
    supabase_bucket = os.getenv('SUPABASE_STORAGE_BUCKET', 'flodrama-images')
    
    if not supabase_url or not supabase_key:
        logger.error("❌ Variables d'environnement SUPABASE_URL et/ou SUPABASE_SERVICE_KEY non définies")
        return False
    
    logger.info(f"URL Supabase: {supabase_url}")
    logger.info(f"Bucket de stockage: {supabase_bucket}")
    
    try:
        # Initialisation du client
        logger.info("Tentative de connexion à Supabase...")
        supabase = create_client(supabase_url, supabase_key)
        
        # Test de connexion simple - récupération des métadonnées du bucket
        logger.info("Vérification des buckets de stockage...")
        buckets = supabase.storage.list_buckets()
        
        bucket_names = [bucket['name'] for bucket in buckets]
        if bucket_names:
            logger.info(f"Buckets disponibles: {', '.join(bucket_names)}")
        else:
            logger.info("Aucun bucket disponible")
        
        # Vérification si le bucket configuré existe
        if supabase_bucket in bucket_names:
            logger.info(f"✅ Bucket {supabase_bucket} trouvé !")
        else:
            logger.warning(f"⚠️ Bucket {supabase_bucket} non trouvé. Tentative de création...")
            # Correction: s'assurer que le nom est bien passé comme argument nommé
            supabase.storage.create_bucket(
                id=supabase_bucket,
                options={'public': True}  # Bucket public pour que les images soient accessibles sans authentification
            )
            logger.info(f"✅ Bucket {supabase_bucket} créé avec succès !")
        
        # Test d'une requête à la table de logs de scraping
        logger.info("Test d'accès à la table 'scraping_logs'...")
        try:
            result = supabase.table('scraping_logs').select('*').limit(1).execute()
            logger.info(f"✅ Connexion à la table 'scraping_logs' réussie ! Données récupérées: {result.data}")
        except Exception as e:
            logger.warning(f"⚠️ Erreur lors de l'accès à la table 'scraping_logs': {e}")
            logger.info("Il est possible que cette table n'existe pas encore. Vérification des tables disponibles...")
            # Vérifier si nous pouvons accéder à la liste des tables
            try:
                # Effectuer une requête SQL pour lister les tables
                query = "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"
                result = supabase.rpc('exec_sql', {'query': query}).execute()
                tables = [row.get('table_name') for row in result.data]
                logger.info(f"Tables disponibles: {tables}")
            except Exception as e2:
                logger.warning(f"⚠️ Erreur lors de la récupération des tables: {e2}")
        
        return True
        
    except Exception as e:
        logger.error(f"❌ Erreur lors de la connexion à Supabase: {str(e)}")
        return False

if __name__ == "__main__":
    print("===== Test de connexion à Supabase =====")
    if test_supabase_auth():
        print("✅ TEST RÉUSSI: La connexion à Supabase fonctionne correctement")
    else:
        print("❌ TEST ÉCHOUÉ: Problème de connexion à Supabase")
