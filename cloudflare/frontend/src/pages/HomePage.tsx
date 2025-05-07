/**
 * Page d'accueil de FloDrama
 * 
 * Cette page présente les recommandations personnalisées, les contenus populaires
 * et les dernières sorties avec prévisualisation des trailers au survol.
 * Utilise le service de distribution de contenu optimisé pour Cloudflare.
 */

import React, { useState, useEffect } from 'react';
import HeroBanner from '../components/HeroBanner';
import ContentCarousel from '../components/ContentCarousel';
import ContinueWatching, { WatchHistoryItem } from '../components/ContinueWatching';
import { fetchWatchHistory } from '../services/videoService';

import Footer from '../components/Footer';
import { ContentItem } from '../types/content';
import { getHomePageContent } from '../services/contentDistributionService';

const HomePage: React.FC = () => {
  // ID utilisateur fictif pour la démo
  const userId = 'user123';
  
  // États pour les contenus
  const [heroBannerItems, setHeroBannerItems] = useState<ContentItem[]>([]);
  const [carousels, setCarousels] = useState<{title: string, items: ContentItem[]}[]>([]);
  const [watchHistory, setWatchHistory] = useState<WatchHistoryItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Chargement de l'historique de visionnage
  useEffect(() => {
    const loadWatchHistory = async () => {
      try {
        const history = await fetchWatchHistory(userId);
        setWatchHistory(history);
      } catch (err) {
        console.error('Erreur lors du chargement de l\'historique de visionnage:', err);
      }
    };
    
    loadWatchHistory();
  }, [userId]);
  
  // Chargement du contenu de la page d'accueil
  useEffect(() => {
    const loadContent = async () => {
      try {
        setLoading(true);
        
        // Utiliser le nouveau service de distribution de contenu
        const { heroBanner, carousels: contentCarousels } = await getHomePageContent();
        
        // Mettre à jour les états
        setHeroBannerItems(heroBanner);
        setCarousels(contentCarousels);
        
        setLoading(false);
      } catch (err) {
        console.error('Erreur lors du chargement du contenu:', err);
        setError('Impossible de charger le contenu. Veuillez réessayer plus tard.');
        setLoading(false);
      }
    };

    loadContent();
  }, []);

  // Données de démonstration pour le hero banner si aucune donnée n'est disponible
  const demoFeaturedContent: ContentItem[] = [
    {
      id: 'solo-leveling',
      title: 'Solo Leveling',
      description: 'Dans un monde où des chasseurs dotés de pouvoirs magiques combattent des monstres mortels, Sung Jinwoo, le chasseur le plus faible de l\'humanité, se trouve soudainement doté d\'un pouvoir mystérieux qui lui permet de monter en niveau sans limite.',
      posterUrl: 'https://cdn.myanimelist.net/images/anime/1823/132329.jpg',
      releaseDate: '2024-01-06',
      rating: 8.7,
      duration: 24,
      genres: ['Action', 'Aventure', 'Fantastique'],
      trailerUrl: 'https://www.youtube.com/embed/jn1UH3U4Xz0?autoplay=1&controls=0&showinfo=0&mute=1',
      videoId: 'solo-leveling-ep1',
      category: 'anime'
    },
    {
      id: 'demon-slayer',
      title: 'Demon Slayer: Kimetsu no Yaiba',
      description: 'Tanjiro Kamado et ses amis du Corps des Pourfendeurs de démons poursuivent leur mission de protection de l\'humanité contre les démons qui menacent de détruire la race humaine.',
      posterUrl: 'https://cdn.myanimelist.net/images/anime/1286/99889.jpg',
      releaseDate: '2019-04-06',
      rating: 8.9,
      duration: 24,
      genres: ['Action', 'Fantastique', 'Historique'],
      videoId: 'demon-slayer-ep1',
      category: 'anime'
    },
    {
      id: 'jujutsu-kaisen',
      title: 'Jujutsu Kaisen',
      description: 'Yuji Itadori, un lycéen ordinaire, se retrouve plongé dans un monde d\'exorcistes et de malédictions après avoir ingéré un doigt maudit.',
      posterUrl: 'https://cdn.myanimelist.net/images/anime/1171/109222.jpg',
      releaseDate: '2020-10-03',
      rating: 8.8,
      duration: 24,
      genres: ['Action', 'Surnaturel', 'École'],
      trailerUrl: 'https://www.youtube.com/embed/4A_X-Dvl0ws?autoplay=1&controls=0&showinfo=0&mute=1',
      videoId: 'jujutsu-kaisen-ep1',
      category: 'anime'
    }
  ];

  // Utiliser les données de démonstration si aucune donnée n'est disponible
  const heroItems = heroBannerItems.length > 0 ? heroBannerItems : demoFeaturedContent;

  if (loading) {
    return (
      <>
        
        <div className="flex justify-center items-center min-h-[50vh]">
          <div className="loading-spinner"></div>
          <p className="ml-3 text-white text-lg">Chargement du contenu...</p>
        </div>
        <Footer />
      </>
    );
  }

  if (error) {
    return (
      <>
        
        <div className="container mx-auto px-4 py-12">
          <div className="bg-red-500/20 border border-red-500 text-white p-6 rounded-xl text-center">
            <h2 className="text-xl font-bold mb-2">Erreur</h2>
            <p>{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-4 bg-flo-violet hover:bg-flo-fuchsia text-white px-4 py-2 rounded-lg transition-colors duration-300"
            >
              Réessayer
            </button>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      
      <div className="bg-flo-dark min-h-screen">
        {/* Bannière héro */}
        {heroItems.length > 0 && (
          <HeroBanner 
            items={heroItems}
            autoplayInterval={10000}
            showTrailers={true}
          />
        )}
        
        <div className="container mx-auto px-4 pb-12">
          {/* Section Continuer la lecture */}
          {watchHistory.length > 0 && (
            <ContinueWatching items={watchHistory} />
          )}
          
          {/* Carrousels de contenu */}
          {carousels.map((carousel, index) => (
            <ContentCarousel
              key={`carousel-${index}`}
              title={carousel.title}
              items={carousel.items}
              viewAllLink={getViewAllLink(carousel.title)}
            />
          ))}
          
          {/* Message si aucun carrousel n'est disponible */}
          {carousels.length === 0 && (
            <div className="text-center text-white opacity-70 my-12 p-12">
              <p>Aucun contenu disponible pour le moment.</p>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
};

// Fonction pour déterminer le lien "Voir tout" en fonction du titre du carrousel
function getViewAllLink(title: string): string {
  const titleLower = title.toLowerCase();
  
  if (titleLower.includes('drama')) {
    return '/dramas';
  } else if (titleLower.includes('anime')) {
    return '/animes';
  } else if (titleLower.includes('film')) {
    return '/films';
  } else if (titleLower.includes('bollywood')) {
    return '/bollywood';
  } else if (titleLower.includes('tendance') || titleLower.includes('populaire')) {
    return '/trending';
  } else if (titleLower.includes('récent')) {
    return '/recent';
  }
  
  return '/browse';
}

export default HomePage;
