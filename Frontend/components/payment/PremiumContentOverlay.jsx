/**
 * PremiumContentOverlay
 * 
 * Composant qui s'affiche lorsqu'un utilisateur sans abonnement premium
 * essaie d'accéder à du contenu premium.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Crown, Lock } from 'lucide-react';
import { useSubscription } from '../../services/SubscriptionService';

const PremiumContentOverlay = ({ className }) => {
  const { isInInitialTrial, hasActiveSubscription } = useSubscription();
  
  // Si l'utilisateur est en période d'essai ou a un abonnement actif, ne pas afficher l'overlay
  if (isInInitialTrial() || hasActiveSubscription()) {
    return null;
  }
  
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 p-4 ${className}`}
    >
      <div className="max-w-md w-full bg-gray-800 rounded-xl overflow-hidden shadow-2xl">
        <div className="bg-gradient-to-r from-pink-500 to-purple-600 p-6 text-center">
          <div className="bg-white bg-opacity-20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock size={32} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Contenu Premium</h2>
          <p className="text-white text-opacity-90">
            Ce contenu est réservé aux abonnés premium de FloDrama
          </p>
        </div>
        
        <div className="p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3 flex items-center">
              <Crown size={20} className="text-yellow-500 mr-2" />
              <span>Avantages premium</span>
            </h3>
            <ul className="space-y-2 text-gray-300">
              <li className="flex items-start">
                <span className="text-pink-500 mr-2">•</span>
                <span>Accès à tous les dramas et films en qualité HD/4K</span>
              </li>
              <li className="flex items-start">
                <span className="text-pink-500 mr-2">•</span>
                <span>Visionnage sur plusieurs écrans simultanément</span>
              </li>
              <li className="flex items-start">
                <span className="text-pink-500 mr-2">•</span>
                <span>Sans publicité</span>
              </li>
              <li className="flex items-start">
                <span className="text-pink-500 mr-2">•</span>
                <span>Accès anticipé aux nouveautés</span>
              </li>
            </ul>
          </div>
          
          <div className="flex flex-col space-y-3">
            <Link 
              to="/subscription" 
              className="bg-pink-500 hover:bg-pink-600 text-white py-3 px-4 rounded-lg font-medium text-center transition-colors"
            >
              S'abonner maintenant
            </Link>
            <button 
              onClick={() => window.history.back()}
              className="bg-gray-700 hover:bg-gray-600 text-white py-3 px-4 rounded-lg font-medium text-center transition-colors"
            >
              Retour
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default PremiumContentOverlay;
