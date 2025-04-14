import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Plus, Info, Star, Clock, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getAssetUrl } from '../../api/metadata';
import { getBackdropUrl } from '../../utils/demo-images';

/**
 * Composant héro inspiré du style Apple TV+ pour FloDrama
 * @param {Object} item - Élément à afficher en vedette
 */
const AppleStyleHero = ({ item }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  
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

  const imageVariants = {
    initial: { scale: 1.1, opacity: 0 },
    animate: { 
      scale: 1, 
      opacity: 1,
      transition: { duration: 1.5, ease: [0.6, 0.05, 0.01, 0.99] }
    }
  };

  return (
    <motion.div 
      className="relative w-full h-[85vh] overflow-hidden"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Image de fond avec effet parallaxe */}
      <div className="absolute inset-0 w-full h-full">
        <motion.div
          className={`w-full h-full transition-opacity duration-500 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
          initial="initial"
          animate="animate"
          variants={imageVariants}
        >
          <img 
            src={getBackgroundImageUrl()} 
            alt={item.title}
            className="w-full h-full object-cover"
            onLoad={() => setImageLoaded(true)}
            onError={(e) => {
              // En cas d'erreur, utiliser l'image générée dynamiquement
              e.target.src = getBackdropUrl(item);
              setImageLoaded(true);
            }}
          />
        </motion.div>
        
        {/* Overlay avec dégradé amélioré */}
        <div 
          className="absolute inset-0" 
          style={{ 
            background: `
              linear-gradient(0deg, var(--color-background) 0%, rgba(18, 17, 24, 0.8) 20%, rgba(18, 17, 24, 0.4) 60%, rgba(18, 17, 24, 0.2) 100%),
              linear-gradient(90deg, rgba(18, 17, 24, 0.8) 0%, rgba(18, 17, 24, 0) 50%)
            `,
            boxShadow: 'inset 0 -100px 120px -50px var(--color-background)'
          }} 
        />
      </div>

      {/* Contenu avec animations améliorées */}
      <div className="absolute bottom-0 left-0 right-0 p-8 md:p-16 z-10">
        <div className="max-w-3xl">
          {/* Badge de nouveauté si applicable */}
          {item.isNew && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="inline-block mb-4 px-3 py-1 rounded-md text-sm font-semibold"
              style={{ 
                backgroundColor: 'var(--color-accent)',
                color: 'var(--color-text-primary)'
              }}
            >
              NOUVEAU
            </motion.div>
          )}
          
          <motion.div variants={itemVariants}>
            <h1 
              className="text-4xl md:text-6xl font-bold mb-4"
              style={{ color: 'var(--color-text-primary)' }}
            >
              {item.title}
            </h1>
          </motion.div>

          <motion.div variants={itemVariants}>
            <div 
              className="flex flex-wrap items-center gap-4 text-sm mb-4"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              {item.year && (
                <span className="flex items-center">
                  <Calendar size={16} className="mr-1.5" />
                  {item.year}
                </span>
              )}
              {item.duration && (
                <span className="flex items-center">
                  <Clock size={16} className="mr-1.5" />
                  {item.duration}
                </span>
              )}
              {item.genres && item.genres.length > 0 && (
                <span>{item.genres.slice(0, 3).join(' • ')}</span>
              )}
              {item.rating && (
                <span className="flex items-center">
                  <Star size={16} className="mr-1.5" style={{ color: 'var(--color-accent)' }} />
                  {item.rating}
                </span>
              )}
            </div>
          </motion.div>

          <motion.div variants={itemVariants}>
            <p 
              className="text-lg mb-8 line-clamp-3 md:line-clamp-none"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              {item.description || item.synopsis}
            </p>
          </motion.div>

          <motion.div 
            className="flex flex-wrap gap-4"
            variants={itemVariants}
          >
            <Link to={`/${getContentType()}/${item.id}/play`}>
              <motion.button 
                className="btn btn-primary flex items-center gap-2 py-3 px-6 rounded-full"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Play size={20} fill="white" />
                Regarder
              </motion.button>
            </Link>

            <motion.button 
              className="btn btn-secondary flex items-center gap-2 py-3 px-6 rounded-full"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Plus size={20} />
              Ma liste
            </motion.button>

            <Link to={`/${getContentType()}/${item.id}`}>
              <motion.button 
                className="btn btn-secondary flex items-center gap-2 py-3 px-6 rounded-full"
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
      
      {/* Effet de vignette sur les côtés */}
      <div 
        className="absolute inset-0 pointer-events-none" 
        style={{ 
          boxShadow: 'inset 0 0 150px rgba(0, 0, 0, 0.7)'
        }}
      />
    </motion.div>
  );
};

export default AppleStyleHero;
