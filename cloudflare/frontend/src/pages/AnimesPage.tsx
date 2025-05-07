/**
 * Page Animes de FloDrama
 * 
 * Cette page présente les animes disponibles sur la plateforme
 * avec filtrage par genre, studio et saison de sortie.
 */

import React, { useEffect } from 'react';
import { ContentItem } from '../types/content';
import ContentGrid from '../components/ContentGrid';
import CategoryHeader from '../components/CategoryHeader';
import Footer from '../components/Footer';
import usePersistedFilters from '../hooks/usePersistedFilters';
import contentPreloadService from '../services/contentPreloadService';

const AnimesPage: React.FC = () => {
  // États pour les contenus avec persistance des filtres
  const [animes, setAnimes] = React.useState<ContentItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  
  // Utilisation du hook personnalisé pour persister les filtres
  const [filters, setFilters] = usePersistedFilters('animes', {
    genre: '',
    season: '',
    year: '',
    sortBy: 'popularity'
  });

  // Chargement des animes avec système de préchargement
  useEffect(() => {
    const loadAnimes = async () => {
      try {
        setLoading(true);
        
        // Récupérer les animes avec le service optimisé
        const data = await contentPreloadService.loadContent('anime', {
          genre: filters.genre || undefined,
          season: filters.season || undefined,
          year: filters.year || undefined,
          sort_by: filters.sortBy
        });
        
        setAnimes(data);
        
        // Précharger les images en arrière-plan
        if (data.length > 0) {
          contentPreloadService.preloadImages(data);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Erreur lors du chargement des animes:', err);
        setError('Impossible de charger les animes. Veuillez réessayer plus tard.');
        setLoading(false);
      }
    };

    loadAnimes();
  }, [filters]);

  // Liste des genres disponibles pour les animes
  const genres = [
    'Action', 'Aventure', 'Comédie', 'Drame', 'Fantastique', 'Horreur',
    'Mecha', 'Mystère', 'Psychologique', 'Romance', 'Sci-Fi', 'Slice of Life',
    'Sports', 'Surnaturel', 'Thriller', 'Ecchi', 'Shonen', 'Shojo', 'Seinen', 'Josei'
  ];

  // Liste des saisons disponibles pour les animes
  const seasons = [
    'Hiver', 'Printemps', 'Été', 'Automne'
  ];

  // Liste des années pour le filtre
  const years = Array.from({ length: 30 }, (_, i) => (new Date().getFullYear() - i).toString());

  // Options de tri
  const sortOptions = [
    { value: 'popularity', label: 'Popularité' },
    { value: 'release_date', label: 'Date de sortie' },
    { value: 'rating', label: 'Note' },
    { value: 'title', label: 'Titre' }
  ];

  // Gestionnaire de changement de filtre
  const handleFilterChange = (filterName: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };



  return (
    <div className="bg-flo-dark min-h-screen">
      {/* En-tête avec filtres */}
      <CategoryHeader
        title="Animes"
        description="Découvrez notre sélection d'animes japonais de toutes les époques"
        genres={genres}
        seasons={seasons}
        years={years}
        sortOptions={sortOptions}
        activeFilters={{
          genre: filters.genre,
          season: filters.season,
          year: filters.year,
          sortBy: filters.sortBy
        }}
        onFilterChange={handleFilterChange}
      />
      
      <div className="container mx-auto px-4 pb-12">
        {/* Indicateur de chargement */}
        {loading && animes.length === 0 && (
          <div className="flex justify-center items-center my-16">
            <div className="w-10 h-10 border-4 border-flo-fuchsia border-t-transparent rounded-full animate-spin"></div>
            <p className="ml-4 text-white">Chargement des animes...</p>
          </div>
        )}
        
        {/* Message d'erreur */}
        {error && animes.length === 0 && (
          <div className="bg-red-500/20 border border-red-500 text-white p-6 rounded-xl text-center my-12">
            <h2 className="text-xl font-bold mb-2">Erreur</h2>
            <p>{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-4 bg-flo-violet hover:bg-flo-fuchsia text-white px-4 py-2 rounded-lg transition-colors duration-300"
            >
              Réessayer
            </button>
          </div>
        )}
        
        {/* Résultats de recherche */}
        {!loading && !error && (
          <>
            {/* Statistiques de résultats avec indicateurs des filtres actifs */}
            <div className="flex justify-between items-center mb-6 mt-4">
              <p className="text-white">
                {animes.length > 0 
                  ? `${animes.length} anime${animes.length > 1 ? 's' : ''} trouvé${animes.length > 1 ? 's' : ''}` 
                  : 'Aucun anime trouvé'}
                {filters.season && <span className="text-flo-fuchsia ml-1"> • {filters.season}</span>}
              </p>
              
              {Object.values(filters).some(v => v && v !== 'popularity') && (
                <button 
                  onClick={() => setFilters({ genre: '', season: '', year: '', sortBy: 'popularity' })}
                  className="text-flo-fuchsia hover:text-white transition-colors duration-200 text-sm"
                >
                  <span className="flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Réinitialiser les filtres
                  </span>
                </button>
              )}
            </div>
            
            {/* Grille d'animes avec options avancées */}
            {animes.length > 0 ? (
              <>
                {/* Barre d'actions supplémentaires */}
                <div className="flex flex-wrap justify-between items-center mb-4 bg-flo-dark-blue/30 rounded-lg p-4">
                  {/* Trier par */}
                  <div className="flex items-center space-x-2 mb-2 sm:mb-0">
                    <span className="text-white text-sm">Trier par :</span>
                    <div className="flex space-x-1">
                      {[
                        { value: 'popularity', label: 'Popularité' },
                        { value: 'release_date', label: 'Date' },
                        { value: 'rating', label: 'Note' }
                      ].map(option => (
                        <button
                          key={option.value}
                          className={`px-3 py-1 text-xs rounded-full transition-colors ${filters.sortBy === option.value 
                            ? 'bg-flo-fuchsia text-white' 
                            : 'bg-flo-dark-blue text-gray-300 hover:bg-flo-purple/30'}`}
                          onClick={() => setFilters({ sortBy: option.value })}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Filtrage rapide par saison */}
                  <div className="flex flex-wrap items-center space-x-2">
                    {["Hiver", "Printemps", "Été", "Automne"].map(season => (
                      <button
                        key={season}
                        className={`px-3 py-1 text-xs rounded-full transition-colors ${filters.season === season.toLowerCase() 
                          ? 'bg-flo-fuchsia text-white' 
                          : 'bg-flo-dark-blue text-gray-300 hover:bg-flo-purple/30'}`}
                        onClick={() => setFilters({ season: filters.season === season.toLowerCase() ? '' : season.toLowerCase() })}
                      >
                        {season}
                      </button>
                    ))}
                  </div>
                </div>
                
                <ContentGrid 
                  title="Animes" 
                  items={animes} 
                  userId="user123"
                  contentType="anime"
                  onRefresh={() => setFilters(prev => ({...prev}))}
                />
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="mb-8">
                  <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Aucun anime disponible</h3>
                <p className="text-gray-400 max-w-md mb-6">Aucun anime ne correspond aux filtres sélectionnés.</p>
                
                <button 
                  onClick={() => setFilters({ genre: '', season: '', year: '', sortBy: 'popularity' })}
                  className="bg-flo-violet hover:bg-flo-fuchsia text-white px-6 py-3 rounded-lg transition-colors duration-300"
                >
                  Afficher tous les animes
                </button>
              </div>
            )}
          </>
        )}
      </div>
      
      <Footer />
    </div>
  );
};

export default AnimesPage;
