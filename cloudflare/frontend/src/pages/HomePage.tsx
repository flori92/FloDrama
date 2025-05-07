/**
 * Page d'accueil de FloDrama
 * 
 * Présentation élégante et performante des contenus phares de la plateforme,
 * intégrant un hero banner dynamique, des carrousels thématiques,
 * et une expérience utilisateur digne des plateformes de streaming premium.
 */

import React, { useState, useEffect } from 'react';
import HeroBanner from '../components/HeroBanner';
import ContentCarousel from '../components/ContentCarousel';
import ContinueWatching, { WatchHistoryItem } from '../components/ContinueWatching';
import { fetchWatchHistory } from '../services/videoService';
import { getContentByCategory } from '../services/contentService';

// Composants partagés
import Footer from '../components/Footer';

// Services et utilitaires
import { ContentItem } from '../types/content';
import { CONTENT_TYPES } from '../services/contentDistributionService';

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
        
        // Charger les contenus du hero banner depuis les différentes catégories
        const dramas = await getContentByCategory(CONTENT_TYPES.DRAMA, { sort_by: 'rating' });
        const animes = await getContentByCategory(CONTENT_TYPES.ANIME, { sort_by: 'rating' });
        const movies = await getContentByCategory(CONTENT_TYPES.MOVIE, { sort_by: 'rating' });
        
        // Sélectionner les meilleurs éléments pour le hero banner
        const topItems = [
          ...dramas.slice(0, 2),
          ...animes.slice(0, 2),
          ...movies.slice(0, 2)
        ].sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 5);
        
        setHeroBannerItems(topItems);
        
        // Construire les carrousels thématiques
        const contentCarousels = [
          { title: 'Films populaires', items: movies.slice(0, 12) },
          { title: 'Dramas asiatiques', items: dramas.slice(0, 12) },
          { title: 'Animes à découvrir', items: animes.slice(0, 12) },
          { title: 'Dernières sorties', items: [...movies, ...dramas, ...animes]
              .sort((a, b) => new Date(b.releaseDate || '').getTime() - new Date(a.releaseDate || '').getTime())
              .slice(0, 12) }
        ];
        
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
    <div className="bg-gradient-to-b from-flo-dark-blue to-flo-dark min-h-screen">
      {/* En-tête avec dégradé subtil */}
      <div className="bg-gradient-to-b from-black/60 to-transparent absolute top-0 left-0 right-0 h-32 z-10" />
      
      {/* Bannière héro avec animations et transitions fluides */}
      <section className="relative">
        {heroItems.length > 0 ? (
          <HeroBanner 
            items={heroItems}
            autoplayInterval={8000}
            showTrailers={true}
          />
        ) : loading ? (
          <div className="hero-placeholder animate-pulse" />
        ) : (
          <div className="hero-error flex items-center justify-center h-[70vh]">
            <div className="text-center text-white">
              <div className="inline-block p-4 rounded-full bg-red-500/20 mb-4">
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">Contenu temporairement indisponible</h3>
              <p>Nous travaillons à résoudre le problème.</p>
            </div>
          </div>
        )}
      </section>
      
      <main className="relative z-10 -mt-16 pt-16">
        <div className="container mx-auto px-4 pb-16">
          {/* Section Continuer la lecture avec animations d'entrée */}
          {watchHistory.length > 0 && (
            <section className="mb-12 animate-fadeIn">
              <ContinueWatching items={watchHistory} />
            </section>
          )}
          
          {/* Carrousels de contenu avec transitions fluides */}
          {carousels.map((carousel, index) => (
            <section 
              key={`carousel-${index}`} 
              className="mb-10 animate-fadeIn" 
              style={{ animationDelay: `${index * 150}ms` }}
            >
              <ContentCarousel
                title={carousel.title}
                items={carousel.items}
                viewAllLink={getViewAllLink(carousel.title)}
              />
            </section>
          ))}
          
          {/* Message si aucun carrousel n'est disponible */}
          {!loading && carousels.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-8">
                <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Aucun contenu disponible</h3>
              <p className="text-gray-400 max-w-md">Nous sommes en train d'ajouter du nouveau contenu. Revenez bientôt pour découvrir nos nouveautés !</p>
            </div>
          )}
        </div>
      </main>
      
      {/* Footer avec animation d'apparition */}
      <Footer />
    </div>
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
