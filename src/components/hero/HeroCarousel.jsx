import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import './HeroCarousel.css';

/**
 * Composant de carrousel héroïque pour la page d'accueil de FloDrama
 * Affiche les contenus mis en avant avec une animation fluide
 * 
 * @param {Object} props - Propriétés du composant
 * @param {Array} props.items - Éléments à afficher dans le carrousel
 * @param {number} props.autoplaySpeed - Vitesse de défilement automatique en ms (défaut: 6000)
 * @param {boolean} props.showControls - Afficher les contrôles de navigation (défaut: true)
 */
const HeroCarousel = ({ 
  items = [], 
  autoplaySpeed = 6000, 
  showControls = true 
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  
  // Générer des éléments de démonstration si aucun n'est fourni
  const carouselItems = items.length > 0 ? items : [
    {
      id: 'demo-1',
      title: 'Crash Landing on You',
      description: 'Une héritière sud-coréenne atterrit accidentellement en Corée du Nord après un accident de parapente et tombe amoureuse d\'un officier nord-coréen.',
      image: '/assets/media/hero/crash-landing-on-you.jpg',
      type: 'drama',
      rating: 9.2,
      year: 2020,
      path: '/contenu/crash-landing-on-you'
    },
    {
      id: 'demo-2',
      title: 'Itaewon Class',
      description: 'Un ex-détenu et ses amis luttent pour réussir dans le quartier d\'Itaewon tout en poursuivant leur rêve d\'ouvrir un bar à succès.',
      image: '/assets/media/hero/itaewon-class.jpg',
      type: 'drama',
      rating: 8.7,
      year: 2020,
      path: '/contenu/itaewon-class'
    },
    {
      id: 'demo-3',
      title: 'Goblin',
      description: 'Un gobelin immortel cherche sa fiancée pour mettre fin à sa vie éternelle, tandis qu\'un faucheur d\'âmes amnésique collecte les âmes des morts.',
      image: '/assets/media/hero/goblin.jpg',
      type: 'drama',
      rating: 9.5,
      year: 2016,
      path: '/contenu/goblin'
    }
  ];
  
  // Passer à l'élément suivant
  const nextSlide = useCallback(() => {
    setCurrentIndex(prevIndex => 
      prevIndex === carouselItems.length - 1 ? 0 : prevIndex + 1
    );
  }, [carouselItems.length]);
  
  // Passer à l'élément précédent
  const prevSlide = useCallback(() => {
    setCurrentIndex(prevIndex => 
      prevIndex === 0 ? carouselItems.length - 1 : prevIndex - 1
    );
  }, [carouselItems.length]);
  
  // Définir l'élément actif
  const goToSlide = (index) => {
    setCurrentIndex(index);
    setIsPlaying(false);
    // Redémarrer l'autoplay après un délai
    setTimeout(() => setIsPlaying(true), 5000);
  };
  
  // Défilement automatique
  useEffect(() => {
    let interval;
    
    if (isPlaying && carouselItems.length > 1) {
      interval = setInterval(nextSlide, autoplaySpeed);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, nextSlide, autoplaySpeed, carouselItems.length]);
  
  // Gestion des événements tactiles
  const handleTouchStart = (e) => {
    setTouchStart(e.targetTouches[0].clientX);
  };
  
  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };
  
  const handleTouchEnd = () => {
    if (touchStart - touchEnd > 150) {
      // Swipe gauche
      nextSlide();
    }
    
    if (touchStart - touchEnd < -150) {
      // Swipe droite
      prevSlide();
    }
  };
  
  // Obtenir l'élément actuel
  const currentItem = carouselItems[currentIndex];
  
  // Variantes d'animation pour les transitions
  const slideVariants = {
    enter: (direction) => ({
      x: direction > 0 ? '100%' : '-100%',
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1
    },
    exit: (direction) => ({
      x: direction < 0 ? '100%' : '-100%',
      opacity: 0
    })
  };
  
  // Variantes d'animation pour le contenu
  const contentVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        delay: 0.3,
        staggerChildren: 0.2 
      }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };
  
  return (
    <div 
      className="hero-carousel"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <AnimatePresence initial={false} custom={1}>
        <motion.div
          key={currentIndex}
          className="hero-carousel-slide"
          custom={1}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ type: 'tween', duration: 0.5 }}
        >
          {/* Image d'arrière-plan */}
          <div className="hero-carousel-background">
            <img 
              src={currentItem.image} 
              alt={currentItem.title}
              className="hero-carousel-image"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = '/assets/media/hero-fallback.jpg';
              }}
            />
            <div className="hero-carousel-overlay"></div>
          </div>
          
          {/* Contenu */}
          <div className="hero-carousel-content-container">
            <motion.div 
              className="hero-carousel-content"
              variants={contentVariants}
              initial="hidden"
              animate="visible"
            >
              <motion.div className="hero-carousel-badges" variants={itemVariants}>
                <span className="hero-carousel-badge hero-carousel-type-badge">
                  {currentItem.type === 'drama' ? 'Drama' : 
                   currentItem.type === 'anime' ? 'Animé' : 
                   currentItem.type === 'film' ? 'Film' : 
                   currentItem.type === 'bollywood' ? 'Bollywood' : 'Série'}
                </span>
                <span className="hero-carousel-badge hero-carousel-year-badge">
                  {currentItem.year}
                </span>
                {currentItem.rating && (
                  <span className="hero-carousel-badge hero-carousel-rating-badge">
                    ★ {currentItem.rating}
                  </span>
                )}
              </motion.div>
              
              <motion.h1 className="hero-carousel-title" variants={itemVariants}>
                {currentItem.title}
              </motion.h1>
              
              <motion.p className="hero-carousel-description" variants={itemVariants}>
                {currentItem.description}
              </motion.p>
              
              <motion.div className="hero-carousel-actions" variants={itemVariants}>
                <Link to={currentItem.path} className="hero-carousel-button primary-button">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                    <polygon points="5 3 19 12 5 21 5 3"></polygon>
                  </svg>
                  Regarder
                </Link>
                <Link to={`${currentItem.path}/details`} className="hero-carousel-button secondary-button">
                  Plus d'infos
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>
      
      {/* Contrôles de navigation */}
      {showControls && carouselItems.length > 1 && (
        <div className="hero-carousel-controls">
          <button 
            className="hero-carousel-arrow hero-carousel-prev"
            onClick={prevSlide}
            aria-label="Précédent"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>
          
          <div className="hero-carousel-indicators">
            {carouselItems.map((_, index) => (
              <button
                key={index}
                className={`hero-carousel-indicator ${index === currentIndex ? 'active' : ''}`}
                onClick={() => goToSlide(index)}
                aria-label={`Aller à l'élément ${index + 1}`}
              />
            ))}
          </div>
          
          <button 
            className="hero-carousel-arrow hero-carousel-next"
            onClick={nextSlide}
            aria-label="Suivant"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};

export default HeroCarousel;
