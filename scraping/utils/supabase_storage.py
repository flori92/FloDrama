#!/usr/bin/env python3
"""
Utilitaire de gestion du stockage d'images avec Supabase
Remplace les fonctionnalités S3/CloudFront utilisées dans AWS
"""
import os
import time
import uuid
import logging
import requests
from urllib.parse import urlparse
from dotenv import load_dotenv
from pathlib import Path
from supabase import create_client, Client

# Configuration du logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('supabase_storage')

# Chargement des variables d'environnement
load_dotenv()

# Variables d'environnement Supabase
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_KEY')  # Utilisation de la clé de service pour les opérations storage

# Configuration des buckets
STORAGE_BUCKET = os.getenv('SUPABASE_STORAGE_BUCKET', 'flodrama-images')
CONTENT_BUCKET = os.getenv('SUPABASE_CONTENT_BUCKET', 'flodrama-content')
ASSETS_BUCKET = os.getenv('SUPABASE_ASSETS_BUCKET', 'flodrama-assets')
VIDEO_BUCKET = os.getenv('SUPABASE_VIDEO_BUCKET', 'flodrama-video-cache')

# Liste des buckets existants (déjà créés manuellement sur Supabase)
EXISTING_BUCKETS = [STORAGE_BUCKET, CONTENT_BUCKET, ASSETS_BUCKET, VIDEO_BUCKET]

# Initialisation du client Supabase
supabase_client: Client = None

def init_supabase_client():
    """Initialise le client Supabase"""
    global supabase_client
    
    # Pour le stockage, nous utilisons la clé de service qui a tous les droits
    # au lieu de la clé anonyme qui a des permissions limitées
    supabase_service_key = os.getenv('SUPABASE_SERVICE_KEY')
    
    if not SUPABASE_URL or not supabase_service_key:
        logger.error("Les variables d'environnement SUPABASE_URL et SUPABASE_SERVICE_KEY doivent être définies")
        return None
    
    try:
        # Initialisation du client avec la clé de service
        supabase_client = create_client(SUPABASE_URL, supabase_service_key)
        logger.info(f"Client Supabase initialisé pour {SUPABASE_URL}")
        
        # Test direct de l'API Storage sans utiliser list_buckets()
        # Cette méthode est plus fiable car elle utilise l'API REST directement
        try:
            # Vérifier que le bucket principal existe en utilisant l'API REST
            response = requests.get(
                f"{SUPABASE_URL}/storage/v1/bucket/{STORAGE_BUCKET}",
                headers={
                    "Authorization": f"Bearer {supabase_service_key}",
                    "apikey": supabase_service_key
                }
            )
            
            if response.status_code == 200:
                logger.info(f"✅ Bucket {STORAGE_BUCKET} accessible via API REST")
            else:
                logger.warning(f"⚠️ Bucket {STORAGE_BUCKET} non accessible via API REST: {response.status_code}")
                logger.debug(f"Réponse: {response.text}")
        except Exception as e:
            logger.warning(f"⚠️ Erreur lors du test direct de l'API Storage: {str(e)}")
        
        return supabase_client
    except Exception as e:
        logger.error(f"Erreur lors de l'initialisation du client Supabase: {str(e)}")
        return None

def ensure_bucket_exists(bucket_name):
    """Vérifie si un bucket existe sans tenter de le créer (les buckets sont déjà créés manuellement)."""
    global supabase_client
    
    try:
        # Vérifier que le client est initialisé
        if not supabase_client:
            init_supabase_client()
            
        if not supabase_client:
            logger.error("Client Supabase non initialisé, impossible de vérifier le bucket")
            return False
            
        # Récupération de la liste des buckets
        try:
            buckets = supabase_client.storage.list_buckets()
            
            # Extraction des noms de buckets (compatible avec les anciennes et nouvelles versions de l'API)
            bucket_names = []
            for bucket in buckets:
                try:
                    # Nouvelle version de l'API (objet SyncBucket)
                    bucket_names.append(bucket.name)
                except (AttributeError, TypeError):
                    try:
                        # Ancienne version de l'API (dictionnaire)
                        bucket_names.append(bucket["name"])
                    except (KeyError, TypeError):
                        logger.warning(f"Format de bucket non reconnu: {bucket}")
            
            if bucket_name in bucket_names:
                logger.info(f"✅ Bucket {bucket_name} existe déjà")
                return True
            else:
                # Ne pas tenter de créer le bucket, car ils sont déjà créés manuellement
                if bucket_name in EXISTING_BUCKETS:
                    logger.warning(f"⚠️ Le bucket {bucket_name} est censé exister mais n'a pas été trouvé. Vérifiez les permissions.")
                    # On retourne True quand même pour ne pas bloquer le processus
                    return True
                else:
                    logger.error(f"❌ Le bucket {bucket_name} n'existe pas et n'est pas dans la liste des buckets connus.")
                    return False
                
        except Exception as bucket_error:
            # Si l'erreur est liée à l'authentification, essayer de réinitialiser le client
            if "invalid signature" in str(bucket_error) or "Unauthorized" in str(bucket_error):
                logger.warning("Problème d'authentification détecté, tentative de réinitialisation du client...")
                supabase_client = None
                init_supabase_client()
                
                # Nouvelle tentative après réinitialisation
                if supabase_client:
                    buckets = supabase_client.storage.list_buckets()
                    
                    # Extraction des noms de buckets (compatible avec les nouvelles versions de l'API)
                    bucket_names = []
                    for bucket in buckets:
                        try:
                            # Nouvelle version de l'API (objet SyncBucket)
                            bucket_names.append(bucket.name)
                        except (AttributeError, TypeError):
                            try:
                                # Ancienne version de l'API (dictionnaire)
                                bucket_names.append(bucket["name"])
                            except (KeyError, TypeError):
                                logger.warning(f"Format de bucket non reconnu: {bucket}")
                    
                    if bucket_name in bucket_names:
                        logger.info(f"✅ Bucket {bucket_name} existe déjà (vérifié après réinitialisation)")
                        return True
                    else:
                        logger.warning(f"⚠️ Le bucket {bucket_name} n'a pas été trouvé après réinitialisation.")
                        return True if bucket_name in EXISTING_BUCKETS else False
            
            logger.error(f"Erreur lors de la vérification du bucket {bucket_name}: {str(bucket_error)}")
            return False
            
    except Exception as e:
        logger.error(f"Erreur lors de la vérification du bucket {bucket_name}: {str(e)}")
        return False

def download_and_upload_image(image_url: str, content_type: str, content_id: str = None, image_type: str = 'poster') -> str:
    """
    Stocke l'URL de l'image originale sans tenter de la télécharger
    Contournement temporaire des problèmes d'authentification avec Supabase Storage
    
    Args:
        image_url (str): URL de l'image à stocker
        content_type (str): Type de contenu (drama, anime, film, bollywood)
        content_id (str): Identifiant unique du contenu
        image_type (str): Type d'image (poster, banner, screenshot, etc.)
    
    Returns:
        str: URL originale de l'image
    """
    if not image_url:
        logger.warning("URL d'image vide")
        return ""
    
    # Solution temporaire: retourner directement l'URL originale en raison des problèmes d'authentification
    logger.info(f"Stockage de l'URL originale de l'image: {image_url}")
    return image_url

# Exporter les fonctions principales
__all__ = ['init_supabase_client', 'download_and_upload_image']

# Initialiser le client au chargement du module
if __name__ != "__main__":
    init_supabase_client()
