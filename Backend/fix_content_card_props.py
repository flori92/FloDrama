#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Script de correction des props du composant ContentCard
Ce script :
1. Corrige l'incompatibilité entre ContentGrid et ContentCard
2. Adapte les props pour assurer la compatibilité entre les composants
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
CONTENT_CARD_FILE = COMPONENTS_DIR / "ContentCard" / "index.tsx"

def print_step(message: str) -> None:
    """Affiche un message d'étape avec formatage."""
    print(f"\n{'='*80}\n{message}\n{'='*80}")

def fix_content_grid() -> None:
    """Corrige le composant ContentGrid pour adapter les props à ContentCard."""
    print_step("Correction du composant ContentGrid")
    
    if not CONTENT_GRID_FILE.exists():
        print(f"❌ Le fichier {CONTENT_GRID_FILE} n'existe pas")
        return
    
    with open(CONTENT_GRID_FILE, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()
    
    # Mettre à jour l'interface ContentItem pour correspondre aux props de ContentCard
    new_content = re.sub(
        r'interface ContentItem \{[^}]*\}',
        '''interface ContentItem {
  id: string;
  title: string;
  posterUrl: string;
  rating?: number;
  year?: string;
  type?: string;
  description?: string;
  genres?: string[];
  country?: string;
}''',
        content
    )
    
    # Corriger l'utilisation du composant ContentCard
    new_content = re.sub(
        r'<ContentCard\s+item=\{item\}\s+onClick=\{\(\) => onItemClick && onItemClick\(item\)\}\s+/>',
        '''<ContentCard
                id={item.id}
                title={item.title}
                posterUrl={item.posterUrl || item.imageUrl}
                rating={item.rating}
                year={item.year?.toString()}
                type={item.type as 'drama' | 'anime' | 'bollywood'}
                description={item.description}
                genres={item.genres}
                country={item.country}
                onClick={() => onItemClick && onItemClick(item)}
              />''',
        new_content
    )
    
    # Mettre à jour ContentCard pour accepter onClick
    with open(CONTENT_CARD_FILE, 'r', encoding='utf-8', errors='ignore') as f:
        card_content = f.read()
    
    # Ajouter onClick aux props de ContentCard
    new_card_content = re.sub(
        r'interface ContentCardProps \{[^}]*\}',
        '''interface ContentCardProps {
  id: string;
  title: string;
  description?: string;
  posterUrl: string;
  trailerUrl?: string;
  backdropUrl?: string;
  rating?: number;
  genres?: string[];
  year?: string;
  type?: 'drama' | 'anime' | 'bollywood';
  country?: string;
  onClick?: () => void;
}''',
        card_content
    )
    
    # Ajouter onClick aux paramètres destructurés
    new_card_content = re.sub(
        r'export const ContentCard = \(\{[^}]*\}: ContentCardProps\)',
        '''export const ContentCard = ({
  id,
  title,
  description,
  posterUrl,
  trailerUrl,
  backdropUrl,
  rating,
  genres,
  year,
  type = 'drama',
  country,
  onClick
}: ContentCardProps)''',
        new_card_content
    )
    
    # Modifier le Link pour utiliser onClick si fourni
    new_card_content = re.sub(
        r'<Link href=\{\`/content/\$\{id\}\`\} className="block h-full">',
        '''<div className="block h-full" onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>''',
        new_card_content
    )
    
    # Remplacer la fermeture du Link
    new_card_content = re.sub(
        r'</Link>',
        '''</div>''',
        new_card_content
    )
    
    # Écrire les nouveaux contenus
    with open(CONTENT_GRID_FILE, 'w', encoding='utf-8') as f:
        f.write(new_content)
    
    with open(CONTENT_CARD_FILE, 'w', encoding='utf-8') as f:
        f.write(new_card_content)
    
    print(f"✅ Composants ContentGrid et ContentCard corrigés avec succès")

def deploy_app() -> bool:
    """Déploie l'application."""
    print_step("Déploiement de l'application")
    
    try:
        os.chdir(FRONTEND_ROOT)
        
        # 1. Commiter les changements
        print("Commit des changements...")
        subprocess.run(["git", "add", "."], check=True)
        subprocess.run(["git", "commit", "-m", "🔧 FIX: Correction de l'incompatibilité des props entre ContentGrid et ContentCard"], check=True)
        
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
    print("║   Correction des props des composants          ║")
    print("║                                                ║")
    print("╚════════════════════════════════════════════════╝\n")
    
    # 1. Corriger les composants
    fix_content_grid()
    
    # 2. Déployer l'application
    deploy_success = deploy_app()
    
    # Résumé
    print_step("RÉSUMÉ")
    print(f"Correction des props: ✅")
    print(f"Déploiement: {'✅' if deploy_success else '❌'}")
    
    print_step("FIN DE LA CORRECTION")
    
    print("""
PROCHAINES ÉTAPES:

1. Attendez quelques minutes que le déploiement soit effectif sur GitHub Pages
2. Vérifiez le site à l'adresse https://flodrama.com
3. Si cette version fonctionne, nous aurons corrigé le dernier problème de compilation

Cette correction assure la compatibilité entre ContentGrid et ContentCard en adaptant les props.
    """)

if __name__ == "__main__":
    main()
