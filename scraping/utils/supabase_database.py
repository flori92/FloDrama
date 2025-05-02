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
                
        # Vérifier si un contenu avec le même titre et source existe déjà
        try:
            # Vérification de l'existence des colonnes requises
            # Si la colonne 'source' n'existe pas, on utilise uniquement le titre
            try:
                existing = self.client.table(table_name).select("id").eq("title", content_data["title"]).eq("source", content_data["source"]).execute()
                if existing.data and len(existing.data) > 0:
                    content_id = existing.data[0]["id"]
                    logger.info(f"Contenu '{content_data['title']}' trouvé avec l'ID: {content_id}. Mise à jour...")
                    
                    # Mise à jour du contenu existant
                    response = self.client.table(table_name).update(content_data).eq("id", content_id).execute()
                    return response.data[0] if response.data else None
            except Exception as column_error:
                # Si une erreur se produit (probablement parce que la colonne 'source' n'existe pas)
                if "column" in str(column_error) and "does not exist" in str(column_error):
                    logger.warning(f"La colonne 'source' n'existe pas dans la table {table_name}. On l'ignore pour la requête.")
                    # Vérification basée uniquement sur le titre
                    existing = self.client.table(table_name).select("id").eq("title", content_data["title"]).execute()
                    if existing.data and len(existing.data) > 0:
                        content_id = existing.data[0]["id"]
                        logger.info(f"Contenu '{content_data['title']}' trouvé avec l'ID: {content_id}. Mise à jour...")
                        
                        # On retire les colonnes qui pourraient ne pas exister
                        safe_content = content_data.copy()
                        if "source" in safe_content:
                            del safe_content["source"]
                        if "source_url" in safe_content:
                            del safe_content["source_url"]
                        
                        # Mise à jour du contenu existant
                        response = self.client.table(table_name).update(safe_content).eq("id", content_id).execute()
                        return response.data[0] if response.data else None
                else:
                    # Une autre erreur s'est produite
                    raise column_error
                    
            # Insertion d'un nouveau contenu
            logger.info(f"Insertion d'un nouveau contenu: '{content_data['title']}'")
            
            # Vérification des colonnes à insérer
            try:
                response = self.client.table(table_name).insert(content_data).execute()
                return response.data[0] if response.data else None
            except Exception as insert_error:
                if "column" in str(insert_error) and "does not exist" in str(insert_error):
                    logger.warning(f"Erreur d'insertion liée à une colonne manquante: {str(insert_error)}")
                    # On retire les colonnes qui semblent poser problème
                    safe_content = content_data.copy()
                    error_msg = str(insert_error).lower()
                    
                    # Vérification des colonnes mentionnées dans l'erreur
                    if "source" in error_msg and "source" in safe_content:
                        del safe_content["source"]
                        logger.warning("Colonne 'source' retirée pour l'insertion")
                    if "source_url" in error_msg and "source_url" in safe_content:
                        del safe_content["source_url"]
                        logger.warning("Colonne 'source_url' retirée pour l'insertion")
                        
                    # Nouvelle tentative avec le contenu sécurisé
                    response = self.client.table(table_name).insert(safe_content).execute()
                    return response.data[0] if response.data else None
                else:
                    raise insert_error
                    
        except Exception as e:
            logger.error(f"Erreur lors du stockage du contenu '{content_data.get('title', 'Inconnu')}': {str(e)}")
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
            logger.error("Client Supabase non initialisé")
            return None
        
        try:
            log_data = {
                "source": source,
                "content_type": content_type,
                "items_count": 0,
                "status": "processing",
                "started_at": datetime.now().isoformat(),
                "target_table": content_type,
                "total_items": 0,
                "error_count": 0,
                "success": False
            }
            
            result = self.client.table("scraping_logs") \
                .insert(log_data) \
                .execute()
            
            log_id = result.data[0]["id"] if result.data else None
            
            if log_id:
                logger.info(f"Session de scraping enregistrée avec l'ID: {log_id}")
            else:
                logger.warning("Aucun ID de log retourné")
                
            return log_id
            
        except Exception as e:
            logger.error(f"Erreur lors de l'enregistrement du début du scraping: {str(e)}")
            return None
    
    def log_scraping_end(self, log_id: str, success_count: int, error_count: int, 
                         duration: float, details: Dict = None) -> bool:
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
                return False
        
        try:
            # Préparation des données de mise à jour
            update_data = {
                "ended_at": datetime.now().isoformat(),
                "items_count": success_count,
                "errors_count": error_count,
                "execution_time": duration,
                "success": error_count == 0,
                "status": "completed"
            }
            
            # Mise à jour du log
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
                - items_scraped (int) ou items_count (int): Nombre d'éléments scrappés avec succès
                - errors (int) ou errors_count (int): Nombre d'erreurs rencontrées
                - execution_time (float) ou duration (float): Durée de l'opération en secondes
                - details (Dict, optional): Détails supplémentaires à enregistrer
                
        Returns:
            bool: True si la mise à jour a réussi, False sinon
        """
        if not self.client:
            logger.error("Client Supabase non initialisé")
            return False
            
        try:
            # Extraction des données du dictionnaire avec compatibilité des noms de champs
            success_count = data.get("items_scraped", data.get("items_count", 0))
            error_count = data.get("errors", data.get("errors_count", 0))
            duration = data.get("execution_time", data.get("duration", 0.0))
            details = data.get("details")
            
            # Préparation des données à mettre à jour
            update_data = {
                "items_count": success_count,
                "errors_count": error_count,
                "duration": duration,
                "ended_at": datetime.now().isoformat(),
                "success": success_count > 0,  # Considère comme succès si au moins un élément a été récupéré
                "status": "completed"
            }
            
            # Ajout des détails si fournis
            if details:
                update_data["details"] = details
                
            # Mise à jour directe dans la table scraping_logs
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
    
    # Alias pour log_scraping_end pour la compatibilité avec les scripts existants
    update_scraping_log_alias = log_scraping_end
    
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
            logger.error("Client Supabase non initialisé")
            return []
        
        try:
            # Sélection des colonnes selon le schéma réel de la table
            # Utilisation de source_url au lieu de url qui n'existe pas
            result = self.client.table(content_type) \
                .select("id,title,source,year,source_url,created_at,updated_at") \
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
            logger.error("Client Supabase non initialisé")
            return {}
        
        try:
            # Calculer la date limite
            cutoff_date = (datetime.now() - timedelta(days=days)).isoformat()
            
            # Récupérer les logs de scraping
            result = self.client.table("scraping_logs") \
                .select("*") \
                .gte("started_at", cutoff_date) \
                .order("started_at", desc=True) \
                .execute()
            
            logs = result.data if result.data else []
            
            # Regrouper les résultats par source et par type
            metrics = {
                "total_logs": len(logs),
                "success_count": sum(1 for log in logs if log.get("success") is True),
                "error_count": sum(1 for log in logs if log.get("success") is False),
                "total_items": sum(log.get("items_count", 0) for log in logs),
                "sources": {},
                "content_types": {}
            }
            
            # Agréger par source
            for log in logs:
                source = log.get("source")
                if source:
                    if source not in metrics["sources"]:
                        metrics["sources"][source] = {
                            "count": 0,
                            "success": 0,
                            "items": 0
                        }
                    
                    metrics["sources"][source]["count"] += 1
                    if log.get("success"):
                        metrics["sources"][source]["success"] += 1
                    metrics["sources"][source]["items"] += log.get("items_count", 0)
            
            # Agréger par type de contenu
            for log in logs:
                content_type = log.get("content_type")
                if content_type:
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
