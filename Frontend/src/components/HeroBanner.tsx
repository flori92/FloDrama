import React, { useState, useEffect } from 'react';
import { Play, Info, Plus, ThumbsUp, ThumbsDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Données de démonstration pour le carrousel
const heroContents = [
  {
    id: 1,
    title: "Les mystères de l'Empire",
    subtitle: "Nouvelle Saison",
    description: "Dans la Chine ancienne, une jeune femme devient enquêtrice pour résoudre des mystères qui menacent l'empire. Entre complots politiques et aventures romantiques, suivez son parcours extraordinaire.",
    image: "/static/hero/hero-drama1.jpg",
    logo: "/static/logos/empire-mysteries.png",
    category: "Drama Historique"
  },
  {
    id: 2,
    title: "Sous les cerisiers en fleurs",
    subtitle: "Exclusivité",
    description: "Quand un jeune architecte retourne dans sa ville natale, il redécouvre son premier amour. Une histoire touchante de seconde chance dans un cadre magnifique du Japon rural.",
    image: "/static/hero/hero-drama2.jpg",
    logo: "/static/logos/cherry-blossoms.png",
    category: "Romance"
  },
  {
    id: 3,
    title: "La légende du guerrier",
    subtitle: "Haute note",
    description: "Un guerrier légendaire doit faire face à son plus grand défi : protéger son village et retrouver sa famille disparue. Une épopée captivante mêlant arts martiaux et spiritualité.",
    image: "/static/hero/hero-action.jpg",
    logo: "/static/logos/warrior-legend.png",
    category: "Action"
  },
];

const HeroBanner: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  
  // Effet pour le carrousel automatique
  useEffect(() => {
    if (isHovering) return; // Arrêter la rotation automatique pendant le survol
    
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % heroContents.length);
    }, 6000);
    
    return () => clearInterval(interval);
  }, [isHovering]);
  
  // Content actuel
  const content = heroContents[currentIndex];
  
  return (
    <section 
      className="relative h-[85vh] overflow-hidden flex items-center justify-start mb-8"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Carrousel d'images de fond */}
      <AnimatePresence mode="wait">
        <motion.div
          key={content.id}
          className="absolute inset-0 z-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
        >
          {/* Image de fond */}
          <motion.div
            className="w-full h-full bg-cover bg-center"
            style={{ 
              backgroundImage: `url(${content.image})` 
            }}
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            transition={{ duration: 8 }}
          />
          
          {/* Superpositions de dégradés */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-80" />
        </motion.div>
      </AnimatePresence>
      
      {/* Contenu texte */}
      <div className="relative z-10 container mx-auto px-6 flex flex-col items-start max-w-3xl ml-12 mt-6">
        {/* Logo du contenu */}
        <motion.img 
          src={content.logo || '/static/logos/default.png'} 
          alt={`Logo ${content.title}`}
          className="h-24 mb-4 object-contain"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        />
        
        {/* Catégorie */}
        <motion.div
          className="mb-2 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm text-white font-medium"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          {content.category}
        </motion.div>
        
        {/* Sous-titre */}
        <motion.div
          className="mb-2 text-white/80 text-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          {content.subtitle}
        </motion.div>
        
        {/* Titre */}
        <motion.h1 
          className="text-4xl md:text-6xl font-bold text-white mb-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          {content.title}
        </motion.h1>
        
        {/* Description */}
        <motion.p 
          className="text-lg text-white/80 mb-8 max-w-2xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          {content.description}
        </motion.p>
        
        {/* Boutons d'action */}
        <motion.div 
          className="flex flex-wrap gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.5 }}
        >
          {/* Bouton Regarder */}
          <motion.button 
            className="flex items-center space-x-2 bg-white text-black px-6 py-3 rounded-full font-medium shadow-lg hover:bg-white/90 transition-all duration-200"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
          >
            <Play className="w-5 h-5" />
            <span>Commencer à regarder</span>
          </motion.button>
          
          {/* Bouton En savoir plus */}
          <motion.button 
            className="flex items-center space-x-2 border border-white/30 bg-transparent text-white px-6 py-3 rounded-full font-medium hover:bg-white/10 transition-all duration-200"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
          >
            <Info className="w-5 h-5" />
            <span>En savoir plus</span>
          </motion.button>
          
          {/* Actions rapides */}
          <div className="flex space-x-2">
            <motion.button 
              className="p-3 rounded-full border border-white/30 hover:bg-gradient-to-r hover:from-blue-500 hover:to-fuchsia-500 text-white transition-all duration-200"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <Plus className="w-5 h-5" />
            </motion.button>
            <motion.button 
              className="p-3 rounded-full border border-white/30 hover:bg-gradient-to-r hover:from-blue-500 hover:to-fuchsia-500 text-white transition-all duration-200"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <ThumbsUp className="w-5 h-5" />
            </motion.button>
            <motion.button 
              className="p-3 rounded-full border border-white/30 hover:bg-gradient-to-r hover:from-blue-500 hover:to-fuchsia-500 text-white transition-all duration-200"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <ThumbsDown className="w-5 h-5" />
            </motion.button>
          </div>
        </motion.div>
      </div>
      
      {/* Indicateurs du carrousel */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-2 z-20">
        {heroContents.map((_, index) => (
          <motion.button
            key={index}
            className={`w-3 h-3 rounded-full ${
              currentIndex === index 
                ? 'bg-white' 
                : 'bg-white/30'
            }`}
            onClick={() => setCurrentIndex(index)}
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
          />
        ))}
      </div>
    </section>
  );
};

export default HeroBanner;