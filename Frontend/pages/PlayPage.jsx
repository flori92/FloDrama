import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, Info } from 'lucide-react';
import { useMetadata } from '../hooks/useMetadata';
import { getVideoUrl } from '../api/metadata';
import LoadingSpinner from '../components/ui/LoadingSpinner';

/**
 * Page de lecture vidéo pour FloDrama
 * Permet de lire les épisodes de dramas et les films
 */
const PlayPage = () => {
  const { type, id, episode } = useParams();
  const { getItemById, isLoading, error } = useMetadata();
  const [item, setItem] = useState(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [isVideoLoading, setIsVideoLoading] = useState(true);
  const [videoError, setVideoError] = useState(null);

  // Charger les données du contenu
  useEffect(() => {
    if (isLoading || error) return;
    
    const contentItem = getItemById(id);
    if (contentItem) {
      setItem(contentItem);
      
      // Déterminer l'URL de la vidéo
      try {
        const url = getVideoUrl(contentItem, episode);
        setVideoUrl(url);
      } catch (err) {
        console.error('Erreur lors de la récupération de l\'URL vidéo:', err);
        setVideoError('Impossible de charger la vidéo. Veuillez réessayer plus tard.');
      } finally {
        setIsVideoLoading(false);
      }
    } else {
      setVideoError('Contenu non trouvé');
      setIsVideoLoading(false);
    }
  }, [id, episode, isLoading, error, getItemById]);

  // Gérer le chargement de la vidéo
  const handleVideoLoad = () => {
    setIsVideoLoading(false);
  };

  // Gérer les erreurs de vidéo
  const handleVideoError = () => {
    setIsVideoLoading(false);
    setVideoError('Erreur lors du chargement de la vidéo. Veuillez réessayer plus tard.');
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="relative min-h-screen bg-black"
    >
      {/* Bouton retour */}
      <div className="absolute top-4 left-4 z-10">
        <Link
          to={`/${type}/${id}`}
          className="flex items-center gap-2 text-white bg-black bg-opacity-50 p-2 rounded-full hover:bg-opacity-70 transition-all"
        >
          <ChevronLeft size={20} />
          <span className="hidden md:inline">Retour</span>
        </Link>
      </div>

      {/* Contenu principal */}
      <div className="w-full h-screen flex flex-col items-center justify-center">
        {isLoading || isVideoLoading ? (
          <div className="flex flex-col items-center justify-center">
            <LoadingSpinner size="large" />
            <p className="mt-4 text-white">Chargement de la vidéo...</p>
          </div>
        ) : videoError ? (
          <div className="flex flex-col items-center justify-center text-white">
            <Info size={48} className="text-red-500 mb-4" />
            <h2 className="text-xl font-bold mb-2">Erreur de lecture</h2>
            <p className="text-center max-w-md">{videoError}</p>
            <Link
              to={`/${type}/${id}`}
              className="mt-6 px-6 py-2 bg-fuchsia-600 rounded-full hover:bg-fuchsia-700 transition-colors"
            >
              Retour aux détails
            </Link>
          </div>
        ) : (
          <div className="w-full h-full max-w-7xl mx-auto">
            {videoUrl && (
              <video
                className="w-full h-full object-contain"
                controls
                autoPlay
                src={videoUrl}
                onLoadedData={handleVideoLoad}
                onError={handleVideoError}
              />
            )}
          </div>
        )}
      </div>

      {/* Informations sur le contenu en cours de lecture */}
      {item && !isVideoLoading && !videoError && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-xl md:text-2xl font-bold text-white">
              {item.title}
              {episode && ` - Épisode ${episode}`}
            </h1>
            {item.year && (
              <p className="text-gray-300 text-sm">{item.year}</p>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default PlayPage;
