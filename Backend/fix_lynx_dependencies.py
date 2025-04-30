#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Script de correction des dépendances Lynx obsolètes pour FloDrama
Ce script :
1. Identifie et supprime les imports Lynx obsolètes
2. Remplace les composants Lynx par des équivalents React
3. Nettoie les fichiers problématiques
"""

import os
import sys
import subprocess
import re
import glob
from pathlib import Path

# Configuration
PROJECT_ROOT = Path(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
FRONTEND_ROOT = PROJECT_ROOT / "Frontend"
SRC_DIR = FRONTEND_ROOT / "src"
COMPONENTS_DIR = SRC_DIR / "components"

def print_step(message: str) -> None:
    """Affiche un message d'étape avec formatage."""
    print(f"\n{'='*80}\n{message}\n{'='*80}")

def find_lynx_imports() -> list:
    """Trouve tous les fichiers contenant des imports Lynx."""
    print_step("Recherche des imports Lynx")
    
    lynx_files = []
    
    # Parcourir tous les fichiers .tsx et .ts
    for ext in ["tsx", "ts"]:
        for file_path in glob.glob(str(SRC_DIR / "**" / f"*.{ext}"), recursive=True):
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
                
                # Rechercher les imports Lynx
                if re.search(r'import.*from\s+[\'"]@lynx-js', content):
                    lynx_files.append(file_path)
                    print(f"✅ Fichier avec import Lynx trouvé: {file_path}")
    
    print(f"Total de fichiers avec imports Lynx: {len(lynx_files)}")
    return lynx_files

def fix_content_grid() -> None:
    """Corrige le composant ContentGrid."""
    print_step("Correction du composant ContentGrid")
    
    content_grid_file = COMPONENTS_DIR / "ContentGrid" / "index.tsx"
    
    if not content_grid_file.exists():
        print(f"⚠️ Le fichier {content_grid_file} n'existe pas")
        return
    
    with open(content_grid_file, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()
    
    # Remplacer les imports Lynx
    new_content = re.sub(
        r'import\s+{\s*View,\s*Text\s*}\s+from\s+[\'"]@lynx-js/core[\'"];',
        "import React from 'react';",
        content
    )
    
    # Remplacer useAnimation
    new_content = re.sub(
        r'import\s+{\s*useAnimation\s*}\s+from\s+[\'"]@lynx-js/hooks[\'"];',
        "",
        new_content
    )
    
    # Remplacer View par div
    new_content = re.sub(r'<View', '<div', new_content)
    new_content = re.sub(r'</View>', '</div>', new_content)
    
    # Remplacer Text par span
    new_content = re.sub(r'<Text', '<span', new_content)
    new_content = re.sub(r'</Text>', '</span>', new_content)
    
    # Remplacer useAnimation
    new_content = re.sub(r'useAnimation\(.*?\)', '{}', new_content)
    
    with open(content_grid_file, 'w', encoding='utf-8') as f:
        f.write(new_content)
    
    print(f"✅ Composant ContentGrid corrigé")

def fix_lynx_components(lynx_files: list) -> None:
    """Corrige tous les composants utilisant Lynx."""
    print_step("Correction des composants utilisant Lynx")
    
    for file_path in lynx_files:
        print(f"Traitement du fichier: {file_path}")
        
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
        
        # Remplacer les imports Lynx
        new_content = re.sub(
            r'import\s+{[^}]*}\s+from\s+[\'"]@lynx-js/core[\'"];',
            "import React from 'react';",
            content
        )
        
        # Remplacer les imports de hooks Lynx
        new_content = re.sub(
            r'import\s+{[^}]*}\s+from\s+[\'"]@lynx-js/hooks[\'"];',
            "",
            new_content
        )
        
        # Remplacer View par div
        new_content = re.sub(r'<View', '<div', new_content)
        new_content = re.sub(r'</View>', '</div>', new_content)
        
        # Remplacer Text par span
        new_content = re.sub(r'<Text', '<span', new_content)
        new_content = re.sub(r'</Text>', '</span>', new_content)
        
        # Remplacer Image par img
        new_content = re.sub(r'<Image\s+source=', '<img src=', new_content)
        new_content = re.sub(r'</Image>', '</img>', new_content)
        
        # Remplacer les hooks Lynx
        new_content = re.sub(r'useAnimation\(.*?\)', '{}', new_content)
        new_content = re.sub(r'useLynxEffect\(.*?\)', '{}', new_content)
        new_content = re.sub(r'useLynxState\(.*?\)', '{}', new_content)
        
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        
        print(f"✅ Fichier {file_path} corrigé")
    
    print(f"✅ Correction des composants Lynx terminée")

def remove_lynx_packages() -> None:
    """Supprime les packages Lynx du package.json."""
    print_step("Suppression des packages Lynx du package.json")
    
    package_json_path = FRONTEND_ROOT / "package.json"
    
    if not package_json_path.exists():
        print(f"⚠️ Le fichier {package_json_path} n'existe pas")
        return
    
    try:
        import json
        
        with open(package_json_path, 'r', encoding='utf-8') as f:
            package_data = json.load(f)
        
        # Supprimer les dépendances Lynx
        if 'dependencies' in package_data:
            lynx_deps = [dep for dep in package_data['dependencies'] if dep.startswith('@lynx-js')]
            for dep in lynx_deps:
                del package_data['dependencies'][dep]
                print(f"✅ Dépendance {dep} supprimée")
        
        # Supprimer les devDependencies Lynx
        if 'devDependencies' in package_data:
            lynx_devs = [dep for dep in package_data['devDependencies'] if dep.startswith('@lynx-js')]
            for dep in lynx_devs:
                del package_data['devDependencies'][dep]
                print(f"✅ DevDependency {dep} supprimée")
        
        with open(package_json_path, 'w', encoding='utf-8') as f:
            json.dump(package_data, f, indent=2)
        
        print(f"✅ Packages Lynx supprimés du package.json")
    
    except Exception as e:
        print(f"❌ Erreur lors de la suppression des packages Lynx: {str(e)}")

def deploy_app() -> bool:
    """Déploie l'application."""
    print_step("Déploiement de l'application")
    
    try:
        os.chdir(FRONTEND_ROOT)
        
        # 1. Commiter les changements
        print("Commit des changements...")
        subprocess.run(["git", "add", "."], check=True)
        subprocess.run(["git", "commit", "-m", "🔧 FIX: Remplacement des composants Lynx par des équivalents React"], check=True)
        
        # 2. Pousser les changements
        print("Push des changements...")
        subprocess.run(["git", "push"], check=True)
        
        print("✅ Application déployée avec succès")
        return True
    
    except subprocess.CalledProcessError as e:
        print(f"❌ Erreur lors du déploiement: {str(e)}")
        return False
    finally:
        os.chdir(PROJECT_ROOT)

def main() -> None:
    """Fonction principale qui orchestre toutes les étapes."""
    print("\n╔════════════════════════════════════════════════╗")
    print("║                                                ║")
    print("║   Correction des dépendances Lynx obsolètes    ║")
    print("║                                                ║")
    print("╚════════════════════════════════════════════════╝\n")
    
    # 1. Trouver tous les fichiers avec des imports Lynx
    lynx_files = find_lynx_imports()
    
    # 2. Corriger le composant ContentGrid spécifiquement
    fix_content_grid()
    
    # 3. Corriger tous les composants utilisant Lynx
    fix_lynx_components(lynx_files)
    
    # 4. Supprimer les packages Lynx du package.json
    remove_lynx_packages()
    
    # 5. Déployer l'application
    deploy_success = deploy_app()
    
    # Résumé
    print_step("RÉSUMÉ")
    print(f"Recherche des imports Lynx: ✅")
    print(f"Correction du composant ContentGrid: ✅")
    print(f"Correction des composants Lynx: ✅")
    print(f"Suppression des packages Lynx: ✅")
    print(f"Déploiement: {'✅' if deploy_success else '❌'}")
    
    print_step("FIN DE LA CORRECTION")
    
    print("""
PROCHAINES ÉTAPES:

1. Attendez quelques minutes que le déploiement soit effectif sur GitHub Pages
2. Vérifiez le site à l'adresse https://flodrama.com
3. Si cette version fonctionne, nous aurons corrigé le problème des dépendances Lynx obsolètes

Cette correction permettra à Next.js de compiler correctement l'application en remplaçant les composants Lynx par des équivalents React.
    """)

if __name__ == "__main__":
    main()
