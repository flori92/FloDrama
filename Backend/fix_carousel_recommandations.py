#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Script pour corriger le composant CarouselRecommandations.
Ce script remplace les imports obsolètes et adapte le composant pour fonctionner sans HybridComponent.
"""

import os
import re

def print_header(message):
    """Affiche un message d'en-tête formaté."""
    print("\n" + "=" * 60)
    print(f" {message} ".center(60, "="))
    print("=" * 60 + "\n")

def print_step(message):
    """Affiche un message d'étape formaté."""
    print(f"➤ {message}")

def fix_carousel_recommandations():
    """Corrige le composant CarouselRecommandations."""
    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    file_path = os.path.join(project_root, "src", "components", "features", "CarouselRecommandations.tsx")
    
    print_step(f"Correction du fichier: {file_path}")
    
    # Vérifier si le fichier existe
    if not os.path.exists(file_path):
        print_step(f"❌ Fichier introuvable: {file_path}")
        return False
    
    # Définir le contenu corrigé
    corrected_content = """import React, { useEffect, useState } from 'react';
// Importation directe des types sans dépendances obsolètes
import { Carousel } from 'react-responsive-carousel';
import 'react-responsive-carousel/lib/styles/carousel.min.css';

// Type pour le contenu média
interface ContenuMedia {
  id: string;
  titre: string;
  description: string;
  imageUrl: string;
  type: 'film' | 'serie' | 'anime';
  genres: string[];
  note?: number;
  duree?: number;
}

// Service de recommandation simplifié
const RecommandationService = {
  getRecommandations: async (
    userId: string, 
    preferences: any, 
    limit: number
  ): Promise<ContenuMedia[]> => {
    // Simulation de données pour l'exemple
    // Dans une implémentation réelle, cela ferait un appel API
    return [
      {
        id: '1',
        titre: 'Crash Landing on You',
        description: 'Une héritière sud-coréenne atterrit accidentellement en Corée du Nord après un accident de parapente.',
        imageUrl: '/images/dramas/crash-landing-on-you.jpg',
        type: 'serie',
        genres: ['Romance', 'Drame', 'Comédie'],
        note: 9.2,
        duree: 70
      },
      {
        id: '2',
        titre: 'Itaewon Class',
        description: 'Un ex-détenu et ses amis luttent pour réussir dans le quartier animé d\'Itaewon.',
        imageUrl: '/images/dramas/itaewon-class.jpg',
        type: 'serie',
        genres: ['Drame', 'Affaires'],
        note: 8.7,
        duree: 70
      },
      {
        id: '3',
        titre: 'Demon Slayer',
        description: 'Tanjiro devient un chasseur de démons après que sa famille a été massacrée et sa sœur transformée en démon.',
        imageUrl: '/images/animes/demon-slayer.jpg',
        type: 'anime',
        genres: ['Action', 'Aventure', 'Surnaturel'],
        note: 9.5,
        duree: 24
      },
      {
        id: '4',
        titre: 'Parasite',
        description: 'Une famille pauvre s\'infiltre dans la maison d\'une famille riche, avec des conséquences inattendues.',
        imageUrl: '/images/films/parasite.jpg',
        type: 'film',
        genres: ['Drame', 'Thriller', 'Comédie noire'],
        note: 9.3,
        duree: 132
      },
      {
        id: '5',
        titre: 'Kingdom',
        description: 'Dans la Corée médiévale, un prince héritier enquête sur une mystérieuse épidémie.',
        imageUrl: '/images/dramas/kingdom.jpg',
        type: 'serie',
        genres: ['Historique', 'Horreur', 'Action'],
        note: 8.9,
        duree: 50
      }
    ];
  }
};

interface CarouselRecommandationsProps {
  userId: string;
  nombreElements?: number;
  onSelectionContenu?: (contenu: ContenuMedia) => void;
  className?: string;
}

/**
 * Composant de carrousel pour les recommandations
 * Utilise react-responsive-carousel
 */
const CarouselRecommandations: React.FC<CarouselRecommandationsProps> = ({
  userId,
  nombreElements = 10,
  onSelectionContenu,
  className = ''
}) => {
  const [contenus, setContenus] = useState<ContenuMedia[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Configuration du carrousel
  const carouselSettings = {
    infiniteLoop: true,
    showThumbs: false,
    showStatus: false,
    showIndicators: true,
    autoPlay: true,
    interval: 3000,
    stopOnHover: true,
    centerMode: true,
    centerSlidePercentage: 20,
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          centerSlidePercentage: 33.33
        }
      },
      {
        breakpoint: 600,
        settings: {
          centerSlidePercentage: 50
        }
      }
    ]
  };

  // Chargement des recommandations
  useEffect(() => {
    const chargerRecommandations = async () => {
      try {
        setIsLoading(true);
        // Simuler les préférences pour l'exemple
        const preferences = {
          genresPrefers: ['action', 'drame', 'comédie'],
          historique: [],
          favoris: []
        };
        
        const recommandations = await RecommandationService.getRecommandations(
          userId,
          preferences,
          nombreElements
        );
        
        setContenus(recommandations);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Erreur inconnue'));
      } finally {
        setIsLoading(false);
      }
    };

    chargerRecommandations();
  }, [userId, nombreElements]);

  if (isLoading) {
    return <div className="chargement">Chargement des recommandations...</div>;
  }

  if (error) {
    return (
      <div className="erreur">
        Une erreur est survenue lors du chargement des recommandations.
      </div>
    );
  }

  return (
    <div className={`carousel-recommandations ${className}`}>
      <h2 className="titre-section">Recommandations pour vous</h2>
      
      <Carousel {...carouselSettings}>
        {contenus.map((contenu) => (
          <div
            key={contenu.id}
            className="carte-contenu"
            onClick={() => onSelectionContenu?.(contenu)}
          >
            <div className="carte-image">
              <img src={contenu.imageUrl} alt={contenu.titre} loading="lazy" />
              {contenu.type === 'serie' && (
                <span className="badge-serie">Série</span>
              )}
            </div>
            
            <div className="carte-info">
              <h3 className="titre">{contenu.titre}</h3>
              <p className="description">{contenu.description}</p>
              
              <div className="meta-info">
                {contenu.duree && (
                  <span className="duree">{contenu.duree} min</span>
                )}
                {contenu.note && (
                  <span className="note">★ {contenu.note.toFixed(1)}</span>
                )}
              </div>
              
              <div className="genres">
                {contenu.genres.map((genre) => (
                  <span key={genre} className="tag-genre">
                    {genre}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </Carousel>
    </div>
  );
};

export default CarouselRecommandations;
"""
    
    # Écrire le contenu corrigé dans le fichier
    with open(file_path, 'w', encoding='utf-8') as file:
        file.write(corrected_content)
    
    print_step(f"✅ Le fichier {file_path} a été corrigé avec succès.")
    
    # Créer un fichier package.json temporaire pour installer react-responsive-carousel
    package_json_path = os.path.join(project_root, "Frontend", "package.json")
    
    if os.path.exists(package_json_path):
        print_step("Installation de react-responsive-carousel...")
        
        try:
            import json
            
            with open(package_json_path, 'r', encoding='utf-8') as file:
                package_data = json.load(file)
            
            # Vérifier si react-responsive-carousel est déjà installé
            dependencies = package_data.get('dependencies', {})
            if 'react-responsive-carousel' not in dependencies:
                # Ajouter react-responsive-carousel aux dépendances
                dependencies['react-responsive-carousel'] = "^3.2.23"
                package_data['dependencies'] = dependencies
                
                # Écrire le fichier package.json mis à jour
                with open(package_json_path, 'w', encoding='utf-8') as file:
                    json.dump(package_data, file, indent=2)
                
                print_step("✅ react-responsive-carousel ajouté aux dépendances.")
            else:
                print_step("react-responsive-carousel est déjà installé.")
        except Exception as e:
            print_step(f"❌ Erreur lors de la mise à jour du package.json: {str(e)}")
    
    return True

def create_recommandation_service():
    """Crée un service de recommandation simplifié."""
    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    services_dir = os.path.join(project_root, "src", "services")
    
    # Créer le répertoire services s'il n'existe pas
    if not os.path.exists(services_dir):
        os.makedirs(services_dir, exist_ok=True)
        print_step(f"Répertoire services créé: {services_dir}")
    
    # Définir le contenu du service
    service_content = """// Service de recommandation simplifié pour FloDrama
// Ce service fournit des recommandations de contenu basées sur les préférences utilisateur

export interface ContenuMedia {
  id: string;
  titre: string;
  description: string;
  imageUrl: string;
  type: 'film' | 'serie' | 'anime';
  genres: string[];
  note?: number;
  duree?: number;
}

export interface PreferencesUtilisateur {
  genresPrefers: string[];
  historique: string[];
  favoris: string[];
}

class RecommandationService {
  /**
   * Récupère des recommandations personnalisées pour un utilisateur
   * @param userId Identifiant de l'utilisateur
   * @param preferences Préférences de l'utilisateur
   * @param limit Nombre maximum de recommandations à retourner
   * @returns Liste des contenus recommandés
   */
  async getRecommandations(
    userId: string,
    preferences: PreferencesUtilisateur,
    limit: number = 10
  ): Promise<ContenuMedia[]> {
    try {
      // Dans une implémentation réelle, cela ferait un appel API
      // Pour l'exemple, nous utilisons des données statiques
      const recommandations: ContenuMedia[] = [
        {
          id: '1',
          titre: 'Crash Landing on You',
          description: 'Une héritière sud-coréenne atterrit accidentellement en Corée du Nord après un accident de parapente.',
          imageUrl: '/images/dramas/crash-landing-on-you.jpg',
          type: 'serie',
          genres: ['Romance', 'Drame', 'Comédie'],
          note: 9.2,
          duree: 70
        },
        {
          id: '2',
          titre: 'Itaewon Class',
          description: 'Un ex-détenu et ses amis luttent pour réussir dans le quartier animé d\\'Itaewon.',
          imageUrl: '/images/dramas/itaewon-class.jpg',
          type: 'serie',
          genres: ['Drame', 'Affaires'],
          note: 8.7,
          duree: 70
        },
        {
          id: '3',
          titre: 'Demon Slayer',
          description: 'Tanjiro devient un chasseur de démons après que sa famille a été massacrée et sa sœur transformée en démon.',
          imageUrl: '/images/animes/demon-slayer.jpg',
          type: 'anime',
          genres: ['Action', 'Aventure', 'Surnaturel'],
          note: 9.5,
          duree: 24
        },
        {
          id: '4',
          titre: 'Parasite',
          description: 'Une famille pauvre s\\'infiltre dans la maison d\\'une famille riche, avec des conséquences inattendues.',
          imageUrl: '/images/films/parasite.jpg',
          type: 'film',
          genres: ['Drame', 'Thriller', 'Comédie noire'],
          note: 9.3,
          duree: 132
        },
        {
          id: '5',
          titre: 'Kingdom',
          description: 'Dans la Corée médiévale, un prince héritier enquête sur une mystérieuse épidémie.',
          imageUrl: '/images/dramas/kingdom.jpg',
          type: 'serie',
          genres: ['Historique', 'Horreur', 'Action'],
          note: 8.9,
          duree: 50
        },
        {
          id: '6',
          titre: 'Your Name',
          description: 'Deux adolescents découvrent qu\\'ils échangent leurs corps pendant leur sommeil.',
          imageUrl: '/images/animes/your-name.jpg',
          type: 'anime',
          genres: ['Romance', 'Fantastique', 'Drame'],
          note: 9.4,
          duree: 106
        },
        {
          id: '7',
          titre: 'Squid Game',
          description: 'Des personnes endettées participent à des jeux d\\'enfants mortels pour gagner une somme d\\'argent colossale.',
          imageUrl: '/images/dramas/squid-game.jpg',
          type: 'serie',
          genres: ['Thriller', 'Drame', 'Action'],
          note: 8.8,
          duree: 60
        },
        {
          id: '8',
          titre: 'Attack on Titan',
          description: 'L\\'humanité lutte pour sa survie contre des géants mangeurs d\\'hommes appelés Titans.',
          imageUrl: '/images/animes/attack-on-titan.jpg',
          type: 'anime',
          genres: ['Action', 'Drame', 'Fantastique'],
          note: 9.6,
          duree: 24
        },
        {
          id: '9',
          titre: 'Oldboy',
          description: 'Un homme cherche à se venger après avoir été emprisonné pendant 15 ans sans explication.',
          imageUrl: '/images/films/oldboy.jpg',
          type: 'film',
          genres: ['Thriller', 'Mystère', 'Action'],
          note: 8.9,
          duree: 120
        },
        {
          id: '10',
          titre: 'Vincenzo',
          description: 'Un avocat italo-coréen de la mafia revient en Corée et utilise ses compétences pour combattre une entreprise corrompue.',
          imageUrl: '/images/dramas/vincenzo.jpg',
          type: 'serie',
          genres: ['Comédie', 'Crime', 'Drame'],
          note: 9.1,
          duree: 80
        }
      ];

      // Filtrer les recommandations selon les préférences
      const filteredRecommandations = this.filterByPreferences(recommandations, preferences);
      
      // Limiter le nombre de résultats
      return filteredRecommandations.slice(0, limit);
    } catch (error) {
      console.error('Erreur lors de la récupération des recommandations:', error);
      throw error;
    }
  }

  /**
   * Filtre les contenus selon les préférences de l'utilisateur
   * @param contenus Liste des contenus à filtrer
   * @param preferences Préférences de l'utilisateur
   * @returns Liste filtrée et triée par pertinence
   */
  private filterByPreferences(
    contenus: ContenuMedia[],
    preferences: PreferencesUtilisateur
  ): ContenuMedia[] {
    // Calculer un score de pertinence pour chaque contenu
    const scoredContenus = contenus.map(contenu => {
      let score = 0;
      
      // Score basé sur les genres préférés
      const genreMatches = contenu.genres.filter(genre => 
        preferences.genresPrefers.includes(genre.toLowerCase())
      ).length;
      score += genreMatches * 2;
      
      // Bonus pour les contenus bien notés
      if (contenu.note && contenu.note > 8.5) {
        score += (contenu.note - 8.5) * 2;
      }
      
      // Éviter de recommander des contenus déjà vus
      if (preferences.historique.includes(contenu.id)) {
        score -= 10;
      }
      
      // Bonus pour les favoris (similaires)
      if (preferences.favoris.some(favId => {
        const fav = contenus.find(c => c.id === favId);
        return fav && fav.genres.some(g => contenu.genres.includes(g));
      })) {
        score += 3;
      }
      
      return { ...contenu, score };
    });
    
    // Trier par score décroissant
    return scoredContenus
      .sort((a, b) => (b as any).score - (a as any).score)
      .map(({ score, ...contenu }) => contenu);
  }
}

export default new RecommandationService();
"""
    
    # Écrire le contenu du service dans un fichier
    service_path = os.path.join(services_dir, "RecommandationService.ts")
    with open(service_path, 'w', encoding='utf-8') as file:
        file.write(service_content)
    
    print_step(f"✅ Service de recommandation créé: {service_path}")

def main():
    """Fonction principale du script."""
    print_header("CORRECTION DU COMPOSANT CAROUSELRECOMMANDATIONS")
    
    # Corriger le composant CarouselRecommandations
    if fix_carousel_recommandations():
        # Créer un service de recommandation simplifié
        create_recommandation_service()
        
        print_header("CORRECTION TERMINÉE")
        print("Le composant CarouselRecommandations a été adapté pour fonctionner sans les dépendances obsolètes.")
        print("Un service de recommandation simplifié a été créé pour remplacer les imports manquants.")
    else:
        print_header("CORRECTION ÉCHOUÉE")
        print("Une erreur s'est produite lors de la correction du composant CarouselRecommandations.")

if __name__ == "__main__":
    main()
