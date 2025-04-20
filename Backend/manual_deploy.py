#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Script de déploiement manuel pour FloDrama
Ce script :
1. Vérifie l'état du dépôt GitHub
2. Construit l'application localement
3. Déploie manuellement les fichiers statiques générés
4. Vérifie que le déploiement a réussi
"""

import os
import sys
import subprocess
import shutil
import time
import requests
from pathlib import Path

# Configuration
PROJECT_ROOT = Path(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
FRONTEND_ROOT = PROJECT_ROOT / "Frontend"
BUILD_DIR = FRONTEND_ROOT / "out"  # Next.js static export directory
GITHUB_REPO = "flori92/FloDrama"
GITHUB_BRANCH = "gh-pages"
DOMAIN = "flodrama.com"

def print_step(message: str) -> None:
    """Affiche un message d'étape avec formatage."""
    print(f"\n{'='*80}\n{message}\n{'='*80}")

def check_github_repo():
    """Vérifie l'état du dépôt GitHub."""
    print_step("Vérification du dépôt GitHub")
    
    try:
        os.chdir(FRONTEND_ROOT)
        
        # Vérifier si le dépôt est propre
        status = subprocess.run(["git", "status", "--porcelain"], capture_output=True, text=True)
        if status.stdout.strip():
            print("⚠️ Le dépôt contient des modifications non commitées:")
            print(status.stdout)
            
            # Demander confirmation
            confirmation = input("Voulez-vous continuer quand même ? (o/N): ").strip().lower()
            if confirmation != 'o':
                print("Opération annulée.")
                return False
        
        # Vérifier la branche actuelle
        branch = subprocess.run(["git", "rev-parse", "--abbrev-ref", "HEAD"], capture_output=True, text=True)
        current_branch = branch.stdout.strip()
        print(f"Branche actuelle: {current_branch}")
        
        if current_branch != GITHUB_BRANCH:
            print(f"⚠️ Vous n'êtes pas sur la branche {GITHUB_BRANCH}")
            
            # Demander confirmation
            confirmation = input(f"Voulez-vous basculer sur la branche {GITHUB_BRANCH} ? (o/N): ").strip().lower()
            if confirmation == 'o':
                subprocess.run(["git", "checkout", GITHUB_BRANCH], check=True)
                print(f"✅ Basculé sur la branche {GITHUB_BRANCH}")
            else:
                print("Opération annulée.")
                return False
        
        # Récupérer les dernières modifications
        print("Récupération des dernières modifications...")
        subprocess.run(["git", "pull"], check=True)
        
        print("✅ Dépôt GitHub prêt pour le déploiement")
        return True
    
    except subprocess.CalledProcessError as e:
        print(f"❌ Erreur lors de la vérification du dépôt: {str(e)}")
        return False
    finally:
        os.chdir(PROJECT_ROOT)

def configure_next_export():
    """Configure Next.js pour l'export statique."""
    print_step("Configuration de Next.js pour l'export statique")
    
    # Vérifier et modifier next.config.js
    next_config_path = FRONTEND_ROOT / "next.config.js"
    
    if next_config_path.exists():
        with open(next_config_path, 'r') as f:
            config_content = f.read()
        
        # Vérifier si l'export est déjà configuré
        if "output: 'export'" not in config_content:
            print("Modification de next.config.js pour activer l'export statique...")
            
            # Ajouter la configuration d'export
            if "module.exports = {" in config_content:
                new_content = config_content.replace(
                    "module.exports = {", 
                    "module.exports = {\n  output: 'export',\n  images: { unoptimized: true },"
                )
            else:
                new_content = "/** @type {import('next').NextConfig} */\nmodule.exports = {\n  output: 'export',\n  images: { unoptimized: true },\n};\n"
            
            with open(next_config_path, 'w') as f:
                f.write(new_content)
            
            print("✅ next.config.js modifié pour l'export statique")
        else:
            print("✅ L'export statique est déjà configuré dans next.config.js")
    else:
        print("Création de next.config.js pour l'export statique...")
        
        with open(next_config_path, 'w') as f:
            f.write("/** @type {import('next').NextConfig} */\nmodule.exports = {\n  output: 'export',\n  images: { unoptimized: true },\n};\n")
        
        print("✅ next.config.js créé pour l'export statique")
    
    # Créer un fichier .nojekyll pour GitHub Pages
    nojekyll_path = FRONTEND_ROOT / ".nojekyll"
    if not nojekyll_path.exists():
        with open(nojekyll_path, 'w') as f:
            f.write("")
        print("✅ Fichier .nojekyll créé pour GitHub Pages")
    
    return True

def build_application():
    """Construit l'application localement."""
    print_step("Construction de l'application")
    
    try:
        os.chdir(FRONTEND_ROOT)
        
        # Installer les dépendances
        print("Installation des dépendances...")
        subprocess.run(["npm", "install"], check=True)
        
        # Construire l'application
        print("Construction de l'application...")
        subprocess.run(["npm", "run", "build"], check=True)
        
        # Vérifier que le répertoire de build existe
        if not BUILD_DIR.exists():
            print(f"❌ Le répertoire de build {BUILD_DIR} n'existe pas")
            return False
        
        print(f"✅ Application construite avec succès dans {BUILD_DIR}")
        return True
    
    except subprocess.CalledProcessError as e:
        print(f"❌ Erreur lors de la construction de l'application: {str(e)}")
        return False
    finally:
        os.chdir(PROJECT_ROOT)

def deploy_to_github_pages():
    """Déploie manuellement les fichiers statiques générés sur GitHub Pages."""
    print_step("Déploiement sur GitHub Pages")
    
    try:
        os.chdir(FRONTEND_ROOT)
        
        # Vérifier que le répertoire de build existe
        if not BUILD_DIR.exists():
            print(f"❌ Le répertoire de build {BUILD_DIR} n'existe pas")
            return False
        
        # Créer un fichier CNAME pour le domaine personnalisé
        cname_path = BUILD_DIR / "CNAME"
        with open(cname_path, 'w') as f:
            f.write(DOMAIN)
        print(f"✅ Fichier CNAME créé pour le domaine {DOMAIN}")
        
        # Créer un fichier .nojekyll pour GitHub Pages
        nojekyll_path = BUILD_DIR / ".nojekyll"
        with open(nojekyll_path, 'w') as f:
            f.write("")
        print("✅ Fichier .nojekyll créé pour GitHub Pages")
        
        # Commiter les fichiers de build
        print("Ajout des fichiers de build...")
        subprocess.run(["git", "add", "out", ".nojekyll"], check=True)
        
        # Commiter les changements
        print("Commit des changements...")
        subprocess.run(["git", "commit", "-m", "🚀 DEPLOY: Déploiement manuel de l'application"], check=True)
        
        # Pousser les changements
        print("Push des changements...")
        subprocess.run(["git", "push"], check=True)
        
        print("✅ Application déployée avec succès sur GitHub Pages")
        return True
    
    except subprocess.CalledProcessError as e:
        print(f"❌ Erreur lors du déploiement: {str(e)}")
        return False
    finally:
        os.chdir(PROJECT_ROOT)

def check_deployment():
    """Vérifie que le déploiement a réussi."""
    print_step("Vérification du déploiement")
    
    print("Attente de 30 secondes pour laisser le temps au déploiement de s'effectuer...")
    time.sleep(30)
    
    try:
        # Vérifier que le site est accessible
        print(f"Vérification de l'accès à https://{DOMAIN}...")
        response = requests.get(f"https://{DOMAIN}")
        
        if response.status_code == 200:
            print(f"✅ Le site est accessible à https://{DOMAIN}")
            
            # Vérifier que le contenu est correct
            if "Create Next App" in response.text:
                print("⚠️ Le site semble toujours afficher le template Next.js par défaut")
                print("Vérifiez manuellement le site pour vous assurer que le déploiement a réussi")
            else:
                print("✅ Le contenu du site semble correct")
            
            return True
        else:
            print(f"❌ Le site n'est pas accessible (code {response.status_code})")
            return False
    
    except Exception as e:
        print(f"❌ Erreur lors de la vérification du déploiement: {str(e)}")
        return False

def main():
    """Fonction principale qui orchestre toutes les étapes."""
    print("\n╔════════════════════════════════════════════════╗")
    print("║                                                ║")
    print("║   Déploiement manuel de FloDrama              ║")
    print("║                                                ║")
    print("╚════════════════════════════════════════════════╝\n")
    
    # 1. Vérifier le dépôt GitHub
    if not check_github_repo():
        print("❌ Impossible de continuer sans un dépôt GitHub propre")
        return
    
    # 2. Configurer Next.js pour l'export statique
    if not configure_next_export():
        print("❌ Impossible de configurer Next.js pour l'export statique")
        return
    
    # 3. Construire l'application
    if not build_application():
        print("❌ Impossible de construire l'application")
        return
    
    # 4. Déployer sur GitHub Pages
    if not deploy_to_github_pages():
        print("❌ Impossible de déployer sur GitHub Pages")
        return
    
    # 5. Vérifier le déploiement
    check_deployment()
    
    print_step("FIN DU DÉPLOIEMENT")
    
    print("""
PROCHAINES ÉTAPES:

1. Vérifiez manuellement le site à l'adresse https://flodrama.com
   - Assurez-vous que l'interface correspond à FloDrama
   - Vérifiez que les données sont correctement chargées

2. Si le problème persiste:
   - Vérifiez les paramètres GitHub Pages dans les paramètres du dépôt
   - Assurez-vous que le domaine flodrama.com pointe vers GitHub Pages
   - Considérez un redéploiement complet avec un nouveau projet Next.js
    """)

if __name__ == "__main__":
    main()
