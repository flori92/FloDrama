import React from 'react';

/**
 * Composant de fallback pour afficher les erreurs de manière élégante
 * Utilisé avec le hook useApi et d'autres composants
 * 
 * @param {Object} props - Propriétés du composant
 * @param {Error} props.error - L'erreur à afficher
 * @param {Function} props.resetError - Fonction pour réinitialiser l'erreur
 * @param {String} props.message - Message personnalisé (optionnel)
 * @returns {JSX.Element} - Composant d'affichage d'erreur
 */
const ErrorFallback = ({ error, resetError, message }) => {
  // Message par défaut si aucun message personnalisé n'est fourni
  const errorMessage = message || "Une erreur est survenue lors du chargement des données";
  
  return (
    <div className="error-fallback p-4 rounded-md bg-red-900/30 border border-red-500/50 text-white my-4">
      <h3 className="text-lg font-medium mb-2">
        {errorMessage}
      </h3>
      
      {/* Afficher les détails de l'erreur */}
      <p className="text-sm text-red-300 mb-3">
        {error?.message || "Erreur inconnue"}
      </p>
      
      {/* Bouton pour réessayer */}
      {resetError && (
        <button
          onClick={resetError}
          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-sm rounded transition-colors"
        >
          Réessayer
        </button>
      )}
    </div>
  );
};

export default ErrorFallback;
