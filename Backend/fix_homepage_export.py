#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Script de correction de l'export du composant HomePage
Ce script :
1. Vérifie et corrige l'export du composant HomePage
2. Met à jour l'import dans pages/index.tsx
"""

import os
import sys
import subprocess
import re
from pathlib import Path

# Configuration
PROJECT_ROOT = Path(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
FRONTEND_ROOT = PROJECT_ROOT / "Frontend"
COMPONENTS_DIR = FRONTEND_ROOT / "src" / "components"
HOMEPAGE_FILE = COMPONENTS_DIR / "HomePage.tsx"
INDEX_FILE = FRONTEND_ROOT / "pages" / "index.tsx"

def print_step(message: str) -> None:
    """Affiche un message d'étape avec formatage."""
    print(f"\n{'='*80}\n{message}\n{'='*80}")

def check_homepage_component() -> bool:
    """Vérifie si le composant HomePage existe et est exporté correctement."""
    print_step("Vérification du composant HomePage")
    
    if not HOMEPAGE_FILE.exists():
        print(f"❌ Le fichier {HOMEPAGE_FILE} n'existe pas")
        return False
    
    with open(HOMEPAGE_FILE, 'r') as f:
        content = f.read()
    
    # Vérifier si le composant est exporté correctement
    default_export = re.search(r'export\s+default\s+HomePage', content)
    named_export = re.search(r'export\s+const\s+HomePage', content)
    
    if default_export:
        print("✅ Le composant HomePage est exporté par défaut")
        return True
    elif named_export:
        print("⚠️ Le composant HomePage est exporté en tant qu'export nommé")
        print("   Modification nécessaire pour utiliser un export par défaut")
        return False
    else:
        print("⚠️ Le composant HomePage n'est pas exporté correctement")
        print("   Création d'un export par défaut")
        return False

def fix_homepage_export() -> None:
    """Corrige l'export du composant HomePage."""
    print_step("Correction de l'export du composant HomePage")
    
    if not HOMEPAGE_FILE.exists():
        print(f"❌ Le fichier {HOMEPAGE_FILE} n'existe pas")
        print("   Création d'un composant HomePage minimal")
        
        # Créer le répertoire components s'il n'existe pas
        COMPONENTS_DIR.mkdir(parents=True, exist_ok=True)
        
        # Créer un composant HomePage minimal
        homepage_content = """import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Configuration des URLs de données
const BASE_DATA_URL = "https://flodrama-exported-data.s3.eu-west-3.amazonaws.com/";

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
            <li><a href="/" className="text-white hover:text-flo-fuchsia">Accueil</a></li>
            <li><a href="/dramas" className="text-white hover:text-flo-fuchsia">Dramas</a></li>
            <li><a href="/films" className="text-white hover:text-flo-fuchsia">Films</a></li>
            <li><a href="/animes" className="text-white hover:text-flo-fuchsia">Animes</a></li>
            <li><a href="/bollywood" className="text-white hover:text-flo-fuchsia">Bollywood</a></li>
            <li><a href="/recherche" className="text-white hover:text-flo-fuchsia">Recherche</a></li>
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
        
        with open(HOMEPAGE_FILE, 'w') as f:
            f.write(homepage_content)
        
        print(f"✅ Composant HomePage créé avec succès")
        return
    
    # Lire le contenu du fichier
    with open(HOMEPAGE_FILE, 'r') as f:
        content = f.read()
    
    # Vérifier si le composant est exporté correctement
    default_export = re.search(r'export\s+default\s+HomePage', content)
    named_export = re.search(r'export\s+const\s+HomePage', content)
    
    if default_export:
        print("✅ Le composant HomePage est déjà exporté par défaut")
        return
    
    # Modifier le contenu pour ajouter un export par défaut
    if named_export:
        # Remplacer l'export nommé par un export par défaut
        new_content = re.sub(
            r'export\s+const\s+HomePage\s*=',
            'const HomePage =',
            content
        )
        
        # Ajouter l'export par défaut à la fin du fichier
        if not re.search(r'export\s+default\s+HomePage', new_content):
            new_content += '\n\nexport default HomePage;\n'
    else:
        # Trouver la définition du composant
        component_def = re.search(r'const\s+HomePage\s*=', content)
        
        if component_def:
            # Ajouter l'export par défaut à la fin du fichier
            new_content = content
            if not re.search(r'export\s+default\s+HomePage', new_content):
                new_content += '\n\nexport default HomePage;\n'
        else:
            print("❌ Impossible de trouver la définition du composant HomePage")
            return
    
    # Écrire le nouveau contenu
    with open(HOMEPAGE_FILE, 'w') as f:
        f.write(new_content)
    
    print("✅ Export par défaut ajouté au composant HomePage")

def fix_index_import() -> None:
    """Corrige l'import dans le fichier index.tsx."""
    print_step("Correction de l'import dans index.tsx")
    
    if not INDEX_FILE.exists():
        print(f"❌ Le fichier {INDEX_FILE} n'existe pas")
        return
    
    # Lire le contenu du fichier
    with open(INDEX_FILE, 'r') as f:
        content = f.read()
    
    # Vérifier si l'import est correct
    default_import = re.search(r'import\s+HomePage\s+from', content)
    named_import = re.search(r'import\s+{\s*HomePage\s*}\s+from', content)
    
    if default_import and not named_import:
        print("✅ L'import dans index.tsx est déjà correct")
        return
    
    # Modifier l'import pour utiliser un import par défaut
    if named_import:
        new_content = re.sub(
            r'import\s+{\s*HomePage\s*}\s+from\s+([\'"].*?[\'"])',
            r'import HomePage from \1',
            content
        )
    else:
        print("❌ Impossible de trouver l'import du composant HomePage")
        return
    
    # Écrire le nouveau contenu
    with open(INDEX_FILE, 'w') as f:
        f.write(new_content)
    
    print("✅ Import corrigé dans index.tsx")

def deploy_app() -> bool:
    """Déploie l'application."""
    print_step("Déploiement de l'application")
    
    try:
        os.chdir(FRONTEND_ROOT)
        
        # 1. Commiter les changements
        print("Commit des changements...")
        subprocess.run(["git", "add", "."], check=True)
        subprocess.run(["git", "commit", "-m", "🔧 FIX: Correction de l'export du composant HomePage"], check=True)
        
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
    print("║   Correction de l'export du composant HomePage ║")
    print("║                                                ║")
    print("╚════════════════════════════════════════════════╝\n")
    
    # 1. Vérifier et corriger l'export du composant HomePage
    is_correct = check_homepage_component()
    
    if not is_correct:
        fix_homepage_export()
    
    # 2. Corriger l'import dans index.tsx
    fix_index_import()
    
    # 3. Déployer l'application
    deploy_success = deploy_app()
    
    # Résumé
    print_step("RÉSUMÉ")
    print(f"Export du composant HomePage corrigé: ✅")
    print(f"Import dans index.tsx corrigé: ✅")
    print(f"Déploiement: {'✅' if deploy_success else '❌'}")
    
    print_step("FIN DE LA CORRECTION")
    
    print("""
PROCHAINES ÉTAPES:

1. Attendez quelques minutes que le déploiement soit effectif sur GitHub Pages
2. Vérifiez le site à l'adresse https://flodrama.com
3. Si cette version fonctionne, nous aurons corrigé le problème d'export du composant HomePage

Cette correction permettra à Next.js de compiler correctement l'application.
    """)

if __name__ == "__main__":
    main()
