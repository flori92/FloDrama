import React from 'react';

/**
 * Composant d'indicateur de chargement
 * @param {Object} props - Propriétés du composant
 * @param {string} props.size - Taille du spinner (small, medium, large)
 * @param {string} props.color - Couleur du spinner
 */
const LoadingSpinner = ({ size = 'medium', color = 'blue' }) => {
  // Définir les classes en fonction de la taille
  const sizeClasses = {
    small: 'h-4 w-4 border-2',
    medium: 'h-8 w-8 border-2',
    large: 'h-12 w-12 border-3',
  };
  
  // Définir les classes en fonction de la couleur
  const colorClasses = {
    blue: 'border-blue-500',
    white: 'border-white',
    gray: 'border-gray-300',
  };
  
  return (
    <div className="flex justify-center items-center">
      <div 
        className={`
          animate-spin rounded-full 
          ${sizeClasses[size] || sizeClasses.medium} 
          border-t-transparent 
          ${colorClasses[color] || colorClasses.blue}
        `}
      />
    </div>
  );
};

export default LoadingSpinner;
