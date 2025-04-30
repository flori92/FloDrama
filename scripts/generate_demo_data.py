import json
import random
import os
from datetime import datetime

# Fonction pour générer des données de démonstration
def generate_demo_content(count=20):
    content = []
    categories = ["drama", "anime", "movie"]
    countries = ["Korea", "Japan", "China", "Thailand"]
    
    for i in range(1, count + 1):
        category = random.choice(categories)
        country = random.choice(countries)
        year = random.randint(2010, 2025)
        rating = round(random.uniform(3.5, 9.8), 1)
        
        content.append({
            "id": f"demo{i}",
            "title": f"{country} {category.title()} {i}",
            "original_title": f"Original Title {i}",
            "description": f"This is a {category} from {country} released in {year}.",
            "year": year,
            "country": country,
            "genre": category,
            "rating": rating,
            "episodes": random.randint(1, 24) if category == "drama" or category == "anime" else 1,
            "duration": random.randint(22, 60) if category == "drama" or category == "anime" else random.randint(90, 180),
            "poster": f"https://picsum.photos/seed/{i}/300/450",
            "backdrop": f"https://picsum.photos/seed/back{i}/1280/720",
            "trailer": f"https://example.com/trailer/{i}",
            "streaming_url": f"https://example.com/stream/{category}/{i}",
            "last_updated": datetime.now().isoformat()
        })
    
    return content

# Fonction pour exporter les données en JSON
def export_to_json(filename, data):
    with open(filename, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f" Fichier {filename} généré avec succès")

def main():
    # Création du dossier d'export
    export_path = "export_data"
    if not os.path.exists(export_path):
        os.makedirs(export_path)
        print(f" Dossier {export_path} créé")
    
    # Génération des dramas
    print(" Génération des dramas...")
    dramas = generate_demo_content(30)
    for item in dramas:
        if item["genre"] == "drama":
            item["popularity"] = random.randint(70, 100)
    export_to_json(f"{export_path}/dramas.json", dramas)
    
    # Génération des contenus mis en avant
    print(" Génération des contenus mis en avant...")
    featured = generate_demo_content(5)
    for item in featured:
        item["featured"] = True
        item["highlight"] = random.choice([True, False])
    export_to_json(f"{export_path}/featured.json", featured)
    
    # Génération des contenus populaires
    print(" Génération des contenus populaires...")
    popular = generate_demo_content(10)
    for item in popular:
        item["popularity"] = random.randint(80, 100)
    export_to_json(f"{export_path}/popular.json", popular)
    
    # Génération des contenus récemment ajoutés
    print(" Génération des contenus récemment ajoutés...")
    recently_added = generate_demo_content(8)
    for item in recently_added:
        item["added_date"] = datetime.now().isoformat()
    export_to_json(f"{export_path}/recently_added.json", recently_added)
    
    # Génération des contenus les mieux notés
    print(" Génération des contenus les mieux notés...")
    top_rated = generate_demo_content(12)
    for item in top_rated:
        item["rating"] = round(random.uniform(8.0, 9.9), 1)
    export_to_json(f"{export_path}/top_rated.json", top_rated)
    
    # Génération des catégories
    print(" Génération des catégories...")
    categories = [
        {"id": "drama", "name": "Drama", "count": 30, "icon": "film"},
        {"id": "anime", "name": "Anime", "count": 25, "icon": "tv"},
        {"id": "movie", "name": "Movie", "count": 20, "icon": "video"}
    ]
    export_to_json(f"{export_path}/categories.json", categories)
    
    # Génération des métadonnées
    print(" Génération des métadonnées...")
    metadata = {
        "last_updated": datetime.now().isoformat(),
        "version": "1.0.0",
        "total_content": sum(cat["count"] for cat in categories),
        "categories": len(categories)
    }
    export_to_json(f"{export_path}/metadata.json", metadata)

if __name__ == "__main__":
    main()
