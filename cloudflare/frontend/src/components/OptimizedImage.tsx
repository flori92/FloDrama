import React, { useState, useEffect } from 'react';
import { verifyMediaUrl } from '../services/mediaGatewayService';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackSrc?: string;
}

const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  className = '',
  fallbackSrc = '/images/placeholder.jpg'
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [validatedSrc, setValidatedSrc] = useState<string>(src || fallbackSrc);

  // Vérification proactive de la validité de l'URL source via l'API Gateway
  useEffect(() => {
    const validateImageSource = async () => {
      setIsLoading(true);
      try {
        const verifiedUrl = await verifyMediaUrl(src, fallbackSrc);
        setValidatedSrc(verifiedUrl);
        setHasError(verifiedUrl !== src);
      } catch (error) {
        console.error('Erreur lors de la validation de l\'image:', error);
        setValidatedSrc(fallbackSrc);
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    };

    validateImageSource();
  }, [src, fallbackSrc]);

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
    // Si l'image rencontre une erreur même après validation, utiliser le fallback
    setValidatedSrc(fallbackSrc);
  };

  return (
    <div className={`relative ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 bg-flo-secondary animate-pulse" />
      )}
      <img
        src={validatedSrc}
        alt={alt}
        className={`w-full h-full object-cover transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'} ${hasError ? 'border border-red-500/10' : ''}`}
        onLoad={handleLoad}
        onError={handleError}
      />
    </div>
  );
};

export default OptimizedImage;
