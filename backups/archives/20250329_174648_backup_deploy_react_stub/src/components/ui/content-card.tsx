import React, { useState } from 'react';
import { AnimatedElement } from './animated-element';
import { cn } from '@/lib/utils';

// Types pour les cartes de contenu
interface ContentCardProps {
  title: string;
  description?: string;
  imageUrl: string;
  category?: string;
  date?: string;
  onClick?: () => void;
  className?: string;
  size?: 'small' | 'medium' | 'large';
  variant?: 'default' | 'featured' | 'minimal';
  badge?: string;
  rating?: number;
}

// Composant principal pour les cartes de contenu
export const ContentCard: React.FC<ContentCardProps> = ({
  title,
  description,
  imageUrl,
  category,
  date,
  onClick,
  className = '',
  size = 'medium',
  variant = 'default',
  badge,
  rating
}) => {
  const [isHovered, setIsHovered] = useState(false);

  // Classes CSS en fonction de la taille et de la variante
  const sizeClasses = {
    small: 'h-48 w-full',
    medium: 'h-64 w-full',
    large: 'h-80 w-full'
  };

  const variantClasses = {
    default: 'rounded-lg overflow-hidden shadow-md',
    featured: 'rounded-lg overflow-hidden shadow-lg',
    minimal: 'rounded overflow-hidden'
  };

  return (
    <div
      className={cn(
        "content-card relative cursor-pointer transition-all duration-300",
        sizeClasses[size],
        variantClasses[variant],
        isHovered && "scale-[1.03] shadow-xl",
        className
      )}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image de fond avec effet de zoom au survol */}
      <div 
        className={cn(
          "absolute inset-0 bg-cover bg-center z-0 transition-all duration-500",
          isHovered ? "scale-110 brightness-[0.7]" : "brightness-[0.85]"
        )}
        style={{ backgroundImage: `url(${imageUrl})` }}
      />

      {/* Overlay dégradé */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent z-10" />

      {/* Badge (si présent) */}
      {badge && (
        <div className="absolute top-2 right-2 z-30 bg-primary text-white text-xs font-bold px-2 py-1 rounded">
          {badge}
        </div>
      )}

      {/* Contenu de la carte */}
      <div className="absolute bottom-0 left-0 right-0 p-4 z-20 text-white">
        <div className={cn(
          "transition-all duration-300",
          isHovered ? "transform -translate-y-2" : ""
        )}>
          {category && (
            <AnimatedElement 
              animation="slide-up" 
              delay={0.1} 
              className="text-xs font-semibold uppercase tracking-wider mb-1 text-primary-300"
            >
              {category}
            </AnimatedElement>
          )}
          
          <AnimatedElement animation="slide-up" delay={0.2}>
            <h3 className="text-lg font-bold leading-tight mb-1">{title}</h3>
          </AnimatedElement>
          
          {description && (
            <AnimatedElement 
              animation="slide-up" 
              delay={0.3} 
              className={cn(
                "text-sm text-gray-300 line-clamp-2 transition-opacity duration-300",
                isHovered ? "opacity-100" : "opacity-0 md:opacity-100"
              )}
            >
              {description}
            </AnimatedElement>
          )}
          
          {/* Note (si présente) */}
          {rating && (
            <div className={cn(
              "flex items-center mt-2 transition-opacity duration-300",
              isHovered ? "opacity-100" : "opacity-70"
            )}>
              {Array.from({ length: 5 }).map((_, i) => (
                <svg 
                  key={i} 
                  className={cn(
                    "w-4 h-4 mr-1", 
                    i < Math.floor(rating) ? "text-yellow-400" : "text-gray-400"
                  )}
                  fill="currentColor" 
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
              <span className="text-xs ml-1 text-gray-300">{rating.toFixed(1)}</span>
            </div>
          )}
          
          {date && (
            <AnimatedElement 
              animation="slide-up" 
              delay={0.4} 
              className="text-xs text-gray-400 mt-2"
            >
              {date}
            </AnimatedElement>
          )}
        </div>
      </div>

      {/* Bouton de lecture (visible au survol) */}
      <div 
        className={cn(
          "absolute inset-0 flex items-center justify-center z-30 transition-opacity duration-300",
          isHovered ? "opacity-100" : "opacity-0"
        )}
      >
        <div 
          className="bg-primary text-white rounded-full p-3 transition-transform duration-200 hover:scale-110 active:scale-95 backdrop-blur-sm"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
      </div>

      {/* Effet de vignette au survol */}
      <div 
        className={cn(
          "absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 transition-opacity duration-300 z-15",
          isHovered && "opacity-100"
        )}
      />
    </div>
  );
};

// Composant pour les rangées de cartes de contenu
export const ContentRow: React.FC<{
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  showMoreLink?: string;
  onShowMoreClick?: () => void;
}> = ({
  title,
  subtitle,
  children,
  className = '',
  showMoreLink,
  onShowMoreClick
}) => {
  return (
    <div className={cn("content-row my-8", className)}>
      <div className="flex justify-between items-end mb-6">
        <div>
          {title && (
            <AnimatedElement animation="slide-up" className="mb-1">
              <h2 className="text-2xl font-bold">{title}</h2>
            </AnimatedElement>
          )}
          {subtitle && (
            <AnimatedElement animation="slide-up" delay={0.1}>
              <p className="text-gray-500 text-sm">{subtitle}</p>
            </AnimatedElement>
          )}
        </div>
        
        {showMoreLink && (
          <button 
            onClick={onShowMoreClick}
            className="text-primary hover:text-primary-dark text-sm font-medium transition-colors duration-200 flex items-center"
          >
            {showMoreLink}
            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {children}
      </div>
    </div>
  );
};

// Composant pour les cartes de contenu en vedette
export const FeaturedContentCard: React.FC<ContentCardProps> = (props) => {
  return (
    <ContentCard
      {...props}
      size="large"
      variant="featured"
      className={cn("featured-content-card", props.className)}
    />
  );
};
