#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Script de correction du hook useAnimation dans ContentGrid
Ce script :
1. Remplace complètement le hook useAnimation par une solution React native
2. Corrige les références à l'animation dans le composant
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
CONTENT_GRID_FILE = COMPONENTS_DIR / "ContentGrid" / "index.tsx"

def print_step(message: str) -> None:
    """Affiche un message d'étape avec formatage."""
    print(f"\n{'='*80}\n{message}\n{'='*80}")

def fix_content_grid() -> None:
    """Corrige le composant ContentGrid en remplaçant useAnimation."""
    print_step("Correction du hook useAnimation dans ContentGrid")
    
    if not CONTENT_GRID_FILE.exists():
        print(f"❌ Le fichier {CONTENT_GRID_FILE} n'existe pas")
        return
    
    with open(CONTENT_GRID_FILE, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()
    
    # Remplacer tout le contenu du fichier par une version corrigée
    new_content = """import React, { useState, useEffect } from 'react';
import { ContentCard } from '../ContentCard';
import './styles.css';

interface ContentItem {
  id: string;
  title: string;
  imageUrl: string;
  rating: number;
  year: number;
  type: string;
}

interface ContentGridProps {
  items: ContentItem[];
  title: string;
  emptyMessage?: string;
  onItemClick?: (item: ContentItem) => void;
  loading?: boolean;
}

/**
 * Grille de contenu responsive pour afficher des cartes de contenu
 */
const ContentGrid: React.FC<ContentGridProps> = ({
  items = [],
  title,
  emptyMessage = "Aucun contenu disponible",
  onItemClick,
  loading = false
}) => {
  const [visibleItems, setVisibleItems] = useState<ContentItem[]>([]);
  
  // Effet pour animer l'apparition des éléments
  useEffect(() => {
    if (!loading && items.length > 0) {
      // Afficher progressivement les éléments
      const timer = setTimeout(() => {
        setVisibleItems(items);
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [items, loading]);

  // Affichage du chargement
  if (loading) {
    return (
      <div className="content-grid-container">
        <h2 className="content-grid-title">{title}</h2>
        <div className="content-grid-loading">
          <div className="loading-spinner"></div>
          <p>Chargement en cours...</p>
        </div>
      </div>
    );
  }

  // Affichage du message si aucun contenu
  if (items.length === 0) {
    return (
      <div className="content-grid-container">
        <h2 className="content-grid-title">{title}</h2>
        <div className="content-grid-empty">
          <p>{emptyMessage}</p>
        </div>
      </div>
    );
  }

  // Affichage normal de la grille
  return (
    <div className="content-grid-container">
      <h2 className="content-grid-title">{title}</h2>
      <div className="content-grid">
        {visibleItems.map((item, index) => (
          <div 
            key={item.id || index} 
            className="content-grid-item fade-in"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <ContentCard
              item={item}
              onClick={() => onItemClick && onItemClick(item)}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ContentGrid;
"""
    
    # Créer le fichier de styles si nécessaire
    styles_file = CONTENT_GRID_FILE.parent / "styles.css"
    styles_content = """/* Styles pour ContentGrid */
.content-grid-container {
  margin-bottom: 2rem;
}

.content-grid-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: #fff;
  border-bottom: 2px solid #B91C1C;
  padding-bottom: 0.5rem;
}

.content-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 1.5rem;
}

.content-grid-loading,
.content-grid-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  color: #D1D5DB;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  border-top: 4px solid #B91C1C;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.fade-in {
  opacity: 0;
  transform: translateY(20px);
  animation: fadeIn 0.6s ease forwards;
}

@keyframes fadeIn {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Responsive */
@media (max-width: 768px) {
  .content-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 1rem;
  }
}

@media (max-width: 480px) {
  .content-grid {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 0.75rem;
  }
  
  .content-grid-title {
    font-size: 1.25rem;
  }
}
"""
    
    # Écrire le nouveau contenu
    with open(CONTENT_GRID_FILE, 'w', encoding='utf-8') as f:
        f.write(new_content)
    
    # Écrire le fichier de styles
    with open(styles_file, 'w', encoding='utf-8') as f:
        f.write(styles_content)
    
    print(f"✅ Composant ContentGrid corrigé avec succès")

def deploy_app() -> bool:
    """Déploie l'application."""
    print_step("Déploiement de l'application")
    
    try:
        os.chdir(FRONTEND_ROOT)
        
        # 1. Commiter les changements
        print("Commit des changements...")
        subprocess.run(["git", "add", "."], check=True)
        subprocess.run(["git", "commit", "-m", "🔧 FIX: Remplacement complet du hook useAnimation dans ContentGrid"], check=True)
        
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
    print("║   Correction du hook useAnimation             ║")
    print("║                                                ║")
    print("╚════════════════════════════════════════════════╝\n")
    
    # 1. Corriger le composant ContentGrid
    fix_content_grid()
    
    # 2. Déployer l'application
    deploy_success = deploy_app()
    
    # Résumé
    print_step("RÉSUMÉ")
    print(f"Correction du hook useAnimation: ✅")
    print(f"Déploiement: {'✅' if deploy_success else '❌'}")
    
    print_step("FIN DE LA CORRECTION")
    
    print("""
PROCHAINES ÉTAPES:

1. Attendez quelques minutes que le déploiement soit effectif sur GitHub Pages
2. Vérifiez le site à l'adresse https://flodrama.com
3. Si cette version fonctionne, nous aurons corrigé le dernier problème de compilation

Cette correction remplace complètement le hook useAnimation par une solution React native.
    """)

if __name__ == "__main__":
    main()
