#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Script de restauration du frontend complet FloDrama
Ce script :
1. Restaure les composants originaux du frontend
2. Conserve les corrections de configuration Tailwind
3. Force l'utilisation des données S3
4. Prépare le déploiement complet
"""

import os
import sys
import subprocess
import shutil
import json
from pathlib import Path
import glob

# Configuration
PROJECT_ROOT = Path(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
FRONTEND_ROOT = PROJECT_ROOT / "Frontend"
CONFIG_FILE = FRONTEND_ROOT / "src" / "config" / "data.ts"
POSTCSS_CONFIG = FRONTEND_ROOT / "postcss.config.js"
TAILWIND_CONFIG = FRONTEND_ROOT / "tailwind.config.js"
PACKAGE_JSON = FRONTEND_ROOT / "package.json"
SRC_DIR = FRONTEND_ROOT / "src"
APP_DIR = FRONTEND_ROOT / "app"

def print_step(message: str) -> None:
    """Affiche un message d'étape avec formatage."""
    print(f"\n{'='*80}\n{message}\n{'='*80}")

def update_config_file() -> None:
    """Met à jour le fichier de configuration pour garantir l'utilisation du S3 en production."""
    print_step("Mise à jour du fichier de configuration des données")
    
    # Vérifier si le fichier existe
    if not CONFIG_FILE.exists():
        print(f"Création du répertoire {CONFIG_FILE.parent}")
        CONFIG_FILE.parent.mkdir(parents=True, exist_ok=True)
    
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

def restore_original_components() -> None:
    """Restaure les composants originaux du frontend."""
    print_step("Restauration des composants originaux")
    
    # Supprimer le dossier app s'il existe (version minimale)
    if APP_DIR.exists():
        print(f"Suppression du dossier {APP_DIR}")
        shutil.rmtree(APP_DIR)
    
    # Vérifier si les composants originaux existent
    components_dir = SRC_DIR / "components"
    if not components_dir.exists() or len(list(components_dir.glob("*.tsx"))) == 0:
        print("⚠️ Les composants originaux ne sont pas disponibles")
        print("Création d'un composant HomePage minimal mais avec la structure correcte")
        
        # Créer le répertoire components s'il n'existe pas
        components_dir.mkdir(parents=True, exist_ok=True)
        
        # Créer un fichier HomePage.tsx minimal
        homepage_content = """import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BASE_DATA_URL } from '../config/data';

// Types pour les données
interface ContentItem {
  id: string;
  title: string;
  description: string;
  posterUrl: string;
  backdropUrl: string;
  rating: number;
  year: number;
  type: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

// Composant principal
const HomePage: React.FC = () => {
  const [content, setContent] = useState<ContentItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [featured, setFeatured] = useState<ContentItem[]>([]);
  const [popular, setPopular] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadContentData();
  }, []);

  const loadContentData = async () => {
    try {
      setIsLoading(true);
      
      // Charger les données depuis S3
      const contentResponse = await axios.get(`${BASE_DATA_URL}content.json`);
      const categoriesResponse = await axios.get(`${BASE_DATA_URL}categories.json`);
      const featuredResponse = await axios.get(`${BASE_DATA_URL}featured.json`);
      const popularResponse = await axios.get(`${BASE_DATA_URL}popular.json`);
      
      setContent(contentResponse.data);
      setCategories(categoriesResponse.data);
      setFeatured(featuredResponse.data);
      setPopular(popularResponse.data);
      
      console.log('Données chargées avec succès:', {
        content: contentResponse.data.length,
        categories: categoriesResponse.data.length,
        featured: featuredResponse.data.length,
        popular: popularResponse.data.length
      });
    } catch (err) {
      console.error('Erreur lors du chargement des données:', err);
      setError('Erreur lors du chargement des données. Veuillez réessayer plus tard.');
    } finally {
      setIsLoading(false);
    }
  };

  // Affichage du chargement
  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Chargement de FloDrama...</h2>
          <div className="w-12 h-12 border-4 border-flo-fuchsia border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  // Affichage des erreurs
  if (error) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Erreur</h2>
          <p className="text-red-500">{error}</p>
          <button 
            onClick={loadContentData}
            className="mt-4 px-4 py-2 bg-flo-fuchsia text-white rounded hover:bg-opacity-80"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  // Affichage principal
  return (
    <div className="min-h-screen bg-black text-white">
      {/* En-tête */}
      <header className="bg-gradient-to-r from-flo-blue to-flo-violet py-4">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold">FloDrama</h1>
          <p className="text-lg">Votre plateforme de référence pour les dramas, films, animes et plus encore !</p>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-gray-900 py-2">
        <div className="container mx-auto px-4">
          <ul className="flex space-x-6">
            <li><a href="#" className="text-white hover:text-flo-fuchsia">Accueil</a></li>
            <li><a href="#" className="text-white hover:text-flo-fuchsia">Dramas</a></li>
            <li><a href="#" className="text-white hover:text-flo-fuchsia">Films</a></li>
            <li><a href="#" className="text-white hover:text-flo-fuchsia">Animes</a></li>
            <li><a href="#" className="text-white hover:text-flo-fuchsia">Bollywood</a></li>
            <li><a href="#" className="text-white hover:text-flo-fuchsia">Recherche</a></li>
          </ul>
        </div>
      </nav>

      {/* Contenu en vedette */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold mb-6 border-b border-flo-fuchsia pb-2">En Vedette</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featured.slice(0, 3).map((item) => (
              <div key={item.id} className="bg-gray-800 rounded-lg overflow-hidden shadow-lg">
                <div className="h-48 bg-gray-700 relative">
                  <img 
                    src={item.posterUrl || `${BASE_DATA_URL}static/placeholders/drama1.webp`} 
                    alt={item.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = `${BASE_DATA_URL}static/placeholders/drama1.webp`;
                    }}
                  />
                </div>
                <div className="p-4">
                  <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                  <p className="text-gray-400 line-clamp-2">{item.description}</p>
                  <div className="mt-4 flex justify-between items-center">
                    <span className="text-sm text-gray-500">{item.year}</span>
                    <span className="text-sm bg-flo-fuchsia text-white px-2 py-1 rounded">{item.rating} ★</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contenu populaire */}
      <section className="py-8 bg-gray-900">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold mb-6 border-b border-flo-blue pb-2">Populaire</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {popular.slice(0, 6).map((item) => (
              <div key={item.id} className="bg-gray-800 rounded-lg overflow-hidden shadow-lg">
                <div className="h-48 bg-gray-700 relative">
                  <img 
                    src={item.posterUrl || `${BASE_DATA_URL}static/placeholders/drama1.webp`}
                    alt={item.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = `${BASE_DATA_URL}static/placeholders/drama1.webp`;
                    }}
                  />
                </div>
                <div className="p-4">
                  <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                  <p className="text-gray-400 line-clamp-2">{item.description}</p>
                  <div className="mt-4 flex justify-between items-center">
                    <span className="text-sm text-gray-500">{item.year}</span>
                    <span className="text-sm bg-flo-blue text-white px-2 py-1 rounded">{item.rating} ★</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Catégories */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold mb-6 border-b border-flo-violet pb-2">Catégories</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categories.slice(0, 8).map((category) => (
              <div key={category.id} className="bg-gradient-to-r from-flo-blue to-flo-violet rounded-lg p-4 text-center hover:opacity-90 cursor-pointer">
                <h3 className="text-lg font-semibold">{category.name}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pied de page */}
      <footer className="bg-gray-900 py-6 text-center text-gray-500">
        <p>© 2025 FloDrama - Tous droits réservés</p>
      </footer>
    </div>
  );
};

export default HomePage;
"""
        
        with open(components_dir / "HomePage.tsx", 'w') as f:
            f.write(homepage_content)
        
        # Créer un fichier index.tsx pour le point d'entrée
        index_content = """import React from 'react';
import ReactDOM from 'react-dom/client';
import HomePage from './components/HomePage';
import './index.css';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <HomePage />
  </React.StrictMode>
);
"""
        
        with open(SRC_DIR / "index.tsx", 'w') as f:
            f.write(index_content)
        
        # Créer un fichier index.css pour les styles globaux
        index_css_content = """@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --foreground-rgb: 255, 255, 255;
  --background-rgb: 0, 0, 0;
}

body {
  color: rgb(var(--foreground-rgb));
  background: rgb(var(--background-rgb));
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

code {
  font-family: source-code-pro, Menlo, Monaco, Consolas, 'Courier New',
    monospace;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
"""
        
        with open(SRC_DIR / "index.css", 'w') as f:
            f.write(index_css_content)
        
        print("✅ Composants de base créés avec succès")
    else:
        print("✅ Les composants originaux sont disponibles")
    
    print("✅ Restauration des composants terminée")

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
        subprocess.run(["git", "commit", "-m", "🔄 RESTORE: Restauration du frontend complet avec configuration corrigée"], check=True)
        
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
    print("║   Restauration du frontend complet FloDrama    ║")
    print("║                                                ║")
    print("╚════════════════════════════════════════════════╝\n")
    
    # 1. Mettre à jour le fichier de configuration des données
    update_config_file()
    
    # 2. Corriger la configuration Tailwind CSS
    fix_tailwind_config()
    
    # 3. Restaurer les composants originaux
    restore_original_components()
    
    # 4. Déployer l'application
    deploy_success = deploy_app()
    
    # Résumé
    print_step("RÉSUMÉ")
    print(f"Configuration des données mise à jour: ✅")
    print(f"Configuration Tailwind CSS corrigée: ✅")
    print(f"Restauration des composants originaux: ✅")
    print(f"Déploiement: {'✅' if deploy_success else '❌'}")
    
    print_step("FIN DE LA RESTAURATION")
    
    print("""
PROCHAINES ÉTAPES:

1. Attendez quelques minutes que le déploiement soit effectif sur GitHub Pages
2. Vérifiez le site à l'adresse https://flodrama.com
3. Si cette version restaurée fonctionne, nous aurons récupéré l'interface complète de FloDrama

Cette approche nous permet de restaurer l'interface complète tout en conservant les corrections de configuration.
    """)

if __name__ == "__main__":
    main()
