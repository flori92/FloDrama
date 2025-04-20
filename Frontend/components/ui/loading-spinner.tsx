import React from 'react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  color?: 'primary' | 'white' | 'gray';
  className?: string;
  text?: string;
}

/**
 * Composant d'indicateur de chargement
 * Affiche une animation de chargement élégante avec texte optionnel
 */
export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'medium',
  color = 'primary',
  className,
  text
}) => {
  // Tailles prédéfinies
  const sizeClasses = {
    small: 'w-4 h-4 border-2',
    medium: 'w-8 h-8 border-2',
    large: 'w-12 h-12 border-3'
  };

  // Couleurs prédéfinies
  const colorClasses = {
    primary: 'border-primary/30 border-t-primary',
    white: 'border-white/30 border-t-white',
    gray: 'border-gray-300/30 border-t-gray-300'
  };

  return (
    <div className={cn("flex flex-col items-center justify-center", className)}>
      <div 
        className={cn(
          "rounded-full animate-spin",
          sizeClasses[size],
          colorClasses[color]
        )}
      />
      {text && (
        <p className={cn(
          "mt-3 text-sm font-medium",
          color === 'white' ? 'text-white' : 'text-gray-600'
        )}>
          {text}
        </p>
      )}
    </div>
  );
};

/**
 * Composant d'état de chargement plein écran
 * Utile pour les transitions de page ou chargements initiaux
 */
export const FullScreenLoader: React.FC<{text?: string}> = ({ text }) => {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white/10 rounded-lg p-8 shadow-2xl backdrop-blur-md">
        <LoadingSpinner size="large" color="white" text={text || "Chargement en cours..."} />
      </div>
    </div>
  );
};

/**
 * Composant de chargement pour les sections de contenu
 * S'affiche à la place du contenu pendant le chargement
 */
export const ContentLoader: React.FC<{className?: string}> = ({ className }) => {
  return (
    <div className={cn("w-full py-12 flex justify-center", className)}>
      <LoadingSpinner size="medium" color="primary" text="Chargement du contenu..." />
    </div>
  );
};

/**
 * Composant de chargement pour les cartes de contenu
 * Affiche un squelette de carte pendant le chargement
 */
export const CardSkeleton: React.FC<{
  count?: number;
  className?: string;
}> = ({ count = 1, className }) => {
  return (
    <div className={cn("grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4", className)}>
      {Array.from({ length: count }).map((_, index) => (
        <div 
          key={index}
          className="bg-gray-200 rounded-lg overflow-hidden h-64 animate-pulse relative"
        >
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-300 rounded w-1/2"></div>
          </div>
        </div>
      ))}
    </div>
  );
};
