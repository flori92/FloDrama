/**
 * Composant de carte de contenu pour FloDrama
 * 
 * Ce composant affiche une carte de contenu avec prévisualisation de trailer au survol,
 * adapté pour l'architecture Cloudflare.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { ContentItem } from '../types/content';
import useTrailerPreview from '../hooks/useTrailerPreview';
import VideoButton from './VideoButton';
import OptimizedImage from './OptimizedImage';
import { motion } from 'framer-motion';

interface ContentCardProps {
  item: ContentItem;
  onLike?: (id: string) => void;
  onDislike?: (id: string) => void;
  onAddToFavorites?: (id: string) => void;
  isLiked?: boolean;
  isDisliked?: boolean;
  isFavorite?: boolean;
}

const ContentCard: React.FC<ContentCardProps> = ({
  item,
  onLike,
  onDislike,
  onAddToFavorites,
  isLiked = false,
  isDisliked = false,
  isFavorite = false
}) => {
  // Hook de prévisualisation du trailer
  const trailerPreview = useTrailerPreview(800); // 800ms de délai avant prévisualisation

  return (
    <motion.div
      className="relative group cursor-pointer rounded-xl overflow-hidden shadow-lg bg-flo-secondary"
      whileHover={{ scale: 1.05 }}
      transition={{ duration: 0.3 }}
      data-trailer-url={item.trailerUrl || ''}
      {...trailerPreview.bind}
    >
      {/* Image principale avec OptimizedImage */}
      <div className="relative aspect-[2/3] overflow-hidden">
        <OptimizedImage
          src={item.poster || item.posterUrl || item.imageUrl || ''}
          alt={item.title}
          className="w-full h-full group-hover:brightness-110 transition-all duration-300"
          fallbackSrc="/images/placeholder-poster.jpg"
        />
        
        {/* Bouton de lecture vidéo */}
        {item.videoId && (
          <VideoButton 
            videoId={item.videoId} 
            variant="overlay" 
            size="large" 
            poster={item.posterUrl}
          />
        )}
        
        {/* Overlay avec boutons et prévisualisation */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end items-center p-2 gap-2">
          {/* Catégorie */}
          {item.category && (
            <span className="category-name text-white group-hover:text-flo-fuchsia transition-colors duration-300">
              {item.category}
            </span>
          )}
          
          {/* Boutons d'action */}
          <div className="flex justify-center gap-2 mb-2 w-full">
            <button
              onClick={(e) => { e.stopPropagation(); onLike?.(item.id); }}
              className={`p-2 rounded-full bg-black/60 hover:bg-flo-violet ${isLiked ? 'text-flo-fuchsia' : 'text-white'}`}
              aria-label="J'aime"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
              </svg>
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDislike?.(item.id); }}
              className={`p-2 rounded-full bg-black/60 hover:bg-flo-blue ${isDisliked ? 'text-flo-blue' : 'text-white'}`}
              aria-label="Je n'aime pas"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2" />
              </svg>
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onAddToFavorites?.(item.id); }}
              className={`p-2 rounded-full bg-black/60 hover:bg-flo-gold ${isFavorite ? 'text-flo-gold' : 'text-white'}`}
              aria-label="Ajouter aux favoris"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill={isFavorite ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </button>
            {item.videoId && (
              <VideoButton 
                videoId={item.videoId} 
                variant="primary" 
                size="medium" 
                label="Regarder"
                className="content-card-button"
              />
            )}
            {item.trailerUrl && (
              <button className="content-card-button secondary">
                Bande-annonce
              </button>
            )}
          </div>
          
          {/* Prévisualisation du trailer */}
          {trailerPreview.isPreviewing && trailerPreview.trailerUrl === item.trailerUrl && item.trailerUrl && (
            <video
              src={item.trailerUrl}
              autoPlay
              muted
              loop
              className="absolute inset-0 w-full h-full object-cover z-10"
            />
          )}
        </div>
      </div>
      
      {/* Informations du contenu */}
      <div className="p-3">
        <h3 className="text-white font-bold text-lg truncate group-hover:text-flo-blue transition-colors duration-300">
          {item.title}
        </h3>
        <div className="flex justify-between items-center mt-1">
          <span className="text-white text-sm opacity-80 group-hover:opacity-100 transition-opacity duration-300">
            {item.year}
          </span>
          {item.rating && (
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-flo-gold" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="text-white ml-1 text-sm">{item.rating.toFixed(1)}</span>
            </div>
          )}
        </div>
        
        {/* Genres */}
        {item.genres && item.genres.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {item.genres.slice(0, 3).map((genre: string, index: number) => (
              <span 
                key={index} 
                className="text-white text-xs px-2 py-0.5 bg-black/30 rounded-full hover:text-flo-violet transition-colors duration-300"
              >
                {genre}
              </span>
            ))}
          </div>
        )}
      </div>
      
      {/* Lien vers la page détaillée */}
      <Link 
        to={`/content/${item.id}`} 
        className="absolute inset-0 z-20"
        aria-label={`Voir les détails de ${item.title}`}
      />
    </motion.div>
  );
};

// Utilisation de React.memo pour éviter les rendus inutiles
// Le composant ne sera re-rendu que si ses props changent
export default React.memo(ContentCard, (prevProps, nextProps) => {
  // Comparaison personnalisée pour optimiser les performances
  return (
    prevProps.item.id === nextProps.item.id &&
    prevProps.isLiked === nextProps.isLiked &&
    prevProps.isDisliked === nextProps.isDisliked &&
    prevProps.isFavorite === nextProps.isFavorite
  );
});
