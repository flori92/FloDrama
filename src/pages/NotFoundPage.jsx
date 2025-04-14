import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Search, ArrowLeft } from 'lucide-react';

/**
 * Page 404 - Page non trouvée
 * Respecte l'identité visuelle de FloDrama avec le dégradé signature
 */
const NotFoundPage = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white p-4">
      {/* Logo animé */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <h1 className="text-5xl font-bold mb-2 text-center">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-fuchsia-500">
            FloDrama
          </span>
        </h1>
      </motion.div>
      
      {/* Message d'erreur */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="text-center max-w-md"
      >
        <h2 className="text-4xl font-bold mb-4">404</h2>
        <h3 className="text-2xl font-semibold mb-6">Page non trouvée</h3>
        <p className="text-gray-400 mb-8">
          La page que vous recherchez n'existe pas ou a été déplacée. 
          Veuillez vérifier l'URL ou utiliser les liens ci-dessous pour continuer votre navigation.
        </p>
        
        {/* Boutons de navigation */}
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link 
            to="/"
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-blue-500 to-fuchsia-500 text-white font-medium hover:opacity-90 transition-opacity"
          >
            <Home size={18} />
            <span>Accueil</span>
          </Link>
          
          <Link 
            to="/search"
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-gray-800 text-white font-medium hover:bg-gray-700 transition-colors"
          >
            <Search size={18} />
            <span>Rechercher</span>
          </Link>
          
          <button 
            onClick={() => window.history.back()}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg border border-gray-700 text-white font-medium hover:bg-gray-800 transition-colors"
          >
            <ArrowLeft size={18} />
            <span>Retour</span>
          </button>
        </div>
      </motion.div>
      
      {/* Illustration */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.7 }}
        transition={{ duration: 1, delay: 0.5 }}
        className="absolute inset-0 -z-10 flex items-center justify-center opacity-20 pointer-events-none"
      >
        <div className="w-full h-full max-w-2xl max-h-2xl">
          <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#d946ef" />
              </linearGradient>
            </defs>
            <path
              d="M50,5 C25,5 5,25 5,50 C5,75 25,95 50,95 C75,95 95,75 95,50 C95,25 75,5 50,5 Z M50,80 C33.4,80 20,66.6 20,50 C20,33.4 33.4,20 50,20 C66.6,20 80,33.4 80,50 C80,66.6 66.6,80 50,80 Z"
              fill="url(#gradient)"
            />
            <path
              d="M65,35 L35,65 M35,35 L65,65"
              stroke="url(#gradient)"
              strokeWidth="5"
              strokeLinecap="round"
            />
          </svg>
        </div>
      </motion.div>
      
      {/* Pied de page */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 1 }}
        className="mt-16 text-sm text-gray-500"
      >
        &copy; {new Date().getFullYear()} FloDrama - Tous droits réservés
      </motion.div>
    </div>
  );
};

export default NotFoundPage;
