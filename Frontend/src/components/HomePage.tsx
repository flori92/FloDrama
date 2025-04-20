import React, { useEffect, useState } from "react";
import { MainNavigation } from "./ui/MainNavigation";
import { HeroBanner } from "./ui/HeroBanner";
import { ContentSection } from "./ui/ContentSection";
import { ContentRow } from "./ui/ContentRow";
import { FeaturedCarousel } from "./ui/FeaturedCarousel";
import { Footer } from "./ui/Footer";
import { AnimatedElement } from "./ui/animated-element";
import { BASE_DATA_URL } from "../config/data";

// Types pour le contenu
interface ContentItem {
  id: string;
  title: string;
  subtitle?: string;
  description: string;
  imageUrl: string;
  videoPreviewUrl?: string;
  year: number;
  rating: number;
  duration: string;
  category?: string;
  tags?: string[];
}

interface HeroContent {
  title: string;
  subtitle?: string;
  description: string;
  image: string;
  logo?: string;
  videoUrl?: string;
}

export function HomePage() {
  // États pour les données dynamiques
  const [featuredContent, setFeaturedContent] = useState<ContentItem[]>([]);
  const [popularDramas, setPopularDramas] = useState<ContentItem[]>([]);
  const [recentlyAdded, setRecentlyAdded] = useState<ContentItem[]>([]);
  const [topRated, setTopRated] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // On suppose que le bucket contient ces fichiers JSON : featured.json, popular.json, recently.json, topRated.json
        const [featuredRes, popularRes, recentRes, topRatedRes] = await Promise.all([
          fetch(`${BASE_DATA_URL}featured.json`),
          fetch(`${BASE_DATA_URL}popular.json`),
          fetch(`${BASE_DATA_URL}recently.json`),
          fetch(`${BASE_DATA_URL}topRated.json`)
        ]);
        if (!featuredRes.ok || !popularRes.ok || !recentRes.ok || !topRatedRes.ok) {
          throw new Error("Erreur lors du chargement des données");
        }
        setFeaturedContent(await featuredRes.json());
        setPopularDramas(await popularRes.json());
        setRecentlyAdded(await recentRes.json());
        setTopRated(await topRatedRes.json());
      } catch (e: any) {
        setError(e.message || "Erreur inconnue");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Fonction utilitaire pour adapter ContentItem en HeroContent
  function toHeroContent(item: ContentItem): HeroContent {
    return {
      title: item.title,
      subtitle: item.subtitle,
      description: item.description,
      image: item.imageUrl, // mapping imageUrl -> image
      logo: undefined, // ou item.logo si présent dans les données futures
      videoUrl: item.videoPreviewUrl // mapping videoPreviewUrl -> videoUrl
    };
  }

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

  if (loading) {
    return <div className="min-h-screen bg-black text-white flex items-center justify-center">Chargement du contenu...</div>;
  }
  if (error) {
    return <div className="min-h-screen bg-black text-red-500 flex items-center justify-center">{error}</div>;
  }

  // Adaptation dynamique pour HeroBanner (évite l'erreur de typage)
  const heroBannerContent = featuredContent.map(toHeroContent);

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
        content={heroBannerContent}
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
