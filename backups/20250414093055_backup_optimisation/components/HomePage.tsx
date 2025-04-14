import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { MainNavigation } from "./ui/MainNavigation";
import { HeroBanner } from "./ui/HeroBanner";
import { ContentSection } from "./ui/ContentSection";
import { ContentRow } from "./ui/ContentRow";
import { FeaturedCarousel } from "./ui/FeaturedCarousel";
import { Footer } from "./ui/Footer";

// Interface pour le contenu héro conforme à HeroContent
interface HeroContent {
  title: string;
  subtitle?: string;
  description: string;
  image: string;
  logo?: string;
  videoUrl?: string;
  videoPreviewUrl?: string;
  year?: number;
  rating?: number;
  duration?: string;
  category?: string;
  tags?: string[];
}

// Interface pour les éléments de contenu standard
interface ContentItem {
  id: string;
  title: string;
  description: string;
  imageUrl: string; // Renommé de image à imageUrl pour la cohérence
  year: number;
  rating: number;
  duration: string;
  category?: string;
  tags?: string[];
}

// Adaptation des données pour correspondre au type HeroContent
const featuredContent: HeroContent[] = [
  {
    title: "Pachinko",
    subtitle: "Nouvelle Saison",
    description:
      "Une saga familiale épique qui s'étend sur quatre générations, depuis la Corée sous occupation japonaise jusqu'au Japon moderne.",
    image: "https://d1pbqs2b6em4ha.cloudfront.net/images/pachinko-banner.jpg",
    logo: "https://d1pbqs2b6em4ha.cloudfront.net/images/pachinko-logo.png",
    videoPreviewUrl: "https://d1pbqs2b6em4ha.cloudfront.net/videos/pachinko-preview.mp4",
    year: 2023,
    rating: 9.2,
    duration: "50 min",
    category: "Drame",
    tags: ["Historique", "Famille", "Adaptation"]
  },
  {
    title: "The Glory",
    subtitle: "Série Originale",
    description:
      "Après avoir subi d'horribles brimades à l'école, une femme met au point un plan élaboré pour se venger de ses bourreaux.",
    image: "https://d1pbqs2b6em4ha.cloudfront.net/images/the-glory-banner.jpg",
    logo: "https://d1pbqs2b6em4ha.cloudfront.net/images/the-glory-logo.png",
    videoPreviewUrl: "https://d1pbqs2b6em4ha.cloudfront.net/videos/the-glory-preview.mp4",
    year: 2022,
    rating: 8.8,
    duration: "45 min",
    category: "Thriller",
    tags: ["Vengeance", "Drame", "Suspense"]
  },
  {
    title: "Moving",
    subtitle: "Exclusivité",
    description:
      "Des adolescents aux super-pouvoirs et leurs parents, qui ont vécu en cachant leurs identités, se retrouvent face à de nouveaux défis.",
    image: "https://d1pbqs2b6em4ha.cloudfront.net/images/moving-banner.jpg",
    logo: "https://d1pbqs2b6em4ha.cloudfront.net/images/moving-logo.png",
    videoPreviewUrl: "https://d1pbqs2b6em4ha.cloudfront.net/videos/moving-preview.mp4",
    year: 2023,
    rating: 9.5,
    duration: "60 min",
    category: "Action",
    tags: ["Super-héros", "Fantastique", "Adaptation"]
  }
];

// Adaptation des données pour correspondre au type ContentItem
const popularDramas: ContentItem[] = [
  {
    id: "4",
    title: "Crash Landing on You",
    description: "Une héritière sud-coréenne atterrit accidentellement en Corée du Nord après un accident de parapente.",
    imageUrl: "https://d1pbqs2b6em4ha.cloudfront.net/images/crash-landing.jpg",
    year: 2020,
    rating: 9.0,
    duration: "70 min"
  },
  {
    id: "5",
    title: "Goblin",
    description: "Un gobelin immortel cherche sa fiancée pour mettre fin à sa vie éternelle.",
    imageUrl: "https://d1pbqs2b6em4ha.cloudfront.net/images/goblin.jpg",
    year: 2016,
    rating: 8.9,
    duration: "60 min"
  },
  {
    id: "6",
    title: "Itaewon Class",
    description: "Un ex-détenu et ses amis luttent pour réussir dans le quartier d'Itaewon.",
    imageUrl: "https://d1pbqs2b6em4ha.cloudfront.net/images/itaewon-class.jpg",
    year: 2020,
    rating: 8.7,
    duration: "70 min"
  },
  {
    id: "7",
    title: "Vincenzo",
    description: "Un avocat coréen-italien de la mafia revient en Corée et utilise ses méthodes pour combattre les grands conglomérats.",
    imageUrl: "https://d1pbqs2b6em4ha.cloudfront.net/images/vincenzo.jpg",
    year: 2021,
    rating: 8.8,
    duration: "80 min"
  },
  {
    id: "8",
    title: "Mr. Queen",
    description: "Un chef cuisinier moderne se retrouve dans le corps d'une reine de la dynastie Joseon.",
    imageUrl: "https://d1pbqs2b6em4ha.cloudfront.net/images/mr-queen.jpg",
    year: 2020,
    rating: 8.9,
    duration: "70 min"
  }
];

const recentlyAdded: ContentItem[] = [
  {
    id: "9",
    title: "Queen of Tears",
    description: "L'histoire d'un couple marié qui traverse une crise dans leur relation.",
    imageUrl: "https://d1pbqs2b6em4ha.cloudfront.net/images/queen-of-tears.jpg",
    year: 2024,
    rating: 9.1,
    duration: "70 min"
  },
  {
    id: "10",
    title: "Lovely Runner",
    description: "Une fan voyage dans le temps pour sauver son idole d'un destin tragique.",
    imageUrl: "https://d1pbqs2b6em4ha.cloudfront.net/images/lovely-runner.jpg",
    year: 2024,
    rating: 8.9,
    duration: "60 min"
  },
  {
    id: "11",
    title: "A Time Called You",
    description: "Une femme voyage dans le passé et se retrouve dans le corps d'une autre personne.",
    imageUrl: "https://d1pbqs2b6em4ha.cloudfront.net/images/a-time-called-you.jpg",
    year: 2023,
    rating: 8.5,
    duration: "50 min"
  },
  {
    id: "12",
    title: "Daily Dose of Sunshine",
    description: "Le quotidien d'une infirmière travaillant dans un service psychiatrique.",
    imageUrl: "https://d1pbqs2b6em4ha.cloudfront.net/images/daily-dose-of-sunshine.jpg",
    year: 2023,
    rating: 8.7,
    duration: "60 min"
  }
];

const topRated: ContentItem[] = [
  {
    id: "13",
    title: "Reply 1988",
    description: "La vie de cinq familles vivant dans le même quartier de Séoul en 1988.",
    imageUrl: "https://d1pbqs2b6em4ha.cloudfront.net/images/reply-1988.jpg",
    year: 2015,
    rating: 9.7,
    duration: "90 min"
  },
  {
    id: "14",
    title: "My Mister",
    description: "La relation entre un homme d'âge moyen et une jeune femme qui ont tous deux traversé des difficultés dans la vie.",
    imageUrl: "https://d1pbqs2b6em4ha.cloudfront.net/images/my-mister.jpg",
    year: 2018,
    rating: 9.6,
    duration: "90 min"
  },
  {
    id: "15",
    title: "Hospital Playlist",
    description: "Le quotidien de cinq médecins qui sont amis depuis la faculté de médecine.",
    imageUrl: "https://d1pbqs2b6em4ha.cloudfront.net/images/hospital-playlist.jpg",
    year: 2020,
    rating: 9.4,
    duration: "90 min"
  },
  {
    id: "16",
    title: "Prison Playbook",
    description: "Un célèbre joueur de baseball est envoyé en prison suite à un incident.",
    imageUrl: "https://d1pbqs2b6em4ha.cloudfront.net/images/prison-playbook.jpg",
    year: 2017,
    rating: 9.3,
    duration: "90 min"
  }
];

/**
 * Page d'accueil de FloDrama
 * Utilise tous les composants UI adaptés du Template_Front
 */
export function HomePage() {
  const [isLoading, setIsLoading] = useState(true);
  const [scrollY, setScrollY] = useState(0);

  // Effet pour simuler le chargement initial
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  // Effet pour suivre le défilement de la page
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Gestionnaires d'événements pour HeroBanner
  const handlePlay = (content: HeroContent) => {
    console.log("Lecture de", content.title);
  };

  const handleMoreInfo = (content: HeroContent) => {
    console.log("Plus d'infos sur", content.title);
  };

  const handleAddToList = (content: HeroContent) => {
    console.log("Ajout à la liste:", content.title);
  };

  // Gestionnaires d'événements pour les autres composants
  const handleSearch = (query: string) => {
    console.log("Recherche:", query);
  };

  const handleProfileClick = () => {
    console.log("Clic sur le profil");
  };

  const handleNotificationsClick = () => {
    console.log("Clic sur les notifications");
  };

  // Animation de chargement
  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <motion.div
            animate={{ 
              rotate: 360,
              transition: { 
                duration: 1.5, 
                repeat: Infinity, 
                ease: "linear" 
              }
            }}
            className="w-16 h-16 border-t-4 border-primary rounded-full mx-auto mb-4"
          />
          <motion.h2
            animate={{ 
              opacity: [0.5, 1, 0.5], 
              transition: { 
                duration: 1.5, 
                repeat: Infinity, 
                ease: "easeInOut" 
              }
            }}
            className="text-xl font-medium text-gray-200"
          >
            Chargement de FloDrama...
          </motion.h2>
        </motion.div>
      </div>
    );
  }

  // Variants pour les animations
  const staggerContainer = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3
      }
    }
  };

  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    show: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.22, 1, 0.36, 1]
      }
    }
  };

  return (
    <div 
      className="min-h-screen bg-black text-white"
      style={{ 
        backgroundColor: "var(--color-background)",
        color: "var(--color-text-primary)"
      }}
    >
      {/* Navigation avec effet de transparence au défilement */}
      <motion.div
        style={{ 
          backgroundColor: `rgba(0, 0, 0, ${Math.min(scrollY / 200, 0.9)})`,
          backdropFilter: `blur(${Math.min(scrollY / 100, 8)}px)`,
          boxShadow: scrollY > 50 ? "0 4px 30px rgba(0, 0, 0, 0.1)" : "none"
        }}
        className="sticky top-0 z-50 transition-all duration-300"
      >
        <MainNavigation 
          onSearch={handleSearch}
          onProfileClick={handleProfileClick}
          onNotificationsClick={handleNotificationsClick}
        />
      </motion.div>

      {/* Bannière héro */}
      <HeroBanner 
        content={featuredContent}
        onPlay={handlePlay}
        onMoreInfo={handleMoreInfo}
        onAddToList={handleAddToList}
      />

      {/* Contenu principal */}
      <motion.main 
        className="pb-16 relative"
        variants={staggerContainer}
        initial="hidden"
        animate="show"
      >
        {/* Élément décoratif */}
        <div className="absolute top-0 left-0 w-full h-64 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 to-transparent z-0"></div>
        </div>

        {/* Carrousel en vedette */}
        <motion.div variants={fadeInUp} className="relative z-10">
          <FeaturedCarousel 
            title="Séries en vedette" 
            items={featuredContent.map(item => ({
              id: item.title,
              title: item.title,
              description: item.description,
              imageUrl: item.image,
              year: item.year,
              rating: item.rating,
              duration: item.duration,
              category: item.category,
              tags: item.tags
            }))}
          />
        </motion.div>

        {/* Dramas populaires */}
        <motion.div variants={fadeInUp} className="relative z-10">
          <ContentRow 
            title="Dramas populaires" 
            items={popularDramas} 
            onSeeAll={() => console.log("Voir tous les dramas populaires")}
          />
        </motion.div>

        {/* Ajouts récents */}
        <motion.div variants={fadeInUp} className="relative z-10">
          <ContentSection 
            title="Ajouts récents" 
            subtitle="Les derniers dramas ajoutés à notre catalogue"
            items={recentlyAdded} 
            layout="carousel"
            onSeeAll={() => console.log("Voir tous les ajouts récents")}
          />
        </motion.div>

        {/* Mieux notés */}
        <motion.div variants={fadeInUp} className="relative z-10">
          <ContentSection 
            title="Les mieux notés" 
            items={topRated} 
            layout="grid"
            columns={4}
            onSeeAll={() => console.log("Voir tous les dramas les mieux notés")}
          />
        </motion.div>
      </motion.main>

      {/* Pied de page avec animation d'entrée */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2, duration: 0.8 }}
      >
        <Footer />
      </motion.div>
    </div>
  );
}
