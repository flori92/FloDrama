import { useEffect, useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useRouter } from 'next/router';

interface ContentCardProps {
  id: string;
  title: string;
  description?: string;
  posterUrl: string;
  trailerUrl?: string;
  backdropUrl?: string;
  rating?: number;
  genres?: string[];
  year?: string;
  type?: 'drama' | 'anime' | 'bollywood';
  country?: string;
}

export const ContentCard = ({
  id,
  title,
  description,
  posterUrl,
  trailerUrl,
  backdropUrl,
  rating,
  genres,
  year,
  type = 'drama',
  country
}: ContentCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const router = useRouter();
  
  // Déterminer la classe de thème en fonction du type ou du pays
  let themeClass = '';
  if (type === 'anime') {
    themeClass = 'anime-theme';
  } else if (type === 'bollywood') {
    themeClass = 'bollywood-theme';
  } else if (country) {
    const lowerCountry = country.toLowerCase();
    if (lowerCountry.includes('coréen') || lowerCountry.includes('korean')) {
      themeClass = 'korean-theme';
    } else if (lowerCountry.includes('japonais') || lowerCountry.includes('japanese')) {
      themeClass = 'japanese-theme';
    }
  }

  const handleClick = () => {
    router.push(`/content/${id}`);
  };

  // Fallback pour l'image si l'URL est invalide
  const imageSrc = posterUrl || '/images/fallback/poster1.jpg';
  
  return (
    <motion.div
      className={`content-card ${themeClass}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
      whileHover={{ 
        scale: 1.05,
        y: -10,
        transition: { duration: 0.3 }
      }}
    >
      {/* Image principale avec ratio 2:3 */}
      <div className="content-card__image relative overflow-hidden rounded-md">
        <Image
          src={imageSrc}
          alt={title}
          width={300}
          height={450}
          className="object-cover w-full h-full"
          loading="lazy"
        />
        
        {/* Badge pour le type de contenu */}
        {type && (
          <div className={`absolute top-2 right-2 px-2 py-1 text-xs font-bold rounded-md ${
            type === 'anime' ? 'bg-anime-blue' : 
            type === 'bollywood' ? 'bg-bollywood-orange' : 
            'bg-flo-violet'
          } text-flo-white`}>
            {type.toUpperCase()}
          </div>
        )}
        
        {/* Overlay avec contenu détaillé */}
        <div className="content-card__content">
          <h3 className="content-card__title">{title}</h3>
          
          {/* Métadonnées */}
          <div className="flex items-center space-x-2 mt-1">
            {rating && (
              <div className="content-card__rating">
                <span className="text-flo-fuchsia">★</span> {rating.toFixed(1)}
              </div>
            )}
            {year && (
              <span className="text-flo-white/80 text-sm">
                {year}
              </span>
            )}
          </div>

          {/* Genres (affichés uniquement au survol) */}
          {isHovered && genres && genres.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {genres.slice(0, 2).map((genre, index) => (
                <span 
                  key={index} 
                  className="text-xs px-1.5 py-0.5 bg-flo-night/50 text-flo-white rounded"
                >
                  {genre}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Effet de survol avec dégradé */}
      <motion.div 
        className="absolute inset-0 bg-gradient-flo opacity-0 rounded-md"
        animate={{ opacity: isHovered ? 1 : 0 }}
        transition={{ duration: 0.3 }}
      />
    </motion.div>
  );
};
