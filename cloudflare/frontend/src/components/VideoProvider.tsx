/**
 * Fournisseur de lecteur vidéo pour FloDrama
 * 
 * Ce composant encapsule la logique du lecteur vidéo global et
 * rend disponible le modal vidéo dans toute l'application.
 */

import React from 'react';
import VideoModal from './VideoModal';

interface VideoProviderProps {
  children: React.ReactNode;
}

const VideoProvider: React.FC<VideoProviderProps> = ({ children }) => {
  return (
    <>
      {children}
      <VideoModal />
    </>
  );
};

export default VideoProvider;
