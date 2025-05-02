#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Framework de base pour les scrapers FloDrama - Migration Supabase
Ce module fournit les classes de base et utilitaires pour tous les scrapers.
"""

import os
import json
import time
import random
import logging
from datetime import datetime
import requests
from bs4 import BeautifulSoup
import re
from supabase import create_client, Client
from urllib.parse import urljoin
from abc import ABC, abstractmethod
from typing import Dict, List, Any, Optional, Union

# Configuration du logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('flodrama_scraper')

# Configuration des constantes globales
USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.107 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/97.0.4692.71 Safari/537.36",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 15_2_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.2 Mobile/15E148 Safari/604.1"
]

# Récupération des variables d'environnement
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_KEY")  # Utilisation de la clé de service
MIN_ITEMS = int(os.environ.get("MIN_ITEMS", "200"))

# Initialisation du client Supabase (si les variables d'environnement sont définies)
supabase = None
if SUPABASE_URL and SUPABASE_KEY:
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
else:
    logger.warning("Variables d'environnement SUPABASE_URL et SUPABASE_SERVICE_KEY non définies. Connexion à Supabase désactivée.")

class ScraperUtils:
    """Classe utilitaire avec des méthodes statiques pour les scrapers"""
    
    @staticmethod
    def get_random_headers(referer: str = None) -> Dict[str, str]:
        """Génère des en-têtes aléatoires pour les requêtes HTTP"""
        headers = {
            "User-Agent": random.choice(USER_AGENTS),
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
            "Accept-Language": "fr,fr-FR;q=0.8,en-US;q=0.5,en;q=0.3",
            "DNT": "1",
            "Connection": "keep-alive",
            "Upgrade-Insecure-Requests": "1",
        }
        
        if referer:
            headers["Referer"] = referer
            
        return headers
    
    @staticmethod
    def fetch_page(url: str, referer: str = None, retries: int = 3, delay: int = 2) -> Optional[str]:
        """Récupère le contenu d'une page avec gestion des erreurs et retries"""
        for attempt in range(retries):
            try:
                logger.info(f"Récupération de la page: {url} (tentative {attempt+1}/{retries})")
                headers = ScraperUtils.get_random_headers(referer)
                response = requests.get(url, headers=headers, timeout=10)
                response.raise_for_status()
                time.sleep(delay)  # Respect du rate limiting
                return response.text
            except requests.exceptions.RequestException as e:
                logger.warning(f"Erreur lors de la récupération de {url}: {e}")
                if attempt < retries - 1:
                    sleep_time = 2 ** attempt  # Backoff exponentiel
                    logger.info(f"Nouvelle tentative dans {sleep_time} secondes...")
                    time.sleep(sleep_time)
                else:
                    logger.error(f"Échec après {retries} tentatives pour {url}")
                    return None
    
    @staticmethod
    def detect_language_from_country(country: str) -> str:
        """Détecte la langue en fonction du pays"""
        country_lower = country.lower()
        
        if any(jp in country_lower for jp in ["japon", "japan"]):
            return "ja"
        elif any(cn in country_lower for cn in ["chine", "china", "taiwan", "hong kong"]):
            return "zh"
        elif any(th in country_lower for th in ["thaïlande", "thailand"]):
            return "th"
        elif any(in_country in country_lower for in_country in ["inde", "india"]):
            return "hi"
        else:
            return "ko"  # Par défaut coréen
    
    @staticmethod
    def clean_text(text: str) -> str:
        """Nettoie un texte en supprimant les espaces multiples et les retours à la ligne"""
        if not text:
            return ""
        
        # Remplacer les retours à la ligne par des espaces
        text = re.sub(r'\s+', ' ', text)
        # Supprimer les espaces en début et fin de chaîne
        return text.strip()
    
    @staticmethod
    def extract_year(text: str) -> Optional[int]:
        """Extrait une année (4 chiffres) d'un texte"""
        year_match = re.search(r'\b(19|20)\d{2}\b', text)
        return int(year_match.group(0)) if year_match else None
    
    @staticmethod
    def extract_number(text: str) -> Optional[int]:
        """Extrait un nombre d'un texte"""
        number_match = re.search(r'\b\d+\b', text)
        return int(number_match.group(0)) if number_match else None
    
    @staticmethod
    def extract_float(text: str) -> Optional[float]:
        """Extrait un nombre à virgule d'un texte"""
        float_match = re.search(r'\b\d+[.,]\d+\b', text)
        if float_match:
            # Remplacer la virgule par un point si nécessaire
            return float(float_match.group(0).replace(',', '.'))
        return None
    
    @staticmethod
    def log_scraping_start(source_id: str, target_table: str) -> str:
        """Enregistre le début d'un scraping dans Supabase et retourne l'ID du log"""
        scraping_log = {
            "source": source_id,
            "content_type": target_table,
            "items_count": 0,
            "status": "processing",
            "started_at": datetime.now().isoformat(),
        }
        
        try:
            scraping_log_response = supabase.table("scraping_logs").insert(scraping_log).execute()
            return scraping_log_response.data[0]["id"] if scraping_log_response.data else None
        except Exception as e:
            logger.error(f"Erreur lors de l'enregistrement du début du scraping: {e}")
            return None
    
    @staticmethod
    def log_scraping_end(log_id: str, success_count: int, error_count: int, duration: float, details: Dict = None) -> None:
        """Met à jour le log de scraping avec les résultats"""
        if not log_id:
            return
            
        update_data = {
            "items_count": success_count,
            "status": "completed",
            "error_message": f"{error_count} erreurs" if error_count > 0 else None,
            "duration_seconds": duration,
            "finished_at": datetime.now().isoformat(),
            "details": details or {}
        }
        
        try:
            supabase.table("scraping_logs").update(update_data).eq("id", log_id).execute()
        except Exception as e:
            logger.error(f"Erreur lors de la mise à jour du log de scraping: {e}")
    
    @staticmethod
    def save_report(source_id: str, target_table: str, results: Dict) -> None:
        """Sauvegarde un rapport de scraping dans un fichier JSON"""
        report = {
            "source": source_id,
            "table": target_table,
            "timestamp": datetime.now().isoformat(),
            "results": results
        }
        
        try:
            with open(f"scraping/{source_id}_report.json", "w") as f:
                json.dump(report, f, indent=4)
                
            logger.info(f"Rapport généré: scraping/{source_id}_report.json")
        except Exception as e:
            logger.error(f"Erreur lors de la sauvegarde du rapport: {e}")

class BaseScraper(ABC):
    """Classe de base abstraite pour tous les scrapers"""
    
    def __init__(self, source_id: str, target_table: str, base_url: str):
        self.source_id = source_id
        self.target_table = target_table
        self.base_url = base_url
        self.min_items = MIN_ITEMS
        self.rate_limit_delay = 2  # secondes entre les requêtes
        self.max_retries = 3  # nombre maximal de tentatives en cas d'échec
        
        # Initialisation du logger spécifique
        self.logger = logging.getLogger(f'flodrama_{source_id}')
    
    @abstractmethod
    def get_content_urls(self, limit: int = 300) -> List[str]:
        """Récupère les URLs des contenus à scraper"""
        pass
    
    @abstractmethod
    def extract_content_details(self, url: str) -> Optional[Dict[str, Any]]:
        """Extrait les détails d'un contenu à partir de son URL"""
        pass
    
    def save_content(self, content_data: Dict[str, Any]) -> bool:
        """Sauvegarde un contenu dans Supabase"""
        try:
            # Vérifier si le contenu existe déjà
            existing_query = supabase.table(self.target_table) \
                .select("id") \
                .eq("title", content_data["title"]) \
                .eq("source", self.source_id)
                
            if content_data.get("year"):
                existing_query = existing_query.eq("year", content_data["year"])
                
            existing_result = existing_query.execute()
            
            if existing_result.data:
                # Mise à jour du contenu existant
                content_id = existing_result.data[0]["id"]
                self.logger.info(f"Mise à jour du contenu existant: {content_data['title']} (ID: {content_id})")
                supabase.table(self.target_table).update(content_data).eq("id", content_id).execute()
            else:
                # Insertion d'un nouveau contenu
                self.logger.info(f"Ajout d'un nouveau contenu: {content_data['title']}")
                supabase.table(self.target_table).insert(content_data).execute()
            
            return True
        except Exception as e:
            self.logger.error(f"Erreur lors de la sauvegarde du contenu {content_data.get('title', 'inconnu')}: {str(e)}")
            return False
    
    def run(self) -> Dict[str, Any]:
        """Exécute le processus complet de scraping"""
        start_time = time.time()
        self.logger.info(f"Début du scraping depuis {self.source_id} pour la table {self.target_table}")
        
        # Enregistrement du début du scraping
        log_id = ScraperUtils.log_scraping_start(self.source_id, self.target_table)
        
        # Récupération des URLs
        content_urls = self.get_content_urls()
        
        # Initialisation des compteurs
        total_contents = len(content_urls)
        scraped_count = 0
        success_count = 0
        error_count = 0
        
        self.logger.info(f"Trouvé {total_contents} contenus à traiter")
        
        # Traitement de chaque contenu
        for url in content_urls:
            scraped_count += 1
            self.logger.info(f"Traitement du contenu {scraped_count}/{total_contents}: {url}")
            
            # Si nous avons déjà atteint le minimum requis, arrêter
            if success_count >= self.min_items:
                self.logger.info(f"Minimum requis atteint ({self.min_items} contenus). Arrêt du scraping.")
                break
            
            try:
                content_data = self.extract_content_details(url)
                if not content_data:
                    error_count += 1
                    continue
                
                # Ajouter les métadonnées communes
                content_data["source"] = self.source_id
                content_data["created_at"] = datetime.now().isoformat()
                
                # Sauvegarder le contenu
                if self.save_content(content_data):
                    success_count += 1
                else:
                    error_count += 1
                    
            except Exception as e:
                self.logger.error(f"Erreur lors du traitement de {url}: {str(e)}")
                error_count += 1
        
        # Calcul de la durée
        duration = time.time() - start_time
        
        # Mise à jour du log de scraping
        details = {
            "total": total_contents,
            "scraped": scraped_count,
            "success": success_count,
            "errors": error_count
        }
        ScraperUtils.log_scraping_end(log_id, success_count, error_count, duration, details)
        
        # Rapport final
        self.logger.info(f"Scraping terminé en {duration:.2f} secondes")
        self.logger.info(f"Résultats: {success_count} contenus ajoutés/mis à jour, {error_count} erreurs")
        
        # Vérification de l'objectif
        if success_count < self.min_items:
            self.logger.error(f"❌ ÉCHEC: {success_count}/{self.min_items} contenus récupérés")
        else:
            self.logger.info(f"✅ SUCCÈS: {success_count}/{self.min_items} contenus récupérés")
        
        # Génération du rapport
        results = {
            "success": success_count,
            "errors": error_count,
            "total": total_contents,
            "duration": duration
        }
        ScraperUtils.save_report(self.source_id, self.target_table, results)
        
        return results
