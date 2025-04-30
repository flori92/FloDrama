#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Générateur de bannières hero pour FloDrama - Migration Supabase
Ce script génère des bannières hero à partir des contenus populaires dans la base Supabase.
Exécution via GitHub Actions après le scraping des contenus.
"""

import os
import json
import logging
from datetime import datetime, timedelta
import random
from supabase import create_client, Client

# Configuration du logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('banners_generator')

# Récupération des variables d'environnement
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")

# Initialisation du client Supabase
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# Nombre de bannières à générer
BANNERS_COUNT = 5

def select_banner_candidates():
    """Sélectionne les meilleurs candidats pour les bannières hero"""
    candidates = []
    
    # Récupérer les contenus les plus populaires de chaque catégorie
    tables = ["dramas", "animes", "films", "bollywood"]
    
    for table in tables:
        try:
            # Sélectionner les éléments avec une bonne note et une image de fond
            result = supabase.table(table) \
                .select("id,title,poster,backdrop,synopsis,year,rating") \
                .gte("rating", 7.5) \
                .not_.is_("backdrop", "null") \
                .order("popularity_score", ascending=False) \
                .limit(5) \
                .execute()
            
            if result.data:
                # Ajouter le type de contenu
                for item in result.data:
                    item["content_type"] = table[:-1] if table.endswith("s") else table
                
                candidates.extend(result.data)
        except Exception as e:
            logger.error(f"Erreur lors de la récupération des candidats depuis {table}: {str(e)}")
    
    # Mélanger les candidats pour éviter de toujours avoir les mêmes types en premier
    random.shuffle(candidates)
    
    # Prendre les meilleurs candidats
    return candidates[:BANNERS_COUNT]

def generate_hero_banners():
    """Génère les bannières hero et les enregistre dans Supabase"""
    logger.info("Début de la génération des bannières hero")
    
    # Supprimer les anciennes bannières
    try:
        supabase.table("hero_banners").delete().neq("id", "placeholder").execute()
        logger.info("Anciennes bannières supprimées")
    except Exception as e:
        logger.error(f"Erreur lors de la suppression des anciennes bannières: {str(e)}")
    
    # Sélectionner les candidats pour les nouvelles bannières
    candidates = select_banner_candidates()
    
    if not candidates:
        logger.warning("Aucun candidat trouvé pour les bannières hero")
        return
    
    logger.info(f"Génération de {len(candidates)} bannières hero")
    
    # Générer les nouvelles bannières
    for position, item in enumerate(candidates):
        # Date de début immédiate, fin dans 7 jours
        start_date = datetime.now()
        end_date = start_date + timedelta(days=7)
        
        banner_data = {
            "title": item["title"],
            "content_id": item["id"],
            "content_type": item["content_type"],
            "image": item["backdrop"],
            "description": item["synopsis"][:200] + "..." if item["synopsis"] and len(item["synopsis"]) > 200 else "",
            "is_active": True,
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat(),
            "position": position,
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        }
        
        try:
            supabase.table("hero_banners").insert(banner_data).execute()
            logger.info(f"Bannière créée pour: {item['title']}")
        except Exception as e:
            logger.error(f"Erreur lors de la création de la bannière pour {item['title']}: {str(e)}")
    
    logger.info("Génération des bannières hero terminée")

if __name__ == "__main__":
    # Vérification de la configuration
    if not SUPABASE_URL or not SUPABASE_KEY:
        logger.error("Les variables d'environnement SUPABASE_URL et SUPABASE_KEY doivent être définies")
        exit(1)
    
    # Génération des bannières
    generate_hero_banners()
    
    logger.info("Script de génération de bannières terminé avec succès")
