import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Filter, X, ChevronDown, Check } from 'lucide-react';
import { useMetadata } from '../hooks/useMetadata';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import AppleStyleCard from '../components/cards/AppleStyleCard';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import NoResults from '../components/ui/NoResults';
import FastSearch from '../components/search/FastSearch';
import SmartScrapingService from '../services/SmartScrapingService.js';

/**
 * Page de recherche de FloDrama
 */
const SearchPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isLoading, searchContent } = useMetadata();
  
  // États pour la recherche et les filtres
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [resultsCount, setResultsCount] = useState(0);
  const [useElasticSearch, setUseElasticSearch] = useState(true);
  const [searchPerformance, setSearchPerformance] = useState(null);
  
  // États pour les filtres
  const [filters, setFilters] = useState({
    type: [],
    genre: [],
    country: [],
    year: [],
    minRating: 0
  });
  
  // Options de filtres disponibles
  const filterOptions = {
    type: ['Drama', 'Movie', 'Anime', 'Bollywood'],
    genre: ['Action', 'Comédie', 'Romance', 'Thriller', 'Fantastique', 'Historique', 'Drame', 'Horreur', 'Science-Fiction'],
    country: ['Corée du Sud', 'Japon', 'Chine', 'Thaïlande', 'Inde', 'États-Unis'],
    year: ['2023', '2022', '2021', '2020', '2019', '2018', '2017', '2016', '2015']
  };
  
  // Effectuer la recherche
  const performSearch = useCallback(async (query = searchQuery, currentFilters = filters) => {
    if (!query) return;
    
    setIsSearching(true);
    setHasSearched(true);
    
    // Mesurer le temps de recherche
    const startTime = performance.now();
    
    try {
      let results = [];
      
      // Utiliser Elasticsearch pour une recherche ultra-rapide
      if (useElasticSearch) {
        // Mapper les types de filtres
        const type = currentFilters.type.length > 0 
          ? currentFilters.type.map(t => t.toLowerCase()).includes('drama') 
            ? 'drama' 
            : currentFilters.type.map(t => t.toLowerCase()).includes('anime')
              ? 'anime'
              : currentFilters.type.map(t => t.toLowerCase()).includes('movie')
                ? 'movie'
                : 'all'
          : 'all';
        
        results = await SmartScrapingService.searchFast(query, type, {
          size: 50,
          sort: '_score'
        });
      } else {
        // Utiliser la recherche traditionnelle
        results = searchContent(query, currentFilters);
      }
      
      // Filtrer les résultats invalides (sans titre ou sans image)
      const validResults = results.filter(item => 
        item && 
        item.title && 
        (item.poster || item.backdrop || item.image)
      );
      
      setSearchResults(validResults);
      setResultsCount(validResults.length);
      
      // Calculer le temps de recherche
      const endTime = performance.now();
      setSearchPerformance({
        time: (endTime - startTime).toFixed(2),
        count: validResults.length,
        method: useElasticSearch ? 'elasticsearch' : 'traditional'
      });
      
    } catch (error) {
      console.error('Erreur lors de la recherche:', error);
      setSearchResults([]);
      setResultsCount(0);
      
      // Calculer le temps d'échec
      const endTime = performance.now();
      setSearchPerformance({
        time: (endTime - startTime).toFixed(2),
        count: 0,
        method: useElasticSearch ? 'elasticsearch' : 'traditional',
        error: error.message
      });
      
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery, filters, searchContent, useElasticSearch]);
  
  // Mettre à jour l'URL avec les paramètres de recherche
  const updateSearchParams = useCallback(() => {
    const params = new URLSearchParams();
    
    if (searchQuery) params.set('q', searchQuery);
    
    if (filters.type.length > 0) params.set('type', filters.type.join(','));
    if (filters.genre.length > 0) params.set('genre', filters.genre.join(','));
    if (filters.country.length > 0) params.set('country', filters.country.join(','));
    if (filters.year.length > 0) params.set('year', filters.year.join(','));
    if (filters.minRating > 0) params.set('rating', filters.minRating.toString());
    
    navigate(`/search?${params.toString()}`);
  }, [searchQuery, filters, navigate]);
  
  // Récupérer les paramètres de l'URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const query = params.get('q');
    
    if (query) {
      setSearchQuery(query);
      performSearch(query, filters);
    }
    
    // Récupérer les filtres de l'URL
    const typeFilter = params.get('type');
    const genreFilter = params.get('genre');
    const countryFilter = params.get('country');
    const yearFilter = params.get('year');
    const ratingFilter = params.get('rating');
    
    const newFilters = { ...filters };
    
    if (typeFilter) newFilters.type = typeFilter.split(',');
    if (genreFilter) newFilters.genre = genreFilter.split(',');
    if (countryFilter) newFilters.country = countryFilter.split(',');
    if (yearFilter) newFilters.year = yearFilter.split(',');
    if (ratingFilter) newFilters.minRating = parseInt(ratingFilter, 10);
    
    setFilters(newFilters);
  }, [location.search, performSearch, filters]);
  
  // Gérer la soumission du formulaire de recherche
  const handleSubmit = (e) => {
    e.preventDefault();
    updateSearchParams();
    performSearch();
  };
  
  // Gérer la sélection d'un résultat de recherche rapide
  const handleFastSearchResultSelect = (result) => {
    // Naviguer vers la page de détail
    navigate(`/watch/${result.id || result.title.replace(/\s+/g, '-').toLowerCase()}`);
  };
  
  // Gérer les changements de filtres
  const handleFilterChange = (filterType, value) => {
    setFilters(prevFilters => {
      const newFilters = { ...prevFilters };
      
      if (filterType === 'minRating') {
        newFilters.minRating = value;
      } else {
        const index = newFilters[filterType].indexOf(value);
        
        if (index === -1) {
          newFilters[filterType] = [...newFilters[filterType], value];
        } else {
          newFilters[filterType] = newFilters[filterType].filter(item => item !== value);
        }
      }
      
      return newFilters;
    });
  };
  
  // Appliquer les filtres
  const applyFilters = () => {
    updateSearchParams();
    performSearch(searchQuery, filters);
    setShowFilters(false);
  };
  
  // Réinitialiser les filtres
  const resetFilters = () => {
    setFilters({
      type: [],
      genre: [],
      country: [],
      year: [],
      minRating: 0
    });
  };
  
  // Vérifier si des filtres sont actifs
  const hasActiveFilters = () => {
    return (
      filters.type.length > 0 ||
      filters.genre.length > 0 ||
      filters.country.length > 0 ||
      filters.year.length > 0 ||
      filters.minRating > 0
    );
  };
  
  // Animations
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3 }
    }
  };
  
  // Afficher un état de chargement
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <LoadingSpinner size="large" color="white" />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Recherche</h1>
          <p className="text-gray-400">
            Trouvez vos dramas, films et animés préférés
          </p>
        </div>
        
        {/* Nouvelle interface de recherche ultra-rapide */}
        <div className="mb-8 bg-gray-800 p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold mb-4">Recherche Ultra-Rapide</h2>
          <div className="flex items-center mb-4">
            <div className="flex-1">
              <FastSearch 
                onResultSelect={handleFastSearchResultSelect}
                placeholder="Rechercher un drama, anime, film..."
              />
            </div>
          </div>
          
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center">
              <label className="inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={useElasticSearch}
                  onChange={() => setUseElasticSearch(!useElasticSearch)}
                  className="sr-only peer"
                />
                <div className="relative w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                <span className="ms-3 text-sm font-medium text-gray-300">Utiliser Elasticsearch</span>
              </label>
            </div>
            
            {searchPerformance && (
              <div className="text-sm text-gray-400">
                <span className="font-medium">
                  Recherche en {searchPerformance.time} ms
                </span>
                <span className="mx-2">•</span>
                <span>
                  {searchPerformance.count} résultats
                </span>
                <span className="mx-2">•</span>
                <span className={searchPerformance.method === 'elasticsearch' ? 'text-blue-400' : 'text-yellow-400'}>
                  {searchPerformance.method === 'elasticsearch' ? 'Elasticsearch' : 'Recherche traditionnelle'}
                </span>
              </div>
            )}
          </div>
        </div>
        
        {/* Interface de recherche traditionnelle */}
        <div className="mb-8">
          <form onSubmit={handleSubmit} className="flex items-center gap-2 mb-4">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Search className="w-5 h-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full p-3 pl-10 text-white bg-gray-800 border border-gray-700 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                placeholder="Rechercher un drama, anime, film..."
                required
              />
            </div>
            
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className="p-3 bg-gray-800 border border-gray-700 rounded-lg hover:bg-gray-700 transition-colors"
            >
              <Filter className="w-5 h-5" />
            </button>
            
            <button
              type="submit"
              className="p-3 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Rechercher
            </button>
          </form>
          
          {/* Filtres */}
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-gray-800 border border-gray-700 rounded-lg p-4 mb-6"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Filtres</h3>
                <div className="flex gap-2">
                  <button
                    onClick={resetFilters}
                    className="text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    Réinitialiser
                  </button>
                  <button
                    onClick={() => setShowFilters(false)}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                {/* Type de contenu */}
                <div>
                  <h4 className="font-medium mb-2 flex items-center">
                    <span>Type</span>
                    <ChevronDown className="w-4 h-4 ml-1" />
                  </h4>
                  <div className="space-y-2">
                    {filterOptions.type.map((type) => (
                      <label key={type} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={filters.type.includes(type)}
                          onChange={() => handleFilterChange('type', type)}
                          className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-600"
                        />
                        <span className="ml-2 text-sm">{type}</span>
                      </label>
                    ))}
                  </div>
                </div>
                
                {/* Genre */}
                <div>
                  <h4 className="font-medium mb-2 flex items-center">
                    <span>Genre</span>
                    <ChevronDown className="w-4 h-4 ml-1" />
                  </h4>
                  <div className="space-y-2">
                    {filterOptions.genre.map((genre) => (
                      <label key={genre} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={filters.genre.includes(genre)}
                          onChange={() => handleFilterChange('genre', genre)}
                          className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-600"
                        />
                        <span className="ml-2 text-sm">{genre}</span>
                      </label>
                    ))}
                  </div>
                </div>
                
                {/* Pays */}
                <div>
                  <h4 className="font-medium mb-2 flex items-center">
                    <span>Pays</span>
                    <ChevronDown className="w-4 h-4 ml-1" />
                  </h4>
                  <div className="space-y-2">
                    {filterOptions.country.map((country) => (
                      <label key={country} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={filters.country.includes(country)}
                          onChange={() => handleFilterChange('country', country)}
                          className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-600"
                        />
                        <span className="ml-2 text-sm">{country}</span>
                      </label>
                    ))}
                  </div>
                </div>
                
                {/* Année */}
                <div>
                  <h4 className="font-medium mb-2 flex items-center">
                    <span>Année</span>
                    <ChevronDown className="w-4 h-4 ml-1" />
                  </h4>
                  <div className="space-y-2">
                    {filterOptions.year.map((year) => (
                      <label key={year} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={filters.year.includes(year)}
                          onChange={() => handleFilterChange('year', year)}
                          className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-600"
                        />
                        <span className="ml-2 text-sm">{year}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end">
                <button
                  onClick={applyFilters}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Check className="w-4 h-4" />
                  <span>Appliquer les filtres</span>
                </button>
              </div>
            </motion.div>
          )}
          
          {/* Filtres actifs */}
          {hasActiveFilters() && (
            <div className="flex flex-wrap gap-2 mb-6">
              {filters.type.map((type) => (
                <div key={type} className="flex items-center bg-blue-900 px-3 py-1 rounded-full text-sm">
                  <span>{type}</span>
                  <button
                    onClick={() => handleFilterChange('type', type)}
                    className="ml-2 text-gray-300 hover:text-white"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              
              {filters.genre.map((genre) => (
                <div key={genre} className="flex items-center bg-purple-900 px-3 py-1 rounded-full text-sm">
                  <span>{genre}</span>
                  <button
                    onClick={() => handleFilterChange('genre', genre)}
                    className="ml-2 text-gray-300 hover:text-white"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              
              {filters.country.map((country) => (
                <div key={country} className="flex items-center bg-green-900 px-3 py-1 rounded-full text-sm">
                  <span>{country}</span>
                  <button
                    onClick={() => handleFilterChange('country', country)}
                    className="ml-2 text-gray-300 hover:text-white"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              
              {filters.year.map((year) => (
                <div key={year} className="flex items-center bg-yellow-900 px-3 py-1 rounded-full text-sm">
                  <span>{year}</span>
                  <button
                    onClick={() => handleFilterChange('year', year)}
                    className="ml-2 text-gray-300 hover:text-white"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Résultats de recherche */}
        {hasSearched && (
          <div className="mb-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                {isSearching ? 'Recherche en cours...' : `${resultsCount} résultats trouvés`}
              </h2>
            </div>
            
            {isSearching ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner size="medium" color="white" />
              </div>
            ) : searchResults.length > 0 ? (
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
              >
                {searchResults.map((item, index) => (
                  <motion.div key={item.id || `${item.title}-${index}`} variants={itemVariants}>
                    <AppleStyleCard
                      id={item.id || `${item.title}-${index}`}
                      title={item.title}
                      image={item.poster || item.backdrop || item.image}
                      rating={item.rating || item.score || 0}
                      year={item.year || 'N/A'}
                      type={item.type || 'Drama'}
                      onClick={() => navigate(`/watch/${item.id || item.title.replace(/\s+/g, '-').toLowerCase()}`)}
                    />
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <NoResults
                query={searchQuery}
                message="Aucun résultat trouvé pour votre recherche"
                suggestion="Essayez avec des termes différents ou moins spécifiques"
              />
            )}
          </div>
        )}
      </div>
      
      <Footer />
    </div>
  );
};

export default SearchPage;
