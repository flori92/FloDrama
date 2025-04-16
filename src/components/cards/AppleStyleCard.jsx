import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Play, Plus, Check, ThumbsUp, ThumbsDown, Star, Bookmark } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getPosterUrl } from '../../utils/demo-images';
import { useWatchlist } from '../../hooks/useWatchlist';
import { useRatings } from '../../hooks/useRatings';
import { MicroAnimations } from '../animations';

/**
 * Carte de contenu inspirée du style Apple TV+ pour FloDrama
 * Améliorée avec des boutons like, dislike et add to list inspirés de CinePulse
 * @param {Object} item - Élément à afficher
 * @param {boolean} showInfo - Afficher les informations supplémentaires
 * @param {number} index - Index pour l'animation
 */
const AppleStyleCard = ({ item, showInfo = true, index = 0 }) => {
  const [showOverlay, setShowOverlay] = useState(false);
  const [imageError, setImageError] = useState(false);
  const { isInWatchlist, toggleWatchlist } = useWatchlist();
  const { isLiked, isDisliked, likeContent, dislikeContent } = useRatings();
  const [isInList, setIsInList] = useState(false);
  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);
  const cardRef = useRef(null);
  
  // États pour les animations
  const [showLikeAnimation, setShowLikeAnimation] = useState(false);
  const [showDislikeAnimation, setShowDislikeAnimation] = useState(false);
  const [showAddAnimation, setShowAddAnimation] = useState(false);
  const [showTooltip, setShowTooltip] = useState('');
  
  // Vérifier si l'élément est dans la liste au chargement
  useEffect(() => {
    if (item && item.id) {
      setIsInList(isInWatchlist(item.id));
      setLiked(isLiked(item.id));
      setDisliked(isDisliked(item.id));
    }
  }, [item, isInWatchlist, isLiked, isDisliked]);
  
  if (!item) return null;
  
  // Gérer l'ajout/suppression de la liste
  const handleWatchlistToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (item) {
      const added = toggleWatchlist(item);
      setIsInList(added);
      
      // Déclencher l'animation
      setShowAddAnimation(true);
      setTimeout(() => setShowAddAnimation(false), 800);
    }
  };
  
  // Gérer le like
  const handleLike = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (item) {
      likeContent(item.id);
      const newLikedState = !liked;
      setLiked(newLikedState);
      if (disliked) setDisliked(false);
      
      // Déclencher l'animation
      if (newLikedState) {
        setShowLikeAnimation(true);
        setTimeout(() => setShowLikeAnimation(false), 800);
      }
    }
  };
  
  // Gérer le dislike
  const handleDislike = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (item) {
      dislikeContent(item.id);
      const newDislikedState = !disliked;
      setDisliked(newDislikedState);
      if (liked) setLiked(false);
      
      // Déclencher l'animation
      if (newDislikedState) {
        setShowDislikeAnimation(true);
        setTimeout(() => setShowDislikeAnimation(false), 800);
      }
    }
  };
  
  // Gérer l'entrée de la souris
  const handleMouseEnter = () => {
    setShowOverlay(true);
  };
  
  // Gérer la sortie de la souris
  const handleMouseLeave = () => {
    setShowOverlay(false);
    setShowTooltip('');
  };

  // Animations pour la carte
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5, delay: index * 0.05 }
    },
    hover: { 
      scale: 1.05,
      boxShadow: "0px 10px 30px -5px rgba(0, 0, 0, 0.5)",
      transition: { duration: 0.3 }
    }
  };

  return (
    <motion.div
      ref={cardRef}
      className="relative"
      initial="hidden"
      animate="visible"
      whileHover="hover"
      variants={cardVariants}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Link to={`/detail/${item.id}`} className="block h-full">
        <div className="relative overflow-hidden rounded-lg bg-gray-800 h-full">
          {/* Image principale */}
          <div className="relative aspect-[2/3]">
            <img
              src={item.image || getPosterUrl(item.id)}
              alt={item.title}
              className="w-full h-full object-cover"
              onError={() => setImageError(true)}
              style={{ opacity: imageError ? 0.5 : 1 }}
            />
            
            {/* Overlay au survol */}
            <AnimatePresence>
              {showOverlay && (
                <motion.div
                  className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent flex flex-col justify-between p-3"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {/* Boutons d'action en haut */}
                  <div className="flex justify-end space-x-1">
                    {/* Bouton Like */}
                    <MicroAnimations 
                      type="tooltip" 
                      tooltipText="J'aime" 
                      isVisible={showTooltip === 'like'}
                    >
                      <motion.button 
                        className={`p-1.5 rounded-full ${liked ? 'bg-blue-500' : 'bg-black/60 hover:bg-black/80'}`}
                        onClick={handleLike}
                        aria-label="J'aime"
                        onMouseEnter={() => setShowTooltip('like')}
                        onMouseLeave={() => setShowTooltip('')}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <ThumbsUp size={14} />
                      </motion.button>
                    </MicroAnimations>
                    
                    {/* Bouton Dislike */}
                    <MicroAnimations 
                      type="tooltip" 
                      tooltipText="Je n'aime pas" 
                      isVisible={showTooltip === 'dislike'}
                    >
                      <motion.button 
                        className={`p-1.5 rounded-full ${disliked ? 'bg-red-500' : 'bg-black/60 hover:bg-black/80'}`}
                        onClick={handleDislike}
                        aria-label="Je n'aime pas"
                        onMouseEnter={() => setShowTooltip('dislike')}
                        onMouseLeave={() => setShowTooltip('')}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <ThumbsDown size={14} />
                      </motion.button>
                    </MicroAnimations>
                    
                    {/* Bouton Ma liste */}
                    <MicroAnimations 
                      type="tooltip" 
                      tooltipText={isInList ? "Retirer de ma liste" : "Ajouter à ma liste"} 
                      isVisible={showTooltip === 'list'}
                    >
                      <motion.button 
                        className={`p-1.5 rounded-full ${isInList ? 'bg-green-500' : 'bg-black/60 hover:bg-black/80'}`}
                        onClick={handleWatchlistToggle}
                        aria-label={isInList ? "Retirer de ma liste" : "Ajouter à ma liste"}
                        onMouseEnter={() => setShowTooltip('list')}
                        onMouseLeave={() => setShowTooltip('')}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {isInList ? <Check size={14} /> : <Plus size={14} />}
                      </motion.button>
                    </MicroAnimations>
                  </div>
                  
                  {/* Bouton de lecture */}
                  <div className="flex justify-center items-center">
                    <motion.button
                      className="bg-white text-black rounded-full p-2 flex items-center justify-center"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      aria-label="Lire"
                    >
                      <Play size={20} fill="black" />
                    </motion.button>
                  </div>
                  
                  {/* Informations en bas */}
                  <div className="text-xs">
                    {item.year && <span className="mr-2">{item.year}</span>}
                    {item.duration && <span className="mr-2">{item.duration}</span>}
                    {item.rating && (
                      <span className="flex items-center">
                        <Star size={12} className="mr-1" /> {item.rating}
                      </span>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          {/* Informations sous l'image */}
          {showInfo && (
            <div className="p-2">
              <h3 className="text-sm font-medium truncate">{item.title}</h3>
              {item.categories && item.categories.origin && (
                <p className="text-xs text-gray-400">{item.categories.origin}</p>
              )}
            </div>
          )}
          
          {/* Indicateur discret si dans la liste */}
          {isInList && !showOverlay && (
            <div className="absolute bottom-0 right-0 m-1">
              <div className="bg-green-500 w-2 h-2 rounded-full"></div>
            </div>
          )}
        </div>
      </Link>
      
      {/* Animations de feedback */}
      <AnimatePresence>
        {showLikeAnimation && (
          <MicroAnimations type="success" isVisible={showLikeAnimation}>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-blue-500 rounded-full p-3">
              <ThumbsUp size={24} />
            </div>
          </MicroAnimations>
        )}
        
        {showDislikeAnimation && (
          <MicroAnimations type="error" isVisible={showDislikeAnimation}>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full p-3">
              <ThumbsDown size={24} />
            </div>
          </MicroAnimations>
        )}
        
        {showAddAnimation && (
          <MicroAnimations type="confetti" isVisible={showAddAnimation}>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-green-500 rounded-full p-3">
              <Bookmark size={24} />
            </div>
          </MicroAnimations>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default AppleStyleCard;
