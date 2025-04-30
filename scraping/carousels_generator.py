#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Générateur de carrousels pour FloDrama - Migration Supabase
Ce script génère des carrousels à partir des contenus disponibles dans la base Supabase.
Exécution via GitHub Actions après le scraping des contenus.
"""

import os
import json
import logging
from datetime import datetime
import random
from supabase import create_client, Client

# Configuration du logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('carousels_generator')

# Récupération des variables d'environnement
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")

# Initialisation du client Supabase
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# Configuration des carrousels à générer
CAROUSELS_CONFIG = [
    {
        "title": "Dramas populaires",
        "type": "drama",
        "source_table": "dramas",
        "order_by": "popularity_score",
        "order_direction": "desc",
        "limit": 10
    },
    {
        "title": "Animes à découvrir",
        "type": "anime",
        "source_table": "animes",
        "order_by": "popularity_score",
        "order_direction": "desc",
        "limit": 10
    },
    {
        "title": "Films à voir",
        "type": "film",
        "source_table": "films",
        "order_by": "popularity_score",
        "order_direction": "desc",
        "limit": 10
    },
    {
        "title": "Bollywood sensations",
        "type": "bollywood",
        "source_table": "bollywood",
        "order_by": "popularity_score",
        "order_direction": "desc",
        "limit": 10
    },
    {
        "title": "Nouveautés",
        "type": "trending",
        "mixed_sources": ["dramas", "animes", "films", "bollywood"],
        "order_by": "created_at",
        "order_direction": "desc",
        "limit": 12
    }
]

def get_items_for_carousel(config):
    """Récupère les éléments pour un carrousel selon sa configuration"""
    items = []
    
    # Cas spécial pour les carrousels mixtes
    if "mixed_sources" in config:
        # Récupérer des éléments de chaque source
        items_per_source = max(2, config["limit"] // len(config["mixed_sources"]))
        
        for source in config["mixed_sources"]:
            try:
                source_items = supabase.table(source) \
                    .select("id,title,poster,year,rating,language") \
                    .order(config["order_by"], ascending=(config["order_direction"] != "desc")) \
                    .limit(items_per_source) \
                    .execute()
                
                if source_items.data:
                    for item in source_items.data:
                        # Ajouter le type au contenu
                        item["type"] = source[:-1] if source.endswith("s") else source
                        items.append(item)
            except Exception as e:
                logger.error(f"Erreur lors de la récupération des éléments depuis {source}: {str(e)}")
        
        # Mélanger les éléments pour plus de diversité
        random.shuffle(items)
        
    else:
        # Carrousel standard avec une seule source
        try:
            result = supabase.table(config["source_table"]) \
                .select("id,title,poster,year,rating,language") \
                .order(config["order_by"], ascending=(config["order_direction"] != "desc")) \
                .limit(config["limit"]) \
                .execute()
            
            if result.data:
                items = result.data
                # Ajouter le type au contenu
                for item in items:
                    item["type"] = config["type"]
        except Exception as e:
            logger.error(f"Erreur lors de la récupération des éléments pour {config['title']}: {str(e)}")
    
    return items[:config["limit"]]

def generate_carousels():
    """Génère tous les carrousels configurés et les enregistre dans Supabase"""
    logger.info("Début de la génération des carrousels")
    
    for carousel_config in CAROUSELS_CONFIG:
        logger.info(f"Génération du carrousel: {carousel_config['title']}")
        
        items = get_items_for_carousel(carousel_config)
        
        if not items:
            logger.warning(f"Aucun élément trouvé pour le carrousel {carousel_config['title']}")
            continue
        
        # Vérifier si le carrousel existe déjà
        existing_query = supabase.table("carousels") \
            .select("id") \
            .eq("title", carousel_config["title"]) \
            .execute()
        
        carousel_data = {
            "title": carousel_config["title"],
            "type": carousel_config["type"],
            "items": items,
            "updated_at": datetime.now().isoformat()
        }
        
        if existing_query.data:
            # Mise à jour du carrousel existant
            carousel_id = existing_query.data[0]["id"]
            logger.info(f"Mise à jour du carrousel existant: {carousel_config['title']} (ID: {carousel_id})")
            supabase.table("carousels").update(carousel_data).eq("id", carousel_id).execute()
        else:
            # Création d'un nouveau carrousel
            logger.info(f"Création d'un nouveau carrousel: {carousel_config['title']}")
            carousel_data["created_at"] = datetime.now().isoformat()
            supabase.table("carousels").insert(carousel_data).execute()
    
    logger.info("Génération des carrousels terminée")

if __name__ == "__main__":
    # Vérification de la configuration
    if not SUPABASE_URL or not SUPABASE_KEY:
        logger.error("Les variables d'environnement SUPABASE_URL et SUPABASE_KEY doivent être définies")
        exit(1)
    
    # Génération des carrousels
    generate_carousels()
    
    logger.info("Script de génération de carrousels terminé avec succès")
