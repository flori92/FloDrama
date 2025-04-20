#!/usr/bin/env python3
"""
Script de génération de données de secours pour FloDrama
Ce script génère des données minimales pour le frontend en cas d'absence de données réelles
"""
import json
import random
from datetime import datetime, timedelta
from pathlib import Path

def generate_fallback_data():
    """Génère des données de secours minimales"""
    print("Génération de données de secours pour FloDrama...")
    
    # Liste des types de contenu
    content_types = ["drama", "anime", "bollywood"]
    
    # Liste des pays par type
    countries = {
        "drama": ["Corée du Sud", "Japon", "Chine", "Thaïlande"],
        "anime": ["Japon"],
        "bollywood": ["Inde"]
    }
    
    # Liste des genres par type
    genres = {
        "drama": ["Romance", "Comédie", "Action", "Historique", "Médical", "Policier", "Fantastique"],
        "anime": ["Shonen", "Shojo", "Seinen", "Action", "Aventure", "Fantasy", "Sci-Fi", "Slice of Life"],
        "bollywood": ["Romance", "Action", "Comédie", "Musical", "Drame"]
    }
    
    # Titres par type
    titles = {
        "drama": [
            "La Voie du Dragon", "Cerisiers en Fleurs", "Le Dernier Samouraï", 
            "Cœurs Entrelacés", "Médecin de Nuit", "Royaume Secret", 
            "Amour Éternel", "Destin Croisé", "Légende du Palais", "Âmes Sœurs"
        ],
        "anime": [
            "Esprit Sauvage", "Cyber Samurai", "Chasseur de Démons", 
            "Académie des Héros", "Titan Légendaire", "Alchimiste d'Acier", 
            "Ninja Mystique", "Voyage Astral", "Chevalier Noir", "Magie Ancestrale"
        ],
        "bollywood": [
            "Danse des Étoiles", "Amour Interdit", "Destin Royal", 
            "Mariage Arrangé", "Héritier du Trône", "Passion Éternelle", 
            "Rêve Bollywood", "Cœur de l'Inde", "Danse et Amour", "Chanson du Destin"
        ]
    }
    
    # Synopsis par type
    synopsis_templates = {
        "drama": [
            "Une histoire d'amour inattendue entre {a} et {b} dans {c}.",
            "{a} doit surmonter de nombreux obstacles pour réaliser son rêve de {b} dans {c}.",
            "Après une tragédie, {a} découvre un secret qui va changer sa vie et celle de {b}.",
            "Dans {c}, {a} et {b} s'affrontent avant de réaliser qu'ils partagent un destin commun.",
            "{a}, un {b} talentueux, fait face à des défis professionnels et personnels dans {c}."
        ],
        "anime": [
            "{a} découvre qu'il possède un pouvoir extraordinaire qui pourrait sauver {b} de {c}.",
            "Dans un monde où {a} est rare, {b} part à l'aventure pour devenir le plus grand {c}.",
            "{a} et ses amis doivent combattre {b} pour protéger {c} d'une destruction imminente.",
            "Après avoir perdu {a}, {b} jure de se venger et entreprend un voyage à travers {c}.",
            "Dans une école de {a}, {b} apprend à maîtriser ses pouvoirs pour vaincre {c}."
        ],
        "bollywood": [
            "Une histoire d'amour épique entre {a} et {b}, séparés par {c} mais réunis par le destin.",
            "{a}, un danseur talentueux, rêve de conquérir {b} malgré l'opposition de {c}.",
            "Quand {a} rencontre {b}, leur amour doit faire face à {c} et aux traditions familiales.",
            "Dans les rues de {a}, {b} et {c} tombent amoureux malgré leurs différences sociales.",
            "{a}, héritier d'une grande fortune, tombe amoureux de {b}, une fille simple de {c}."
        ]
    }
    
    # Variables pour les templates
    template_vars = {
        "drama": {
            "a": ["un médecin", "une avocate", "un professeur", "une détective", "un chef cuisinier", "une héritière"],
            "b": ["une femme mystérieuse", "un homme d'affaires", "une star montante", "un rival professionnel", "une ancienne connaissance"],
            "c": ["un petit village côtier", "la capitale trépidante", "un hôpital prestigieux", "une entreprise familiale", "un palais royal"]
        },
        "anime": {
            "a": ["la magie", "le chakra", "l'alchimie", "le ki", "la force spirituelle"],
            "b": ["un jeune héros", "une princesse guerrière", "un samouraï légendaire", "un ninja rebelle", "un étudiant ordinaire"],
            "c": ["maître des éléments", "sauveur prophétisé", "plus grand guerrier", "ninja légendaire", "chasseur de démons"],
        },
        "bollywood": {
            "a": ["Mumbai", "Delhi", "Rajasthan", "un village traditionnel", "un palais somptueux"],
            "b": ["un riche héritier", "une danseuse talentueuse", "un musicien passionné", "une docteure dévouée", "un rebelle au grand cœur"],
            "c": ["les différences de castes", "les traditions familiales", "un mariage arrangé", "la distance", "des malentendus"]
        }
    }
    
    # Génération des données
    content_data = []
    
    for type_idx, content_type in enumerate(content_types):
        for idx in range(10):  # 10 éléments par type
            # Informations de base
            item_id = f"{content_type}-{idx+1}"
            title = random.choice(titles[content_type])
            titles[content_type].remove(title)  # Éviter les doublons
            
            # Pays
            country = random.choice(countries[content_type])
            
            # Année (entre 2020 et 2025)
            year = str(random.randint(2020, 2025))
            
            # Genres (2 à 3 aléatoires)
            item_genres = random.sample(genres[content_type], random.randint(2, 3))
            
            # Synopsis
            template = random.choice(synopsis_templates[content_type])
            vars_a = random.choice(template_vars[content_type]["a"])
            vars_b = random.choice(template_vars[content_type]["b"])
            vars_c = random.choice(template_vars[content_type]["c"])
            synopsis = template.format(a=vars_a, b=vars_b, c=vars_c)
            
            # Note (entre 3.5 et 5.0)
            rating = round(random.uniform(3.5, 5.0), 1)
            
            # Date (entre aujourd'hui et il y a 2 ans)
            days_ago = random.randint(0, 730)
            timestamp = (datetime.now() - timedelta(days=days_ago)).isoformat()
            
            # Création de l'élément
            content_item = {
                "id": item_id,
                "title": title,
                "type": content_type,
                "source": "fallback",
                "url": "#",
                "timestamp": timestamp,
                "synopsis": synopsis,
                "metadata": {
                    "country": country,
                    "year": year,
                    "genre": item_genres,
                    "status": "Terminé" if random.random() > 0.3 else "En cours"
                },
                "images": {
                    "poster": f"/static/placeholders/{content_type}1.svg",
                    "backdrop": f"/static/placeholders/{content_type}1-backdrop.svg",
                    "thumbnail": f"/static/placeholders/{content_type}1-thumb.svg"
                },
                "ratings": {
                    "average": rating,
                    "count": random.randint(50, 300)
                }
            }
            
            # Ajouter des informations sur les épisodes pour les séries
            if content_type in ["drama", "anime"]:
                seasons_count = random.randint(1, 3)
                episodes = []
                
                for season in range(1, seasons_count + 1):
                    episodes_count = random.randint(12, 24)
                    episodes.append({
                        "number": season,
                        "title": f"Saison {season}",
                        "episodes_count": episodes_count
                    })
                
                content_item["episodes"] = episodes
            
            content_data.append(content_item)
    
    print(f"✅ {len(content_data)} éléments de contenu générés")
    return content_data

def save_fallback_data(output_dir=None):
    """Sauvegarde les données de secours dans un fichier JSON"""
    if output_dir is None:
        script_dir = Path(__file__).parent.absolute()
        output_dir = script_dir / "fallback_data"
    
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Générer les données
    content_data = generate_fallback_data()
    
    # Sauvegarder les données
    output_file = output_dir / "fallback_content.json"
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(content_data, f, ensure_ascii=False, indent=2)
    
    print(f"✅ Données de secours sauvegardées dans {output_file}")
    return str(output_file)

if __name__ == "__main__":
    save_fallback_data()
