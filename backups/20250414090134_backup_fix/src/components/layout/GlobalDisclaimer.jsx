import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Info } from 'lucide-react';

/**
 * Composant de disclaimer global discret affiché au niveau du footer
 * Inspiré du design de CinePulse
 */
const GlobalDisclaimer = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Vérifier si le disclaimer a déjà été consulté
  useEffect(() => {
    const disclaimerSeen = localStorage.getItem('disclaimerSeen');
    if (!disclaimerSeen) {
      // Montrer le disclaimer étendu au premier chargement
      setIsExpanded(true);
      // Marquer comme vu
      localStorage.setItem('disclaimerSeen', 'true');
    }
  }, []);
  
  // Animation pour le disclaimer
  const containerVariants = {
    collapsed: { 
      height: '32px',
      transition: { duration: 0.3, ease: 'easeInOut' }
    },
    expanded: { 
      height: 'auto',
      transition: { duration: 0.3, ease: 'easeInOut' }
    }
  };

  return (
    <div className="w-full bg-background-darker border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-4">
        <motion.div
          className="py-1 relative overflow-hidden"
          variants={containerVariants}
          initial="collapsed"
          animate={isExpanded ? "expanded" : "collapsed"}
        >
          {/* Barre de disclaimer réduite */}
          <div 
            className="flex items-center justify-between cursor-pointer py-1"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <div className="flex items-center text-sm">
              <Info size={14} className="mr-2 text-accent" />
              <span className="text-text-secondary font-medium">
                Avis légal
              </span>
            </div>
            
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.3 }}
            >
              <X 
                size={14} 
                className="text-text-tertiary"
                style={{ transform: 'rotate(45deg)' }}
              />
            </motion.div>
          </div>
          
          {/* Contenu complet du disclaimer */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="pb-2 pt-1 text-xs text-text-tertiary"
              >
                <p>
                  FloDrama n'héberge aucun fichier, mais propose des liens vers des services tiers. Les questions juridiques doivent être traitées avec les hébergeurs et les fournisseurs de fichiers. FloDrama n'est pas responsable des fichiers multimédias diffusés par les fournisseurs de vidéos.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
};

export default GlobalDisclaimer;
