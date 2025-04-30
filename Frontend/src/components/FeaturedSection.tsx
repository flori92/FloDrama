import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import ContentCard from './ContentCard';

interface ContentItem {
  id: string | number;
  title: string;
  image: string;
  year?: string | number;
  match?: number;
  rating?: string;
  duration?: string;
  description?: string;
  videoPreview?: string;
}

interface FeaturedSectionProps {
  title: string;
  subtitle?: string;
  items: ContentItem[];
  onSeeAll?: () => void;
}

const FeaturedSection: React.FC<FeaturedSectionProps> = ({ 
  title, 
  subtitle, 
  items, 
  onSeeAll 
}) => {
  return (
    <section className="mb-16 px-4">
      {/* En-tête avec titre et sous-titre */}
      <div className="flex flex-col mb-6">
        <motion.h2 
          className="text-2xl font-medium text-white mb-2"
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          {title}
        </motion.h2>
        
        {subtitle && (
          <motion.p 
            className="text-white/60 text-sm mb-4"
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            {subtitle}
          </motion.p>
        )}
        
        {/* Bouton "Voir tout" */}
        {onSeeAll && (
          <motion.button
            className="self-end text-sm text-white/70 hover:text-white flex items-center mb-2"
            whileHover={{ scale: 1.05, x: 5 }}
            onClick={onSeeAll}
          >
            Tout voir
            <ChevronRight className="w-4 h-4 ml-1" />
          </motion.button>
        )}
      </div>
      
      {/* Grille responsive de contenus */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {items.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, delay: index * 0.05 }}
          >
            <ContentCard
              id={item.id}
              title={item.title}
              image={item.image}
              year={item.year}
              match={item.match}
              rating={item.rating}
              duration={item.duration}
              description={item.description}
              videoPreview={item.videoPreview}
            />
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default FeaturedSection;
