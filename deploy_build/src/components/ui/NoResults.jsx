import React from 'react';
import { motion } from 'framer-motion';
import { Search, RefreshCw } from 'lucide-react';

/**
 * Composant affiché lorsqu'aucun résultat n'est trouvé
 * @param {string} query - Terme de recherche
 * @param {boolean} hasFilters - Indique si des filtres sont actifs
 * @param {function} onResetFilters - Fonction pour réinitialiser les filtres
 */
const NoResults = ({ query, hasFilters, onResetFilters }) => {
  return (
    <motion.div 
      className="flex flex-col items-center justify-center py-16 px-4 bg-gray-800 rounded-lg text-center"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mb-4">
        <Search size={32} className="text-gray-400" />
      </div>
      
      <h2 className="text-xl font-bold mb-2">Aucun résultat trouvé</h2>
      
      <p className="text-gray-400 mb-6 max-w-md">
        {hasFilters 
          ? "Aucun contenu ne correspond à votre recherche avec les filtres actuels."
          : `Nous n'avons pas trouvé de contenu correspondant à "${query}".`}
      </p>
      
      {hasFilters && (
        <button
          onClick={onResetFilters}
          className="flex items-center bg-fuchsia-600 hover:bg-fuchsia-700 text-white px-4 py-2 rounded-lg transition-colors mb-4"
        >
          <RefreshCw size={16} className="mr-2" />
          Réinitialiser les filtres
        </button>
      )}
      
      <div className="mt-4 text-gray-400 text-sm">
        <p>Suggestions :</p>
        <ul className="mt-2">
          <li>• Vérifiez l'orthographe des mots-clés</li>
          <li>• Essayez des termes plus généraux</li>
          <li>• Essayez un autre type de contenu (drama, film, anime...)</li>
          {hasFilters && <li>• Réduisez le nombre de filtres appliqués</li>}
        </ul>
      </div>
    </motion.div>
  );
};

export default NoResults;
