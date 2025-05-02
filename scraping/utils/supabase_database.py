#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Module d'utilitaires pour l'interaction avec Supabase
Ce module remplace les fonctionnalités MongoDB, Redis et OpenSearch utilisées dans l'ancienne version AWS
"""

import os
import json
import time
import logging
import uuid
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Union
from dotenv import load_dotenv
from supabase import create_client, Client

# Configuration du logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('supabase_database')

# Chargement des variables d'environnement
load_dotenv()

# Variables d'environnement Supabase
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_KEY')  # Utilisation de la clé de service
MIN_ITEMS = int(os.getenv('MIN_ITEMS', '200'))  # Minimum d'éléments à récupérer par source

class SupabaseDatabase:
    """
    Classe gérant les interactions avec la base de données Supabase
    Remplace les fonctionnalités MongoDB, Redis et OpenSearch de l'ancienne version
    """
    
    def __init__(self, url: str = None, key: str = None):
        """
        Initialise la connexion à Supabase
        
        Args:
            url (str, optional): URL de l'API Supabase. Par défaut, utilise la variable d'environnement.
            key (str, optional): Clé de service Supabase. Par défaut, utilise la variable d'environnement.
        """
        self.supabase_url = url or SUPABASE_URL
        self.supabase_key = key or SUPABASE_KEY
        self.client = None
        
        if not self.supabase_url or not self.supabase_key:
            logger.error("Les variables d'environnement SUPABASE_URL et SUPABASE_SERVICE_KEY doivent être définies")
            return
        
        self.initialize_client()
    
    def initialize_client(self) -> bool:
        """
        Initialise le client Supabase
        
        Returns:
            bool: True si l'initialisation a réussi, False sinon
        """
        try:
            # Pour la base de données, nous utilisons la clé de service qui a tous les droits
            self.client = create_client(self.supabase_url, self.supabase_key)
            logger.info(f"✅ Client Supabase initialisé pour {self.supabase_url}")
            return True
        except Exception as e:
            logger.error(f"❌ Erreur lors de l'initialisation du client Supabase: {str(e)}")
            self.client = None
            return False
    
    def store_content(self, table_name: str, content_data: Dict[str, Any]) -> Optional[Dict]:
        """
        Stocke ou met à jour un contenu dans la base de données Supabase
        Args:
            table_name (str): Nom de la table cible (ex: 'dramas', 'animes')
            content_data (Dict[str, Any]): Données du contenu à stocker
        Returns:
            Optional[Dict]: Résultat de l'opération ou None en cas d'erreur
        """
        if not self.client:
            self.initialize_client()
        if not self.client:
            return None

        try:
            content_id = self._find_existing_content(table_name, content_data)
            if content_id:
                logger.info(f"Contenu '{content_data['title']}' trouvé avec l'ID: {content_id}. Mise à jour...")
                return self._update_content(table_name, content_id, content_data)
            else:
                logger.info(f"Nouveau contenu '{content_data['title']}' - insertion...")
                return self._insert_content(table_name, content_data)
        except Exception as e:
            logger.error(f"Erreur lors de l'insertion/mise à jour du contenu: {e}")
            return None

    def _find_existing_content(self, table_name: str, content_data: Dict[str, Any]) -> Optional[str]:
        """
        Recherche un contenu existant par titre et source (si la colonne existe).
        Retourne l'ID si trouvé, sinon None.
        """
        try:
            # Essaye avec la colonne source
            existing = self.client.table(table_name).select("id").eq("title", content_data["title"]).eq("source", content_data["source"]).execute()
            if existing.data and (item := existing.data[0]["id"]):
                return item
        except Exception:
            try:
                existing = self.client.table(table_name).select("id").eq("title", content_data["title"]).execute()
                if existing.data and (item := existing.data[0]["id"]):
                    return item
            except Exception:
                return None
        return None

    def _update_content(self, table_name: str, content_id: str, content_data: Dict[str, Any]) -> Optional[Dict]:
        """
        Met à jour un contenu existant dans la table.
        """
        try:
            result = self.client.table(table_name).update(content_data).eq("id", content_id).execute()
            return result.data[0] if result.data else None
        except Exception as e:
            logger.error(f"Erreur lors de la mise à jour du contenu: {e}")
            return None

    def _insert_content(self, table_name: str, content_data: Dict[str, Any]) -> Optional[Dict]:
        """
        Insère un nouveau contenu dans la table.
        """
        try:
            result = self.client.table(table_name).insert(content_data).execute()
            return result.data[0] if result.data else None
        except Exception as e:
            logger.error(f"Erreur lors de l'insertion du contenu: {e}")
            return None
    
    def log_scraping_start(self, source: str, content_type: str) -> Optional[str]:
        """
        Enregistre le début d'une session de scraping
        Args:
            source (str): Identifiant de la source (ex: 'mydramalist', 'voirdrama')
            content_type (str): Type de contenu (ex: 'dramas', 'animes')
        Returns:
            Optional[str]: ID du log créé ou None en cas d'erreur
        """
        if not self.client:
            self.initialize_client()
        if not self.client:
            logger.error("Client Supabase non initialisé")
            return None
        try:
            log_data = {
                "source": source,
                "content_type": content_type,
                "start_time": datetime.now().isoformat(),
                "status": "started",
                "items_count": 0,
                "error_count": 0,
                "success": False
            }
            result = self.client.table("scraping_logs").insert(log_data).execute()
            log_id = result.data[0]["id"] if result.data else None
            if log_id:
                logger.info(f"Session de scraping enregistrée avec l'ID: {log_id}")
            else:
                logger.warning("Aucun ID de log retourné")
            return log_id
        except Exception as e:
            logger.error(f"Erreur lors de l'enregistrement du début du scraping: {str(e)}")
            return None

    def log_scraping_end(self, log_id: str, success_count: int, error_count: int, duration: float, details: Dict = None) -> bool:
        """
        Met à jour un log de scraping avec les résultats finaux
        Args:
            log_id (str): ID du log à mettre à jour
            success_count (int): Nombre d'éléments scrappés avec succès
            error_count (int): Nombre d'erreurs rencontrées
            duration (float): Durée de l'opération en secondes
            details (Dict, optional): Détails supplémentaires à enregistrer
        Returns:
            bool: True si la mise à jour a réussi, False sinon
        """
        if not self.client:
            self.initialize_client()
        if not self.client:
            logger.error("Client Supabase non initialisé")
            return False
        try:
            update_data = {
                "end_time": datetime.now().isoformat(),
                "items_count": success_count,
                "error_count": error_count,
                "duration": duration,
                "success": error_count == 0,
                "status": "completed",
                "details": details or {}
            }
            response = self.client.table("scraping_logs").update(update_data).eq("id", log_id).execute()
            if response.data:
                logger.info(f"✅ Log de scraping {log_id} mis à jour avec succès")
                return True
            else:
                logger.error(f"❌ Erreur lors de la mise à jour du log de scraping {log_id}")
                return False
        except Exception as e:
            logger.error(f"❌ Erreur lors de la mise à jour du log de scraping {log_id}: {str(e)}")
            return False

    def update_scraping_log(self, log_id: str, data: Dict) -> bool:
        """
        Met à jour un log de scraping avec les données fournies dans un dictionnaire
        Cette fonction est un wrapper pour log_scraping_end pour la compatibilité avec les scripts existants
        Args:
            log_id (str): ID du log à mettre à jour
            data (Dict): Dictionnaire contenant les données à mettre à jour
        Returns:
            bool: True si la mise à jour a réussi, False sinon
        """
        if not self.client:
            self.initialize_client()
        if not self.client:
            logger.error("Client Supabase non initialisé")
            return False
        try:
            update_data = {k: v for k, v in data.items() if k in ["items_scraped", "items_count", "errors", "errors_count", "duration", "success", "status", "details"]}
            update_data["updated_at"] = datetime.now().isoformat()
            response = self.client.table("scraping_logs").update(update_data).eq("id", log_id).execute()
            if response.data:
                logger.info(f"✅ Log de scraping {log_id} mis à jour avec succès")
                return True
            else:
                logger.warning(f"⚠️ Aucune donnée retournée lors de la mise à jour du log {log_id}")
                return False
        except Exception as e:
            logger.error(f"❌ Erreur lors de la mise à jour du log de scraping {log_id}: {str(e)}")
            return False

    def get_existing_content(self, source: str, content_type: str, limit: int = 5000) -> List[Dict]:
        """
        Récupère les contenus existants pour une source et un type donnés
        Utile pour éviter les duplications et faire des vérifications
        Args:
            source (str): Source du contenu (ex: 'mydramalist')
            content_type (str): Type de contenu (ex: 'dramas')
            limit (int, optional): Nombre maximum d'éléments à récupérer
        Returns:
            List[Dict]: Liste des contenus existants
        """
        if not self.client:
            self.initialize_client()
        if not self.client:
            logger.error("Client Supabase non initialisé")
            return []
        try:
            result = self.client.table(content_type) \
                .select("id, title, source, source_url") \
                .eq("source", source) \
                .limit(limit) \
                .execute()
            if result.data:
                logger.info(f"✅ Récupéré {len(result.data)} éléments existants de type {content_type} pour la source {source}")
                return result.data
            else:
                logger.info(f"Aucun élément existant de type {content_type} pour la source {source}")
                return []
        except Exception as e:
            logger.error(f"Erreur lors de la récupération des contenus existants: {str(e)}")
            return []

    def check_scraping_metrics(self, days: int = 7) -> Dict[str, Any]:
        """
        Vérifie les métriques de scraping pour les derniers jours
        Args:
            days (int, optional): Nombre de jours à analyser
        Returns:
            Dict[str, Any]: Métriques de scraping
        """
        if not self.client:
            self.initialize_client()
        if not self.client:
            logger.error("Client Supabase non initialisé")
            return {}
        try:
            cutoff_date = (datetime.now() - timedelta(days=days)).isoformat()
            result = self.client.table("scraping_logs") \
                .select("id, source, content_type, start_time, end_time, items_count, error_count, duration, success, status") \
                .gte("start_time", cutoff_date) \
                .execute()
            metrics = {
                "total_logs": 0,
                "total_items": 0,
                "total_errors": 0,
                "content_types": {}
            }
            if result.data:
                metrics["total_logs"] = len(result.data)
                for log in result.data:
                    metrics["total_items"] += log.get("items_count", 0)
                    metrics["total_errors"] += log.get("error_count", 0)
                    content_type = log.get("content_type", "unknown")
                    if content_type not in metrics["content_types"]:
                        metrics["content_types"][content_type] = {
                            "count": 0,
                            "success": 0,
                            "items": 0
                        }
                    metrics["content_types"][content_type]["count"] += 1
                    if log.get("success"):
                        metrics["content_types"][content_type]["success"] += 1
                    metrics["content_types"][content_type]["items"] += log.get("items_count", 0)
            return metrics
        except Exception as e:
            logger.error(f"Erreur lors de la vérification des métriques: {str(e)}")
            return {"error": str(e)}

# Export de l'instance par défaut pour une utilisation facile
supabase_db = SupabaseDatabase()
# Alias pour la compatibilité avec les scripts existants
supabase_database = supabase_db

# Fonction principale pour tester le module
def main():
    """Fonction de test principale"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Test du module de base de données Supabase")
    parser.add_argument('--action', choices=['test', 'metrics'], default='test',
                      help='Action à exécuter')
    
    args = parser.parse_args()
    
    db = SupabaseDatabase()
    if not db.client:
        logger.error("Impossible d'initialiser la connexion à Supabase")
        return
    
    if args.action == 'test':
        # Test de création d'un log de scraping
        log_id = db.log_scraping_start("test_source", "dramas")
        if log_id:
            logger.info(f"Log créé avec l'ID: {log_id}")
            
            # Simuler un délai
            time.sleep(2)
            
            # Mettre à jour le log
            db.log_scraping_end(log_id, 42, 3, 2.5, {"test": True})
    
    elif args.action == 'metrics':
        # Afficher les métriques de scraping
        metrics = db.check_scraping_metrics()
        print(json.dumps(metrics, indent=2))

if __name__ == "__main__":
    main()
