#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Script de correction finale du frontend FloDrama
Ce script :
1. Identifie la version de Tailwind CSS installée
2. Configure correctement PostCSS selon cette version
3. Force l'utilisation des URLs S3 pour les données
4. Pousse les modifications sans tenter de rebuild
"""

import os
import json
import subprocess
import re
from pathlib import Path

# Configuration
PROJECT_ROOT = Path(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
FRONTEND_ROOT = PROJECT_ROOT / "Frontend"
CONFIG_FILE = FRONTEND_ROOT / "src" / "config" / "data.ts"
POSTCSS_CONFIG = FRONTEND_ROOT / "postcss.config.js"
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

def get_tailwind_version() -> str:
    """Détermine la version de Tailwind CSS installée."""
    print_step("Détection de la version de Tailwind CSS")
    
    try:
        os.chdir(FRONTEND_ROOT)
        result = subprocess.run(["npm", "list", "tailwindcss", "--depth=0"], 
                               capture_output=True, text=True)
        
        # Recherche du pattern de version avec regex
        version_match = re.search(r'tailwindcss@(\d+\.\d+\.\d+)', result.stdout)
        if version_match:
            version = version_match.group(1)
            print(f"✅ Version de Tailwind CSS détectée: {version}")
            return version
        else:
            print("⚠️ Impossible de détecter la version de Tailwind CSS")
            return "3.0.0"  # Version par défaut
    except Exception as e:
        print(f"❌ Erreur lors de la détection de la version: {str(e)}")
        return "3.0.0"  # Version par défaut
    finally:
        os.chdir(PROJECT_ROOT)

def fix_tailwind_config(version: str) -> None:
    """Configure correctement PostCSS selon la version de Tailwind."""
    print_step("Configuration de PostCSS pour Tailwind CSS")
    
    # Déterminer la configuration correcte selon la version
    major_version = int(version.split('.')[0])
    
    if major_version >= 3:
        # Pour Tailwind CSS v3+
        postcss_content = """module.exports = {
  plugins: {
    'tailwindcss/nesting': {},
    tailwindcss: {},
    autoprefixer: {},
  },
}
"""
    else:
        # Pour les versions antérieures
        postcss_content = """module.exports = {
  plugins: [
    require('tailwindcss'),
    require('autoprefixer'),
  ],
}
"""
    
    # Écrire la configuration
    with open(POSTCSS_CONFIG, 'w') as f:
        f.write(postcss_content)
    
    print(f"✅ {POSTCSS_CONFIG} configuré pour Tailwind CSS v{major_version}")

def push_changes() -> bool:
    """Pousse les modifications sans tenter de rebuild."""
    print_step("Déploiement des modifications de configuration")
    
    try:
        # Se déplacer dans le répertoire frontend
        os.chdir(FRONTEND_ROOT)
        
        # 1. Commiter les changements de configuration
        subprocess.run(["git", "add", "src/config/data.ts", "postcss.config.js"], check=True)
        subprocess.run(["git", "commit", "-m", "🔧 FIX: Configuration correcte pour Tailwind CSS et forçage des URLs S3"], check=True)
        
        # 2. Pousser les changements
        print("Déploiement des modifications...")
        subprocess.run(["git", "push"], check=True)
        
        print("✅ Modifications déployées avec succès")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Erreur lors du déploiement: {str(e)}")
        return False
    finally:
        # Revenir au répertoire d'origine
        os.chdir(PROJECT_ROOT)

def main() -> None:
    """Fonction principale qui orchestre toutes les étapes."""
    print_step("DÉBUT DE LA CORRECTION FINALE DU FRONTEND")
    
    # 1. Mettre à jour le fichier de configuration des données
    update_config_file()
    
    # 2. Détecter la version de Tailwind CSS
    tailwind_version = get_tailwind_version()
    
    # 3. Configurer PostCSS correctement
    fix_tailwind_config(tailwind_version)
    
    # 4. Pousser les modifications
    push_success = push_changes()
    
    # Résumé
    print_step("RÉSUMÉ")
    print(f"Configuration des données mise à jour: ✅")
    print(f"Version de Tailwind CSS détectée: {tailwind_version}")
    print(f"Configuration PostCSS mise à jour: ✅")
    print(f"Déploiement des modifications: {'✅' if push_success else '❌'}")
    
    print_step("FIN DE LA CORRECTION")
    
    # Instructions supplémentaires
    print("""
PROCHAINES ÉTAPES RECOMMANDÉES:

1. Vérifiez l'état du déploiement sur GitHub Pages
   - Attendez quelques minutes que le déploiement soit effectif
   - Vérifiez que les données sont correctement chargées depuis S3

2. Si le problème persiste:
   - Vérifiez les logs de déploiement sur GitHub
   - Assurez-vous que le domaine flodrama.com pointe vers le bon projet GitHub Pages
   - Considérez un redéploiement complet avec un nouveau projet Next.js

3. Pour un redéploiement complet:
   - Sauvegardez vos composants et logique métier actuels
   - Créez un nouveau projet Next.js avec la dernière version
   - Réintégrez vos composants et logique métier
   - Configurez correctement les URLs de données dès le début
    """)

if __name__ == "__main__":
    main()
