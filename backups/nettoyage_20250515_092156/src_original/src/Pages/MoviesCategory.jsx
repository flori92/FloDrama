/**
 * Page MoviesCategory
 * Affiche une catégorie de films avec la grille optimisée
 */

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import MovieGrid from '../components/MovieGrid/MovieGrid';
import { handleApiResponse } from '../Constants/FloDramaURLs';
import { API_BASE_URL } from '../Cloudflare/CloudflareConfig';

const MoviesCategory = () => {
  const { category } = useParams();
  const [movies, setMovies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fonction pour obtenir le titre de la catégorie
  const getCategoryTitle = (categorySlug) => {
    const categories = {
      'films': 'Films Populaires',
      'dramas': 'Dramas Coréens',
      'animes': 'Animes',
      'bollywood': 'Films Bollywood',
      'trending': 'Tendances',
      'recent': 'Ajouts Récents'
    };
    
    return categories[categorySlug] || 'Films';
  };

  // Charger les films de la catégorie
  useEffect(() => {
    const fetchMovies = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`${API_BASE_URL}/${category}`);
        const data = await handleApiResponse(response);
        
        // Vérifier si les données sont valides
        if (Array.isArray(data)) {
          setMovies(data);
        } else {
          console.error('Format de données invalide:', data);
          setError('Les données reçues ne sont pas au format attendu.');
        }
      } catch (err) {
        console.error('Erreur lors du chargement des films:', err);
        setError('Impossible de charger les films. Veuillez réessayer plus tard.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchMovies();
  }, [category]);

  return (
    <div className="movies-category-page min-h-screen bg-gradient-to-b from-black to-gray-900 px-4 sm:px-6 lg:px-8 py-16">
      <div className="max-w-7xl mx-auto">
        <MovieGrid 
          title={getCategoryTitle(category)}
          movies={movies}
          isLoading={isLoading}
          error={error}
        />
      </div>
    </div>
  );
};

export default MoviesCategory;
