import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trash2, Info } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useWatchlist } from '../hooks/useWatchlist';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import AppleStyleCard from '../components/cards/AppleStyleCard';
import MotionWrapper from '../components/animations/MotionWrapper';

/**
 * Page affichant la liste personnelle de l'utilisateur
 */
const WatchlistPage = () => {
  const { watchlist, isLoading, removeFromWatchlist } = useWatchlist();
  const [sortOrder, setSortOrder] = useState('newest');
  const [filteredWatchlist, setFilteredWatchlist] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all');
  
  // Filtrer et trier la watchlist
  useEffect(() => {
    if (!watchlist) return;
    
    let filtered = [...watchlist];
    
    // Appliquer le filtre
    if (activeFilter !== 'all') {
      filtered = filtered.filter(item => item.type === activeFilter);
    }
    
    // Appliquer le tri
    if (sortOrder === 'newest') {
      filtered.sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt));
    } else if (sortOrder === 'oldest') {
      filtered.sort((a, b) => new Date(a.addedAt) - new Date(b.addedAt));
    } else if (sortOrder === 'alphabetical') {
      filtered.sort((a, b) => a.title.localeCompare(b.title));
    }
    
    setFilteredWatchlist(filtered);
  }, [watchlist, sortOrder, activeFilter]);
  
  // Animations
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4 }
    }
  };
  
  // Gérer la suppression d'un élément
  const handleRemove = (id) => {
    removeFromWatchlist(id);
  };
  
  // Afficher un message de chargement
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <Navbar />
        <div className="container mx-auto px-6 py-24 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600 mx-auto"></div>
            <p className="mt-4 text-white">Chargement de votre liste...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Navbar />
      
      <div className="container mx-auto px-6 py-24">
        <MotionWrapper animation="fadeIn">
          <div className="mb-12">
            <h1 className="text-4xl font-bold mb-2">Ma Liste</h1>
            <p className="text-gray-400">
              Retrouvez ici tous les dramas et films que vous avez ajoutés à votre liste personnelle.
            </p>
          </div>
          
          {/* Filtres et tri */}
          <div className="flex flex-col md:flex-row justify-between mb-8">
            <div className="flex space-x-4 mb-4 md:mb-0">
              <button 
                className={`px-4 py-2 rounded-full ${activeFilter === 'all' ? 'bg-red-600 text-white' : 'bg-gray-800 text-gray-300'}`}
                onClick={() => setActiveFilter('all')}
              >
                Tous
              </button>
              <button 
                className={`px-4 py-2 rounded-full ${activeFilter === 'drama' ? 'bg-red-600 text-white' : 'bg-gray-800 text-gray-300'}`}
                onClick={() => setActiveFilter('drama')}
              >
                Dramas
              </button>
              <button 
                className={`px-4 py-2 rounded-full ${activeFilter === 'movie' ? 'bg-red-600 text-white' : 'bg-gray-800 text-gray-300'}`}
                onClick={() => setActiveFilter('movie')}
              >
                Films
              </button>
            </div>
            
            <div className="flex items-center">
              <span className="text-gray-400 mr-2">Trier par:</span>
              <select 
                className="bg-gray-800 text-white px-4 py-2 rounded border border-gray-700"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
              >
                <option value="newest">Plus récents</option>
                <option value="oldest">Plus anciens</option>
                <option value="alphabetical">Alphabétique</option>
              </select>
            </div>
          </div>
          
          {/* Liste des contenus */}
          {filteredWatchlist.length > 0 ? (
            <motion.div 
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {filteredWatchlist.map((item, index) => (
                <motion.div 
                  key={item.id} 
                  className="relative group"
                  variants={itemVariants}
                >
                  <AppleStyleCard item={item} index={index} />
                  
                  <button 
                    className="absolute top-2 right-2 bg-red-600 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    onClick={() => handleRemove(item.id)}
                    aria-label="Retirer de ma liste"
                  >
                    <Trash2 size={16} />
                  </button>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <div className="text-center py-16 bg-gray-800 rounded-lg">
              <Info size={48} className="mx-auto text-gray-500 mb-4" />
              <h2 className="text-2xl font-bold mb-2">Votre liste est vide</h2>
              <p className="text-gray-400 mb-6">
                Vous n'avez pas encore ajouté de contenu à votre liste personnelle.
              </p>
              <Link 
                to="/"
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded font-medium inline-block"
              >
                Découvrir des dramas
              </Link>
            </div>
          )}
        </MotionWrapper>
      </div>
      
      <Footer />
    </div>
  );
};

export default WatchlistPage;
