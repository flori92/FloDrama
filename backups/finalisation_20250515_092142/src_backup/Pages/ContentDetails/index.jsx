import React from 'react';
import { useParams, Navigate } from 'react-router-dom';
import AnimeDetails from './AnimeDetails';
import DramaDetails from './DramaDetails';
import BollywoodDetails from './BollywoodDetails';

/**
 * Composant de redirection pour les pages de détails de contenu
 * Redirige vers le bon type de contenu en fonction des paramètres d'URL
 */
const ContentDetails = () => {
  const { type, id } = useParams();
  
  // Vérifier si tous les paramètres nécessaires sont présents
  if (!type || !id) {
    return <Navigate to="/error" replace />;
  }
  
  // Rediriger vers le bon composant en fonction du type
  switch (type) {
    case 'anime':
      return <AnimeDetails />;
    case 'drama':
      return <DramaDetails />;
    case 'bollywood':
      return <BollywoodDetails />;
    default:
      return <Navigate to="/error" replace />;
  }
};

export default ContentDetails;
