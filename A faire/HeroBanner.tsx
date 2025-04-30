import React, { useState, useEffect } from 'react';
import { Play, Info, Plus, ThumbsUp, ThumbsDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Demo data for the carousel
const heroContents = [
  {
    id: 1,
    title: "Les mystères de l'Empire",
    subtitle: "Nouvelle Saison",
    description: "Dans la Chine ancienne, une jeune femme devient enquêtrice pour résoudre des mystères qui menacent l'empire. Entre complots politiques et aventures romantiques, suivez son parcours extraordinaire.",
    image: "/static/hero/hero-drama1.jpg", // Ensure high-quality images
    logo: "/static/logos/empire-mysteries.png", // Ensure high-quality logos
    category: "Drama Historique"
  },
  {
    id: 2,
    title: "Sous les cerisiers en fleurs",
    subtitle: "Exclusivité",
    description: "Quand un jeune architecte retourne dans sa ville natale, il redécouvre son premier amour. Une histoire touchante de seconde chance dans un cadre magnifique du Japon rural.",
    image: "/static/hero/hero-drama2.jpg",
    logo: "/static/logos/cherry-blossoms.png",
    category: "Romance"
  },
  {
    id: 3,
    title: "La légende du guerrier",
    subtitle: "Haute note",
    description: "Un guerrier légendaire doit faire face à son plus grand défi : protéger son village et retrouver sa famille disparue. Une épopée captivante mêlant arts martiaux et spiritualité.",
    image: "/static/hero/hero-action.jpg",
    logo: "/static/logos/warrior-legend.png",
    category: "Action"
  },
];

const HeroBanner: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovering, setIsHovering] = useState(false);

  // Auto-carousel effect
  useEffect(() => {
    if (isHovering) return; // Pause rotation on hover

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % heroContents.length);
    }, 7000); // Slightly longer interval (7s)

    return () => clearInterval(interval);
  }, [isHovering]);

  const content = heroContents[currentIndex];

  // Animation variants for text elements (Recommendation 3.1)
  const textVariant = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1 + 0.3, // Staggered delay starting from 0.3s
        duration: 0.6,
        ease: "easeOut"
      }
    })
  };

  return (
    <section
      className="relative h-[85vh] md:h-[90vh] overflow-hidden flex items-center justify-start mb-8" // Slightly taller on larger screens
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Background Image Carousel */}
      <AnimatePresence mode="wait">
        <motion.div
          key={content.id} // Key change triggers animation
          className="absolute inset-0 z-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeInOut" }} // Smoother fade transition
        >
          {/* Background Image with Ken Burns Effect (Recommendation 3.1) */}
          <motion.div
            className="absolute inset-0 w-full h-full bg-cover bg-center"
            style={{ backgroundImage: `url(${content.image})` }}
            initial={{ scale: 1.05 }} // Start slightly zoomed in
            animate={{ scale: 1 }} // Zoom out slowly over the duration
            transition={{ duration: 10, ease: "linear" }} // Long duration for subtle effect
          />

          {/* Gradient Overlays for Readability (Recommendation 3.1) */}
          {/* Stronger gradient from left */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />
          {/* Gradient from bottom */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        </motion.div>
      </AnimatePresence>

      {/* Text Content Area */}
      <div className="relative z-10 container mx-auto px-4 md:px-6 lg:px-12 flex flex-col items-start max-w-xl lg:max-w-2xl">
        {/* Content Logo (if available) */}
        {content.logo && (
          <motion.img
            key={`${content.id}-logo`} // Ensure key changes with content
            src={content.logo}
            alt={`${content.title} Logo`}
            className="h-16 md:h-24 mb-4 object-contain drop-shadow-lg" // Added drop shadow
            custom={0} // Stagger index
            variants={textVariant}
            initial="hidden"
            animate="visible"
          />
        )}

        {/* Category Tag */}
        <motion.div
          key={`${content.id}-category`} // Ensure key changes with content
          className="mb-3 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs md:text-sm text-white font-medium"
          custom={1} // Stagger index
          variants={textVariant}
          initial="hidden"
          animate="visible"
        >
          {content.category}
        </motion.div>

        {/* Subtitle (Optional) */}
        {content.subtitle && (
          <motion.div
            key={`${content.id}-subtitle`} // Ensure key changes with content
            className="mb-2 text-base md:text-lg text-neutral-300"
            custom={2} // Stagger index
            variants={textVariant}
            initial="hidden"
            animate="visible"
          >
            {content.subtitle}
          </motion.div>
        )}

        {/* Title (Only if no logo) */}
        {!content.logo && (
          <motion.h1
            key={`${content.id}-title`} // Ensure key changes with content
            className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 drop-shadow-md"
            custom={content.subtitle ? 3 : 2} // Adjust stagger based on subtitle presence
            variants={textVariant}
            initial="hidden"
            animate="visible"
          >
            {content.title}
          </motion.h1>
        )}

        {/* Description */}
        <motion.p
          key={`${content.id}-desc`} // Ensure key changes with content
          className="text-base md:text-lg text-neutral-200 mb-6 md:mb-8 max-w-lg lg:max-w-xl line-clamp-3 md:line-clamp-4" // Limit lines
          custom={content.logo ? 3 : (content.subtitle ? 4 : 3)} // Adjust stagger
          variants={textVariant}
          initial="hidden"
          animate="visible"
        >
          {content.description}
        </motion.p>

        {/* Action Buttons */}
        <motion.div
          className="flex flex-wrap items-center gap-3 md:gap-4"
          custom={content.logo ? 4 : (content.subtitle ? 5 : 4)} // Adjust stagger
          variants={textVariant}
          initial="hidden"
          animate="visible"
        >
          {/* Play Button */}
          <motion.button
            className="flex items-center space-x-2 bg-white text-black px-5 py-2.5 md:px-6 md:py-3 rounded-md font-semibold shadow-lg hover:bg-neutral-200 transition-colors duration-200 text-sm md:text-base"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <Play className="w-5 h-5 fill-black" />
            <span>Regarder</span>
          </motion.button>

          {/* More Info Button */}
          <motion.button
            className="flex items-center space-x-2 border border-neutral-400 bg-black/40 backdrop-blur-sm text-white px-5 py-2.5 md:px-6 md:py-3 rounded-md font-semibold hover:bg-white/20 transition-colors duration-200 text-sm md:text-base"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <Info className="w-5 h-5" />
            <span>Plus d'infos</span>
          </motion.button>

          {/* Quick Actions (Optional - can be simplified) */}
          {/* <div className="flex space-x-2">
            <QuickActionButton><Plus className="w-5 h-5" /></QuickActionButton>
            <QuickActionButton><ThumbsUp className="w-5 h-5" /></QuickActionButton>
          </div> */}
        </motion.div>
      </div>

      {/* Carousel Indicators */}
      <div className="absolute bottom-4 md:bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-2 z-20">
        {heroContents.map((_, index) => (
          <motion.button
            key={index}
            className={`w-2.5 h-2.5 rounded-full transition-colors duration-300 ${
              currentIndex === index ? 'bg-white' : 'bg-white/40 hover:bg-white/70'
            }`}
            onClick={() => setCurrentIndex(index)}
            aria-label={`Go to slide ${index + 1}`}
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
          />
        ))}
      </div>
    </section>
  );
};

// Optional Quick Action Button Component (if needed)
// const QuickActionButton: React.FC<{ children: React.ReactNode }> = ({ children }) => (
//   <motion.button
//     className="p-2.5 rounded-full border border-white/30 bg-black/30 backdrop-blur-sm text-white hover:bg-white/20 transition-colors duration-200"
//     whileHover={{ scale: 1.1 }}
//     whileTap={{ scale: 0.95 }}
//   >
//     {children}
//   </motion.button>
// );

export default HeroBanner;

