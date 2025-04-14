import React from "react";
import { MainNavigation } from "./ui/MainNavigation";
import { HeroBanner } from "./ui/HeroBanner";
import { ContentSection } from "./ui/ContentSection";
import { ContentRow } from "./ui/ContentRow";
import { FeaturedCarousel } from "./ui/FeaturedCarousel";
import { Footer } from "./ui/Footer";
import { AnimatedElement } from "./ui/animated-element";

// Données de démonstration
const featuredContent = [
  {
    id: "1",
    title: "Pachinko",
    subtitle: "Nouvelle Saison",
    description:
      "Une saga familiale épique qui s'étend sur quatre générations, depuis la Corée sous occupation japonaise jusqu'au Japon moderne.",
    imageUrl: "https://d1pbqs2b6em4ha.cloudfront.net/images/pachinko-banner.jpg",
    videoPreviewUrl: "https://d1pbqs2b6em4ha.cloudfront.net/videos/pachinko-preview.mp4",
    year: 2023,
    rating: 9.2,
    duration: "50 min",
    category: "Drame",
    tags: ["Historique", "Famille", "Adaptation"]
  },
  {
    id: "2",
    title: "The Glory",
    subtitle: "Série Originale",
    description:
      "Après avoir subi d'horribles brimades à l'école, une femme met au point un plan élaboré pour se venger de ses bourreaux.",
    imageUrl: "https://d1pbqs2b6em4ha.cloudfront.net/images/the-glory-banner.jpg",
    videoPreviewUrl: "https://d1pbqs2b6em4ha.cloudfront.net/videos/the-glory-preview.mp4",
    year: 2022,
    rating: 8.8,
    duration: "45 min",
    category: "Thriller",
    tags: ["Vengeance", "Drame", "Suspense"]
  },
  {
    id: "3",
    title: "Moving",
    subtitle: "Exclusivité",
    description:
      "Des adolescents aux super-pouvoirs et leurs parents, qui ont vécu en cachant leurs identités, se retrouvent face à de nouveaux défis.",
    imageUrl: "https://d1pbqs2b6em4ha.cloudfront.net/images/moving-banner.jpg",
    videoPreviewUrl: "https://d1pbqs2b6em4ha.cloudfront.net/videos/moving-preview.mp4",
    year: 2023,
    rating: 9.5,
    duration: "60 min",
    category: "Action",
    tags: ["Super-héros", "Fantastique", "Adaptation"]
  }
];

const popularDramas = [
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

const recentlyAdded = [
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

const topRated = [
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
  // Gestionnaires d'événements
  const handlePlay = (content: any) => {
    console.log("Lecture de", content.title);
  };

  const handleMoreInfo = (content: any) => {
    console.log("Plus d'infos sur", content.title);
  };

  const handleAddToList = (content: any) => {
    console.log("Ajout à la liste:", content.title);
  };

  const handleSearch = (query: string) => {
    console.log("Recherche:", query);
  };

  const handleProfileClick = () => {
    console.log("Clic sur le profil");
  };

  const handleNotificationsClick = () => {
    console.log("Clic sur les notifications");
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navigation */}
      <MainNavigation 
        onSearch={handleSearch}
        onProfileClick={handleProfileClick}
        onNotificationsClick={handleNotificationsClick}
      />

      {/* Bannière héro */}
      <HeroBanner 
        content={featuredContent}
        onPlay={handlePlay}
        onMoreInfo={handleMoreInfo}
        onAddToList={handleAddToList}
      />

      {/* Contenu principal */}
      <main className="pb-16">
        {/* Carrousel en vedette */}
        <AnimatedElement animation="fade-in" delay={0.2}>
          <FeaturedCarousel 
            title="Séries en vedette" 
            items={featuredContent} 
          />
        </AnimatedElement>

        {/* Dramas populaires */}
        <AnimatedElement animation="slide-up" delay={0.3}>
          <ContentRow 
            title="Dramas populaires" 
            items={popularDramas} 
            onSeeAll={() => console.log("Voir tous les dramas populaires")}
          />
        </AnimatedElement>

        {/* Ajouts récents */}
        <AnimatedElement animation="slide-up" delay={0.4}>
          <ContentSection 
            title="Ajouts récents" 
            subtitle="Les derniers dramas ajoutés à notre catalogue"
            items={recentlyAdded} 
            layout="carousel"
            onSeeAll={() => console.log("Voir tous les ajouts récents")}
          />
        </AnimatedElement>

        {/* Mieux notés */}
        <AnimatedElement animation="slide-up" delay={0.5}>
          <ContentSection 
            title="Les mieux notés" 
            items={topRated} 
            layout="grid"
            columns={4}
            onSeeAll={() => console.log("Voir tous les dramas les mieux notés")}
          />
        </AnimatedElement>
      </main>

      {/* Pied de page */}
      <Footer />
    </div>
  );
}
