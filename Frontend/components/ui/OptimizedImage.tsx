import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  quality?: number;
  blur?: boolean;
  lazyLoad?: boolean;
  fallbackSrc?: string;
  onLoad?: () => void;
  onError?: () => void;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width,
  height,
  className = "",
  quality = 80,
  blur = true,
  lazyLoad = true,
  fallbackSrc = "/assets/images/placeholder.jpg",
  onLoad,
  onError,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [imageSrc, setImageSrc] = useState<string>("");

  useEffect(() => {
    // Réinitialiser l'état lorsque la source change
    setIsLoading(true);
    setError(false);

    // Fonction pour optimiser l'URL de l'image
    const optimizeImageUrl = (url: string) => {
      // Si l'URL est déjà optimisée ou c'est une URL relative, la retourner telle quelle
      if (!url || url.startsWith("/") || url.startsWith("data:")) {
        return url;
      }

      try {
        const imageUrl = new URL(url);
        
        // Si l'image provient de S3/CloudFront
        if (imageUrl.hostname.includes("flodrama-content-1745269660.s3.amazonaws.com") || 
            imageUrl.hostname.includes("cloudfront.net")) {
          
          // Ajouter des paramètres d'optimisation pour CloudFront
          // Note: Cela suppose que CloudFront est configuré avec Lambda@Edge pour le traitement des images
          const params = new URLSearchParams(imageUrl.search);
          
          if (width) params.set("w", width.toString());
          if (height) params.set("h", height.toString());
          if (quality) params.set("q", quality.toString());
          if (blur) params.set("blur", "10");
          
          imageUrl.search = params.toString();
          return imageUrl.toString();
        }
        
        // Pour les autres sources d'images, retourner l'URL d'origine
        return url;
      } catch (e) {
        console.error("Erreur lors de l'optimisation de l'URL de l'image:", e);
        return url;
      }
    };

    // Optimiser l'URL de l'image
    setImageSrc(optimizeImageUrl(src));
  }, [src, width, height, quality, blur]);

  const handleImageLoad = () => {
    setIsLoading(false);
    if (onLoad) onLoad();
  };

  const handleImageError = () => {
    setIsLoading(false);
    setError(true);
    if (onError) onError();
  };

  return (
    <div 
      className={`relative overflow-hidden ${className}`}
      style={{ width: width ? `${width}px` : "100%", height: height ? `${height}px` : "auto" }}
    >
      {isLoading && (
        <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-opacity-50 border-t-fuchsia-500 rounded-full animate-spin"></div>
        </div>
      )}
      
      <motion.img
        src={error ? fallbackSrc : imageSrc}
        alt={alt}
        width={width}
        height={height}
        loading={lazyLoad ? "lazy" : "eager"}
        onLoad={handleImageLoad}
        onError={handleImageError}
        className={`w-full h-full object-cover ${isLoading ? "opacity-0" : "opacity-100"}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: isLoading ? 0 : 1 }}
        transition={{ duration: 0.3 }}
      />
    </div>
  );
};
