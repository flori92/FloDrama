/**
 * Composant WatchPartyPlayer
 * Lecteur vidéo synchronisé pour les sessions WatchParty
 */

import React, { useState, useEffect, useRef } from 'react';
import YouTube from 'react-youtube';
import { useWatchParty } from '../../Context/WatchPartyContext';

const WatchPartyPlayer = () => {
  const { playerState, updatePlayerState } = useWatchParty();
  const [player, setPlayer] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const [isSeeking, setIsSeeking] = useState(false);
  const [localCurrentTime, setLocalCurrentTime] = useState(0);
  const [showControls, setShowControls] = useState(false);
  const syncIntervalRef = useRef(null);
  const lastUpdateRef = useRef(0);
  
  // Configuration du lecteur YouTube
  const opts = {
    height: '100%',
    width: '100%',
    playerVars: {
      autoplay: 0,
      controls: 0,
      disablekb: 1,
      enablejsapi: 1,
      fs: 0,
      modestbranding: 1,
      rel: 0,
      origin: window.location.origin,
    },
  };
  
  // Initialiser le lecteur
  const onReady = (event) => {
    setPlayer(event.target);
    setIsReady(true);
    
    // Mettre à jour la durée totale
    updatePlayerState({
      duration: event.target.getDuration(),
    });
  };
  
  // Gérer les changements d'état du lecteur
  const onStateChange = (event) => {
    if (!isReady || isSeeking) {
      return;
    }
    
    const now = Date.now();
    if (now - lastUpdateRef.current < 500) {
      return; // Limiter les mises à jour
    }
    lastUpdateRef.current = now;
    
    const newState = event.data;
    
    // 1 = playing, 2 = paused
    if (newState === 1 && !playerState.playing) {
      updatePlayerState({ playing: true });
    } else if (newState === 2 && playerState.playing) {
      updatePlayerState({ playing: false });
    }
  };
  
  // Synchroniser le temps de lecture
  useEffect(() => {
    if (!isReady || !player) {
      return;
    }
    
    // Démarrer ou arrêter la lecture selon l'état
    if (playerState.playing && player.getPlayerState() !== 1) {
      player.playVideo();
    } else if (!playerState.playing && player.getPlayerState() === 1) {
      player.pauseVideo();
    }
    
    // Synchroniser la position de lecture si nécessaire
    const currentTime = player.getCurrentTime();
    const timeDiff = Math.abs(currentTime - playerState.currentTime);
    
    if (timeDiff > 3 && !isSeeking) {
      setIsSeeking(true);
      player.seekTo(playerState.currentTime, true);
      setTimeout(() => setIsSeeking(false), 500);
    }
  }, [playerState.playing, playerState.currentTime, isReady, player, isSeeking]);
  
  // Mettre à jour périodiquement la position de lecture
  useEffect(() => {
    if (!isReady || !player) {
      return;
    }
    
    const updateCurrentTime = () => {
      if (player && isReady && !isSeeking && playerState.playing) {
        const currentTime = player.getCurrentTime();
        setLocalCurrentTime(currentTime);
        
        // Mettre à jour l'état global toutes les 5 secondes
        const now = Date.now();
        if (now - lastUpdateRef.current > 5000) {
          lastUpdateRef.current = now;
          updatePlayerState({ currentTime });
        }
      }
    };
    
    syncIntervalRef.current = setInterval(updateCurrentTime, 1000);
    
    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, [isReady, player, playerState.playing, isSeeking, updatePlayerState]);
  
  // Nettoyer les ressources lors du démontage
  useEffect(() => {
    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, []);
  
  // Formater le temps en minutes:secondes
  const formatTime = (timeInSeconds) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };
  
  // Gérer le clic sur la barre de progression
  const handleProgressClick = (e) => {
    if (!isReady || !player) return;
    
    const progressBar = e.currentTarget;
    const rect = progressBar.getBoundingClientRect();
    const clickPosition = (e.clientX - rect.left) / rect.width;
    const newTime = clickPosition * playerState.duration;
    
    setIsSeeking(true);
    player.seekTo(newTime, true);
    updatePlayerState({ currentTime: newTime });
    
    setTimeout(() => setIsSeeking(false), 500);
  };
  
  // Gérer le clic sur le bouton play/pause
  const handlePlayPause = () => {
    updatePlayerState({ playing: !playerState.playing });
  };
  
  // Calculer le pourcentage de progression
  const progressPercentage = playerState.duration > 0
    ? (localCurrentTime / playerState.duration) * 100
    : 0;
  
  return (
    <div 
      className="relative bg-black rounded-lg overflow-hidden"
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      {/* Lecteur vidéo */}
      <div className="aspect-video">
        {playerState.contentId ? (
          <YouTube
            videoId={playerState.contentId}
            opts={opts}
            onReady={onReady}
            onStateChange={onStateChange}
            className="w-full h-full"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-900">
            <p className="text-white text-lg">Aucune vidéo sélectionnée</p>
          </div>
        )}
      </div>
      
      {/* Contrôles du lecteur */}
      <div 
        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4 transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* Barre de progression */}
        <div 
          className="w-full h-2 bg-gray-700 rounded-full mb-4 cursor-pointer"
          onClick={handleProgressClick}
        >
          <div 
            className="h-full bg-flodrama-fuchsia rounded-full"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
        
        {/* Contrôles et temps */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {/* Bouton play/pause */}
            <button 
              onClick={handlePlayPause}
              className="text-white mr-4 focus:outline-none"
            >
              {playerState.playing ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </button>
            
            {/* Affichage du temps */}
            <div className="text-white text-sm">
              {formatTime(localCurrentTime)} / {formatTime(playerState.duration)}
            </div>
          </div>
          
          {/* Titre du contenu */}
          <div className="text-white font-medium truncate max-w-xs">
            {playerState.contentTitle}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WatchPartyPlayer;
