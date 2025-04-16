import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, 
         SkipForward, SkipBack, Settings, X, Type, Users } from 'lucide-react';
import { useMetadata } from '../hooks/useMetadata';
import { getAssetUrl, getVideoUrl } from '../api/metadata';
import ContentCard from '../components/cards/ContentCard';
import CreateWatchPartyModal from '../components/social/CreateWatchPartyModal';

/**
 * Page de lecteur vidéo pour regarder un contenu
 */
const VideoPlayerPage = () => {
  const { type, id } = useParams();
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const playerRef = useRef(null);
  const progressBarRef = useRef(null);
  const timeoutRef = useRef(null);
  
  const { getItemById, getRecommendations, isLoading, error: errorMetadata } = useMetadata();
  
  // États du lecteur vidéo
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showSubtitlesMenu, setShowSubtitlesMenu] = useState(false);
  const [quality, setQuality] = useState('auto');
  
  // États du contenu
  const [episodeData, setEpisodeData] = useState(null);
  const [currentEpisode, setCurrentEpisode] = useState(1);
  const [recommendations, setRecommendations] = useState([]);
  
  // État pour le modal de création de soirée de visionnage
  const [watchPartyModalOpen, setWatchPartyModalOpen] = useState(false);
  
  // États des sous-titres
  const [subtitles, setSubtitles] = useState([
    { id: 'off', label: 'Désactivés', language: 'off', src: '', enabled: true },
    { id: 'fr', label: 'Français', language: 'fr', src: '/subtitles/fr.vtt', enabled: false },
    { id: 'en', label: 'Anglais', language: 'en', src: '/subtitles/en.vtt', enabled: false },
    { id: 'es', label: 'Espagnol', language: 'es', src: '/subtitles/es.vtt', enabled: false },
  ]);
  const [currentSubtitle, setCurrentSubtitle] = useState('off');
  
  // Navigation entre les épisodes
  const goToEpisode = useCallback((ep) => {
    if (ep >= 1 && ep <= (episodeData?.episodes || 1)) {
      setCurrentEpisode(ep);
      // Réinitialiser le lecteur
      setCurrentTime(0);
      setIsPlaying(false);
      
      // Lecture automatique après un court délai
      setTimeout(() => {
        const video = videoRef.current;
        if (video) {
          video.play()
            .then(() => setIsPlaying(true))
            .catch(err => console.error('Erreur de lecture:', err));
        }
      }, 500);
    }
  }, [episodeData]);
  
  // Charger les données du contenu
  useEffect(() => {
    if (isLoading || errorMetadata) return;
    
    const contentItem = getItemById(id);
    if (contentItem) {
      setEpisodeData(contentItem);
      
      // Récupérer les recommandations
      const recs = getRecommendations(id);
      if (recs.length > 0) {
        setRecommendations(recs[0].items || []);
      }
      
      // Charger les sous-titres disponibles pour ce contenu
      // Dans une application réelle, cela viendrait de l'API
      if (contentItem.subtitles) {
        setSubtitles(prev => {
          const newSubtitles = [...prev];
          newSubtitles[0].enabled = true; // Option "Désactivés" toujours disponible
          
          // Activer les sous-titres disponibles
          contentItem.subtitles.forEach(sub => {
            const index = newSubtitles.findIndex(s => s.language === sub.language);
            if (index !== -1) {
              newSubtitles[index].enabled = true;
              newSubtitles[index].src = sub.src || newSubtitles[index].src;
            }
          });
          
          return newSubtitles;
        });
      }
    }
  }, [id, isLoading, errorMetadata, getItemById, getRecommendations]);
  
  // Gérer la lecture automatique et les événements du lecteur
  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;
    
    // Lecture automatique après un court délai
    const autoplayTimeout = setTimeout(() => {
      videoElement.play()
        .then(() => setIsPlaying(true))
        .catch(err => console.error('Erreur de lecture automatique:', err));
    }, 1500);
    
    // Gestionnaires d'événements
    const handleTimeUpdate = () => {
      setCurrentTime(videoElement.currentTime);
    };
    
    const handleDurationChange = () => {
      setDuration(videoElement.duration);
    };
    
    const handlePlay = () => {
      setIsPlaying(true);
    };
    
    const handlePause = () => {
      setIsPlaying(false);
    };
    
    const handleVolumeChange = () => {
      setVolume(videoElement.volume);
      setIsMuted(videoElement.muted);
    };
    
    const handleEnded = () => {
      setIsPlaying(false);
      // Si c'est une série et qu'il y a un épisode suivant
      if (episodeData && episodeData.episodes && currentEpisode < episodeData.episodes) {
        // Passer à l'épisode suivant après 5 secondes
        setTimeout(() => {
          goToEpisode(currentEpisode + 1);
        }, 5000);
      }
    };
    
    // Ajouter les écouteurs d'événements
    videoElement.addEventListener('timeupdate', handleTimeUpdate);
    videoElement.addEventListener('durationchange', handleDurationChange);
    videoElement.addEventListener('play', handlePlay);
    videoElement.addEventListener('pause', handlePause);
    videoElement.addEventListener('volumechange', handleVolumeChange);
    videoElement.addEventListener('ended', handleEnded);
    
    // Nettoyage
    return () => {
      clearTimeout(autoplayTimeout);
      if (videoElement) {
        videoElement.removeEventListener('timeupdate', handleTimeUpdate);
        videoElement.removeEventListener('durationchange', handleDurationChange);
        videoElement.removeEventListener('play', handlePlay);
        videoElement.removeEventListener('pause', handlePause);
        videoElement.removeEventListener('volumechange', handleVolumeChange);
        videoElement.removeEventListener('ended', handleEnded);
      }
    };
  }, [episodeData, currentEpisode, goToEpisode]);
  
  // Gérer l'affichage des contrôles
  useEffect(() => {
    const handleMouseMove = () => {
      setShowControls(true);
      
      // Réinitialiser le délai
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      // Masquer les contrôles après 3 secondes d'inactivité
      timeoutRef.current = setTimeout(() => {
        if (isPlaying) {
          setShowControls(false);
          setShowSettings(false);
          setShowSubtitlesMenu(false);
        }
      }, 3000);
    };
    
    const container = playerRef.current;
    if (container) {
      container.addEventListener('mousemove', handleMouseMove);
      container.addEventListener('touchstart', handleMouseMove);
    }
    
    return () => {
      if (container) {
        container.removeEventListener('mousemove', handleMouseMove);
        container.removeEventListener('touchstart', handleMouseMove);
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isPlaying]);
  
  // Gérer le plein écran
  const toggleFullscreen = () => {
    const container = playerRef.current;
    
    if (!document.fullscreenElement) {
      container.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(err => {
        console.error('Erreur lors du passage en plein écran:', err);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      }).catch(err => {
        console.error('Erreur lors de la sortie du plein écran:', err);
      });
    }
  };
  
  // Formater le temps (secondes -> MM:SS)
  const formatTime = (timeInSeconds) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };
  
  // Contrôles de lecture
  const togglePlay = () => {
    const video = videoRef.current;
    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
    setIsPlaying(!isPlaying);
  };
  
  const toggleMute = () => {
    const video = videoRef.current;
    video.muted = !video.muted;
    setIsMuted(!isMuted);
  };
  
  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    const video = videoRef.current;
    video.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };
  
  const handleProgressChange = (e) => {
    const newTime = parseFloat(e.target.value);
    const video = videoRef.current;
    video.currentTime = newTime;
    setCurrentTime(newTime);
  };
  
  const handleProgressClick = (e) => {
    const progressBar = progressBarRef.current;
    const rect = progressBar.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / progressBar.offsetWidth;
    const newTime = pos * duration;
    
    const video = videoRef.current;
    video.currentTime = newTime;
    setCurrentTime(newTime);
  };
  
  // Changer la qualité vidéo
  const handleQualityChange = (newQuality) => {
    setQuality(newQuality);
    setShowSettings(false);
    
    // Sauvegarder la position actuelle
    const currentPos = videoRef.current.currentTime;
    
    // Appliquer la nouvelle qualité (dans une application réelle, cela changerait la source)
    setTimeout(() => {
      videoRef.current.currentTime = currentPos;
      if (isPlaying) {
        videoRef.current.play();
      }
    }, 100);
  };
  
  // Changer les sous-titres
  const handleSubtitleChange = (subtitleId) => {
    setCurrentSubtitle(subtitleId);
    setShowSubtitlesMenu(false);
    
    // Désactiver tous les tracks de sous-titres
    const video = videoRef.current;
    if (video) {
      Array.from(video.textTracks).forEach(track => {
        track.mode = 'disabled';
      });
      
      // Activer le track sélectionné
      if (subtitleId !== 'off') {
        const selectedTrack = Array.from(video.textTracks).find(track => track.language === subtitleId);
        if (selectedTrack) {
          selectedTrack.mode = 'showing';
        }
      }
    }
  };
  
  // Obtenir le libellé du sous-titre actuel
  const getCurrentSubtitleLabel = () => {
    const subtitle = subtitles.find(sub => sub.id === currentSubtitle);
    return subtitle ? subtitle.label : 'Désactivés';
  };
  
  // Afficher un état de chargement
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-white">Chargement de la vidéo...</p>
        </div>
      </div>
    );
  }
  
  // Afficher une erreur si nécessaire
  if (errorMetadata || !episodeData) {
    return (
      <div className="flex items-center justify-center h-screen bg-black">
        <div className="text-center">
          <div className="text-red-600 text-5xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-white mb-2">Vidéo non disponible</h1>
          <p className="text-gray-400 mb-6">{errorMetadata || "Cette vidéo n'existe pas ou a été supprimée."}</p>
          <button 
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded font-medium"
            onClick={() => navigate('/')}
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }
  
  // Déterminer la source vidéo
  const getVideoSource = () => {
    // Pour les séries
    if (episodeData.episodes && episodeData.episodes > 1) {
      return episodeData.episode_videos && episodeData.episode_videos[currentEpisode - 1]
        ? getVideoUrl(episodeData.episode_videos[currentEpisode - 1])
        : getVideoUrl(`${episodeData.id}/episode${currentEpisode}.mp4`);
    }
    
    // Pour les films
    return episodeData.video ? getVideoUrl(episodeData.video) : getVideoUrl(`${episodeData.id}/movie.mp4`);
  };
  
  // Animations
  const controlsVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
  };
  
  const infoVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.3 } }
  };
  
  return (
    <div className="bg-black h-screen w-screen overflow-hidden">
      {/* Conteneur du lecteur vidéo */}
      <div 
        ref={playerRef}
        className="relative h-full w-full"
        onClick={() => {
          if (!showSettings && !showSubtitlesMenu) {
            togglePlay();
          }
        }}
      >
        {/* Vidéo */}
        <video
          ref={videoRef}
          className="h-full w-full object-contain"
          src={getVideoSource()}
          poster={getAssetUrl(episodeData.banner || episodeData.poster)}
          preload="auto"
          onClick={e => e.stopPropagation()}
        >
          {/* Pistes de sous-titres */}
          {subtitles.filter(sub => sub.id !== 'off' && sub.enabled).map(subtitle => (
            <track 
              key={subtitle.id}
              kind="subtitles"
              src={subtitle.src}
              srcLang={subtitle.language}
              label={subtitle.label}
              default={subtitle.id === currentSubtitle}
            />
          ))}
        </video>
        
        {/* Overlay pour les contrôles */}
        {showControls && (
          <motion.div 
            className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black bg-opacity-50"
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={controlsVariants}
          >
            {/* Bouton retour */}
            <div className="absolute top-4 left-4 z-10">
              <button 
                className="text-white hover:text-red-500 transition-colors"
                onClick={() => navigate(`/${type}/${id}`)}
              >
                <X size={24} />
              </button>
            </div>
            
            {/* Informations sur le contenu */}
            <motion.div 
              className="absolute top-4 left-16 z-10"
              variants={infoVariants}
            >
              <h1 className="text-xl font-bold text-white">{episodeData.title}</h1>
              {episodeData.episodes && episodeData.episodes > 1 && (
                <p className="text-gray-300">Épisode {currentEpisode}</p>
              )}
            </motion.div>
            
            {/* Contrôles principaux */}
            <div className="absolute bottom-0 left-0 right-0 p-4">
              {/* Barre de progression */}
              <div 
                ref={progressBarRef}
                className="w-full h-1 bg-gray-600 rounded-full mb-4 cursor-pointer"
                onClick={handleProgressClick}
              >
                <div 
                  className="h-full bg-red-600 rounded-full relative"
                  style={{ width: `${(currentTime / duration) * 100}%` }}
                >
                  <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-3 h-3 bg-red-600 rounded-full"></div>
                </div>
                <input
                  type="range"
                  min="0"
                  max={duration || 100}
                  value={currentTime}
                  onChange={handleProgressChange}
                  className="absolute inset-0 w-full opacity-0 cursor-pointer"
                />
              </div>
              
              {/* Boutons de contrôle */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {/* Lecture/Pause */}
                  <button 
                    className="text-white hover:text-red-500 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      togglePlay();
                    }}
                  >
                    {isPlaying ? <Pause size={24} /> : <Play size={24} />}
                  </button>
                  
                  {/* Épisode précédent (pour les séries) */}
                  {episodeData.episodes && episodeData.episodes > 1 && (
                    <button 
                      className={`text-white hover:text-red-500 transition-colors ${
                        currentEpisode <= 1 ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (currentEpisode > 1) {
                          goToEpisode(currentEpisode - 1);
                        }
                      }}
                      disabled={currentEpisode <= 1}
                    >
                      <SkipBack size={20} />
                    </button>
                  )}
                  
                  {/* Épisode suivant (pour les séries) */}
                  {episodeData.episodes && episodeData.episodes > 1 && (
                    <button 
                      className={`text-white hover:text-red-500 transition-colors ${
                        currentEpisode >= episodeData.episodes ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (currentEpisode < episodeData.episodes) {
                          goToEpisode(currentEpisode + 1);
                        }
                      }}
                      disabled={currentEpisode >= episodeData.episodes}
                    >
                      <SkipForward size={20} />
                    </button>
                  )}
                  
                  {/* Volume */}
                  <div className="flex items-center space-x-2">
                    <button 
                      className="text-white hover:text-red-500 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleMute();
                      }}
                    >
                      {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                    </button>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={isMuted ? 0 : volume}
                      onChange={handleVolumeChange}
                      className="w-20 accent-red-600"
                      onClick={e => e.stopPropagation()}
                    />
                  </div>
                  
                  {/* Temps */}
                  <div className="text-white text-sm">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  {/* Sous-titres */}
                  <div className="relative">
                    <button 
                      className="text-white hover:text-red-500 transition-colors flex items-center space-x-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowSubtitlesMenu(!showSubtitlesMenu);
                        setShowSettings(false);
                      }}
                    >
                      <Type size={20} />
                      <span className="text-sm hidden sm:inline">{getCurrentSubtitleLabel()}</span>
                    </button>
                    
                    {/* Menu des sous-titres */}
                    {showSubtitlesMenu && (
                      <motion.div 
                        className="absolute bottom-full right-0 mb-2 bg-gray-900 rounded-lg shadow-lg p-4 w-48"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ duration: 0.2 }}
                        onClick={e => e.stopPropagation()}
                      >
                        <div className="text-white font-medium mb-2">Sous-titres</div>
                        
                        {subtitles.filter(sub => sub.enabled).map(subtitle => (
                          <button 
                            key={subtitle.id}
                            className={`flex items-center justify-between w-full py-2 px-2 rounded ${
                              currentSubtitle === subtitle.id 
                                ? 'bg-red-600 text-white' 
                                : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                            }`}
                            onClick={() => handleSubtitleChange(subtitle.id)}
                          >
                            {subtitle.label}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </div>
                  
                  {/* Soirée de visionnage */}
                  <div className="relative">
                    <button 
                      className="text-white hover:text-red-500 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        setWatchPartyModalOpen(true);
                        setShowSettings(false);
                        setShowSubtitlesMenu(false);
                      }}
                    >
                      <Users size={20} />
                    </button>
                  </div>
                  
                  {/* Paramètres */}
                  <div className="relative">
                    <button 
                      className="text-white hover:text-red-500 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowSettings(!showSettings);
                        setShowSubtitlesMenu(false);
                      }}
                    >
                      <Settings size={20} />
                    </button>
                    
                    {/* Menu des paramètres */}
                    {showSettings && (
                      <motion.div 
                        className="absolute bottom-full right-0 mb-2 bg-gray-900 rounded-lg shadow-lg p-4 w-48"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ duration: 0.2 }}
                        onClick={e => e.stopPropagation()}
                      >
                        <div className="text-white font-medium mb-2">Paramètres</div>
                        
                        {/* Option de qualité */}
                        <div className="relative">
                          <button 
                            className="flex items-center justify-between w-full text-gray-300 hover:text-white py-2"
                            onClick={() => handleQualityChange('auto')}
                          >
                            <span>Qualité</span>
                            <span className="flex items-center">
                              {quality}
                            </span>
                          </button>
                        </div>
                        
                        {/* Vitesse de lecture */}
                        <button className="flex items-center justify-between w-full text-gray-300 hover:text-white py-2">
                          <span>Vitesse</span>
                          <span>1x</span>
                        </button>
                      </motion.div>
                    )}
                  </div>
                  
                  {/* Plein écran */}
                  <button 
                    className="text-white hover:text-red-500 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFullscreen();
                    }}
                  >
                    {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
        
        {/* Overlay de fin de vidéo */}
        {currentTime > 0 && currentTime >= duration - 0.5 && (
          <motion.div 
            className="absolute inset-0 bg-black bg-opacity-80 flex flex-col items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-2xl font-bold text-white mb-4">
              {episodeData.episodes && currentEpisode < episodeData.episodes 
                ? "Prochain épisode dans 5 secondes..." 
                : "Fin du contenu"}
            </h2>
            
            {episodeData.episodes && currentEpisode < episodeData.episodes ? (
              <div className="flex space-x-4">
                <button 
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded font-medium"
                  onClick={() => goToEpisode(currentEpisode + 1)}
                >
                  Regarder maintenant
                </button>
                <button 
                  className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded font-medium"
                  onClick={() => setCurrentTime(0)}
                >
                  Revoir
                </button>
              </div>
            ) : (
              <div className="flex space-x-4">
                <button 
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded font-medium"
                  onClick={() => navigate(`/${type}/${id}`)}
                >
                  Détails
                </button>
                <button 
                  className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded font-medium"
                  onClick={() => setCurrentTime(0)}
                >
                  Revoir
                </button>
              </div>
            )}
            
            {/* Recommandations */}
            {recommendations.length > 0 && (
              <div className="mt-12 w-full max-w-4xl">
                <h3 className="text-xl font-bold text-white mb-4">Recommandations</h3>
                <div className="flex space-x-4 overflow-x-auto pb-4">
                  {recommendations.slice(0, 5).map((rec, index) => (
                    <ContentCard key={rec.id} item={rec} size="sm" index={index} />
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>
      
      {/* Modal de création de soirée de visionnage */}
      <CreateWatchPartyModal
        open={watchPartyModalOpen}
        onClose={() => setWatchPartyModalOpen(false)}
        contentId={id}
        contentTitle={episodeData?.title}
      />
    </div>
  );
};

export default VideoPlayerPage;
