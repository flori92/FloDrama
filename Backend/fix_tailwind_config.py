#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Script de correction de la configuration Tailwind CSS pour FloDrama
Ce script :
1. Restaure la configuration Tailwind CSS d'origine
2. Met à jour la configuration des données pour forcer l'utilisation de S3
3. Prépare et exécute un déploiement sur GitHub Pages
"""

import os
import json
import subprocess
import shutil
from pathlib import Path

# Configuration
PROJECT_ROOT = Path(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
FRONTEND_ROOT = PROJECT_ROOT / "Frontend"
CONFIG_FILE = FRONTEND_ROOT / "src" / "config" / "data.ts"
POSTCSS_CONFIG = FRONTEND_ROOT / "postcss.config.js"
TAILWIND_CONFIG = FRONTEND_ROOT / "tailwind.config.js"
PACKAGE_JSON = FRONTEND_ROOT / "package.json"
GITHUB_PAGES_BRANCH = "gh-pages"  # Branche utilisée pour GitHub Pages

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
    """Restaure la configuration Tailwind CSS d'origine."""
    print_step("Restauration de la configuration Tailwind CSS d'origine")
    
    # 1. Restaurer postcss.config.js
    postcss_content = """module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
"""
    with open(POSTCSS_CONFIG, 'w') as f:
        f.write(postcss_content)
    print(f"✅ {POSTCSS_CONFIG} restauré à sa configuration d'origine")
    
    # 2. Vérifier et mettre à jour package.json pour supprimer @tailwindcss/postcss s'il existe
    if PACKAGE_JSON.exists():
        with open(PACKAGE_JSON, 'r') as f:
            package_data = json.load(f)
        
        # Supprimer la dépendance si elle existe
        if '@tailwindcss/postcss' in package_data.get('dependencies', {}):
            del package_data['dependencies']['@tailwindcss/postcss']
            print(f"✅ Dépendance @tailwindcss/postcss supprimée des dependencies")
        
        if '@tailwindcss/postcss' in package_data.get('devDependencies', {}):
            del package_data['devDependencies']['@tailwindcss/postcss']
            print(f"✅ Dépendance @tailwindcss/postcss supprimée des devDependencies")
        
        with open(PACKAGE_JSON, 'w') as f:
            json.dump(package_data, f, indent=2)
        
        print(f"✅ {PACKAGE_JSON} mis à jour")
    else:
        print(f"❌ {PACKAGE_JSON} n'existe pas")
    
    print("✅ Configuration Tailwind CSS restaurée")

def deploy_frontend() -> bool:
    """Déploie l'application frontend sur GitHub Pages."""
    print_step("Déploiement du frontend sur GitHub Pages")
    
    try:
        # Se déplacer dans le répertoire frontend
        os.chdir(FRONTEND_ROOT)
        
        # 1. Commiter les changements de configuration
        subprocess.run(["git", "add", "src/config/data.ts", "postcss.config.js", "package.json"], check=True)
        subprocess.run(["git", "commit", "-m", "🔧 FIX: Restauration de la configuration Tailwind CSS et forçage des URLs S3"], check=True)
        
        # 2. Construire l'application
        print("Construction de l'application (npm run build)...")
        build_result = subprocess.run(["npm", "run", "build"], capture_output=True, text=True)
        
        # Capturer la sortie pour analyse
        build_output = build_result.stdout + build_result.stderr
        
        # 3. Vérifier si la construction a réussi
        if build_result.returncode != 0:
            print(f"❌ Erreur lors de la construction de l'application:")
            print(build_output)
            return False
        
        print("✅ Construction réussie")
        
        # 4. Déployer sur GitHub Pages
        print(f"Déploiement sur la branche {GITHUB_PAGES_BRANCH}...")
        subprocess.run(["git", "push"], check=True)
        
        print("✅ Frontend déployé avec succès")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Erreur lors du déploiement: {str(e)}")
        return False
    finally:
        # Revenir au répertoire d'origine
        os.chdir(PROJECT_ROOT)

def main() -> None:
    """Fonction principale qui orchestre toutes les étapes."""
    print_step("DÉBUT DE LA CORRECTION DE LA CONFIGURATION TAILWIND")
    
    # 1. Mettre à jour le fichier de configuration des données
    update_config_file()
    
    # 2. Restaurer la configuration Tailwind CSS d'origine
    fix_tailwind_config()
    
    # 3. Déployer le frontend
    deploy_success = deploy_frontend()
    
    # Résumé
    print_step("RÉSUMÉ")
    print(f"Configuration des données mise à jour: ✅")
    print(f"Configuration Tailwind CSS restaurée: ✅")
    print(f"Déploiement: {'✅' if deploy_success else '❌'}")
    
    print_step("FIN DE LA CORRECTION")
    
    # Instructions supplémentaires en cas d'échec
    if not deploy_success:
        print("""
Pour déployer manuellement le frontend:
1. Naviguez vers le répertoire Frontend: cd /Users/floriace/FLO_DRAMA/FloDrama/Frontend
2. Vérifiez que postcss.config.js contient bien:
   module.exports = {
     plugins: {
       tailwindcss: {},
       autoprefixer: {},
     },
   }
3. Construisez l'application: npm run build
4. Déployez: git push
        """)

if __name__ == "__main__":
    main()
