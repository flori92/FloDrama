#!/usr/bin/env python3
"""
Script d'exportation des données de contenu pour le frontend FloDrama
Ce script convertit les données JSON générées par le scraping en un format optimisé pour le frontend
"""
import os
import json
import logging
import shutil
from pathlib import Path
from datetime import datetime

# Configuration du logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('FloDrama-ContentExport')

def load_content_data(data_dir):
    """Charge toutes les données de contenu depuis le répertoire data"""
    logger.info(f"Chargement des données depuis {data_dir}")
    
    all_content = []
    content_files = list(Path(data_dir).glob('*_content.json'))
    
    if not content_files:
        logger.error(f"Aucun fichier de contenu trouvé dans {data_dir}")
        return []
    
    logger.info(f"Traitement de {len(content_files)} fichiers de contenu")
    
    for file_path in content_files:
        source_name = file_path.stem.replace('_content', '')
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content_data = json.load(f)
                logger.info(f"Chargé {len(content_data)} éléments depuis {file_path.name}")
                
                # Ajouter la source aux données
                for item in content_data:
                    item['_source_file'] = file_path.name
                
                all_content.extend(content_data)
        except Exception as e:
            logger.error(f"Erreur lors du chargement de {file_path}: {str(e)}")
    
    logger.info(f"Total: {len(all_content)} éléments chargés")
    return all_content

def optimize_content_for_frontend(content_data):
    """Optimise les données de contenu pour le frontend"""
    logger.info("Optimisation des données pour le frontend")
    
    optimized_content = []
    search_index = []
    
    for item in content_data:
        # Créer une version optimisée pour l'affichage
        optimized_item = {
            "id": item["id"],
            "title": item["title"],
            "type": item["type"],
            "source": item["source"],
            "url": item["url"],
            "timestamp": item["timestamp"],
            "synopsis": item.get("synopsis", ""),
            "metadata": item.get("metadata", {}),
            "images": {
                "poster": item.get("images", {}).get("poster", ""),
                "thumbnail": item.get("images", {}).get("thumbnail", "")
            },
            "ratings": {
                "average": item.get("ratings", {}).get("average", 0),
                "count": item.get("ratings", {}).get("count", 0)
            }
        }
        
        # Ajouter des informations sur les épisodes si disponibles
        if "episodes" in item and item["episodes"]:
            seasons_count = len(item["episodes"])
            episodes_count = sum(season.get("episodes_count", 0) for season in item["episodes"])
            
            optimized_item["episodes_info"] = {
                "seasons_count": seasons_count,
                "episodes_count": episodes_count,
                "latest_season": item["episodes"][-1]["number"] if seasons_count > 0 else 0
            }
        
        optimized_content.append(optimized_item)
        
        # Créer une entrée d'index de recherche
        search_entry = {
            "id": item["id"],
            "title": item["title"],
            "type": item["type"],
            "source": item["source"],
            "synopsis": item.get("synopsis", ""),
            "metadata": {
                k: v for k, v in item.get("metadata", {}).items() 
                if k in ["country", "year", "genre", "episodes", "status"]
            }
        }
        
        # Ajouter les acteurs à l'index de recherche
        if "cast" in item and item["cast"]:
            search_entry["cast"] = [actor["actor"] for actor in item["cast"]]
        
        search_index.append(search_entry)
    
    logger.info(f"Données optimisées: {len(optimized_content)} éléments")
    return optimized_content, search_index

def create_category_indexes(content_data):
    """Crée des index par catégorie pour le frontend"""
    logger.info("Création des index par catégorie")
    
    # Définir les catégories principales
    categories = {
        "drama": [],
        "anime": [],
        "bollywood": [],
        "trending": [],
        "latest": [],
        "top_rated": []
    }
    
    # Catégories par pays pour les dramas
    drama_countries = {
        "korean": [],
        "chinese": [],
        "japanese": [],
        "thai": []
    }
    
    # Trier par date pour les plus récents
    sorted_by_date = sorted(
        content_data, 
        key=lambda x: x.get("timestamp", ""), 
        reverse=True
    )
    
    # Trier par note pour les mieux notés
    sorted_by_rating = sorted(
        content_data, 
        key=lambda x: x.get("ratings", {}).get("average", 0), 
        reverse=True
    )
    
    # Remplir les catégories
    for item in content_data:
        item_type = item.get("type", "")
        item_id = item.get("id", "")
        
        # Catégories principales
        if item_type == "drama":
            categories["drama"].append(item_id)
            
            # Sous-catégories par pays
            country = item.get("metadata", {}).get("country", "").lower()
            if "coreens" in country or "korean" in country:
                drama_countries["korean"].append(item_id)
            elif "chinois" in country or "chinese" in country:
                drama_countries["chinese"].append(item_id)
            elif "japonais" in country or "japanese" in country:
                drama_countries["japanese"].append(item_id)
            elif "thailandais" in country or "thai" in country:
                drama_countries["thai"].append(item_id)
                
        elif item_type == "anime":
            categories["anime"].append(item_id)
        elif item_type == "bollywood":
            categories["bollywood"].append(item_id)
    
    # Remplir les catégories transversales
    categories["latest"] = [item.get("id") for item in sorted_by_date[:100]]
    categories["top_rated"] = [item.get("id") for item in sorted_by_rating[:100]]
    
    # Créer une liste de tendances (mélange de contenus récents et bien notés)
    trending_set = set()
    for i, item in enumerate(sorted_by_date[:50]):
        trending_set.add(item.get("id"))
    
    for i, item in enumerate(sorted_by_rating[:50]):
        if len(trending_set) >= 100:
            break
        trending_set.add(item.get("id"))
    
    categories["trending"] = list(trending_set)
    
    # Combiner toutes les catégories
    all_categories = {
        **categories,
        **{f"drama_{k}": v for k, v in drama_countries.items()}
    }
    
    logger.info(f"Index par catégorie créés: {len(all_categories)} catégories")
    return all_categories

def export_data_for_frontend(content_data, output_dir):
    """Exporte les données pour le frontend"""
    logger.info(f"Exportation des données vers {output_dir}")
    
    # Créer le répertoire de sortie s'il n'existe pas
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)
    
    # Optimiser les données
    optimized_content, search_index = optimize_content_for_frontend(content_data)
    
    # Créer les index par catégorie
    category_indexes = create_category_indexes(optimized_content)
    
    # Exporter le contenu principal
    content_file = output_path / "content.json"
    with open(content_file, 'w', encoding='utf-8') as f:
        json.dump(optimized_content, f, ensure_ascii=False, indent=2)
    logger.info(f"Contenu exporté vers {content_file}")
    
    # Exporter l'index de recherche
    search_file = output_path / "search_index.json"
    with open(search_file, 'w', encoding='utf-8') as f:
        json.dump(search_index, f, ensure_ascii=False, indent=2)
    logger.info(f"Index de recherche exporté vers {search_file}")
    
    # Exporter les index par catégorie
    categories_file = output_path / "categories.json"
    with open(categories_file, 'w', encoding='utf-8') as f:
        json.dump(category_indexes, f, ensure_ascii=False, indent=2)
    logger.info(f"Index par catégorie exportés vers {categories_file}")
    
    # Créer un fichier de métadonnées
    metadata = {
        "timestamp": datetime.now().isoformat(),
        "content_count": len(optimized_content),
        "categories_count": len(category_indexes),
        "search_index_count": len(search_index)
    }
    
    metadata_file = output_path / "metadata.json"
    with open(metadata_file, 'w', encoding='utf-8') as f:
        json.dump(metadata, f, ensure_ascii=False, indent=2)
    logger.info(f"Métadonnées exportées vers {metadata_file}")
    
    return {
        "content_file": str(content_file),
        "search_file": str(search_file),
        "categories_file": str(categories_file),
        "metadata_file": str(metadata_file)
    }

def copy_to_frontend(exported_files, frontend_dir):
    """Copie les fichiers exportés vers le répertoire public du frontend"""
    logger.info(f"Copie des fichiers vers le frontend: {frontend_dir}")
    
    frontend_path = Path(frontend_dir)
    public_path = frontend_path / "public" / "data"
    public_path.mkdir(parents=True, exist_ok=True)
    
    for file_key, file_path in exported_files.items():
        source_path = Path(file_path)
        target_path = public_path / source_path.name
        
        shutil.copy2(source_path, target_path)
        logger.info(f"Copié {source_path.name} vers {target_path}")
    
    # Créer un fichier index.txt vide pour la recherche
    search_index_path = frontend_path / "public" / "recherche"
    search_index_path.mkdir(parents=True, exist_ok=True)
    
    index_file = search_index_path / "index.txt"
    with open(index_file, 'w', encoding='utf-8') as f:
        f.write("FloDrama Search Index - Generated on " + datetime.now().isoformat())
    
    logger.info(f"Créé fichier d'index de recherche: {index_file}")
    
    return {
        "public_data_dir": str(public_path),
        "search_index_file": str(index_file)
    }

def main():
    """Fonction principale"""
    print("\n╔════════════════════════════════════════════════╗")
    print("║                                                ║")
    print("║   Export des données pour le frontend          ║")
    print("║   FloDrama                                     ║")
    print("║                                                ║")
    print("╚════════════════════════════════════════════════╝\n")
    
    # Définir les chemins
    script_dir = Path(__file__).parent.absolute()
    project_dir = script_dir.parent
    
    backend_dir = project_dir / "Backend"
    frontend_dir = project_dir / "Frontend"
    
    data_dir = backend_dir / "data"
    output_dir = project_dir / "exported_data"
    
    # Vérifier que les répertoires existent
    if not data_dir.exists():
        logger.error(f"Le répertoire de données n'existe pas: {data_dir}")
        return
    
    if not frontend_dir.exists():
        logger.error(f"Le répertoire frontend n'existe pas: {frontend_dir}")
        return
    
    # Charger les données
    content_data = load_content_data(data_dir)
    
    if not content_data:
        logger.error("Aucune donnée de contenu à exporter")
        return
    
    # Exporter les données
    exported_files = export_data_for_frontend(content_data, output_dir)
    
    # Copier vers le frontend
    frontend_paths = copy_to_frontend(exported_files, frontend_dir)
    
    print("\n✅ Export des données terminé avec succès")
    print(f"Données exportées vers: {output_dir}")
    print(f"Données copiées vers: {frontend_paths['public_data_dir']}")
    print(f"Index de recherche créé: {frontend_paths['search_index_file']}")
    
    print("\nPour accéder aux données dans le frontend:")
    print("- Contenu: /data/content.json")
    print("- Recherche: /recherche/index.txt")
    print("- Catégories: /data/categories.json")

if __name__ == "__main__":
    main()
