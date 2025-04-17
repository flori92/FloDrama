import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ContentDataService from '../services/ContentDataService';
import SmartScrapingService from '../services/SmartScrapingService';
import EnhancedPlayer from '../components/player/EnhancedPlayer';
import LoadingSpinner from '../components/LoadingSpinner';
import '../styles/PlayerPage.css';

/**
 * Page du lecteur vidéo
 * Permet de regarder les films, séries et animes
 */
const PlayerPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [content, setContent] = useState(null);
  const [selectedEpisode, setSelectedEpisode] = useState(null);
  const [episodes, setEpisodes] = useState([]);
  const [videoSources, setVideoSources] = useState([]);
  const [subtitles, setSubtitles] = useState([]);

  // Extraire l'ID et le titre du contenu depuis les paramètres d'URL
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const contentId = searchParams.get('id');
    const episodeId = searchParams.get('episode');
    
    if (!contentId) {
      setError('Aucun identifiant de contenu spécifié');
      setIsLoading(false);
      return;
    }
    
    fetchContentDetails(contentId, episodeId);
  }, [location.search]);

  // Charger les détails du contenu
  const fetchContentDetails = async (contentId, episodeId) => {
    try {
      setIsLoading(true);
      
      let contentDetails = null;
      let episodesList = [];
      
      // Essayer de récupérer les données depuis ContentDataService
      if (ContentDataService) {
        try {
          contentDetails = await ContentDataService.getContentDetails(contentId);
          
          // Récupérer les épisodes si c'est une série ou un anime
          if (contentDetails && (contentDetails.type === 'drama' || contentDetails.type === 'anime')) {
            episodesList = await ContentDataService.getContentEpisodes(contentId);
          }
        } catch (contentError) {
          console.warn('Erreur lors de la récupération des données depuis ContentDataService:', contentError);
        }
      }
      
      // Fallback vers SmartScrapingService si nécessaire
      if (!contentDetails && SmartScrapingService) {
        try {
          contentDetails = await SmartScrapingService.getContentDetails(contentId);
          
          // Récupérer les épisodes si c'est une série ou un anime
          if (contentDetails && (contentDetails.type === 'drama' || contentDetails.type === 'anime')) {
            episodesList = await SmartScrapingService.getContentEpisodes(contentId);
          }
        } catch (scrapingError) {
          console.error('Erreur lors de la récupération des données depuis SmartScrapingService:', scrapingError);
          throw scrapingError;
        }
      }
      
      if (!contentDetails) {
        throw new Error('Impossible de récupérer les détails du contenu');
      }
      
      // Déterminer l'épisode à lire
      let episodeToPlay = null;
      
      if (episodesList && episodesList.length > 0) {
        if (episodeId) {
          // Rechercher l'épisode spécifié
          episodeToPlay = episodesList.find(ep => ep.id === episodeId);
        }
        
        // Si aucun épisode spécifié ou non trouvé, prendre le premier
        if (!episodeToPlay) {
          episodeToPlay = episodesList[0];
        }
        
        setEpisodes(episodesList);
        setSelectedEpisode(episodeToPlay);
      }
      
      // Préparer les sources vidéo
      const sources = [];
      
      // Si nous avons un épisode sélectionné, utiliser ses sources
      if (episodeToPlay && episodeToPlay.sources) {
        episodeToPlay.sources.forEach(source => {
          sources.push({
            quality: source.quality || 'auto',
            url: source.url
          });
        });
      } 
      // Sinon, utiliser les sources du contenu principal (pour les films)
      else if (contentDetails.sources) {
        contentDetails.sources.forEach(source => {
          sources.push({
            quality: source.quality || 'auto',
            url: source.url
          });
        });
      }
      
      // Si aucune source n'est disponible, utiliser des sources de démonstration
      if (sources.length === 0) {
        // Sources de démonstration pour le développement
        sources.push(
          { quality: 'auto', url: 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.mp4/.m3u8' },
          { quality: '1080p', url: 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.mp4/.m3u8' },
          { quality: '720p', url: 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.mp4/.m3u8' },
          { quality: '480p', url: 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.mp4/.m3u8' }
        );
      }
      
      // Préparer les sous-titres
      const subtitlesList = [];
      
      // Si nous avons un épisode sélectionné, utiliser ses sous-titres
      if (episodeToPlay && episodeToPlay.subtitles) {
        episodeToPlay.subtitles.forEach(subtitle => {
          subtitlesList.push({
            language: subtitle.language,
            label: subtitle.label || subtitle.language,
            url: subtitle.url
          });
        });
      } 
      // Sinon, utiliser les sous-titres du contenu principal (pour les films)
      else if (contentDetails.subtitles) {
        contentDetails.subtitles.forEach(subtitle => {
          subtitlesList.push({
            language: subtitle.language,
            label: subtitle.label || subtitle.language,
            url: subtitle.url
          });
        });
      }
      
      setContent(contentDetails);
      setVideoSources(sources);
      setSubtitles(subtitlesList);
      setIsLoading(false);
      
      // Enregistrer la progression de visionnage
      if (ContentDataService) {
        try {
          if (episodeToPlay) {
            ContentDataService.addToWatchHistory(contentId, episodeToPlay.id);
          } else {
            ContentDataService.addToWatchHistory(contentId);
          }
        } catch (historyError) {
          console.warn('Erreur lors de l\'enregistrement dans l\'historique:', historyError);
        }
      }
      
    } catch (error) {
      console.error('Erreur lors du chargement des détails du contenu:', error);
      setError(error.message || 'Une erreur est survenue lors du chargement du contenu');
      setIsLoading(false);
    }
  };
  
  // Gérer la fermeture du lecteur
  const handleClose = () => {
    navigate(-1);
  };
  
  // Trouver l'épisode suivant et précédent
  const getAdjacentEpisodes = () => {
    if (!selectedEpisode || episodes.length <= 1) {
      return { next: null, previous: null };
    }
    
    const currentIndex = episodes.findIndex(ep => ep.id === selectedEpisode.id);
    
    if (currentIndex === -1) {
      return { next: null, previous: null };
    }
    
    const nextEpisode = currentIndex < episodes.length - 1 ? episodes[currentIndex + 1] : null;
    const previousEpisode = currentIndex > 0 ? episodes[currentIndex - 1] : null;
    
    return {
      next: nextEpisode ? {
        id: nextEpisode.id,
        title: nextEpisode.title || `Épisode ${nextEpisode.number}`
      } : null,
      previous: previousEpisode ? {
        id: previousEpisode.id,
        title: previousEpisode.title || `Épisode ${previousEpisode.number}`
      } : null
    };
  };
  
  const { next, previous } = getAdjacentEpisodes();
  
  // Afficher un écran de chargement
  if (isLoading) {
    return (
      <div className="player-loading">
        <LoadingSpinner />
        <p>Chargement du contenu...</p>
      </div>
    );
  }
  
  // Afficher un message d'erreur
  if (error) {
    return (
      <div className="player-error">
        <h2>Erreur de lecture</h2>
        <p>{error}</p>
        <button className="player-error-button" onClick={handleClose}>
          Retour
        </button>
      </div>
    );
  }
  
  // Déterminer le titre à afficher
  const displayTitle = content ? content.title : '';
  const episodeInfo = selectedEpisode 
    ? selectedEpisode.title 
      ? `Épisode ${selectedEpisode.number} - ${selectedEpisode.title}` 
      : `Épisode ${selectedEpisode.number}`
    : '';
  
  return (
    <div className="player-page">
      <div className="player-container">
        <EnhancedPlayer
          videoSources={videoSources}
          title={displayTitle}
          episodeInfo={episodeInfo}
          subtitles={subtitles}
          onClose={handleClose}
          autoPlay={true}
          poster={content?.coverImage || content?.image}
          nextEpisode={next}
          previousEpisode={previous}
        />
      </div>
      
      {/* Liste des épisodes (pour les séries et animes) */}
      {episodes.length > 1 && (
        <div className="episodes-list">
          <h2 className="episodes-title">Épisodes</h2>
          <div className="episodes-grid">
            {episodes.map((episode) => (
              <button
                key={episode.id}
                className={`episode-item ${selectedEpisode && selectedEpisode.id === episode.id ? 'active' : ''}`}
                onClick={() => navigate(`/player?id=${content.id}&episode=${episode.id}`)}
              >
                <div className="episode-number">{episode.number}</div>
                <div className="episode-info">
                  <div className="episode-title">{episode.title || `Épisode ${episode.number}`}</div>
                  {episode.duration && (
                    <div className="episode-duration">
                      {Math.floor(episode.duration / 60)}:{(episode.duration % 60).toString().padStart(2, '0')}
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PlayerPage;
