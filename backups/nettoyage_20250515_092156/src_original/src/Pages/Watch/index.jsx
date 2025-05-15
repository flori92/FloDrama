import React from 'react';
import { useParams, Navigate } from 'react-router-dom';
import VideoPlayerContainer from './VideoPlayerContainer';

/**
 * Composant de redirection pour la page de visionnage
 * Redirige vers le bon type de contenu en fonction des paramètres d'URL
 */
const WatchPage = () => {
  const { type, id, episode } = useParams();
  
  // Vérifier si tous les paramètres nécessaires sont présents
  if (!type || !id) {
    return <Navigate to="/error" replace />;
  }
  
  // Vérifier si le type est valide
  const validTypes = ['anime', 'drama', 'bollywood'];
  if (!validTypes.includes(type)) {
    return <Navigate to="/error" replace />;
  }
  
  // Pour les types qui nécessitent un numéro d'épisode
  if ((type === 'anime' || type === 'drama') && !episode) {
    return <Navigate to={`/${type}/${id}`} replace />;
  }
  
  // Rendu du conteneur de lecteur vidéo
  return <VideoPlayerContainer />;
};

export default WatchPage;
