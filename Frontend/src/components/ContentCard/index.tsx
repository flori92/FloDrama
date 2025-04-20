import { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import Link from 'next/link';

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
  const [imageError, setImageError] = useState(false);
  
  // Déterminer la classe de thème et les couleurs en fonction du type ou du pays
  let themeClass = '';
  let gradientColors = 'from-violet-600 to-fuchsia-500';
  
  if (type === 'anime') {
    themeClass = 'anime-theme';
    gradientColors = 'from-blue-800 to-blue-500';
  } else if (type === 'bollywood') {
    themeClass = 'bollywood-theme';
    gradientColors = 'from-orange-600 to-orange-400';
  } else if (country) {
    const lowerCountry = country.toLowerCase();
    if (lowerCountry.includes('coréen') || lowerCountry.includes('korean')) {
      themeClass = 'korean-theme';
      gradientColors = 'from-emerald-700 to-emerald-500';
    } else if (lowerCountry.includes('japonais') || lowerCountry.includes('japanese')) {
      themeClass = 'japanese-theme';
      gradientColors = 'from-purple-700 to-purple-500';
    }
  }

  // Fallback pour l'image si l'URL est invalide
  const imageSrc = imageError ? '/images/fallback/poster1.jpg' : (posterUrl || '/images/fallback/poster1.jpg');
  
  return (
    <motion.div
      className={`relative group overflow-hidden rounded-lg shadow-lg ${themeClass} bg-gray-900 h-full`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={{ 
        scale: 1.05,
        transition: { duration: 0.3 }
      }}
    >
      <Link href={`/content/${id}`} className="block h-full">
        {/* Image principale avec ratio 2:3 */}
        <div className="relative overflow-hidden w-full" style={{ aspectRatio: '2/3' }}>
          <Image
            src={imageSrc}
            alt={title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
            onError={() => setImageError(true)}
          />
          
          {/* Overlay gradient */}
          <motion.div 
            className={`absolute inset-0 bg-gradient-to-t ${gradientColors} opacity-0 group-hover:opacity-70 transition-opacity duration-300`}
            animate={{ opacity: isHovered ? 0.7 : 0 }}
          />
          
          {/* Badge pour le type de contenu */}
          <div className={`absolute top-2 right-2 px-2 py-1 text-xs font-bold rounded-md z-10 ${
            type === 'anime' ? 'bg-blue-600' : 
            type === 'bollywood' ? 'bg-orange-500' : 
            'bg-violet-600'
          } text-white`}>
            {type.toUpperCase()}
          </div>
          
          {/* Contenu au survol */}
          <motion.div 
            className="absolute inset-0 flex flex-col justify-end p-4 text-white z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: isHovered ? 1 : 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Métadonnées */}
            <div className="flex items-center space-x-2 mb-1">
              {rating && (
                <div className="flex items-center">
                  <span className="text-yellow-400 mr-1">★</span>
                  <span className="text-sm font-medium">{rating.toFixed(1)}</span>
                </div>
              )}
              {year && (
                <span className="text-xs text-gray-200">
                  {year}
                </span>
              )}
            </div>
            
            {/* Genres */}
            {genres && genres.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {genres.slice(0, 2).map((genre, index) => (
                  <span 
                    key={index} 
                    className="text-xs px-1.5 py-0.5 bg-black/30 text-white rounded"
                  >
                    {genre}
                  </span>
                ))}
              </div>
            )}
            
            {/* Description courte */}
            {description && (
              <motion.p 
                className="text-xs line-clamp-2 text-gray-200 mt-1"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: isHovered ? 0 : 20, opacity: isHovered ? 1 : 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                {description}
              </motion.p>
            )}
            
            {/* Bouton de lecture */}
            <motion.div
              className="mt-2"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: isHovered ? 0 : 20, opacity: isHovered ? 1 : 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
              </div>
            </motion.div>
          </motion.div>
        </div>
        
        {/* Titre et info en dehors de l'image */}
        <div className="p-3">
          <h3 className="font-semibold text-white text-sm line-clamp-1">{title}</h3>
          
          <div className="flex items-center mt-1">
            {country && (
              <span className="text-xs text-gray-400">{country}</span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
};
