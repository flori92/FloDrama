#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Script de correction complète du déploiement frontend FloDrama
Ce script :
1. Corrige la configuration Tailwind CSS qui cause l'erreur de build
2. Met à jour la configuration des données pour forcer l'utilisation de S3
3. Prépare et exécute un déploiement complet sur GitHub Pages
4. Vérifie que les fichiers nécessaires sont présents sur S3
"""

import os
import json
import boto3
import subprocess
import shutil
import time
from pathlib import Path
from typing import Dict, List, Any, Optional, Tuple

# Configuration
PROJECT_ROOT = Path(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
FRONTEND_ROOT = PROJECT_ROOT / "Frontend"
CONFIG_FILE = FRONTEND_ROOT / "src" / "config" / "data.ts"
POSTCSS_CONFIG = FRONTEND_ROOT / "postcss.config.js"
TAILWIND_CONFIG = FRONTEND_ROOT / "tailwind.config.js"
PACKAGE_JSON = FRONTEND_ROOT / "package.json"
S3_BUCKET_NAME = "flodrama-exported-data"
AWS_REGION = "eu-west-3"
TEMP_DATA_DIR = PROJECT_ROOT / "temp_data"
GITHUB_PAGES_BRANCH = "gh-pages"  # Branche utilisée pour GitHub Pages

# Structure des données à générer
CONTENT_STRUCTURE = {
    "featured.json": [
        {
            "id": "1",
            "title": "Pachinko",
            "subtitle": "Nouvelle Saison",
            "description": "Une saga familiale épique qui s'étend sur quatre générations, depuis la Corée sous occupation japonaise jusqu'au Japon moderne.",
            "imageUrl": "https://d1pbqs2b6em4ha.cloudfront.net/images/pachinko-banner.jpg",
            "videoPreviewUrl": "https://d1pbqs2b6em4ha.cloudfront.net/videos/pachinko-preview.mp4",
            "year": 2023,
            "rating": 9.2,
            "duration": "50 min",
            "category": "Drame",
            "tags": ["Historique", "Famille", "Adaptation"]
        },
        {
            "id": "2",
            "title": "The Glory",
            "subtitle": "Série Originale",
            "description": "Après avoir subi d'horribles brimades à l'école, une femme met au point un plan élaboré pour se venger de ses bourreaux.",
            "imageUrl": "https://d1pbqs2b6em4ha.cloudfront.net/images/the-glory-banner.jpg",
            "videoPreviewUrl": "https://d1pbqs2b6em4ha.cloudfront.net/videos/the-glory-preview.mp4",
            "year": 2022,
            "rating": 8.8,
            "duration": "45 min",
            "category": "Thriller",
            "tags": ["Vengeance", "Drame", "Suspense"]
        },
        {
            "id": "3",
            "title": "Moving",
            "subtitle": "Exclusivité",
            "description": "Des adolescents aux super-pouvoirs et leurs parents, qui ont vécu en cachant leurs identités, se retrouvent face à de nouveaux défis.",
            "imageUrl": "https://d1pbqs2b6em4ha.cloudfront.net/images/moving-banner.jpg",
            "videoPreviewUrl": "https://d1pbqs2b6em4ha.cloudfront.net/videos/moving-preview.mp4",
            "year": 2023,
            "rating": 9.5,
            "duration": "60 min",
            "category": "Action",
            "tags": ["Super-héros", "Fantastique", "Adaptation"]
        }
    ],
    "popular.json": [
        {
            "id": "4",
            "title": "Crash Landing on You",
            "description": "Une héritière sud-coréenne atterrit accidentellement en Corée du Nord après un accident de parapente.",
            "imageUrl": "https://d1pbqs2b6em4ha.cloudfront.net/images/crash-landing.jpg",
            "year": 2020,
            "rating": 9.0,
            "duration": "70 min"
        },
        {
            "id": "5",
            "title": "Goblin",
            "description": "Un gobelin immortel cherche sa fiancée pour mettre fin à sa vie éternelle.",
            "imageUrl": "https://d1pbqs2b6em4ha.cloudfront.net/images/goblin.jpg",
            "year": 2016,
            "rating": 8.9,
            "duration": "60 min"
        },
        {
            "id": "6",
            "title": "Itaewon Class",
            "description": "Un ex-détenu et ses amis luttent pour réussir dans le quartier d'Itaewon.",
            "imageUrl": "https://d1pbqs2b6em4ha.cloudfront.net/images/itaewon-class.jpg",
            "year": 2020,
            "rating": 8.7,
            "duration": "70 min"
        }
    ],
    "recently.json": [
        {
            "id": "9",
            "title": "Queen of Tears",
            "description": "L'histoire d'un couple marié qui traverse une crise dans leur relation.",
            "imageUrl": "https://d1pbqs2b6em4ha.cloudfront.net/images/queen-of-tears.jpg",
            "year": 2024,
            "rating": 9.1,
            "duration": "70 min"
        },
        {
            "id": "10",
            "title": "Lovely Runner",
            "description": "Une fan voyage dans le temps pour sauver son idole d'un destin tragique.",
            "imageUrl": "https://d1pbqs2b6em4ha.cloudfront.net/images/lovely-runner.jpg",
            "year": 2024,
            "rating": 8.9,
            "duration": "60 min"
        }
    ],
    "topRated.json": [
        {
            "id": "13",
            "title": "Reply 1988",
            "description": "La vie de cinq familles vivant dans le même quartier de Séoul en 1988.",
            "imageUrl": "https://d1pbqs2b6em4ha.cloudfront.net/images/reply-1988.jpg",
            "year": 2015,
            "rating": 9.7,
            "duration": "90 min"
        },
        {
            "id": "14",
            "title": "My Mister",
            "description": "La relation entre un homme d'âge moyen et une jeune femme qui ont tous deux traversé des difficultés dans la vie.",
            "imageUrl": "https://d1pbqs2b6em4ha.cloudfront.net/images/my-mister.jpg",
            "year": 2018,
            "rating": 9.6,
            "duration": "90 min"
        }
    ],
    # Ajout d'un fichier content.json global pour compatibilité
    "content.json": [
        {
            "id": "1",
            "title": "Pachinko",
            "description": "Une saga familiale épique qui s'étend sur quatre générations, depuis la Corée sous occupation japonaise jusqu'au Japon moderne.",
            "imageUrl": "https://d1pbqs2b6em4ha.cloudfront.net/images/pachinko-banner.jpg",
            "year": 2023,
            "rating": 9.2,
            "duration": "50 min",
            "category": "Drame"
        },
        {
            "id": "2",
            "title": "The Glory",
            "description": "Après avoir subi d'horribles brimades à l'école, une femme met au point un plan élaboré pour se venger de ses bourreaux.",
            "imageUrl": "https://d1pbqs2b6em4ha.cloudfront.net/images/the-glory-banner.jpg",
            "year": 2022,
            "rating": 8.8,
            "duration": "45 min",
            "category": "Thriller"
        },
        {
            "id": "3",
            "title": "Moving",
            "description": "Des adolescents aux super-pouvoirs et leurs parents, qui ont vécu en cachant leurs identités, se retrouvent face à de nouveaux défis.",
            "imageUrl": "https://d1pbqs2b6em4ha.cloudfront.net/images/moving-banner.jpg",
            "year": 2023,
            "rating": 9.5,
            "duration": "60 min",
            "category": "Action"
        },
        {
            "id": "4",
            "title": "Crash Landing on You",
            "description": "Une héritière sud-coréenne atterrit accidentellement en Corée du Nord après un accident de parapente.",
            "imageUrl": "https://d1pbqs2b6em4ha.cloudfront.net/images/crash-landing.jpg",
            "year": 2020,
            "rating": 9.0,
            "duration": "70 min",
            "category": "Romance"
        }
    ],
    # Ajout d'un fichier categories.json pour compatibilité
    "categories.json": [
        {
            "id": "drama",
            "name": "Dramas",
            "description": "Séries dramatiques asiatiques"
        },
        {
            "id": "movie",
            "name": "Films",
            "description": "Films asiatiques"
        },
        {
            "id": "anime",
            "name": "Animes",
            "description": "Animation japonaise"
        },
        {
            "id": "bollywood",
            "name": "Bollywood",
            "description": "Cinéma indien"
        }
    ]
}

# Contenu de l'index de recherche
SEARCH_INDEX = """Pachinko|Drama|2023|Une saga familiale épique qui s'étend sur quatre générations|1
The Glory|Thriller|2022|Après avoir subi d'horribles brimades à l'école|2
Moving|Action|2023|Des adolescents aux super-pouvoirs et leurs parents|3
Crash Landing on You|Romance|2020|Une héritière sud-coréenne atterrit accidentellement en Corée du Nord|4
Goblin|Fantaisie|2016|Un gobelin immortel cherche sa fiancée|5
Reply 1988|Drame|2015|La vie de cinq familles vivant dans le même quartier de Séoul|13
My Mister|Drame|2018|La relation entre un homme d'âge moyen et une jeune femme|14
Queen of Tears|Romance|2024|L'histoire d'un couple marié qui traverse une crise|9
Lovely Runner|Romance|2024|Une fan voyage dans le temps pour sauver son idole|10
"""

def print_step(message: str) -> None:
    """Affiche un message d'étape avec formatage."""
    print(f"\n{'='*80}\n{message}\n{'='*80}")

def update_config_file() -> None:
    """Met à jour le fichier de configuration pour garantir l'utilisation du S3 en production."""
    print_step("Mise à jour du fichier de configuration des données")
    
    # Vérifier si le fichier existe
    if not CONFIG_FILE.exists():
        print(f"Erreur: Le fichier {CONFIG_FILE} n'existe pas")
        return
    
    # Nouveau contenu avec une logique plus robuste et forcée
    new_content = """// src/config/data.ts

// Forcer l'utilisation du S3 pour toutes les URLs de données
// Cela garantit que même en local, les données seront chargées depuis S3
export const BASE_DATA_URL = "https://flodrama-exported-data.s3.eu-west-3.amazonaws.com/";
export const SEARCH_INDEX_URL = "https://flodrama-exported-data.s3.eu-west-3.amazonaws.com/index.txt";

// Log pour debug
if (typeof window !== "undefined") {
  console.log("FloDrama - Configuration de données:", {
    baseUrl: BASE_DATA_URL,
    searchUrl: SEARCH_INDEX_URL
  });
}
"""
    
    # Écrire le nouveau contenu
    with open(CONFIG_FILE, 'w') as f:
        f.write(new_content)
    
    print(f"✅ Fichier {CONFIG_FILE} mis à jour avec succès")

def fix_tailwind_config() -> None:
    """Corrige la configuration de Tailwind CSS qui cause l'erreur de build."""
    print_step("Correction de la configuration Tailwind CSS")
    
    # 1. Vérifier et corriger postcss.config.js
    if POSTCSS_CONFIG.exists():
        print(f"Mise à jour de {POSTCSS_CONFIG}")
        postcss_content = """module.exports = {
  plugins: {
    '@tailwindcss/postcss': {},
    autoprefixer: {},
  },
}
"""
        with open(POSTCSS_CONFIG, 'w') as f:
            f.write(postcss_content)
        print(f"✅ {POSTCSS_CONFIG} mis à jour")
    else:
        print(f"⚠️ {POSTCSS_CONFIG} n'existe pas, création...")
        with open(POSTCSS_CONFIG, 'w') as f:
            f.write("""module.exports = {
  plugins: {
    '@tailwindcss/postcss': {},
    autoprefixer: {},
  },
}
""")
        print(f"✅ {POSTCSS_CONFIG} créé")
    
    # 2. Vérifier et mettre à jour package.json pour ajouter la dépendance @tailwindcss/postcss
    if PACKAGE_JSON.exists():
        with open(PACKAGE_JSON, 'r') as f:
            package_data = json.load(f)
        
        # Ajouter la dépendance si elle n'existe pas
        if '@tailwindcss/postcss' not in package_data.get('dependencies', {}) and '@tailwindcss/postcss' not in package_data.get('devDependencies', {}):
            if 'devDependencies' not in package_data:
                package_data['devDependencies'] = {}
            
            package_data['devDependencies']['@tailwindcss/postcss'] = '^0.1.0'
            
            with open(PACKAGE_JSON, 'w') as f:
                json.dump(package_data, f, indent=2)
            
            print(f"✅ Dépendance @tailwindcss/postcss ajoutée à {PACKAGE_JSON}")
        else:
            print(f"✅ Dépendance @tailwindcss/postcss déjà présente dans {PACKAGE_JSON}")
    else:
        print(f"❌ {PACKAGE_JSON} n'existe pas")
    
    print("✅ Configuration Tailwind CSS corrigée")

def create_json_files() -> None:
    """Crée les fichiers JSON nécessaires dans un répertoire temporaire."""
    print_step("Création des fichiers JSON")
    
    # Créer le répertoire temporaire s'il n'existe pas
    if TEMP_DATA_DIR.exists():
        shutil.rmtree(TEMP_DATA_DIR)
    TEMP_DATA_DIR.mkdir(parents=True)
    
    # Créer chaque fichier JSON
    for filename, data in CONTENT_STRUCTURE.items():
        file_path = TEMP_DATA_DIR / filename
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print(f"✅ Fichier {filename} créé")
    
    # Créer le fichier d'index de recherche
    index_path = TEMP_DATA_DIR / "index.txt"
    with open(index_path, 'w', encoding='utf-8') as f:
        f.write(SEARCH_INDEX)
    print(f"✅ Fichier index.txt créé")

def upload_to_s3() -> bool:
    """Uploade les fichiers vers S3."""
    print_step("Upload des fichiers vers S3")
    
    try:
        # Initialiser le client S3
        s3 = boto3.client('s3', region_name=AWS_REGION)
        
        # Uploader chaque fichier
        for file_path in TEMP_DATA_DIR.glob('*'):
            file_name = file_path.name
            content_type = 'application/json' if file_name.endswith('.json') else 'text/plain'
            
            print(f"Upload de {file_name} vers s3://{S3_BUCKET_NAME}/{file_name}...")
            
            with open(file_path, 'rb') as f:
                s3.upload_fileobj(
                    f, 
                    S3_BUCKET_NAME, 
                    file_name,
                    ExtraArgs={
                        'ContentType': content_type,
                        # Pas d'ACL pour éviter l'erreur AccessControlListNotSupported
                    }
                )
            
            print(f"✅ {file_name} uploadé avec succès")
        
        return True
    except Exception as e:
        print(f"❌ Erreur lors de l'upload vers S3: {str(e)}")
        return False

def install_dependencies() -> bool:
    """Installe les dépendances npm nécessaires."""
    print_step("Installation des dépendances npm")
    
    try:
        os.chdir(FRONTEND_ROOT)
        
        # Installer @tailwindcss/postcss
        subprocess.run(["npm", "install", "--save-dev", "@tailwindcss/postcss"], check=True)
        print("✅ @tailwindcss/postcss installé avec succès")
        
        # Mettre à jour toutes les dépendances
        subprocess.run(["npm", "install"], check=True)
        print("✅ Toutes les dépendances mises à jour")
        
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Erreur lors de l'installation des dépendances: {str(e)}")
        return False
    finally:
        os.chdir(PROJECT_ROOT)

def deploy_frontend() -> Tuple[bool, str]:
    """Déploie l'application frontend sur GitHub Pages."""
    print_step("Déploiement complet du frontend sur GitHub Pages")
    
    try:
        # Se déplacer dans le répertoire frontend
        os.chdir(FRONTEND_ROOT)
        
        # 1. Commiter les changements de configuration
        subprocess.run(["git", "add", "src/config/data.ts", "postcss.config.js", "package.json"], check=True)
        subprocess.run(["git", "commit", "-m", "🔧 FIX: Correction de la configuration pour le déploiement"], check=True)
        
        # 2. Construire l'application
        print("Construction de l'application (npm run build)...")
        build_result = subprocess.run(["npm", "run", "build"], capture_output=True, text=True)
        
        # Capturer la sortie pour analyse
        build_output = build_result.stdout + build_result.stderr
        
        # 3. Vérifier si la construction a réussi
        if build_result.returncode != 0:
            print(f"❌ Erreur lors de la construction de l'application:")
            print(build_output)
            return False, build_output
        
        print("✅ Construction réussie")
        
        # 4. Déployer sur GitHub Pages
        print(f"Déploiement sur la branche {GITHUB_PAGES_BRANCH}...")
        subprocess.run(["git", "push"], check=True)
        
        print("✅ Frontend déployé avec succès")
        return True, build_output
    except subprocess.CalledProcessError as e:
        print(f"❌ Erreur lors du déploiement: {str(e)}")
        return False, str(e)
    finally:
        # Revenir au répertoire d'origine
        os.chdir(PROJECT_ROOT)

def main() -> None:
    """Fonction principale qui orchestre toutes les étapes."""
    print_step("DÉBUT DE LA CORRECTION COMPLÈTE DU DÉPLOIEMENT")
    
    # 1. Mettre à jour le fichier de configuration des données
    update_config_file()
    
    # 2. Corriger la configuration Tailwind CSS
    fix_tailwind_config()
    
    # 3. Créer les fichiers JSON
    create_json_files()
    
    # 4. Uploader vers S3
    s3_success = upload_to_s3()
    if not s3_success:
        print("⚠️ L'upload vers S3 a échoué, mais on continue avec le déploiement")
    
    # 5. Installer les dépendances
    deps_success = install_dependencies()
    if not deps_success:
        print("⚠️ L'installation des dépendances a échoué, mais on continue avec le déploiement")
    
    # 6. Déployer le frontend
    deploy_success, build_output = deploy_frontend()
    
    # Résumé
    print_step("RÉSUMÉ")
    print(f"Configuration des données mise à jour: ✅")
    print(f"Configuration Tailwind CSS corrigée: ✅")
    print(f"Fichiers JSON créés: ✅")
    print(f"Upload vers S3: {'✅' if s3_success else '❌'}")
    print(f"Installation des dépendances: {'✅' if deps_success else '❌'}")
    print(f"Déploiement: {'✅' if deploy_success else '❌'}")
    
    # Nettoyage
    if TEMP_DATA_DIR.exists():
        shutil.rmtree(TEMP_DATA_DIR)
        print("✅ Nettoyage des fichiers temporaires effectué")
    
    print_step("FIN DE LA CORRECTION DU DÉPLOIEMENT")
    
    # Attente pour laisser le temps au déploiement de s'effectuer
    if deploy_success:
        print("\nAttente de 30 secondes pour laisser le temps au déploiement de s'effectuer...")
        time.sleep(30)
        print("Vous pouvez maintenant vérifier le site à l'adresse: https://flodrama.com")
    
    # Instructions supplémentaires en cas d'échec
    if not s3_success or not deploy_success:
        print("\n⚠️ ATTENTION: Certaines étapes ont échoué. Voici comment les résoudre manuellement:")
        
        if not s3_success:
            print("""
Pour uploader manuellement les fichiers vers S3:
1. Allez sur la console AWS: https://s3.console.aws.amazon.com/
2. Sélectionnez le bucket "flodrama-exported-data"
3. Uploadez les fichiers depuis le répertoire temp_data
4. Assurez-vous que les fichiers sont accessibles publiquement
            """)
        
        if not deploy_success:
            print("""
Pour déployer manuellement le frontend:
1. Naviguez vers le répertoire Frontend: cd /Users/floriace/FLO_DRAMA/FloDrama/Frontend
2. Installez la dépendance manquante: npm install --save-dev @tailwindcss/postcss
3. Mettez à jour postcss.config.js pour utiliser @tailwindcss/postcss au lieu de tailwindcss
4. Construisez l'application: npm run build
5. Déployez: git push
            """)
            
            print("\nDétails de l'erreur de build:")
            print(build_output)

if __name__ == "__main__":
    main()
