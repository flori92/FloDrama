#!/usr/bin/env python3
"""
Script d'exportation des données de contenu pour le frontend FloDrama
Ce script convertit les données JSON générées par le scraping en un format optimisé pour le frontend
"""
import os
import json
import logging
import shutil
import hashlib
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
                    # Assurer que chaque élément a un ID unique
                    if 'id' not in item:
                        item['id'] = f"{source_name}-{hashlib.md5(item['title'].encode()).hexdigest()[:8]}"
                
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
                "backdrop": item.get("images", {}).get("backdrop", ""),
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
        
        # Vérifier et corriger les URLs des images
        for img_type in ["poster", "backdrop", "thumbnail"]:
            img_url = optimized_item["images"].get(img_type, "")
            if not img_url:
                # Générer un fallback basé sur le type de contenu
                optimized_item["images"][img_type] = f"/static/placeholders/{item['type']}1-{img_type if img_type != 'poster' else ''}.svg".replace("--", "-")
        
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
    
    return optimized_content, search_index

def create_category_indexes(content_data):
    """Crée des index par catégorie pour le frontend"""
    logger.info("Création des index par catégorie")
    
    # Catégories principales
    categories = {
        "drama": [],
        "anime": [],
        "bollywood": [],
        "film": [],
        "trending": [],
        "latest": [],
        "top_rated": [],
        "drama_korean": [],
        "drama_japanese": [],
        "drama_chinese": [],
        "drama_thai": []
    }
    
    # Trier par date (plus récent d'abord)
    sorted_by_date = sorted(
        content_data, 
        key=lambda x: x.get("timestamp", ""), 
        reverse=True
    )
    
    # Trier par note (meilleure d'abord)
    sorted_by_rating = sorted(
        content_data, 
        key=lambda x: x.get("ratings", {}).get("average", 0), 
        reverse=True
    )
    
    # Remplir les catégories
    for item in content_data:
        item_id = item["id"]
        item_type = item["type"]
        
        # Catégories par type
        if item_type in categories:
            categories[item_type].append(item_id)
        
        # Catégories par pays pour les dramas
        if item_type == "drama" and "metadata" in item and "country" in item["metadata"]:
            country = item["metadata"]["country"].lower()
            
            if "corée" in country or "korean" in country:
                categories["drama_korean"].append(item_id)
            elif "japon" in country or "japanese" in country:
                categories["drama_japanese"].append(item_id)
            elif "chine" in country or "chinese" in country:
                categories["drama_chinese"].append(item_id)
            elif "thaïlande" in country or "thai" in country:
                categories["drama_thai"].append(item_id)
    
    # Remplir les catégories spéciales
    categories["latest"] = [item["id"] for item in sorted_by_date[:20]]
    categories["top_rated"] = [item["id"] for item in sorted_by_rating[:20]]
    
    # Pour trending, on prend un mix des plus récents et des mieux notés
    trending_ids = set()
    for i, item in enumerate(sorted_by_date[:10]):
        trending_ids.add(item["id"])
    for i, item in enumerate(sorted_by_rating[:10]):
        trending_ids.add(item["id"])
    categories["trending"] = list(trending_ids)
    
    # Supprimer les catégories vides
    categories = {k: v for k, v in categories.items() if v}
    
    return categories

def generate_search_index_file(search_index, output_path):
    """Génère un fichier d'index de recherche optimisé"""
    logger.info("Génération du fichier d'index de recherche")
    
    search_lines = []
    search_lines.append(f"FloDrama Search Index - Generated on {datetime.now().isoformat()}")
    search_lines.append("")
    
    for item in search_index:
        # Format: id|title|type|country|year|genres|synopsis
        country = item.get("metadata", {}).get("country", "")
        year = item.get("metadata", {}).get("year", "")
        genres = ",".join(item.get("metadata", {}).get("genre", []))
        synopsis = item.get("synopsis", "").replace("\n", " ").replace("|", "/")
        
        search_line = f"{item['id']}|{item['title']}|{item['type']}|{country}|{year}|{genres}|{synopsis}"
        search_lines.append(search_line)
    
    search_file = output_path / "index.txt"
    with open(search_file, 'w', encoding='utf-8') as f:
        f.write("\n".join(search_lines))
    
    logger.info(f"Index de recherche exporté vers {search_file}")
    return str(search_file)

def calculate_content_hash(content_data):
    """Calcule un hash des données de contenu pour le cache"""
    content_str = json.dumps(content_data, sort_keys=True)
    return hashlib.md5(content_str.encode()).hexdigest()

def check_cache(content_hash, cache_dir):
    """Vérifie si une version en cache existe pour ce contenu"""
    cache_file = cache_dir / f"{content_hash}.json"
    if cache_file.exists():
        try:
            with open(cache_file, 'r', encoding='utf-8') as f:
                cache_data = json.load(f)
                logger.info(f"Cache trouvé pour {content_hash}")
                return cache_data
        except Exception as e:
            logger.warning(f"Erreur lors de la lecture du cache: {str(e)}")
    
    return None

def save_to_cache(content_hash, exported_data, cache_dir):
    """Sauvegarde les données exportées dans le cache"""
    cache_file = cache_dir / f"{content_hash}.json"
    try:
        with open(cache_file, 'w', encoding='utf-8') as f:
            json.dump(exported_data, f, ensure_ascii=False, indent=2)
        logger.info(f"Données exportées sauvegardées dans le cache: {cache_file}")
    except Exception as e:
        logger.warning(f"Erreur lors de la sauvegarde du cache: {str(e)}")

def export_data_for_frontend(content_data, output_dir, use_cache=True):
    """Exporte les données pour le frontend"""
    logger.info(f"Exportation des données vers {output_dir}")
    
    # Créer le répertoire de sortie s'il n'existe pas
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)
    
    # Créer le répertoire de cache s'il n'existe pas
    cache_dir = output_path / "cache"
    cache_dir.mkdir(exist_ok=True)
    
    # Calculer le hash des données pour le cache
    content_hash = calculate_content_hash(content_data)
    
    # Vérifier le cache si activé
    if use_cache:
        cached_data = check_cache(content_hash, cache_dir)
        if cached_data:
            logger.info("Utilisation des données en cache")
            
            # Copier les fichiers du cache vers le répertoire de sortie
            for file_key, file_path in cached_data.items():
                source_path = Path(file_path)
                if source_path.exists():
                    # Éviter de copier un fichier sur lui-même
                    target_path = output_path / source_path.name
                    if source_path != target_path:
                        shutil.copy2(source_path, target_path)
                        logger.info(f"Copié {source_path.name} depuis le cache")
            
            return cached_data
    
    # Optimiser les données
    optimized_content, search_index = optimize_content_for_frontend(content_data)
    
    # Créer les index par catégorie
    category_indexes = create_category_indexes(optimized_content)
    
    # Exporter les données optimisées
    content_file = output_path / "content.json"
    with open(content_file, 'w', encoding='utf-8') as f:
        json.dump(optimized_content, f, ensure_ascii=False, indent=2)
    logger.info(f"Contenu exporté vers {content_file}")
    
    # Exporter les index par catégorie
    categories_file = output_path / "categories.json"
    with open(categories_file, 'w', encoding='utf-8') as f:
        json.dump(category_indexes, f, ensure_ascii=False, indent=2)
    logger.info(f"Catégories exportées vers {categories_file}")
    
    # Générer le fichier d'index de recherche
    search_file = generate_search_index_file(search_index, output_path)
    
    # Créer un fichier de métadonnées
    metadata = {
        "timestamp": datetime.now().isoformat(),
        "content_count": len(optimized_content),
        "categories_count": len(category_indexes),
        "search_index_count": len(search_index),
        "content_hash": content_hash
    }
    
    metadata_file = output_path / "metadata.json"
    with open(metadata_file, 'w', encoding='utf-8') as f:
        json.dump(metadata, f, ensure_ascii=False, indent=2)
    logger.info(f"Métadonnées exportées vers {metadata_file}")
    
    exported_files = {
        "content_file": str(content_file),
        "search_file": str(search_file),
        "categories_file": str(categories_file),
        "metadata_file": str(metadata_file)
    }
    
    # Sauvegarder dans le cache
    save_to_cache(content_hash, exported_files, cache_dir)
    
    return exported_files

def copy_to_frontend(exported_files, frontend_dir):
    """Copie les fichiers exportés vers le répertoire public du frontend"""
    logger.info(f"Copie des fichiers vers le frontend: {frontend_dir}")
    
    frontend_path = Path(frontend_dir)
    public_path = frontend_path / "public" / "data"
    public_path.mkdir(parents=True, exist_ok=True)
    
    copied_files = {}
    
    for file_key, file_path in exported_files.items():
        source_path = Path(file_path)
        if not source_path.exists():
            logger.warning(f"Fichier source introuvable: {source_path}")
            continue
            
        target_path = public_path / source_path.name
        
        # Éviter de copier un fichier sur lui-même
        if source_path != target_path:
            try:
                shutil.copy2(source_path, target_path)
                logger.info(f"Copié {source_path.name} vers {target_path}")
                copied_files[file_key] = str(target_path)
            except shutil.SameFileError:
                logger.warning(f"Tentative de copie d'un fichier sur lui-même: {source_path}")
                copied_files[file_key] = str(source_path)
            except Exception as e:
                logger.error(f"Erreur lors de la copie de {source_path}: {str(e)}")
        else:
            logger.info(f"Fichier déjà à la bonne destination: {source_path}")
            copied_files[file_key] = str(source_path)
    
    # Créer le répertoire de recherche s'il n'existe pas
    search_index_path = frontend_path / "public" / "recherche"
    search_index_path.mkdir(parents=True, exist_ok=True)
    
    # Copier le fichier d'index de recherche
    if "search_file" in exported_files:
        search_source = Path(exported_files["search_file"])
        if search_source.exists():
            search_target = search_index_path / "index.txt"
            # Éviter de copier un fichier sur lui-même
            if search_source != search_target:
                try:
                    shutil.copy2(search_source, search_target)
                    logger.info(f"Copié index de recherche vers {search_target}")
                    copied_files["search_index_file"] = str(search_target)
                except shutil.SameFileError:
                    logger.warning(f"Tentative de copie d'un fichier sur lui-même: {search_source}")
                    copied_files["search_index_file"] = str(search_source)
                except Exception as e:
                    logger.error(f"Erreur lors de la copie de l'index de recherche: {str(e)}")
            else:
                logger.info(f"Index de recherche déjà à la bonne destination: {search_source}")
                copied_files["search_index_file"] = str(search_source)
    
    return {
        "public_data_dir": str(public_path),
        "search_index_dir": str(search_index_path),
        "copied_files": copied_files
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
        # Utiliser un répertoire de données de secours
        data_dir = script_dir / "fallback_data"
        data_dir.mkdir(exist_ok=True)
        logger.info(f"Utilisation du répertoire de secours: {data_dir}")
    
    if not frontend_dir.exists():
        logger.error(f"Le répertoire frontend n'existe pas: {frontend_dir}")
        return
    
    # Charger les données
    content_data = load_content_data(data_dir)
    
    if not content_data:
        logger.warning("Aucune donnée de contenu trouvée, génération de données de secours...")
        # Générer des données de secours minimales
        from prepare_fallback_data import generate_fallback_data
        content_data = generate_fallback_data()
    
    # Exporter les données avec utilisation du cache
    exported_files = export_data_for_frontend(content_data, output_dir, use_cache=True)
    
    # Copier vers le frontend
    frontend_paths = copy_to_frontend(exported_files, frontend_dir)
    
    print("\n✅ Export des données terminé avec succès")
    print(f"Données exportées vers: {output_dir}")
    print(f"Données copiées vers: {frontend_paths['public_data_dir']}")
    print(f"Index de recherche créé: {frontend_paths['search_index_dir']}")
    
    print("\nPour accéder aux données dans le frontend:")
    print("- Contenu: /data/content.json")
    print("- Recherche: /recherche/index.txt")
    print("- Catégories: /data/categories.json")

if __name__ == "__main__":
    main()
