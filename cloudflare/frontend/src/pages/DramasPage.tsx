/**
 * Page Dramas de FloDrama
 * 
 * Cette page présente les dramas asiatiques disponibles sur la plateforme
 * avec filtrage par pays, genre et année.
 */

import React, { useEffect } from 'react';
import { ContentItem } from '../types/content';
import ContentGrid from '../components/ContentGrid';
import CategoryHeader from '../components/CategoryHeader';
import Footer from '../components/Footer';
import usePersistedFilters from '../hooks/usePersistedFilters';
import contentPreloadService from '../services/contentPreloadService';

const DramasPage: React.FC = () => {
  // États pour les contenus avec persistance des filtres
  const [dramas, setDramas] = React.useState<ContentItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  
  // Utilisation du hook personnalisé pour persister les filtres
  const [filters, setFilters] = usePersistedFilters('dramas', {
    genre: '',
    country: '',
    year: '',
    sortBy: 'popularity'
  });

  // Chargement des dramas avec le service de préchargement
  useEffect(() => {
    const loadDramas = async () => {
      try {
        setLoading(true);
        
        // Récupérer les dramas avec le service optimisé
        const data = await contentPreloadService.loadContent('drama', {
          genre: filters.genre || undefined,
          country: filters.country || undefined,
          year: filters.year || undefined,
          sort_by: filters.sortBy
        });
        
        setDramas(data);
        
        // Précharger les images en arrière-plan
        if (data.length > 0) {
          contentPreloadService.preloadImages(data);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Erreur lors du chargement des dramas:', err);
        setError('Impossible de charger les dramas. Veuillez réessayer plus tard.');
        setLoading(false);
      }
    };

    loadDramas();
  }, [filters]);

  // Liste des genres disponibles pour les dramas
  const genres = [
    'Romance', 'Comédie', 'Drame', 'Thriller', 'Action', 
    'Fantastique', 'Historique', 'Médical', 'Mystère', 'Policier',
    'Science-Fiction', 'Scolaire', 'Tranche de vie', 'Webdrama'
  ];

  // Liste des pays disponibles pour les dramas
  const countries = [
    'Corée du Sud', 'Japon', 'Chine', 'Taïwan', 'Thaïlande', 
    'Philippines', 'Vietnam', 'Malaisie', 'Indonésie'
  ];

  // Liste des années pour le filtre
  const years = Array.from({ length: 20 }, (_, i) => (new Date().getFullYear() - i).toString());

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
        title="Dramas Asiatiques"
        description="Découvrez notre collection de dramas asiatiques de qualité"
        genres={genres}
        countries={countries}
        years={years}
        sortOptions={sortOptions}
        activeFilters={{
          genre: filters.genre,
          country: filters.country,
          year: filters.year,
          sortBy: filters.sortBy
        }}
        onFilterChange={handleFilterChange}
      />
      
      <div className="container mx-auto px-4 pb-12">
        {/* Indicateur de chargement */}
        {loading && dramas.length === 0 && (
          <div className="flex justify-center items-center my-16">
            <div className="w-10 h-10 border-4 border-flo-fuchsia border-t-transparent rounded-full animate-spin"></div>
            <p className="ml-4 text-white">Chargement des dramas...</p>
          </div>
        )}
        
        {/* Message d'erreur */}
        {error && dramas.length === 0 && (
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
            {/* Statistiques de résultats avec indicateur des filtres actifs */}
            <div className="flex justify-between items-center mb-6 mt-4">
              <p className="text-white">
                {dramas.length > 0 
                  ? `${dramas.length} drama${dramas.length > 1 ? 's' : ''} trouvé${dramas.length > 1 ? 's' : ''}` 
                  : 'Aucun drama trouvé'}
                {filters.country && <span className="text-flo-fuchsia ml-1"> • {filters.country}</span>}
              </p>
              
              {Object.values(filters).some(v => v && v !== 'popularity') && (
                <button 
                  onClick={() => setFilters({ genre: '', country: '', year: '', sortBy: 'popularity' })}
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
            
            {/* Grille de dramas avec options avancées */}
            {dramas.length > 0 ? (
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
                  
                  {/* Filtrage rapide par pays */}
                  <div className="flex flex-wrap items-center space-x-2">
                    {["Corée du Sud", "Japon", "Chine", "Thaïlande"].map(country => (
                      <button
                        key={country}
                        className={`px-3 py-1 text-xs rounded-full transition-colors ${filters.country === country.toLowerCase() 
                          ? 'bg-flo-fuchsia text-white' 
                          : 'bg-flo-dark-blue text-gray-300 hover:bg-flo-purple/30'}`}
                        onClick={() => setFilters({ country: filters.country === country.toLowerCase() ? '' : country.toLowerCase() })}
                      >
                        {country}
                      </button>
                    ))}
                  </div>
                </div>
                
                <ContentGrid 
                  title="Dramas" 
                  items={dramas} 
                  userId="user123"
                  contentType="drama"
                  onRefresh={() => setFilters(prev => ({...prev}))}
                />
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="mb-8">
                  <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Aucun drama disponible</h3>
                <p className="text-gray-400 max-w-md mb-6">Aucun drama ne correspond aux filtres sélectionnés.</p>
                
                <button 
                  onClick={() => setFilters({ genre: '', country: '', year: '', sortBy: 'popularity' })}
                  className="bg-flo-violet hover:bg-flo-fuchsia text-white px-6 py-3 rounded-lg transition-colors duration-300"
                >
                  Afficher tous les dramas
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

export default DramasPage;
