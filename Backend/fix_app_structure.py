#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Script de correction de la structure de l'application FloDrama
Ce script :
1. Supprime les fichiers obsolètes qui causent des erreurs de compilation
2. Assure la cohérence de la structure Next.js
"""

import os
import sys
import subprocess
import shutil
from pathlib import Path

# Configuration
PROJECT_ROOT = Path(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
FRONTEND_ROOT = PROJECT_ROOT / "Frontend"
SRC_DIR = FRONTEND_ROOT / "src"
PAGES_DIR = FRONTEND_ROOT / "pages"

def print_step(message: str) -> None:
    """Affiche un message d'étape avec formatage."""
    print(f"\n{'='*80}\n{message}\n{'='*80}")

def clean_obsolete_files() -> None:
    """Supprime les fichiers obsolètes qui causent des erreurs de compilation."""
    print_step("Suppression des fichiers obsolètes")
    
    # Liste des fichiers obsolètes à supprimer
    obsolete_files = [
        SRC_DIR / "App.tsx",
        SRC_DIR / "adapters",
        SRC_DIR / "hooks/useHybridComponent.ts",
    ]
    
    for file_path in obsolete_files:
        if file_path.exists():
            if file_path.is_dir():
                shutil.rmtree(file_path)
                print(f"✅ Répertoire {file_path} supprimé")
            else:
                file_path.unlink()
                print(f"✅ Fichier {file_path} supprimé")
        else:
            print(f"Le fichier/répertoire {file_path} n'existe pas")
    
    print("✅ Nettoyage des fichiers obsolètes terminé")

def create_minimal_app() -> None:
    """Crée une application minimale fonctionnelle si nécessaire."""
    print_step("Création d'une application minimale fonctionnelle")
    
    # Vérifier si le fichier _app.tsx existe
    app_file = PAGES_DIR / "_app.tsx"
    if not app_file.exists():
        print(f"Création du fichier {app_file}")
        
        app_content = """import React from 'react';
import '../src/styles/globals.css';
import type { AppProps } from 'next/app';

function MyApp({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}

export default MyApp;
"""
        
        with open(app_file, 'w') as f:
            f.write(app_content)
        
        print(f"✅ Fichier {app_file} créé")
    else:
        print(f"Le fichier {app_file} existe déjà")
    
    # Vérifier si le fichier index.tsx existe
    index_file = PAGES_DIR / "index.tsx"
    if not index_file.exists():
        print(f"Création du fichier {index_file}")
        
        index_content = """import React from 'react';
import HomePage from '../src/components/HomePage';

export default function Home() {
  return <HomePage />;
}
"""
        
        with open(index_file, 'w') as f:
            f.write(index_content)
        
        print(f"✅ Fichier {index_file} créé")
    else:
        print(f"Le fichier {index_file} existe déjà")
    
    print("✅ Application minimale fonctionnelle créée")

def deploy_app() -> bool:
    """Déploie l'application."""
    print_step("Déploiement de l'application")
    
    try:
        os.chdir(FRONTEND_ROOT)
        
        # 1. Commiter les changements
        print("Commit des changements...")
        subprocess.run(["git", "add", "."], check=True)
        subprocess.run(["git", "commit", "-m", "🔧 FIX: Suppression des fichiers obsolètes causant des erreurs de compilation"], check=True)
        
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
    print("║   Correction de la structure de l'application  ║")
    print("║                                                ║")
    print("╚════════════════════════════════════════════════╝\n")
    
    # 1. Supprimer les fichiers obsolètes
    clean_obsolete_files()
    
    # 2. Créer une application minimale fonctionnelle
    create_minimal_app()
    
    # 3. Déployer l'application
    deploy_success = deploy_app()
    
    # Résumé
    print_step("RÉSUMÉ")
    print(f"Nettoyage des fichiers obsolètes: ✅")
    print(f"Application minimale fonctionnelle: ✅")
    print(f"Déploiement: {'✅' if deploy_success else '❌'}")
    
    print_step("FIN DE LA CORRECTION")
    
    print("""
PROCHAINES ÉTAPES:

1. Attendez quelques minutes que le déploiement soit effectif sur GitHub Pages
2. Vérifiez le site à l'adresse https://flodrama.com
3. Si cette version fonctionne, nous aurons corrigé le problème de structure de l'application

Cette correction permettra à Next.js de compiler correctement l'application en supprimant les fichiers obsolètes.
    """)

if __name__ == "__main__":
    main()
