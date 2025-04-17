import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Filter, Search, X } from 'lucide-react';
import { useMetadata } from '../hooks/useMetadata';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import ContentCard from '../components/cards/ContentCard';
import MotionWrapper from '../components/animations/MotionWrapper';

/**
 * Page de navigation et filtrage des contenus
 */
const BrowsePage = () => {
  const { category } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { 
    getAllItems, 
    getCategories, 
    getLanguages, 
    getCountries, 
    isLoading, 
    error 
  } = useMetadata();
  
  // États
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [countries, setCountries] = useState([]);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [activeFilters, setActiveFilters] = useState({
    type: searchParams.get('type') || 'all',
    category: category || searchParams.get('category') || 'all',
    language: searchParams.get('language') || 'all',
    country: searchParams.get('country') || 'all',
    year: searchParams.get('year') || 'all',
    sort: searchParams.get('sort') || 'popular'
  });
  const [showFilters, setShowFilters] = useState(false);
  const [years, setYears] = useState([]);
  
  // Charger les données
  useEffect(() => {
    if (isLoading || error) return;
    
    // Récupérer tous les contenus
    const allItems = getAllItems();
    setItems(allItems);
    
    // Récupérer les catégories, langues et pays
    setCategories(getCategories());
    setLanguages(getLanguages());
    setCountries(getCountries());
    
    // Générer les années (de l'année actuelle à 2000)
    const currentYear = new Date().getFullYear();
    const yearsList = Array.from({ length: currentYear - 1999 }, (_, i) => currentYear - i);
    setYears(yearsList);
    
  }, [isLoading, error, getAllItems, getCategories, getLanguages, getCountries]);
  
  // Mettre à jour les filtres lorsque la catégorie change dans l'URL
  useEffect(() => {
    if (category) {
      setActiveFilters(prev => ({ ...prev, category }));
    }
  }, [category]);
  
  // Appliquer les filtres
  useEffect(() => {
    if (items.length === 0) return;
    
    let result = [...items];
    
    // Filtrer par type
    if (activeFilters.type !== 'all') {
      result = result.filter(item => item.type === activeFilters.type);
    }
    
    // Filtrer par catégorie
    if (activeFilters.category !== 'all') {
      result = result.filter(item => 
        item.categories && item.categories.includes(activeFilters.category)
      );
    }
    
    // Filtrer par langue
    if (activeFilters.language !== 'all') {
      result = result.filter(item => item.language === activeFilters.language);
    }
    
    // Filtrer par pays
    if (activeFilters.country !== 'all') {
      result = result.filter(item => item.country === activeFilters.country);
    }
    
    // Filtrer par année
    if (activeFilters.year !== 'all') {
      result = result.filter(item => item.year === parseInt(activeFilters.year, 10));
    }
    
    // Filtrer par terme de recherche
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(item => 
        item.title.toLowerCase().includes(term) || 
        (item.description && item.description.toLowerCase().includes(term))
      );
    }
    
    // Trier les résultats
    switch (activeFilters.sort) {
      case 'newest':
        result.sort((a, b) => b.year - a.year);
        break;
      case 'oldest':
        result.sort((a, b) => a.year - b.year);
        break;
      case 'rating':
        result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'az':
        result.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'za':
        result.sort((a, b) => b.title.localeCompare(a.title));
        break;
      case 'popular':
      default:
        // Par défaut, trier par popularité (on suppose que l'ordre initial est par popularité)
        break;
    }
    
    setFilteredItems(result);
    
    // Mettre à jour les paramètres d'URL
    const params = {};
    Object.entries(activeFilters).forEach(([key, value]) => {
      if (value !== 'all') {
        params[key] = value;
      }
    });
    
    if (searchTerm) {
      params.q = searchTerm;
    }
    
    setSearchParams(params, { replace: true });
    
  }, [items, activeFilters, searchTerm, setSearchParams]);
  
  // Gérer le changement de filtre
  const handleFilterChange = (filterType, value) => {
    setActiveFilters(prev => ({ ...prev, [filterType]: value }));
  };
  
  // Réinitialiser les filtres
  const resetFilters = () => {
    setActiveFilters({
      type: 'all',
      category: 'all',
      language: 'all',
      country: 'all',
      year: 'all',
      sort: 'popular'
    });
    setSearchTerm('');
  };
  
  // Gérer la recherche
  const handleSearch = (e) => {
    e.preventDefault();
    // La mise à jour des résultats est gérée par l'effet
  };
  
  // Afficher un état de chargement
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-white">Chargement des contenus...</p>
        </div>
      </div>
    );
  }
  
  // Afficher une erreur si nécessaire
  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-center">
          <div className="text-red-600 text-5xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-white mb-2">Erreur de chargement</h1>
          <p className="text-gray-400 mb-6">{error}</p>
          <Link 
            to="/"
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded font-medium"
          >
            Retour à l'accueil
          </Link>
        </div>
      </div>
    );
  }
  
  // Animations
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.1
      }
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        {/* En-tête */}
        <MotionWrapper animation="fadeIn">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                {category ? `Catégorie: ${category}` : 'Parcourir les contenus'}
              </h1>
              <p className="text-gray-400">
                {filteredItems.length} résultat{filteredItems.length !== 1 ? 's' : ''}
              </p>
            </div>
            
            {/* Bouton pour afficher/masquer les filtres sur mobile */}
            <button 
              className="mt-4 md:mt-0 flex items-center bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded md:hidden"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter size={18} className="mr-2" />
              {showFilters ? 'Masquer les filtres' : 'Afficher les filtres'}
            </button>
          </div>
        </MotionWrapper>
        
        <div className="flex flex-col md:flex-row">
          {/* Barre latérale de filtres */}
          <motion.aside 
            className={`w-full md:w-64 flex-shrink-0 bg-gray-800 rounded-lg p-4 mb-6 md:mb-0 md:mr-6 ${
              showFilters ? 'block' : 'hidden md:block'
            }`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Filtres</h2>
              <button 
                className="text-gray-400 hover:text-white"
                onClick={resetFilters}
              >
                Réinitialiser
              </button>
            </div>
            
            {/* Barre de recherche */}
            <form onSubmit={handleSearch} className="mb-6">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Rechercher..."
                  className="w-full bg-gray-700 text-white px-4 py-2 pl-10 rounded"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                {searchTerm && (
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                    onClick={() => setSearchTerm('')}
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            </form>
            
            {/* Type de contenu */}
            <div className="mb-6">
              <h3 className="font-medium mb-2">Type de contenu</h3>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="type"
                    value="all"
                    checked={activeFilters.type === 'all'}
                    onChange={() => handleFilterChange('type', 'all')}
                    className="mr-2 accent-red-600"
                  />
                  Tous
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="type"
                    value="drama"
                    checked={activeFilters.type === 'drama'}
                    onChange={() => handleFilterChange('type', 'drama')}
                    className="mr-2 accent-red-600"
                  />
                  Dramas
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="type"
                    value="movie"
                    checked={activeFilters.type === 'movie'}
                    onChange={() => handleFilterChange('type', 'movie')}
                    className="mr-2 accent-red-600"
                  />
                  Films
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="type"
                    value="bollywood"
                    checked={activeFilters.type === 'bollywood'}
                    onChange={() => handleFilterChange('type', 'bollywood')}
                    className="mr-2 accent-red-600"
                  />
                  Bollywood
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="type"
                    value="anime"
                    checked={activeFilters.type === 'anime'}
                    onChange={() => handleFilterChange('type', 'anime')}
                    className="mr-2 accent-red-600"
                  />
                  Anime
                </label>
              </div>
            </div>
            
            {/* Catégories */}
            <div className="mb-6">
              <h3 className="font-medium mb-2">Catégorie</h3>
              <select
                className="w-full bg-gray-700 text-white px-3 py-2 rounded"
                value={activeFilters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
              >
                <option value="all">Toutes les catégories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            
            {/* Langue */}
            <div className="mb-6">
              <h3 className="font-medium mb-2">Langue</h3>
              <select
                className="w-full bg-gray-700 text-white px-3 py-2 rounded"
                value={activeFilters.language}
                onChange={(e) => handleFilterChange('language', e.target.value)}
              >
                <option value="all">Toutes les langues</option>
                {languages.map((lang) => (
                  <option key={lang} value={lang}>{lang}</option>
                ))}
              </select>
            </div>
            
            {/* Pays */}
            <div className="mb-6">
              <h3 className="font-medium mb-2">Pays</h3>
              <select
                className="w-full bg-gray-700 text-white px-3 py-2 rounded"
                value={activeFilters.country}
                onChange={(e) => handleFilterChange('country', e.target.value)}
              >
                <option value="all">Tous les pays</option>
                {countries.map((country) => (
                  <option key={country} value={country}>{country}</option>
                ))}
              </select>
            </div>
            
            {/* Année */}
            <div className="mb-6">
              <h3 className="font-medium mb-2">Année</h3>
              <select
                className="w-full bg-gray-700 text-white px-3 py-2 rounded"
                value={activeFilters.year}
                onChange={(e) => handleFilterChange('year', e.target.value)}
              >
                <option value="all">Toutes les années</option>
                {years.map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            
            {/* Tri */}
            <div>
              <h3 className="font-medium mb-2">Trier par</h3>
              <select
                className="w-full bg-gray-700 text-white px-3 py-2 rounded"
                value={activeFilters.sort}
                onChange={(e) => handleFilterChange('sort', e.target.value)}
              >
                <option value="popular">Popularité</option>
                <option value="newest">Plus récent</option>
                <option value="oldest">Plus ancien</option>
                <option value="rating">Note</option>
                <option value="az">A-Z</option>
                <option value="za">Z-A</option>
              </select>
            </div>
          </motion.aside>
          
          {/* Grille de contenu */}
          <div className="flex-grow">
            {filteredItems.length > 0 ? (
              <motion.div 
                className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {filteredItems.map((item, index) => (
                  <ContentCard 
                    key={item.id} 
                    item={item} 
                    size="md" 
                    index={index}
                  />
                ))}
              </motion.div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 bg-gray-800 rounded-lg">
                <div className="text-5xl mb-4">🔍</div>
                <h3 className="text-xl font-bold mb-2">Aucun résultat trouvé</h3>
                <p className="text-gray-400 mb-4 text-center">
                  Essayez de modifier vos filtres ou votre recherche
                </p>
                <button 
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded font-medium"
                  onClick={resetFilters}
                >
                  Réinitialiser les filtres
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default BrowsePage;
