import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { useRouter } from 'next/router';

interface CategoryCardProps {
  title: string;
  image: string;
  slug: string;
  gradient?: string;
  onClick?: () => void;
}

const CategoryCard: React.FC<CategoryCardProps> = ({
  title,
  image,
  slug,
  gradient = 'from-blue-500/80 to-fuchsia-500/80',
  onClick
}) => {
  const router = useRouter();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      router.push(`/category/${slug}`);
    }
  };

  return (
    <motion.div
      className="relative w-full h-48 overflow-hidden rounded-lg cursor-pointer shadow-lg"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5 }}
      whileHover={{ 
        scale: 1.03,
        y: -5,
        transition: { type: "spring", stiffness: 400, damping: 20 }
      }}
      whileTap={{ scale: 0.98 }}
      onClick={handleClick}
    >
      {/* Image d'arrière-plan */}
      <div className="absolute inset-0 z-0 group">
        <img 
          src={image} 
          alt={title} 
          className="w-full h-full object-cover transition-transform duration-500 ease-in-out group-hover:scale-110"
        />
        {/* Superposition de dégradé */}
        <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-90`}></div>
      </div>

      {/* Contenu de la carte */}
      <div className="relative z-10 flex flex-col justify-between h-full p-5 text-white font-['SF_Pro_Display',-apple-system,BlinkMacSystemFont,'Segoe_UI',Roboto,'Helvetica_Neue',Arial,sans-serif]">
        <h3 className="text-2xl font-bold tracking-wide">{title}</h3>
        
        <div className="flex items-center mt-auto group">
          <span className="text-sm font-medium mr-2 transition-all duration-300 group-hover:bg-gradient-to-r group-hover:from-blue-500 group-hover:to-fuchsia-500 group-hover:bg-clip-text group-hover:text-transparent">Voir tout</span>
          <motion.div
            animate={{ x: [0, 5, 0] }}
            transition={{
              repeat: Infinity,
              repeatType: "loop",
              duration: 1.5,
              ease: "easeInOut"
            }}
            className="transition-all duration-300 group-hover:text-fuchsia-500"
          >
            <ArrowRight className="w-5 h-5" />
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default CategoryCard;
