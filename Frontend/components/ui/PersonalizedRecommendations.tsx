import React, { useState } from "react";
import { motion } from "framer-motion";

interface ContentItem {
  id: string;
  title: string;
  description: string;
  image: string;
  category?: string;
  source?: string;
  score?: number;
  popularity?: number;
  releaseDate?: string;
}

interface PersonalizedRecommendationsProps {
  title: string;
  subtitle?: string;
  recommendations: ContentItem[];
  onItemClick: (item: ContentItem) => void;
}

export const PersonalizedRecommendations: React.FC<PersonalizedRecommendationsProps> = ({
  title,
  subtitle,
  recommendations,
  onItemClick,
}) => {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
      },
    },
  };

  // Fonction pour formater la date
  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  };

  return (
    <section className="py-12">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-blue-500 to-fuchsia-500 bg-clip-text text-transparent">
            {title}
          </h2>
          {subtitle && (
            <p className="text-white text-opacity-80">{subtitle}</p>
          )}
        </div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          {recommendations.map((item) => (
            <motion.div
              key={item.id}
              className="relative rounded-lg overflow-hidden cursor-pointer"
              variants={itemVariants}
              whileHover={{ scale: 1.03, transition: { duration: 0.2 } }}
              onMouseEnter={() => setHoveredItem(item.id)}
              onMouseLeave={() => setHoveredItem(null)}
              onClick={() => onItemClick(item)}
            >
              <div className="aspect-w-16 aspect-h-9 relative">
                <img
                  src={item.image}
                  alt={item.title}
                  className="object-cover w-full h-full"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent"></div>
                
                {/* Overlay d'informations au survol */}
                <motion.div
                  className="absolute inset-0 bg-black bg-opacity-70 p-6 flex flex-col justify-between"
                  initial={{ opacity: 0 }}
                  animate={{ 
                    opacity: hoveredItem === item.id ? 1 : 0,
                    transition: { duration: 0.3 }
                  }}
                >
                  <div>
                    <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                    <p className="text-sm text-white text-opacity-80 line-clamp-3 mb-4">
                      {item.description}
                    </p>
                    
                    <div className="flex flex-wrap gap-2 mb-4">
                      {item.category && (
                        <span className="px-2 py-1 text-xs bg-blue-500 bg-opacity-30 rounded-full">
                          {item.category}
                        </span>
                      )}
                      {item.source && (
                        <span className="px-2 py-1 text-xs bg-fuchsia-500 bg-opacity-30 rounded-full">
                          {item.source}
                        </span>
                      )}
                      {item.releaseDate && (
                        <span className="px-2 py-1 text-xs bg-gray-500 bg-opacity-30 rounded-full">
                          {formatDate(item.releaseDate)}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    {item.score && (
                      <div className="flex items-center">
                        <svg className="w-4 h-4 text-yellow-500 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                        </svg>
                        <span>{item.score.toFixed(1)}</span>
                      </div>
                    )}
                    
                    {item.popularity && (
                      <div className="flex items-center">
                        <svg className="w-4 h-4 text-red-500 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                          <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd"></path>
                        </svg>
                        <span>{item.popularity}%</span>
                      </div>
                    )}
                    
                    <button className="px-4 py-2 bg-white text-black rounded-full text-sm font-medium hover:bg-opacity-80 transition-opacity">
                      Voir
                    </button>
                  </div>
                </motion.div>
              </div>
              
              {/* Informations de base (toujours visibles) */}
              <div className="p-4 bg-black bg-opacity-40 border-t border-white border-opacity-10">
                <h3 className="text-lg font-bold mb-1 truncate">{item.title}</h3>
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    {item.score && (
                      <div className="flex items-center mr-3">
                        <svg className="w-4 h-4 text-yellow-500 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                        </svg>
                        <span>{item.score.toFixed(1)}</span>
                      </div>
                    )}
                    
                    {item.category && (
                      <span className="text-sm text-white text-opacity-60 truncate">
                        {item.category}
                      </span>
                    )}
                  </div>
                  
                  {item.releaseDate && (
                    <span className="text-xs text-white text-opacity-50">
                      {new Date(item.releaseDate).getFullYear()}
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};
