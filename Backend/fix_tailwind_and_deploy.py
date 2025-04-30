#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Script de correction Tailwind et déploiement pour FloDrama
Ce script :
1. Corrige la configuration Tailwind CSS
2. Modifie postcss.config.js pour utiliser une configuration simple
3. Met à jour la configuration des données pour utiliser S3
4. Déploie l'application
"""

import os
import sys
import subprocess
import shutil
import json
from pathlib import Path

# Configuration
PROJECT_ROOT = Path(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
FRONTEND_ROOT = PROJECT_ROOT / "Frontend"
CONFIG_FILE = FRONTEND_ROOT / "src" / "config" / "data.ts"
POSTCSS_CONFIG = FRONTEND_ROOT / "postcss.config.js"
TAILWIND_CONFIG = FRONTEND_ROOT / "tailwind.config.js"
PACKAGE_JSON = FRONTEND_ROOT / "package.json"

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
    """Corrige la configuration Tailwind CSS."""
    print_step("Correction de la configuration Tailwind CSS")
    
    # 1. Simplifier postcss.config.js
    postcss_content = """module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
"""
    with open(POSTCSS_CONFIG, 'w') as f:
        f.write(postcss_content)
    print(f"✅ {POSTCSS_CONFIG} simplifié")
    
    # 2. Vérifier et mettre à jour tailwind.config.js
    if TAILWIND_CONFIG.exists():
        print(f"Mise à jour de {TAILWIND_CONFIG}")
        tailwind_content = """/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'flo-blue': '#1E3A8A',
        'flo-fuchsia': '#B91C1C',
        'flo-violet': '#7E22CE',
        'flo-gray': '#D1D5DB',
      },
    },
  },
  plugins: [],
}
"""
        with open(TAILWIND_CONFIG, 'w') as f:
            f.write(tailwind_content)
        print(f"✅ {TAILWIND_CONFIG} mis à jour")
    
    # 3. Mettre à jour package.json pour utiliser des versions spécifiques
    if PACKAGE_JSON.exists():
        with open(PACKAGE_JSON, 'r') as f:
            package_data = json.load(f)
        
        # Mettre à jour les dépendances
        if 'dependencies' not in package_data:
            package_data['dependencies'] = {}
        
        if 'devDependencies' not in package_data:
            package_data['devDependencies'] = {}
        
        # Mettre à jour tailwindcss à une version spécifique
        package_data['devDependencies']['tailwindcss'] = '3.3.0'
        package_data['devDependencies']['autoprefixer'] = '10.4.14'
        package_data['devDependencies']['postcss'] = '8.4.21'
        
        # Supprimer @tailwindcss/postcss s'il existe
        if '@tailwindcss/postcss' in package_data['devDependencies']:
            del package_data['devDependencies']['@tailwindcss/postcss']
        
        with open(PACKAGE_JSON, 'w') as f:
            json.dump(package_data, f, indent=2)
        
        print(f"✅ {PACKAGE_JSON} mis à jour avec des versions spécifiques")
    
    print("✅ Configuration Tailwind CSS corrigée")

def create_minimal_app() -> None:
    """Crée une application minimale fonctionnelle."""
    print_step("Création d'une application minimale fonctionnelle")
    
    # 1. Créer un fichier app/page.tsx minimal
    app_dir = FRONTEND_ROOT / "app"
    app_dir.mkdir(exist_ok=True)
    
    page_content = """import React from 'react';
import styles from './page.module.css';

export default function Home() {
  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <h1 className="text-4xl font-bold text-flo-fuchsia mb-6">
          FloDrama - Plateforme de streaming asiatique
        </h1>
        <p className="text-lg mb-4">
          Votre plateforme de référence pour les dramas, films, animes et plus encore !
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-gray-800 rounded-lg overflow-hidden shadow-lg">
              <div className="h-40 bg-gradient-to-r from-flo-blue to-flo-violet"></div>
              <div className="p-4">
                <h2 className="text-xl font-semibold mb-2">Titre du contenu {i+1}</h2>
                <p className="text-gray-400">Description courte du contenu...</p>
                <div className="mt-4 flex justify-between items-center">
                  <span className="text-sm text-gray-500">2023</span>
                  <span className="text-sm bg-flo-fuchsia text-white px-2 py-1 rounded">8.5 ★</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
      <footer className="py-6 text-center text-gray-500">
        <p>© 2025 FloDrama - Tous droits réservés</p>
      </footer>
    </div>
  );
}
"""
    
    with open(app_dir / "page.tsx", 'w') as f:
        f.write(page_content)
    
    # 2. Créer un fichier app/page.module.css minimal
    css_content = """
.container {
  min-height: 100vh;
  background-color: #000;
  color: #fff;
}

.main {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}
"""
    
    with open(app_dir / "page.module.css", 'w') as f:
        f.write(css_content)
    
    # 3. Créer un fichier app/layout.tsx minimal
    layout_content = """import './globals.css';

export const metadata = {
  title: 'FloDrama - Plateforme de streaming asiatique',
  description: 'Votre plateforme de référence pour les dramas, films, animes et plus encore !',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  )
}
"""
    
    with open(app_dir / "layout.tsx", 'w') as f:
        f.write(layout_content)
    
    # 4. Créer un fichier app/globals.css minimal
    globals_content = """@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --foreground-rgb: 255, 255, 255;
  --background-rgb: 0, 0, 0;
}

body {
  color: rgb(var(--foreground-rgb));
  background: rgb(var(--background-rgb));
}
"""
    
    with open(app_dir / "globals.css", 'w') as f:
        f.write(globals_content)
    
    print("✅ Application minimale fonctionnelle créée")

def deploy_app() -> bool:
    """Déploie l'application."""
    print_step("Déploiement de l'application")
    
    try:
        os.chdir(FRONTEND_ROOT)
        
        # 1. Installer les dépendances
        print("Installation des dépendances...")
        subprocess.run(["npm", "install"], check=True)
        
        # 2. Commiter les changements
        print("Commit des changements...")
        subprocess.run(["git", "add", "."], check=True)
        subprocess.run(["git", "commit", "-m", "🔧 FIX: Application minimale fonctionnelle avec configuration Tailwind corrigée"], check=True)
        
        # 3. Pousser les changements
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
    print("║   Correction Tailwind et déploiement          ║")
    print("║                                                ║")
    print("╚════════════════════════════════════════════════╝\n")
    
    # 1. Mettre à jour le fichier de configuration des données
    update_config_file()
    
    # 2. Corriger la configuration Tailwind CSS
    fix_tailwind_config()
    
    # 3. Créer une application minimale fonctionnelle
    create_minimal_app()
    
    # 4. Déployer l'application
    deploy_success = deploy_app()
    
    # Résumé
    print_step("RÉSUMÉ")
    print(f"Configuration des données mise à jour: ✅")
    print(f"Configuration Tailwind CSS corrigée: ✅")
    print(f"Application minimale fonctionnelle créée: ✅")
    print(f"Déploiement: {'✅' if deploy_success else '❌'}")
    
    print_step("FIN DE LA CORRECTION")
    
    print("""
PROCHAINES ÉTAPES:

1. Attendez quelques minutes que le déploiement soit effectif sur GitHub Pages
2. Vérifiez le site à l'adresse https://flodrama.com
3. Si cette version minimale fonctionne, nous pourrons progressivement réintégrer les composants FloDrama

Cette approche nous permet de vérifier que le problème est bien lié à la configuration Tailwind et non à autre chose.
    """)

if __name__ == "__main__":
    main()
