import React from "react";
import { motion } from "framer-motion";

interface Source {
  id: string;
  name: string;
  url: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  image: string;
  sources: Source[];
}

interface CategorySectionProps {
  categories: Category[];
  onCategoryClick: (category: Category) => void;
  onSourceClick: (source: Source, categoryId: string) => void;
}

export const CategorySection: React.FC<CategorySectionProps> = ({
  categories,
  onCategoryClick,
  onSourceClick,
}) => {
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

  return (
    <section className="py-12">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold mb-8 bg-gradient-to-r from-blue-500 to-fuchsia-500 bg-clip-text text-transparent">
          Catégories
        </h2>
        
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          {categories.map((category) => (
            <motion.div
              key={category.id}
              className="bg-black bg-opacity-40 border border-white border-opacity-30 rounded-lg overflow-hidden"
              variants={itemVariants}
              whileHover={{ scale: 1.03, transition: { duration: 0.2 } }}
            >
              <div 
                className="h-40 bg-cover bg-center relative"
                style={{ backgroundImage: `url(${category.image})` }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent"></div>
                <div className="absolute bottom-4 left-4">
                  <h3 className="text-2xl font-bold">{category.name}</h3>
                </div>
              </div>
              
              <div className="p-4">
                <p className="text-white text-opacity-80 mb-4 line-clamp-2">
                  {category.description}
                </p>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  {category.sources.slice(0, 5).map((source) => (
                    <button
                      key={source.id}
                      onClick={() => onSourceClick(source, category.id)}
                      className="px-3 py-1 text-sm bg-transparent border border-white border-opacity-30 rounded-full hover:bg-white hover:bg-opacity-10 transition-colors"
                    >
                      {source.name}
                    </button>
                  ))}
                  {category.sources.length > 5 && (
                    <span className="px-3 py-1 text-sm text-white text-opacity-60">
                      +{category.sources.length - 5}
                    </span>
                  )}
                </div>
                
                <button
                  onClick={() => onCategoryClick(category)}
                  className="w-full py-2 bg-white text-black font-medium rounded-md hover:bg-opacity-80 transition-opacity"
                >
                  Explorer
                </button>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};
