/**
 * Composant MovieCard
 * Affiche une carte de film avec image optimisée et informations de base
 */

import React from 'react';
import { Link } from 'react-router-dom';
import useOptimizedImages from '../../hooks/useOptimizedImages';
import StarRatings from 'react-star-ratings';
import { determineContentType } from '../../Cloudflare/CloudflareConfig';

// Fonction utilitaire pour garantir que les valeurs de notation sont valides
const ensureValidRating = (rating) => {
  // Si la valeur est undefined ou null, retourner la valeur par défaut
  if (rating === undefined || rating === null) {
    return 3.5;
  }
  
  // Si c'est déjà un nombre, le traiter
  if (typeof rating === 'number') {
    // Vérifier si c'est un nombre valide (pas NaN)
    if (isNaN(rating)) {
      return 3.5;
    }
    // Convertir à une échelle de 5 étoiles si nécessaire (TMDB utilise une échelle de 10)
    return rating > 5 ? rating / 2 : rating;
  }
  
  // Si c'est une chaîne, essayer de la convertir en nombre
  if (typeof rating === 'string') {
    const parsedRating = parseFloat(rating);
    if (isNaN(parsedRating)) {
      return 3.5;
    }
    return parsedRating > 5 ? parsedRating / 2 : parsedRating;
  }
  
  // Pour tout autre type, retourner la valeur par défaut
  return 3.5;
};

const MovieCard = ({ movie, isLarge = false }) => {
  // Utiliser le hook pour gérer les images optimisées
  const { imageUrls, isLoading, hasError } = useOptimizedImages(movie, {
    preload: false,
    posterSize: isLarge ? 'large' : 'medium',
    backdropSize: 'medium'
  });

  // Déterminer le titre à afficher
  const title = movie?.title || movie?.name || movie?.original_title || 'Film sans titre';
  
  // Déterminer la note à afficher
  const rating = ensureValidRating(movie?.vote_average || movie?.rating);
  
  // Déterminer le type de contenu et construire l'URL de détail
  const getDetailUrl = () => {
    if (!movie || !movie.id) {
      return '#';
    }
    
    // Si le type est explicitement défini dans l'objet
    if (movie.content_type) {
      return `/${movie.content_type}/${movie.id}`;
    }
    
    // Utiliser la fonction de détermination du type de contenu
    const contentType = determineContentType(movie);
    return `/${contentType}/${movie.id}`;
  };

  return (
    <div className="movie-card relative rounded-lg overflow-hidden shadow-lg transition-transform duration-300 hover:scale-105 hover:z-10">
      {isLoading ? (
        <div className="w-full h-full bg-gray-800 animate-pulse flex items-center justify-center">
          <span className="text-white">Chargement...</span>
        </div>
      ) : (
        <Link to={getDetailUrl()} className="block">
          <div className="relative">
            {/* Image principale */}
            <img
              src={isLarge ? imageUrls.poster : imageUrls.backdrop}
              alt={title}
              className={`w-full ${isLarge ? 'aspect-[2/3]' : 'aspect-[16/9]'} object-cover`}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = isLarge ? '/images/default-poster.svg' : '/images/default-backdrop.svg';
              }}
            />
            
            {/* Overlay avec informations */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
              <h3 className="text-white font-bold truncate">{title}</h3>
              
              {/* Affichage de la note */}
              <div className="flex items-center mt-1">
                <StarRatings
                  rating={rating}
                  starRatedColor="#FF4F9A"
                  starEmptyColor="#444"
                  numberOfStars={5}
                  starDimension="16px"
                  starSpacing="1px"
                  name="rating"
                />
                <span className="text-white text-sm ml-2">{typeof rating === 'number' && !isNaN(rating) ? rating.toFixed(1) : '3.5'}</span>
              </div>
            </div>
          </div>
        </Link>
      )}
    </div>
  );
};

export default MovieCard;
