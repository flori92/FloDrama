import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ContentDataService from '../services/ContentDataService';
import SmartScrapingService from '../services/SmartScrapingService';
import MainNavigation from '../components/navigation/MainNavigation';
import ContentGrid from '../components/content/ContentGrid';
import LoadingSpinner from '../components/LoadingSpinner';
import '../styles/CategoryPage.css';

/**
 * Page de catégorie pour afficher les dramas, animes, films, etc.
 * @param {Object} props - Propriétés du composant
 * @param {string} props.type - Type de contenu (drama, anime, bollywood)
 * @param {string} props.title - Titre de la catégorie (optionnel)
 */
const CategoryPage = ({ type, title }) => {
  const { subcategory } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [contents, setContents] = useState([]);
  const [filters, setFilters] = useState({
    year: '',
    sort: 'popularity',
    genre: ''
  });
  const [subcategories, setSubcategories] = useState([]);
  const [pageTitle, setPageTitle] = useState(title || '');

  // Charger les contenus et les sous-catégories
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Déterminer le titre de la page en fonction de la sous-catégorie
        if (subcategory) {
          const formattedSubcategory = subcategory
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
          
          setPageTitle(`${formattedSubcategory} ${type === 'drama' ? 'Dramas' : 
                         type === 'anime' ? 'Animés' : 
                         type === 'bollywood' ? 'Films Bollywood' : 'Contenus'}`);
        }
        
        // Récupérer les contenus depuis ContentDataService
        let contentData = [];
        
        if (ContentDataService) {
          try {
            if (subcategory) {
              // Récupérer les contenus de la sous-catégorie
              contentData = await ContentDataService.getContentsBySubcategory(type, subcategory);
            } else {
              // Récupérer tous les contenus du type
              contentData = await ContentDataService.getContentsByType(type, 1, 50);
            }
          } catch (contentError) {
            console.warn('Erreur lors de la récupération des données depuis ContentDataService:', contentError);
            
            // Fallback vers SmartScrapingService
            if (SmartScrapingService) {
              if (type === 'drama') {
                contentData = await SmartScrapingService.getPopularDramas(1);
              } else if (type === 'anime') {
                contentData = await SmartScrapingService.getPopularAnimes(1);
              } else if (type === 'bollywood') {
                contentData = await SmartScrapingService.getPopularMovies(1, 'bollywood');
              }
            }
          }
        }
        
        // Récupérer les sous-catégories
        let subcategoriesData = [];
        
        try {
          if (type === 'drama') {
            subcategoriesData = [
              { id: 'coreens', name: 'Coréens' },
              { id: 'chinois', name: 'Chinois' },
              { id: 'japonais', name: 'Japonais' },
              { id: 'thailandais', name: 'Thaïlandais' },
              { id: 'taiwanais', name: 'Taïwanais' }
            ];
          } else if (type === 'anime') {
            subcategoriesData = [
              { id: 'shonen', name: 'Shōnen' },
              { id: 'shojo', name: 'Shōjo' },
              { id: 'seinen', name: 'Seinen' },
              { id: 'josei', name: 'Josei' },
              { id: 'isekai', name: 'Isekai' }
            ];
          } else if (type === 'bollywood') {
            subcategoriesData = [
              { id: 'action', name: 'Action' },
              { id: 'romance', name: 'Romance' },
              { id: 'comedie', name: 'Comédie' },
              { id: 'drame', name: 'Drame' }
            ];
          }
        } catch (subcategoriesError) {
          console.warn('Erreur lors de la récupération des sous-catégories:', subcategoriesError);
        }
        
        setContents(contentData);
        setSubcategories(subcategoriesData);
      } catch (error) {
        console.error(`Erreur lors du chargement des ${type}:`, error);
        setError(`Impossible de charger les ${type}. Veuillez réessayer plus tard.`);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [type, subcategory, title]);

  // Gérer le changement de filtre
  const handleFilterChange = (filterName, value) => {
    setFilters(prevFilters => ({
      ...prevFilters,
      [filterName]: value
    }));
  };

  // Naviguer vers une sous-catégorie
  const navigateToSubcategory = (subcategoryId) => {
    navigate(`/${type}s/${subcategoryId}`);
  };

  // Filtrer et trier les contenus
  const getFilteredContents = () => {
    let filtered = [...contents];
    
    // Filtrer par année
    if (filters.year) {
      filtered = filtered.filter(content => 
        content.year && content.year.toString() === filters.year
      );
    }
    
    // Filtrer par genre
    if (filters.genre) {
      filtered = filtered.filter(content => 
        content.genres && content.genres.includes(filters.genre)
      );
    }
    
    // Trier les contenus
    if (filters.sort === 'popularity') {
      filtered.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
    } else if (filters.sort === 'year-desc') {
      filtered.sort((a, b) => (b.year || 0) - (a.year || 0));
    } else if (filters.sort === 'year-asc') {
      filtered.sort((a, b) => (a.year || 0) - (b.year || 0));
    } else if (filters.sort === 'title-asc') {
      filtered.sort((a, b) => a.title.localeCompare(b.title));
    }
    
    return filtered;
  };

  // Afficher le chargement
  if (isLoading) {
    return (
      <div className="category-page">
        <MainNavigation />
        <div className="loading-container">
          <LoadingSpinner />
          <p>Chargement en cours...</p>
        </div>
      </div>
    );
  }

  // Afficher une erreur
  if (error) {
    return (
      <div className="category-page">
        <MainNavigation />
        <div className="error-container">
          <h2>Erreur</h2>
          <p>{error}</p>
          <button onClick={() => navigate('/')}>Retour à l'accueil</button>
        </div>
      </div>
    );
  }

  return (
    <div className="category-page">
      <MainNavigation />
      
      <div className="category-content">
        <header className="category-header">
          <h1 className="category-title">{pageTitle}</h1>
          
          {/* Sous-catégories */}
          {!subcategory && subcategories.length > 0 && (
            <div className="subcategories">
              {subcategories.map(subcat => (
                <button
                  key={subcat.id}
                  className="subcategory-button"
                  onClick={() => navigateToSubcategory(subcat.id)}
                >
                  {subcat.name}
                </button>
              ))}
            </div>
          )}
          
          {/* Filtres */}
          <div className="filters">
            <div className="filter-group">
              <label htmlFor="sort-filter">Trier par:</label>
              <select
                id="sort-filter"
                value={filters.sort}
                onChange={(e) => handleFilterChange('sort', e.target.value)}
              >
                <option value="popularity">Popularité</option>
                <option value="year-desc">Année (récent → ancien)</option>
                <option value="year-asc">Année (ancien → récent)</option>
                <option value="title-asc">Titre (A → Z)</option>
              </select>
            </div>
            
            <div className="filter-group">
              <label htmlFor="year-filter">Année:</label>
              <select
                id="year-filter"
                value={filters.year}
                onChange={(e) => handleFilterChange('year', e.target.value)}
              >
                <option value="">Toutes</option>
                {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i).map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          </div>
        </header>
        
        {/* Grille de contenu */}
        {getFilteredContents().length > 0 ? (
          <ContentGrid contents={getFilteredContents()} />
        ) : (
          <div className="no-content">
            <p>Aucun contenu trouvé pour cette catégorie.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryPage;
