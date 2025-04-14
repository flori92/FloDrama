import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { AnimatedElement } from './animated-element';

// Types pour la galerie d'images
interface ImageItem {
  src: string;
  alt: string;
  caption?: string;
  width?: number;
  height?: number;
}

interface ImageGalleryProps {
  images: ImageItem[];
  className?: string;
  variant?: 'grid' | 'masonry' | 'carousel';
  lightbox?: boolean;
  columns?: 1 | 2 | 3 | 4;
  gap?: 'small' | 'medium' | 'large';
}

/**
 * Composant de galerie d'images
 * Affiche une collection d'images avec différentes mises en page et effets
 */
export const ImageGallery: React.FC<ImageGalleryProps> = ({
  images,
  className,
  variant = 'grid',
  lightbox = true,
  columns = 3,
  gap = 'medium'
}) => {
  const [selectedImage, setSelectedImage] = useState<number | null>(null);
  const [isZoomed, setIsZoomed] = useState(false);
  const galleryRef = useRef<HTMLDivElement>(null);

  // Classes pour les différentes tailles d'écart
  const gapClasses = {
    small: 'gap-2',
    medium: 'gap-4',
    large: 'gap-6'
  };

  // Classes pour les différentes colonnes
  const columnClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
  };

  // Fermer la lightbox avec la touche Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedImage !== null) {
        setSelectedImage(null);
      } else if (e.key === 'ArrowRight' && selectedImage !== null) {
        setSelectedImage((prev) => (prev === images.length - 1 ? 0 : (prev || 0) + 1));
      } else if (e.key === 'ArrowLeft' && selectedImage !== null) {
        setSelectedImage((prev) => (prev === 0 ? images.length - 1 : (prev || 0) - 1));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedImage, images.length]);

  // Empêcher le défilement du corps lorsque la lightbox est ouverte
  useEffect(() => {
    if (selectedImage !== null) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [selectedImage]);

  // Rendu de la grille d'images
  const renderGrid = () => {
    return (
      <div 
        className={cn(
          "grid",
          columnClasses[columns],
          gapClasses[gap]
        )}
      >
        {images.map((image, index) => (
          <div 
            key={index}
            className="relative overflow-hidden rounded-lg group cursor-pointer"
            onClick={() => lightbox && setSelectedImage(index)}
          >
            <div className="aspect-square overflow-hidden">
              <img 
                src={image.src} 
                alt={image.alt}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                loading="lazy"
              />
            </div>
            
            {image.caption && (
              <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <p className="text-white text-sm">{image.caption}</p>
              </div>
            )}
            
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>
        ))}
      </div>
    );
  };

  // Rendu de la disposition en maçonnerie
  const renderMasonry = () => {
    return (
      <div 
        className={cn(
          "columns-1 sm:columns-2 md:columns-3 lg:columns-4 space-y-4",
          gapClasses[gap]
        )}
      >
        {images.map((image, index) => (
          <div 
            key={index}
            className="relative overflow-hidden rounded-lg group cursor-pointer break-inside-avoid mb-4"
            onClick={() => lightbox && setSelectedImage(index)}
          >
            <img 
              src={image.src} 
              alt={image.alt}
              className="w-full h-auto transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
            
            {image.caption && (
              <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <p className="text-white text-sm">{image.caption}</p>
              </div>
            )}
            
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>
        ))}
      </div>
    );
  };

  // Rendu du carrousel
  const renderCarousel = () => {
    return (
      <div className="relative overflow-hidden">
        <div className="flex items-center justify-center">
          <button 
            className="absolute left-2 z-10 bg-white/20 hover:bg-white/40 rounded-full p-2 backdrop-blur-sm transition-colors duration-200"
            onClick={(e) => {
              e.stopPropagation();
              const newIndex = selectedImage === null 
                ? images.length - 1 
                : (selectedImage === 0 ? images.length - 1 : selectedImage - 1);
              setSelectedImage(newIndex);
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          
          <div className="overflow-hidden w-full">
            <div 
              className="flex transition-transform duration-500 ease-out"
              style={{ 
                transform: `translateX(-${selectedImage === null ? 0 : selectedImage * 100}%)`,
                width: `${images.length * 100}%`
              }}
            >
              {images.map((image, index) => (
                <div 
                  key={index}
                  className="relative w-full flex-shrink-0"
                  onClick={() => lightbox && setSelectedImage(index)}
                >
                  <div className="aspect-video relative overflow-hidden">
                    <img 
                      src={image.src} 
                      alt={image.alt}
                      className="w-full h-full object-cover"
                      loading={index === 0 ? "eager" : "lazy"}
                    />
                    
                    {image.caption && (
                      <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
                        <p className="text-white text-sm">{image.caption}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <button 
            className="absolute right-2 z-10 bg-white/20 hover:bg-white/40 rounded-full p-2 backdrop-blur-sm transition-colors duration-200"
            onClick={(e) => {
              e.stopPropagation();
              const newIndex = selectedImage === null 
                ? 1 
                : (selectedImage === images.length - 1 ? 0 : selectedImage + 1);
              setSelectedImage(newIndex);
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>
        
        {/* Indicateurs */}
        <div className="flex justify-center mt-4 gap-2">
          {images.map((_, index) => (
            <button
              key={index}
              className={cn(
                "w-2 h-2 rounded-full transition-all duration-300",
                selectedImage === index ? "bg-primary w-6" : "bg-gray-300 hover:bg-gray-400"
              )}
              onClick={() => setSelectedImage(index)}
              aria-label={`Image ${index + 1}`}
            />
          ))}
        </div>
      </div>
    );
  };

  // Rendu de la lightbox
  const renderLightbox = () => {
    if (selectedImage === null) return null;
    
    const currentImage = images[selectedImage];
    
    return (
      <div 
        className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
        onClick={() => setSelectedImage(null)}
      >
        <div className="relative max-w-4xl w-full h-full flex flex-col items-center justify-center p-4">
          <div 
            className={cn(
              "relative max-h-[80vh] transition-transform duration-300",
              isZoomed ? "cursor-zoom-out scale-150" : "cursor-zoom-in"
            )}
            onClick={(e) => {
              e.stopPropagation();
              setIsZoomed(!isZoomed);
            }}
          >
            <AnimatedElement animation="fade-in" className="h-full">
              <img 
                src={currentImage.src} 
                alt={currentImage.alt}
                className="max-h-[80vh] max-w-full object-contain"
              />
            </AnimatedElement>
          </div>
          
          {currentImage.caption && (
            <div className="mt-4 text-white text-center">
              <p>{currentImage.caption}</p>
            </div>
          )}
          
          {/* Navigation */}
          <button 
            className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/40 rounded-full p-3 text-white transition-colors duration-200"
            onClick={(e) => {
              e.stopPropagation();
              setIsZoomed(false);
              setSelectedImage((prev) => (prev === 0 ? images.length - 1 : (prev || 0) - 1));
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          
          <button 
            className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/40 rounded-full p-3 text-white transition-colors duration-200"
            onClick={(e) => {
              e.stopPropagation();
              setIsZoomed(false);
              setSelectedImage((prev) => (prev === images.length - 1 ? 0 : (prev || 0) + 1));
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
          
          {/* Bouton de fermeture */}
          <button 
            className="absolute top-4 right-4 bg-white/20 hover:bg-white/40 rounded-full p-2 text-white transition-colors duration-200"
            onClick={() => setSelectedImage(null)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
          
          {/* Compteur d'images */}
          <div className="absolute bottom-4 left-4 bg-black/50 px-3 py-1 rounded-full text-white text-sm">
            {selectedImage + 1} / {images.length}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div ref={galleryRef} className={cn("image-gallery", className)}>
      {variant === 'grid' && renderGrid()}
      {variant === 'masonry' && renderMasonry()}
      {variant === 'carousel' && renderCarousel()}
      {renderLightbox()}
    </div>
  );
};

/**
 * Composant de vignette d'image
 * Affiche une image avec un effet de zoom au survol
 */
export const ImageThumbnail: React.FC<{
  src: string;
  alt: string;
  caption?: string;
  onClick?: () => void;
  className?: string;
}> = ({
  src,
  alt,
  caption,
  onClick,
  className
}) => {
  return (
    <div 
      className={cn(
        "relative overflow-hidden rounded-lg group cursor-pointer",
        className
      )}
      onClick={onClick}
    >
      <div className="aspect-square overflow-hidden">
        <img 
          src={src} 
          alt={alt}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
        />
      </div>
      
      {caption && (
        <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <p className="text-white text-sm">{caption}</p>
        </div>
      )}
      
      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </div>
  );
};
