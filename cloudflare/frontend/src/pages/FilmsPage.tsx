/**
 * Page Films de FloDrama
 * 
 * Cette page présente les films disponibles sur la plateforme avec filtrage
 * et prévisualisation des trailers au survol.
 */

import React, { useEffect } from 'react';
import { ContentItem } from '../types/content';
import ContentGrid from '../components/ContentGrid';
import CategoryHeader from '../components/CategoryHeader';
import Footer from '../components/Footer';
import { getContentByCategory } from '../services/contentService';
import usePersistedFilters from '../hooks/usePersistedFilters';

const FilmsPage: React.FC = () => {
  // États pour les contenus avec persistance des filtres
  const [films, setFilms] = React.useState<ContentItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  
  // Utilisation du hook personnalisé pour persister les filtres
  const [filters, setFilters] = usePersistedFilters('films', {
    genre: '',
    year: '',
    sortBy: 'popularity'
  });

  // Chargement des films
  useEffect(() => {
    const loadFilms = async () => {
      try {
        setLoading(true);
        
        // Récupérer les films depuis le service de distribution
        const data = await getContentByCategory('film', {
          genre: filters.genre || undefined,
          year: filters.year || undefined,
          sort_by: filters.sortBy
        });
        
        setFilms(data);
        setLoading(false);
      } catch (err) {
        console.error('Erreur lors du chargement des films:', err);
        setError('Impossible de charger les films. Veuillez réessayer plus tard.');
        setLoading(false);
      }
    };

    loadFilms();
  }, [filters]);

  // Liste des genres disponibles pour les films
  const genres = [
    'Action', 'Aventure', 'Animation', 'Comédie', 'Crime', 
    'Documentaire', 'Drame', 'Familial', 'Fantastique', 'Histoire',
    'Horreur', 'Musique', 'Mystère', 'Romance', 'Science-Fiction', 
    'Thriller', 'Guerre', 'Western'
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

  if (loading && films.length === 0) {
    return (
      <>
        <div className="flex justify-center items-center min-h-[50vh]">
          <div className="loading-spinner"></div>
          <p className="ml-3 text-white text-lg">Chargement des films...</p>
        </div>
        <Footer />
      </>
    );
  }

  if (error && films.length === 0) {
    return (
      <>
        <div className="container mx-auto px-4 py-12">
          <div className="bg-red-500/20 border border-red-500 text-white p-6 rounded-xl text-center">
            <h2 className="text-xl font-bold mb-2">Erreur</h2>
            <p>{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-4 bg-flo-violet hover:bg-flo-fuchsia text-white px-4 py-2 rounded-lg transition-colors duration-300"
            >
              Réessayer
            </button>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <div className="bg-flo-dark min-h-screen">
      {/* En-tête avec filtres */}
      <CategoryHeader
        title="Films"
        description="Découvrez notre collection de films du monde entier"
        genres={genres}
        years={years}
        sortOptions={sortOptions}
        activeFilters={{
          genre: filters.genre,
          year: filters.year,
          sortBy: filters.sortBy
        }}
        onFilterChange={handleFilterChange}
      />
      
      <div className="container mx-auto px-4 pb-12">
        {/* Indicateur de chargement */}
        {loading && films.length === 0 && (
          <div className="flex justify-center items-center my-16">
            <div className="w-10 h-10 border-4 border-flo-fuchsia border-t-transparent rounded-full animate-spin"></div>
            <p className="ml-4 text-white">Chargement des films...</p>
          </div>
        )}
        
        {/* Message d'erreur */}
        {error && films.length === 0 && (
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
            {/* Statistiques de résultats */}
            <div className="flex justify-between items-center mb-6 mt-4">
              <p className="text-white">
                {films.length > 0 
                  ? `${films.length} film${films.length > 1 ? 's' : ''} trouvé${films.length > 1 ? 's' : ''}` 
                  : 'Aucun film trouvé'}
              </p>
              
              {Object.values(filters).some(v => v && v !== 'popularity') && (
                <button 
                  onClick={() => setFilters({ genre: '', year: '', sortBy: 'popularity' })}
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
            
            {/* Grille de films avec gestion avancée des interactions */}
            {films.length > 0 ? (
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
                  
                  {/* Mise en page */}
                  <div className="flex items-center space-x-2">
                    <span className="text-white text-sm">Affichage :</span>
                    <div className="flex space-x-1">
                      <button className="p-1 bg-flo-fuchsia rounded" title="Grille">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                        </svg>
                      </button>
                      <button className="p-1 bg-flo-dark-blue/50 rounded hover:bg-flo-purple/30" title="Liste">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
                
                <ContentGrid 
                  title="Films" 
                  items={films} 
                  userId="user123"
                  contentType="film"
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
                <h3 className="text-xl font-bold text-white mb-2">Aucun film disponible</h3>
                <p className="text-gray-400 max-w-md mb-6">Aucun film ne correspond aux filtres sélectionnés.</p>
                
                <button 
                  onClick={() => setFilters({ genre: '', year: '', sortBy: 'popularity' })}
                  className="bg-flo-violet hover:bg-flo-fuchsia text-white px-6 py-3 rounded-lg transition-colors duration-300"
                >
                  Afficher tous les films
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

export default FilmsPage;
