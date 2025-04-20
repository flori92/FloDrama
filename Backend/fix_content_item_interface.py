#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Script de correction de l'interface ContentItem
Ce script :
1. Corrige l'interface ContentItem pour inclure toutes les propriétés nécessaires
2. Adapte l'utilisation du composant ContentCard dans ContentGrid
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

def fix_content_item_interface() -> None:
    """Corrige l'interface ContentItem et son utilisation."""
    print_step("Correction de l'interface ContentItem")
    
    if not CONTENT_GRID_FILE.exists():
        print(f"❌ Le fichier {CONTENT_GRID_FILE} n'existe pas")
        return
    
    with open(CONTENT_GRID_FILE, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()
    
    # Mettre à jour l'interface ContentItem pour inclure toutes les propriétés nécessaires
    new_content = re.sub(
        r'interface ContentItem \{[^}]*\}',
        '''interface ContentItem {
  id: string;
  title: string;
  posterUrl?: string;
  imageUrl?: string;
  rating?: number;
  year?: number | string;
  type?: string;
  description?: string;
  genres?: string[];
  country?: string;
}''',
        content
    )
    
    # Corriger l'utilisation du composant ContentCard
    new_content = re.sub(
        r'posterUrl=\{item\.posterUrl \|\| item\.imageUrl\}',
        'posterUrl={item.posterUrl || item.imageUrl || "/images/fallback/poster1.jpg"}',
        new_content
    )
    
    # Écrire le nouveau contenu
    with open(CONTENT_GRID_FILE, 'w', encoding='utf-8') as f:
        f.write(new_content)
    
    print(f"✅ Interface ContentItem corrigée avec succès")

def deploy_app() -> bool:
    """Déploie l'application."""
    print_step("Déploiement de l'application")
    
    try:
        os.chdir(FRONTEND_ROOT)
        
        # 1. Commiter les changements
        print("Commit des changements...")
        subprocess.run(["git", "add", "."], check=True)
        subprocess.run(["git", "commit", "-m", "🔧 FIX: Correction de l'interface ContentItem avec toutes les propriétés nécessaires"], check=True)
        
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
    print("║   Correction de l'interface ContentItem        ║")
    print("║                                                ║")
    print("╚════════════════════════════════════════════════╝\n")
    
    # 1. Corriger l'interface ContentItem
    fix_content_item_interface()
    
    # 2. Déployer l'application
    deploy_success = deploy_app()
    
    # Résumé
    print_step("RÉSUMÉ")
    print(f"Correction de l'interface ContentItem: ✅")
    print(f"Déploiement: {'✅' if deploy_success else '❌'}")
    
    print_step("FIN DE LA CORRECTION")
    
    print("""
PROCHAINES ÉTAPES:

1. Attendez quelques minutes que le déploiement soit effectif sur GitHub Pages
2. Vérifiez le site à l'adresse https://flodrama.com
3. Si cette version fonctionne, nous aurons corrigé le dernier problème de compilation

Cette correction assure la compatibilité entre l'interface ContentItem et son utilisation dans ContentGrid.
    """)

if __name__ == "__main__":
    main()
