import React from 'react';
import '@/styles/components/logo.scss';

interface LogoProps {
  variant?: 'default' | 'small' | 'large';
  animated?: boolean;
  className?: string;
}

/**
 * Composant Logo FloDrama
 * Reproduit l'identité visuelle caractéristique de FloDrama
 */
const Logo: React.FC<LogoProps> = ({
  variant = 'default',
  animated = true,
  className = ''
}) => {
  const baseClass = 'flodrama-logo';
  const variantClass = `${baseClass}-${variant}`;
  const animatedClass = animated ? 'animated' : '';
  
  return (
    <div className={`${baseClass} ${variantClass} ${animatedClass} ${className}`}>
      <div className="logo-container">
        <span className="logo-text">Flo</span>
        <span className="logo-text accent">Drama</span>
      </div>
      {variant !== 'small' && (
        <div className="logo-subtitle">
          Votre source de dramas en streaming
        </div>
      )}
    </div>
  );
};

export default Logo;
