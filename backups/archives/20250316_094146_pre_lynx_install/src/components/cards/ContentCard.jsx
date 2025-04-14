import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Play, Star, Plus, Check, ThumbsUp, ThumbsDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAssetUrl } from '../../api/metadata';
import { useWatchlist } from '../../hooks/useWatchlist';
import { useRatings } from '../../hooks/useRatings';

/**
 * Carte de contenu standard pour afficher un drama, film, etc.
 * @param {Object} item - Élément à afficher
 * @param {string} size - Taille de la carte ('sm', 'md', 'lg')
 * @param {number} index - Index pour l'animation en cascade
 */
const ContentCard = ({ item, size = 'md', index = 0 }) => {
  const [showOverlay, setShowOverlay] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const { isInWatchlist, toggleWatchlist } = useWatchlist();
  const { isLiked, isDisliked, likeContent, dislikeContent } = useRatings();
  const [isInList, setIsInList] = useState(false);
  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);
  const previewTimeoutRef = useRef(null);
  
  // Vérifier si l'élément est dans la liste au chargement
  useEffect(() => {
    if (item && item.id) {
      setIsInList(isInWatchlist(item.id));
      setLiked(isLiked(item.id));
      setDisliked(isDisliked(item.id));
    }
  }, [item, isInWatchlist, isLiked, isDisliked]);
  
  // Nettoyer le timeout lors du démontage
  useEffect(() => {
    return () => {
      if (previewTimeoutRef.current) {
        clearTimeout(previewTimeoutRef.current);
      }
    };
  }, []);
  
  if (!item) return null;
  
  // Gérer l'ajout/suppression de la liste
  const handleWatchlistToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (item) {
      const added = toggleWatchlist(item);
      setIsInList(added);
    }
  };
  
  // Gérer le like
  const handleLike = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (item) {
      likeContent(item.id);
      setLiked(!liked);
      if (disliked) setDisliked(false);
    }
  };
  
  // Gérer le dislike
  const handleDislike = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (item) {
      dislikeContent(item.id);
      setDisliked(!disliked);
      if (liked) setLiked(false);
    }
  };
  
  // Déterminer les classes CSS en fonction de la taille
  const sizeClasses = {
    sm: 'w-32 h-48',
    md: 'w-40 h-60',
    lg: 'w-48 h-72'
  };
  
  // Déterminer le type de contenu pour la route
  const getContentType = () => {
    if (item.section === 'dramas') return 'drama';
    if (item.section === 'movies') return 'movie';
    if (item.section === 'bollywood') return 'bollywood';
    if (item.section === 'anime') return 'anime';
    return 'drama';
  };

  // Gérer l'entrée de la souris
  const handleMouseEnter = () => {
    setShowOverlay(true);
    
    // Afficher la prévisualisation après un court délai
    previewTimeoutRef.current = setTimeout(() => {
      setShowPreview(true);
    }, 500);
  };
  
  // Gérer la sortie de la souris
  const handleMouseLeave = () => {
    setShowOverlay(false);
    setShowPreview(false);
    
    // Nettoyer le timeout
    if (previewTimeoutRef.current) {
      clearTimeout(previewTimeoutRef.current);
      previewTimeoutRef.current = null;
    }
  };

  // Animations pour la carte
  const cardVariants = {
    hidden: { 
      opacity: 0,
      y: 20,
    },
    visible: { 
      opacity: 1,
      y: 0,
      transition: { 
        duration: 0.5,
        delay: index * 0.05,
        ease: "easeOut"
      }
    },
    hover: { 
      scale: 1.05,
      transition: { 
        duration: 0.3,
        ease: "easeInOut"
      }
    }
  };
  
  // Animation pour la prévisualisation
  const previewVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.3 }
    }
  };
  
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      whileHover="hover"
      variants={cardVariants}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="relative"
    >
      <Link 
        to={`/${getContentType()}/${item.id}`}
        className="group cursor-pointer block"
      >
        <div className={`relative overflow-hidden rounded-lg mb-2 ${sizeClasses[size] || sizeClasses.md}`}>
          <img 
            src={getAssetUrl(item.poster)} 
            alt={item.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          
          {/* Overlay au survol avec animation */}
          <AnimatePresence>
            {showOverlay && (
              <motion.div 
                className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex flex-col justify-end p-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {/* Titre et boutons */}
                <div className="flex justify-between items-end">
                  <div className="flex-1">
                    <h3 className="text-sm font-bold truncate">{item.title}</h3>
                    {item.year && (
                      <p className="text-xs text-gray-300">{item.year}</p>
                    )}
                  </div>
                  <div className="flex space-x-1">
                    <button 
                      className={`p-1.5 rounded-full ${isInList ? 'bg-fuchsia-600 text-white' : 'bg-white/20 text-white hover:bg-white/30'}`}
                      onClick={handleWatchlistToggle}
                      aria-label={isInList ? "Retirer de ma liste" : "Ajouter à ma liste"}
                    >
                      {isInList ? <Check size={14} /> : <Plus size={14} />}
                    </button>
                    <button 
                      className="p-1.5 rounded-full bg-fuchsia-600 text-white"
                      aria-label="Lire"
                    >
                      <Play size={14} fill="white" />
                    </button>
                  </div>
                </div>
                
                {/* Prévisualisation avec animation */}
                <AnimatePresence>
                  {showPreview && (
                    <motion.div 
                      className="mt-2"
                      variants={previewVariants}
                      initial="hidden"
                      animate="visible"
                      exit="hidden"
                    >
                      {/* Informations supplémentaires */}
                      <div className="flex items-center text-xs space-x-2 mb-1">
                        {item.rating && (
                          <div className="flex items-center">
                            <Star size={12} className="text-yellow-400 mr-0.5" />
                            <span>{item.rating}</span>
                          </div>
                        )}
                        {item.duration && (
                          <span>{item.duration}</span>
                        )}
                        {item.year && (
                          <span>{item.year}</span>
                        )}
                      </div>
                      
                      {/* Genres */}
                      {item.categories && item.categories.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {item.categories.slice(0, 2).map((genre, idx) => (
                            <span 
                              key={idx} 
                              className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded"
                            >
                              {genre}
                            </span>
                          ))}
                        </div>
                      )}
                      
                      {/* Description tronquée */}
                      {item.description && (
                        <p className="text-xs text-gray-300 mt-1 line-clamp-2">
                          {item.description}
                        </p>
                      )}
                      
                      {/* Actions */}
                      <div className="flex justify-between mt-2">
                        <div className="flex space-x-2">
                          <button 
                            className={`p-1 ${liked ? 'text-green-400' : 'text-gray-400 hover:text-white'}`}
                            onClick={handleLike}
                            aria-label="J'aime"
                          >
                            <ThumbsUp size={14} />
                          </button>
                          <button 
                            className={`p-1 ${disliked ? 'text-red-400' : 'text-gray-400 hover:text-white'}`}
                            onClick={handleDislike}
                            aria-label="Je n'aime pas"
                          >
                            <ThumbsDown size={14} />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Badge de notation (toujours visible) */}
          {item.rating && (
            <div className="absolute top-2 right-2 bg-red-600 text-white text-xs font-bold px-1.5 py-0.5 rounded flex items-center">
              <Star size={12} className="mr-0.5" />
              {item.rating}
            </div>
          )}
          
          {/* Badge d'épisodes (toujours visible) */}
          {item.episodes && (
            <div className="absolute bottom-2 left-2 bg-black bg-opacity-70 text-white text-xs px-1.5 py-0.5 rounded">
              {item.latest_episode}/{item.episodes} EP
            </div>
          )}
        </div>
        
        {/* Informations textuelles (toujours visibles) */}
        <h3 className="font-medium text-sm truncate">{item.title}</h3>
        <div className="flex text-xs text-gray-400 space-x-2">
          <span>{item.year}</span>
          {item.categories && item.categories.length > 0 && (
            <>
              <span>•</span>
              <span>{item.categories[0]}</span>
            </>
          )}
        </div>
      </Link>
    </motion.div>
  );
};

export default ContentCard;
