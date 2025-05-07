/**
 * Composant d'en-tête pour les pages de catégorie
 * 
 * Affiche le titre de la catégorie, une description et des filtres pour 
 * permettre aux utilisateurs de filtrer le contenu par genre, pays, année, etc.
 */

import React from 'react';

interface FilterOption {
  value: string;
  label: string;
}

interface CategoryHeaderProps {
  title: string;
  description: string;
  genres?: string[];
  countries?: string[];
  years?: string[];
  seasons?: string[];
  decades?: string[];
  sortOptions?: FilterOption[];
  activeFilters: {
    genre?: string;
    country?: string;
    year?: string;
    season?: string;
    decade?: string;
    sortBy: string;
  };
  onFilterChange: (filterName: string, value: string) => void;
}

const CategoryHeader: React.FC<CategoryHeaderProps> = ({
  title,
  description,
  genres = [],
  countries = [],
  years = [],
  seasons = [],
  decades = [],
  sortOptions = [],
  activeFilters,
  onFilterChange
}) => {
  return (
    <div className="bg-gradient-to-b from-flo-dark-blue to-flo-dark py-12 mb-8">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl font-bold text-white mb-2">{title}</h1>
        <p className="text-gray-300 mb-8">{description}</p>
        
        <div className="bg-flo-dark-blue/30 p-4 rounded-xl">
          <div className="flex flex-wrap gap-4 items-center">
            {/* Filtre de genre */}
            {genres.length > 0 && (
              <div className="filter-group">
                <label htmlFor="genre" className="text-gray-300 text-sm block mb-1">Genre</label>
                <select
                  id="genre"
                  value={activeFilters.genre || ''}
                  onChange={(e) => onFilterChange('genre', e.target.value)}
                  className="bg-flo-dark border border-flo-purple rounded-lg px-3 py-2 text-white text-sm min-w-[150px]"
                >
                  <option value="">Tous les genres</option>
                  {genres.map((genre) => (
                    <option key={genre} value={genre.toLowerCase()}>
                      {genre}
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            {/* Filtre de pays */}
            {countries.length > 0 && (
              <div className="filter-group">
                <label htmlFor="country" className="text-gray-300 text-sm block mb-1">Pays</label>
                <select
                  id="country"
                  value={activeFilters.country || ''}
                  onChange={(e) => onFilterChange('country', e.target.value)}
                  className="bg-flo-dark border border-flo-purple rounded-lg px-3 py-2 text-white text-sm min-w-[150px]"
                >
                  <option value="">Tous les pays</option>
                  {countries.map((country) => (
                    <option key={country} value={country.toLowerCase()}>
                      {country}
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            {/* Filtre d'année */}
            {years.length > 0 && (
              <div className="filter-group">
                <label htmlFor="year" className="text-gray-300 text-sm block mb-1">Année</label>
                <select
                  id="year"
                  value={activeFilters.year || ''}
                  onChange={(e) => onFilterChange('year', e.target.value)}
                  className="bg-flo-dark border border-flo-purple rounded-lg px-3 py-2 text-white text-sm min-w-[150px]"
                >
                  <option value="">Toutes les années</option>
                  {years.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            {/* Filtre de saison */}
            {seasons.length > 0 && (
              <div className="filter-group">
                <label htmlFor="season" className="text-gray-300 text-sm block mb-1">Saison</label>
                <select
                  id="season"
                  value={activeFilters.season || ''}
                  onChange={(e) => onFilterChange('season', e.target.value)}
                  className="bg-flo-dark border border-flo-purple rounded-lg px-3 py-2 text-white text-sm min-w-[150px]"
                >
                  <option value="">Toutes les saisons</option>
                  {seasons.map((season) => (
                    <option key={season} value={season.toLowerCase()}>
                      {season}
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            {/* Filtre de décennie */}
            {decades.length > 0 && (
              <div className="filter-group">
                <label htmlFor="decade" className="text-gray-300 text-sm block mb-1">Décennie</label>
                <select
                  id="decade"
                  value={activeFilters.decade || ''}
                  onChange={(e) => onFilterChange('decade', e.target.value)}
                  className="bg-flo-dark border border-flo-purple rounded-lg px-3 py-2 text-white text-sm min-w-[150px]"
                >
                  <option value="">Toutes les décennies</option>
                  {decades.map((decade) => (
                    <option key={decade} value={decade.toLowerCase()}>
                      {decade}
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            {/* Options de tri */}
            {sortOptions.length > 0 && (
              <div className="filter-group ml-auto">
                <label htmlFor="sortBy" className="text-gray-300 text-sm block mb-1">Trier par</label>
                <select
                  id="sortBy"
                  value={activeFilters.sortBy}
                  onChange={(e) => onFilterChange('sortBy', e.target.value)}
                  className="bg-flo-dark border border-flo-purple rounded-lg px-3 py-2 text-white text-sm min-w-[150px]"
                >
                  {sortOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryHeader;
