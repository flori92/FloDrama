import React from 'react';
import { Play, Info, Star, Calendar, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getAssetUrl } from '../../api/metadata';

/**
 * Composant Hero pour mettre en avant un contenu sur la page d'accueil
 * @param {Object} item - Élément à mettre en avant
 */
const FeaturedHero = ({ item }) => {
  if (!item) return null;
  
  // Déterminer le type de contenu pour la navigation
  const getContentType = () => {
    if (item.section === 'dramas') return 'drama';
    if (item.section === 'movies') return 'movie';
    if (item.section === 'bollywood') return 'bollywood';
    if (item.section === 'anime') return 'anime';
    return 'drama';
  };
  
  // Obtenir la durée formatée
  const getDuration = () => {
    if (item.duration) return item.duration;
    if (item.episodes) return `${item.episodes} épisodes`;
    return '';
  };

  // Animations pour le texte
  const textVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.8,
        ease: "easeOut"
      }
    }
  };

  // Animation en cascade pour les métadonnées
  const metadataVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3
      }
    }
  };

  const metadataItemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    }
  };

  // Animation pour les boutons
  const buttonVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.5,
        delay: 0.6,
        ease: "easeOut"
      }
    },
    hover: {
      scale: 1.05,
      transition: {
        duration: 0.2,
        ease: "easeInOut"
      }
    },
    tap: {
      scale: 0.95
    }
  };
  
  return (
    <div className="relative h-screen">
      {/* Image de fond avec animation */}
      <motion.div 
        className="absolute inset-0"
        initial={{ scale: 1.1, opacity: 0.8 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 10, ease: "easeOut" }}
      >
        <img 
          src={getAssetUrl(item.banner || item.poster)} 
          alt={item.title} 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/70 to-transparent" />
      </motion.div>
      
      {/* Contenu */}
      <div className="relative pt-48 px-6 md:px-16 flex flex-col h-full justify-center">
        <motion.h1 
          className="text-5xl md:text-6xl font-bold mb-4 text-white"
          initial="hidden"
          animate="visible"
          variants={textVariants}
        >
          {item.title}
        </motion.h1>
        
        {/* Métadonnées */}
        <motion.div 
          className="flex items-center space-x-4 mb-4"
          initial="hidden"
          animate="visible"
          variants={metadataVariants}
        >
          {item.rating && (
            <motion.span 
              className="bg-red-600 px-2 py-1 rounded text-sm text-white flex items-center"
              variants={metadataItemVariants}
            >
              <Star size={14} className="mr-1" />
              {item.rating}
            </motion.span>
          )}
          
          <motion.span 
            className="text-white flex items-center"
            variants={metadataItemVariants}
          >
            <Calendar size={14} className="mr-1" />
            {item.year}
          </motion.span>
          
          {getDuration() && (
            <motion.span 
              className="text-white flex items-center"
              variants={metadataItemVariants}
            >
              <Clock size={14} className="mr-1" />
              {getDuration()}
            </motion.span>
          )}
          
          {item.categories && item.categories.length > 0 && (
            <motion.span 
              className="text-white"
              variants={metadataItemVariants}
            >
              {item.categories.join(' • ')}
            </motion.span>
          )}
        </motion.div>
        
        {/* Description */}
        <motion.p 
          className="text-lg md:text-xl max-w-2xl mb-8 text-white"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          {item.description}
        </motion.p>
        
        {/* Boutons d'action */}
        <div className="flex space-x-4">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={buttonVariants}
          >
            <Link 
              to={`/${getContentType()}/${item.id}/watch`}
              className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded font-bold flex items-center"
            >
              <motion.div
                whileHover="hover"
                whileTap="tap"
                variants={buttonVariants}
                className="flex items-center"
              >
                <Play size={20} className="mr-2" />
                Regarder
              </motion.div>
            </Link>
          </motion.div>
          
          <motion.div
            initial="hidden"
            animate="visible"
            variants={buttonVariants}
            transition={{ delay: 0.7 }}
          >
            <Link
              to={`/${getContentType()}/${item.id}`}
              className="bg-gray-700 hover:bg-gray-600 text-white px-8 py-3 rounded font-bold flex items-center"
            >
              <motion.div
                whileHover="hover"
                whileTap="tap"
                variants={buttonVariants}
                className="flex items-center"
              >
                <Info size={20} className="mr-2" />
                Plus d'infos
              </motion.div>
            </Link>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default FeaturedHero;
