/**
 * Composant MovieGrid
 * Affiche une grille de films avec des cartes optimisées
 */

import React from 'react';
import MovieCard from '../MovieCard/MovieCard';

const MovieGrid = ({ title, movies, isLoading, error }) => {
  return (
    <div className="movie-grid-container my-8">
      {/* Titre de la section */}
      <h2 className="text-2xl font-bold text-white mb-4">{title}</h2>
      
      {/* État de chargement */}
      {isLoading && (
        <div className="flex justify-center items-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-flodrama-fuchsia"></div>
        </div>
      )}
      
      {/* Message d'erreur */}
      {error && (
        <div className="bg-red-900/30 text-white p-4 rounded-lg mb-4">
          <p>Une erreur est survenue lors du chargement des films.</p>
        </div>
      )}
      
      {/* Grille de films */}
      {!isLoading && !error && movies && movies.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {movies.map((movie, index) => (
            <MovieCard key={movie.id || `movie-${index}`} movie={movie} isLarge={false} />
          ))}
        </div>
      )}
      
      {/* Message si aucun film n'est disponible */}
      {!isLoading && !error && (!movies || movies.length === 0) && (
        <div className="bg-gray-900/30 text-white p-8 rounded-lg text-center">
          <p>Aucun film disponible dans cette catégorie.</p>
        </div>
      )}
    </div>
  );
};

export default MovieGrid;
