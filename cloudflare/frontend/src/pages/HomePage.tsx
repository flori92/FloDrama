/**
 * Page d'accueil de FloDrama
 * 
 * Cette page présente les recommandations personnalisées, les contenus populaires
 * et les dernières sorties avec prévisualisation des trailers au survol.
 */

import React, { useState, useEffect } from 'react';
import { ContentItem, fetchContentByCategory } from '../services/apiService';
import HeroBanner from '../components/HeroBanner';
import ContentGrid from '../components/ContentGrid';
import useRecommendations from '../hooks/useRecommendations';
import ContinueWatching, { WatchHistoryItem } from '../components/ContinueWatching';
import { fetchWatchHistory } from '../services/videoService';
import Header from '../components/Header';
import Footer from '../components/Footer';

const HomePage: React.FC = () => {
  // ID utilisateur fictif pour la démo
  const userId = 'user123';
  
  // Récupération des recommandations personnalisées
  const { recommendations } = useRecommendations({
    userId,
    initialParams: { limit: 10 }
  });
  
  // État pour les autres catégories de contenu
  const [recentContent, setRecentContent] = useState<ContentItem[]>([]);
  const [featuredContent, setFeaturedContent] = useState<ContentItem[]>([]);
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
  
  useEffect(() => {
    const loadContent = async () => {
      try {
        setLoading(true);
        
        // Charger le contenu par catégorie
        const dramas = await fetchContentByCategory('drama');
        const animes = await fetchContentByCategory('anime');
        const films = await fetchContentByCategory('film');
        const bollywood = await fetchContentByCategory('bollywood');
        
        // Combiner tous les contenus
        const allContent = [...dramas, ...animes, ...films, ...bollywood];
        
        // Sélectionner les contenus mis en avant pour le hero banner
        const featured = allContent
          .filter(item => item.trailerUrl || item.posterUrl)
          .slice(0, 4);
        setFeaturedContent(featured);
        
        // Utiliser tous les contenus pour les grilles
        setRecentContent(allContent);
        
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
  const heroItems = featuredContent.length > 0 ? featuredContent : demoFeaturedContent;

  if (loading) {
    return (
      <>
        <Header />
        <div className="loading">Chargement du contenu...</div>
        <Footer />
      </>
    );
  }

  if (error) {
    return (
      <>
        <Header />
        <div className="error">{error}</div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
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
          {/* Grilles de contenu */}
          <div className="content-sections">
            {/* Section Continuer la lecture - placée en premier pour une meilleure accessibilité */}
            {watchHistory.length > 0 && (
              <ContinueWatching items={watchHistory} />
            )}
            
            {recommendations.length > 0 && (
              <ContentGrid 
                title="Recommandations pour vous" 
                items={recommendations}
                contentType="drama"
              />
            )}
            
            <ContentGrid 
              title="Nouveautés" 
              items={recentContent.filter(item => {
                if (!item.releaseDate) {
                  return false;
                }
                
                const releaseDate = new Date(item.releaseDate);
                const currentYear = new Date().getFullYear();
                const releaseYear = releaseDate.getFullYear();
                
                // Inclure uniquement les contenus de l'année en cours ou de l'année précédente
                return releaseYear >= currentYear - 1;
              })}
              contentType="drama"
            />
            
            <ContentGrid 
              title="Dramas Populaires" 
              items={recentContent.filter(item => item.category === 'drama')}
              contentType="drama"
            />
            
            <ContentGrid 
              title="Animes Tendance" 
              items={recentContent.filter(item => item.category === 'anime')}
              contentType="anime"
            />
            
            <ContentGrid 
              title="Bollywood" 
              items={recentContent.filter(item => item.category === 'bollywood')}
              contentType="bollywood"
            />
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default HomePage;
