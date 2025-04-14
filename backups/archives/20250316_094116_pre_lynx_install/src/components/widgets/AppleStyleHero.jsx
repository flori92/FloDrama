import React from 'react';
import { motion } from 'framer-motion';
import { Play, Plus, Info } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getAssetUrl } from '../../api/metadata';
import { getBackdropUrl } from '../../utils/demo-images';

/**
 * Composant héro inspiré du style Apple TV+ pour FloDrama
 * @param {Object} item - Élément à afficher en vedette
 */
const AppleStyleHero = ({ item }) => {
  if (!item) return null;

  // Déterminer le type de contenu pour la route
  const getContentType = () => {
    if (item.section === 'dramas') return 'drama';
    if (item.section === 'movies') return 'movie';
    if (item.section === 'bollywood') return 'bollywood';
    if (item.section === 'anime') return 'anime';
    return 'drama';
  };

  // Obtenir l'URL de l'image de fond (avec fallback vers l'image générée dynamiquement)
  const getBackgroundImageUrl = () => {
    try {
      // Essayer d'abord d'utiliser l'URL de l'asset
      const assetUrl = getAssetUrl(item.backdrop || item.poster);
      
      // Vérifier si l'URL est valide (ne contient pas d'erreur)
      if (assetUrl && !assetUrl.includes('undefined')) {
        return assetUrl;
      }
    } catch (error) {
      console.warn('Erreur lors du chargement de l\'image de fond depuis les assets:', error);
    }
    
    // Fallback vers l'image générée dynamiquement
    return getBackdropUrl(item);
  };

  // Animations
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        duration: 0.8,
        when: "beforeChildren",
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5 }
    }
  };

  return (
    <motion.div 
      className="relative w-full h-[80vh] overflow-hidden"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Image de fond */}
      <div className="absolute inset-0 w-full h-full">
        <img 
          src={getBackgroundImageUrl()} 
          alt={item.title}
          className="w-full h-full object-cover"
          onError={(e) => {
            // En cas d'erreur, utiliser l'image générée dynamiquement
            e.target.src = getBackdropUrl(item);
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent" />
      </div>

      {/* Contenu */}
      <div className="absolute bottom-0 left-0 right-0 p-8 md:p-16 z-10">
        <div className="max-w-3xl">
          <motion.div variants={itemVariants}>
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">{item.title}</h1>
          </motion.div>

          <motion.div variants={itemVariants}>
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-300 mb-4">
              {item.year && <span>{item.year}</span>}
              {item.duration && <span>{item.duration}</span>}
              {item.genres && item.genres.length > 0 && (
                <span>{item.genres.join(' • ')}</span>
              )}
              {item.rating && (
                <span className="flex items-center">
                  <span className="text-pink-500 mr-1">★</span>
                  {item.rating}
                </span>
              )}
            </div>
          </motion.div>

          <motion.div variants={itemVariants}>
            <p className="text-gray-300 text-lg mb-8 line-clamp-3 md:line-clamp-none">
              {item.description || item.synopsis}
            </p>
          </motion.div>

          <motion.div 
            className="flex flex-wrap gap-4"
            variants={itemVariants}
          >
            <Link to={`/${getContentType()}/${item.id}/play`}>
              <motion.button 
                className="flex items-center gap-2 bg-pink-500 hover:bg-pink-600 text-white font-medium py-3 px-6 rounded-full transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Play size={20} fill="white" />
                Regarder
              </motion.button>
            </Link>

            <motion.button 
              className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white font-medium py-3 px-6 rounded-full transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Plus size={20} />
              Ma liste
            </motion.button>

            <Link to={`/${getContentType()}/${item.id}`}>
              <motion.button 
                className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white font-medium py-3 px-6 rounded-full transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Info size={20} />
                Détails
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default AppleStyleHero;
