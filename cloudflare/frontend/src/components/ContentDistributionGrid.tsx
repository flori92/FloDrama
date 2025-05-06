/**
 * Composant de grille de distribution de contenu pour FloDrama
 * 
 * Ce composant affiche une grille de cartes de contenu avec des options de filtrage et de tri.
 * Il utilise le service de distribution de contenu pour récupérer les données.
 */

import React, { useState, useEffect } from 'react';
import ContentCard from './ContentCard';
import { ContentItem } from '../types/content';
import { getCategoryContent, getAvailableGenres, getAvailableLanguages, getAvailableYears } from '../services/contentDistributionService';

// Types pour les filtres
interface FilterOptions {
  genres: string[];
  languages: string[];
  years: number[];
}

// Types pour les options de tri
type SortOption = {
  label: string;
  value: string;
};

// Props du composant
interface ContentDistributionGridProps {
  contentType: string;
  title: string;
  initialLimit?: number;
  showFilters?: boolean;
}

const ContentDistributionGrid: React.FC<ContentDistributionGridProps> = ({
  contentType,
  title,
  initialLimit = 24,
  showFilters = true
}) => {
  // États pour les données et le chargement
  const [items, setItems] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // États pour la pagination
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  
  // États pour les filtres
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    genres: [],
    languages: [],
    years: []
  });
  
  // États pour les filtres sélectionnés
  const [selectedGenre, setSelectedGenre] = useState<string>('');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedSort, setSelectedSort] = useState<string>('rating:desc');
  
  // Options de tri disponibles
  const sortOptions: SortOption[] = [
    { label: 'Mieux notés', value: 'rating:desc' },
    { label: 'Plus récents', value: 'release_date:desc' },
    { label: 'Plus anciens', value: 'release_date:asc' },
    { label: 'Alphabétique (A-Z)', value: 'title:asc' },
    { label: 'Alphabétique (Z-A)', value: 'title:desc' }
  ];
  
  // Charger les options de filtres au montage du composant
  useEffect(() => {
    const loadFilterOptions = async () => {
      try {
        const [genres, languages, years] = await Promise.all([
          getAvailableGenres(contentType),
          getAvailableLanguages(contentType),
          getAvailableYears(contentType)
        ]);
        
        setFilterOptions({
          genres,
          languages,
          years
        });
      } catch (err) {
        console.error('Erreur lors du chargement des options de filtres:', err);
      }
    };
    
    loadFilterOptions();
  }, [contentType]);
  
  // Charger les contenus en fonction des filtres et de la pagination
  useEffect(() => {
    const loadContent = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const params = {
          page,
          limit: initialLimit,
          genre: selectedGenre || undefined,
          language: selectedLanguage || undefined,
          year: selectedYear || undefined,
          sort: selectedSort
        };
        
        const data = await getCategoryContent(contentType, params);
        
        if (page === 1) {
          setItems(data);
        } else {
          setItems(prevItems => [...prevItems, ...data]);
        }
        
        // Si on reçoit moins d'éléments que la limite, on a atteint la fin
        setHasMore(data.length === initialLimit);
      } catch (err) {
        setError('Erreur lors du chargement des contenus. Veuillez réessayer.');
        console.error('Erreur lors du chargement des contenus:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadContent();
  }, [contentType, page, selectedGenre, selectedLanguage, selectedYear, selectedSort, initialLimit]);
  
  // Fonction pour charger plus de contenus
  const handleLoadMore = () => {
    setPage(prevPage => prevPage + 1);
  };
  
  // Fonction pour réinitialiser les filtres
  const handleResetFilters = () => {
    setSelectedGenre('');
    setSelectedLanguage('');
    setSelectedYear(null);
    setSelectedSort('rating:desc');
    setPage(1);
  };
  
  // Fonction pour gérer les changements de filtres
  const handleFilterChange = () => {
    // Réinitialiser la pagination lors d'un changement de filtre
    setPage(1);
  };
  
  return (
    <div className="content-distribution-grid">
      <div className="container mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold text-white mb-6">{title}</h2>
        
        {/* Filtres */}
        {showFilters && (
          <div className="filters-container bg-flo-secondary p-4 rounded-xl mb-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Filtre par genre */}
              <div className="filter-group">
                <label htmlFor="genre-filter" className="block text-white mb-2">Genre</label>
                <select
                  id="genre-filter"
                  value={selectedGenre}
                  onChange={(e) => {
                    setSelectedGenre(e.target.value);
                    handleFilterChange();
                  }}
                  className="w-full bg-flo-primary text-white border border-flo-violet rounded-lg p-2"
                >
                  <option value="">Tous les genres</option>
                  {filterOptions.genres.map((genre) => (
                    <option key={genre} value={genre}>{genre}</option>
                  ))}
                </select>
              </div>
              
              {/* Filtre par langue */}
              <div className="filter-group">
                <label htmlFor="language-filter" className="block text-white mb-2">Langue</label>
                <select
                  id="language-filter"
                  value={selectedLanguage}
                  onChange={(e) => {
                    setSelectedLanguage(e.target.value);
                    handleFilterChange();
                  }}
                  className="w-full bg-flo-primary text-white border border-flo-violet rounded-lg p-2"
                >
                  <option value="">Toutes les langues</option>
                  {filterOptions.languages.map((language) => (
                    <option key={language} value={language}>{language}</option>
                  ))}
                </select>
              </div>
              
              {/* Filtre par année */}
              <div className="filter-group">
                <label htmlFor="year-filter" className="block text-white mb-2">Année</label>
                <select
                  id="year-filter"
                  value={selectedYear || ''}
                  onChange={(e) => {
                    setSelectedYear(e.target.value ? parseInt(e.target.value) : null);
                    handleFilterChange();
                  }}
                  className="w-full bg-flo-primary text-white border border-flo-violet rounded-lg p-2"
                >
                  <option value="">Toutes les années</option>
                  {filterOptions.years.map((year) => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
              
              {/* Options de tri */}
              <div className="filter-group">
                <label htmlFor="sort-options" className="block text-white mb-2">Trier par</label>
                <select
                  id="sort-options"
                  value={selectedSort}
                  onChange={(e) => {
                    setSelectedSort(e.target.value);
                    handleFilterChange();
                  }}
                  className="w-full bg-flo-primary text-white border border-flo-violet rounded-lg p-2"
                >
                  {sortOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
            </div>
            
            {/* Bouton de réinitialisation des filtres */}
            <div className="flex justify-end mt-4">
              <button
                onClick={handleResetFilters}
                className="bg-flo-violet hover:bg-flo-fuchsia text-white px-4 py-2 rounded-lg transition-colors duration-300"
              >
                Réinitialiser les filtres
              </button>
            </div>
          </div>
        )}
        
        {/* Message d'erreur */}
        {error && (
          <div className="bg-red-500 text-white p-4 rounded-lg mb-6">
            {error}
          </div>
        )}
        
        {/* Grille de contenu */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {items.map((item) => (
            <ContentCard
              key={item.id}
              item={item}
            />
          ))}
          
          {/* Indicateur de chargement pour les éléments de la grille */}
          {isLoading && Array.from({ length: 6 }).map((_, index) => (
            <div
              key={`skeleton-${index}`}
              className="aspect-[2/3] bg-flo-secondary rounded-xl animate-pulse"
            />
          ))}
        </div>
        
        {/* Bouton "Charger plus" */}
        {hasMore && !isLoading && (
          <div className="flex justify-center mt-8">
            <button
              onClick={handleLoadMore}
              className="bg-flo-blue hover:bg-flo-violet text-white px-6 py-3 rounded-lg transition-colors duration-300"
            >
              Charger plus
            </button>
          </div>
        )}
        
        {/* Indicateur de chargement pour le bouton "Charger plus" */}
        {isLoading && page > 1 && (
          <div className="flex justify-center mt-8">
            <div className="bg-flo-secondary text-white px-6 py-3 rounded-lg">
              Chargement...
            </div>
          </div>
        )}
        
        {/* Message de fin de liste */}
        {!hasMore && items.length > 0 && (
          <div className="text-center text-white opacity-70 mt-8">
            Vous avez atteint la fin de la liste
          </div>
        )}
        
        {/* Message de liste vide */}
        {!isLoading && items.length === 0 && (
          <div className="text-center text-white opacity-70 mt-8 p-12 bg-flo-secondary rounded-xl">
            <svg className="w-16 h-16 mx-auto mb-4 text-flo-violet" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-xl font-bold mb-2">Aucun contenu trouvé</h3>
            <p>Essayez de modifier vos filtres pour voir plus de résultats.</p>
            <button
              onClick={handleResetFilters}
              className="mt-4 bg-flo-violet hover:bg-flo-fuchsia text-white px-4 py-2 rounded-lg transition-colors duration-300"
            >
              Réinitialiser les filtres
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContentDistributionGrid;
