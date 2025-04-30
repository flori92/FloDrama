import React, { useEffect, useState } from "react";
import { MainNavigation } from "./ui/MainNavigation";
import { HeroBanner } from "./ui/HeroBanner";
import { ContentSection } from "./ui/ContentSection";
import { ContentRow } from "./ui/ContentRow";
import { FeaturedCarousel } from "./ui/FeaturedCarousel";
import { Footer } from "./ui/Footer";
import { AnimatedElement } from "./ui/animated-element";
import { CategorySection } from "./ui/CategorySection";
import { TrendingStats } from "./ui/TrendingStats";
import { PersonalizedRecommendations } from "./ui/PersonalizedRecommendations";
import { OptimizedImage } from "./ui/OptimizedImage";
import { 
  loadFeaturedContent, 
  loadPopularContent, 
  loadRecentContent, 
  loadTopRatedContent, 
  loadCategories,
  loadMetadata,
  ContentItem as DataContentItem,
  Category as DataCategory,
  Metadata
} from "../src/data";
import {
  toUIContentItems,
  toUIHeroContent,
  toUICategories,
  toUIRecommendations,
  UIContentItem,
  UIHeroContent,
  UICategory,
  UIRecommendation
} from "../src/data/adapters";
import {
  HeroContent,
  ContentItem,
  Category,
  StatItem
} from "./ui/types";

function HomePage() {
  // États pour les données dynamiques
  const [featuredContent, setFeaturedContent] = useState<DataContentItem[]>([]);
  const [popularDramas, setPopularDramas] = useState<DataContentItem[]>([]);
  const [recentlyAdded, setRecentlyAdded] = useState<DataContentItem[]>([]);
  const [topRated, setTopRated] = useState<DataContentItem[]>([]);
  const [categories, setCategories] = useState<DataCategory[]>([]);
  const [metadata, setMetadata] = useState<Metadata | null>(null);
  
  // États pour les données adaptées aux composants UI
  const [uiFeaturedContent, setUIFeaturedContent] = useState<ContentItem[]>([]);
  const [uiPopularDramas, setUIPopularDramas] = useState<ContentItem[]>([]);
  const [uiRecentlyAdded, setUIRecentlyAdded] = useState<ContentItem[]>([]);
  const [uiTopRated, setUITopRated] = useState<ContentItem[]>([]);
  const [uiCategories, setUICategories] = useState<Category[]>([]);
  const [uiHeroContent, setUIHeroContent] = useState<HeroContent[]>([]);
  const [uiRecommendations, setUIRecommendations] = useState<UIRecommendation[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Charger toutes les données en parallèle
        const [featured, popular, recent, topRated, cats, meta] = await Promise.all([
          loadFeaturedContent(),
          loadPopularContent(),
          loadRecentContent(),
          loadTopRatedContent(),
          loadCategories(),
          loadMetadata()
        ]);
        
        // Définir les données brutes dans l'état
        setFeaturedContent(featured);
        setPopularDramas(popular);
        setRecentlyAdded(recent);
        setTopRated(topRated);
        setCategories(cats);
        setMetadata(meta);
        
        // Convertir les données pour les composants UI
        setUIFeaturedContent(toUIContentItems(featured) as unknown as ContentItem[]);
        setUIPopularDramas(toUIContentItems(popular) as unknown as ContentItem[]);
        setUIRecentlyAdded(toUIContentItems(recent) as unknown as ContentItem[]);
        setUITopRated(toUIContentItems(topRated) as unknown as ContentItem[]);
        setUICategories(toUICategories(cats) as unknown as Category[]);
        
        // Convertir les données pour la bannière héro
        const heroContent = featured.map(item => ({
          id: item.id,
          title: item.title,
          subtitle: item.subtitle,
          description: item.description,
          image: item.image,
          videoUrl: item.videoUrl
        })) as HeroContent[];
        setUIHeroContent(heroContent);
        
        // Créer les recommandations personnalisées (mélange de contenu populaire et bien noté)
        const recommendations = [...popular, ...topRated]
          .sort(() => Math.random() - 0.5)
          .slice(0, 6);
        setUIRecommendations(toUIRecommendations(recommendations));
      } catch (e: any) {
        setError(e.message || "Erreur inconnue");
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Gestionnaires d'événements
  const handleSearch = (query: string) => {
    console.log("Recherche:", query);
    // Implémenter la logique de recherche
  };

  const handleProfileClick = () => {
    console.log("Profil cliqué");
    // Implémenter la logique de profil
  };

  const handleNotificationsClick = () => {
    console.log("Notifications cliquées");
    // Implémenter la logique de notifications
  };

  const handlePlay = (content: HeroContent) => {
    console.log("Lecture:", content.title);
    // Implémenter la logique de lecture
  };

  const handleMoreInfo = (content: HeroContent) => {
    console.log("Plus d'infos:", content.title);
    // Implémenter la logique d'informations
  };

  const handleAddToList = (content: HeroContent) => {
    console.log("Ajouté à la liste:", content.title);
    // Implémenter la logique d'ajout à la liste
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-opacity-50 border-t-fuchsia-500 rounded-full animate-spin mb-4"></div>
          <p className="text-xl">Chargement du contenu...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen bg-black text-red-500 flex items-center justify-center">
        <div className="bg-black bg-opacity-70 p-8 rounded-lg border border-red-500 border-opacity-30 max-w-lg text-center">
          <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="text-2xl font-bold mb-4">Erreur de chargement</h2>
          <p className="mb-6">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-6 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }
  
  // Statistiques pour le composant TrendingStats
  const stats: StatItem[] = [
    {
      label: "Dramas",
      value: metadata?.contentCounts?.popular || popularDramas.length,
      trend: "up",
      percentage: 15
    },
    {
      label: "Animes",
      value: metadata?.contentCounts?.featured || featuredContent.length,
      trend: "up",
      percentage: 8
    },
    {
      label: "Films",
      value: metadata?.contentCounts?.topRated || topRated.length,
      trend: "stable",
      percentage: 3
    },
    {
      label: "Nouveautés",
      value: metadata?.contentCounts?.recently || recentlyAdded.length,
      trend: "up",
      percentage: 12
    }
  ];

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
        content={uiHeroContent}
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
            items={uiFeaturedContent} 
          />
        </AnimatedElement>

        {/* Dramas populaires */}
        <AnimatedElement animation="slide-up" delay={0.3}>
          <ContentRow 
            title="Dramas populaires" 
            items={uiPopularDramas} 
            onSeeAll={() => console.log("Voir tous les dramas populaires")}
          />
        </AnimatedElement>
        
        {/* Statistiques de tendances */}
        <AnimatedElement animation="fade-in" delay={0.4}>
          <TrendingStats
            title="Tendances du moment"
            subtitle="Les contenus les plus populaires cette semaine"
            stats={stats}
          />
        </AnimatedElement>

        {/* Ajouts récents */}
        <AnimatedElement animation="slide-up" delay={0.5}>
          <ContentSection 
            title="Ajouts récents" 
            subtitle="Les derniers dramas ajoutés à notre catalogue"
            items={uiRecentlyAdded} 
            layout="carousel"
            onSeeAll={() => console.log("Voir tous les ajouts récents")}
          />
        </AnimatedElement>
        
        {/* Catégories */}
        <AnimatedElement animation="slide-up" delay={0.6}>
          <CategorySection
            categories={uiCategories}
            onCategoryClick={(category) => console.log("Catégorie sélectionnée:", category.name)}
            onSourceClick={(source, categoryId) => console.log(`Source ${source.name} de la catégorie ${categoryId} sélectionnée`)}
          />
        </AnimatedElement>
        
        {/* Recommandations personnalisées */}
        <AnimatedElement animation="slide-up" delay={0.7}>
          <PersonalizedRecommendations
            title="Recommandé pour vous"
            subtitle="Basé sur vos préférences et votre historique de visionnage"
            recommendations={uiRecommendations}
            onItemClick={(item) => console.log("Item recommandé sélectionné:", item.title)}
          />
        </AnimatedElement>

        {/* Mieux notés */}
        <AnimatedElement animation="slide-up" delay={0.8}>
          <ContentSection 
            title="Les mieux notés" 
            items={uiTopRated} 
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

// Export par défaut du composant HomePage
export default HomePage;
