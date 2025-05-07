/**
 * Page Bollywood de FloDrama
 * 
 * Cette page présente les films indiens disponibles sur la plateforme
 * avec filtrage par genre, acteurs et décennie.
 */

import React, { useEffect } from 'react';
import { ContentItem } from '../types/content';
import ContentGrid from '../components/ContentGrid';
import CategoryHeader from '../components/CategoryHeader';
import Footer from '../components/Footer';
import usePersistedFilters from '../hooks/usePersistedFilters';
import contentPreloadService from '../services/contentPreloadService';

const BollywoodPage: React.FC = () => {
  // États pour les contenus avec persistance des filtres
  const [bollywoodFilms, setBollywoodFilms] = React.useState<ContentItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  
  // Utilisation du hook personnalisé pour persister les filtres
  const [filters, setFilters] = usePersistedFilters('bollywood', {
    genre: '',
    decade: '',
    sortBy: 'popularity'
  });

  // Chargement des films Bollywood avec service de préchargement
  useEffect(() => {
    const loadBollywoodFilms = async () => {
      try {
        setLoading(true);
        
        // Récupérer les films Bollywood avec le service optimisé
        const data = await contentPreloadService.loadContent('bollywood', {
          genre: filters.genre || undefined,
          decade: filters.decade || undefined,
          sort_by: filters.sortBy
        });
        
        setBollywoodFilms(data);
        
        // Précharger les images en arrière-plan
        if (data.length > 0) {
          contentPreloadService.preloadImages(data);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Erreur lors du chargement des films Bollywood:', err);
        setError('Impossible de charger les films. Veuillez réessayer plus tard.');
        setLoading(false);
      }
    };

    loadBollywoodFilms();
  }, [filters]);

  // Liste des genres disponibles pour Bollywood
  const genres = [
    'Romance', 'Comédie', 'Drame', 'Action', 'Musical', 'Familial',
    'Historique', 'Guerre', 'Biographie', 'Thriller', 'Crime'
  ];

  // Liste des décennies pour le filtre
  const decades = [
    '2020s', '2010s', '2000s', '1990s', '1980s', '1970s', 'Classiques'
  ];

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
        title="Bollywood"
        description="Explorez l'univers coloré du cinéma indien"
        genres={genres}
        decades={decades}
        sortOptions={sortOptions}
        activeFilters={{
          genre: filters.genre,
          decade: filters.decade,
          sortBy: filters.sortBy
        }}
        onFilterChange={handleFilterChange}
      />
      
      <div className="container mx-auto px-4 pb-12">
        {/* Indicateur de chargement */}
        {loading && bollywoodFilms.length === 0 && (
          <div className="flex justify-center items-center my-16">
            <div className="w-10 h-10 border-4 border-flo-fuchsia border-t-transparent rounded-full animate-spin"></div>
            <p className="ml-4 text-white">Chargement des films indiens...</p>
          </div>
        )}
        
        {/* Message d'erreur */}
        {error && bollywoodFilms.length === 0 && (
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
                {bollywoodFilms.length > 0 
                  ? `${bollywoodFilms.length} film${bollywoodFilms.length > 1 ? 's' : ''} indien${bollywoodFilms.length > 1 ? 's' : ''} trouvé${bollywoodFilms.length > 1 ? 's' : ''}` 
                  : 'Aucun film indien trouvé'}
                {filters.decade && <span className="text-flo-fuchsia ml-1"> • {filters.decade}</span>}
              </p>
              
              {Object.values(filters).some(v => v && v !== 'popularity') && (
                <button 
                  onClick={() => setFilters({ genre: '', decade: '', sortBy: 'popularity' })}
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
            
            {/* Grille de films Bollywood avec options avancées */}
            {bollywoodFilms.length > 0 ? (
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
                  
                  {/* Filtrage rapide par décennie */}
                  <div className="flex flex-wrap items-center space-x-2">
                    {["2020s", "2010s", "2000s", "1990s"].map(decade => (
                      <button
                        key={decade}
                        className={`px-3 py-1 text-xs rounded-full transition-colors ${filters.decade === decade 
                          ? 'bg-flo-fuchsia text-white' 
                          : 'bg-flo-dark-blue text-gray-300 hover:bg-flo-purple/30'}`}
                        onClick={() => setFilters({ decade: filters.decade === decade ? '' : decade })}
                      >
                        {decade}
                      </button>
                    ))}
                  </div>
                </div>
                
                <ContentGrid 
                  title="Bollywood" 
                  items={bollywoodFilms} 
                  userId="user123"
                  contentType="bollywood"
                  onRefresh={() => setFilters(prev => ({...prev}))}
                />
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="mb-8">
                  <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Aucun film indien disponible</h3>
                <p className="text-gray-400 max-w-md mb-6">Aucun film ne correspond aux filtres sélectionnés.</p>
                
                <button 
                  onClick={() => setFilters({ genre: '', decade: '', sortBy: 'popularity' })}
                  className="bg-flo-violet hover:bg-flo-fuchsia text-white px-6 py-3 rounded-lg transition-colors duration-300"
                >
                  Afficher tous les films indiens
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

export default BollywoodPage;
