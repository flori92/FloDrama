"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./page.module.css";
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { motion } from 'framer-motion';

// Import dynamique avec No SSR pour éviter les erreurs document is not defined
const MainNavigation = dynamic(
  () => import('../src/components/ui/MainNavigation').then(mod => mod.MainNavigation || mod.default),
  { ssr: false }
);

// Imports normaux pour les autres composants
import { ContentRow } from "../src/components/ui/ContentRow";
import { ContentItem } from "../src/components/ui/ContentCard";
import { Footer } from "../src/components/ui/Footer";
import { HeroBanner } from "../src/components/ui/HeroBanner";

export default function Home() {
  const [trendingContent, setTrendingContent] = useState<ContentItem[]>([]);
  const [recentlyAdded, setRecentlyAdded] = useState<ContentItem[]>([]);
  const [koreanDramas, setKoreanDramas] = useState<ContentItem[]>([]);
  const [japaneseDramas, setJapaneseDramas] = useState<ContentItem[]>([]);
  const [animes, setAnimes] = useState<ContentItem[]>([]);
  const [bollywoodContent, setBollywoodContent] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fonction pour charger les données depuis le fichier JSON
    const loadContentData = async () => {
      try {
        setIsLoading(true);
        
        // Tentative de chargement des données réelles
        const contentResponse = await fetch('/data/content.json');
        const categoriesResponse = await fetch('/data/categories.json');
        
        if (!contentResponse.ok || !categoriesResponse.ok) {
          throw new Error(`Erreur de chargement des données: ${contentResponse.status} ${categoriesResponse.status}`);
        }
        
        const contentData = await contentResponse.json();
        const categoriesData = await categoriesResponse.json();
        
        // Transformation des données en ContentItem[]
        const transformData = (ids: string[]) => {
          return ids.map(id => {
            const item = contentData.find((c: any) => c.id === id);
            if (!item) return null;
            
            return {
              id: item.id,
              title: item.title,
              imageUrl: item.images?.poster || `/static/placeholders/${item.type}1.svg`,
              backdropUrl: item.images?.backdrop || `/static/placeholders/${item.type}1-backdrop.svg`,
              category: item.type.charAt(0).toUpperCase() + item.type.slice(1),
              rating: item.ratings?.average || 0,
              year: parseInt(item.metadata?.year) || new Date().getFullYear(),
              description: item.synopsis || "Aucune description disponible",
              tags: item.metadata?.genre || []
            };
          }).filter(Boolean) as ContentItem[];
        };
        
        // Chargement des différentes catégories
        setTrendingContent(transformData(categoriesData.trending || []));
        setRecentlyAdded(transformData(categoriesData.latest || []));
        setKoreanDramas(transformData(categoriesData.drama_korean || []));
        setJapaneseDramas(transformData(categoriesData.drama_japanese || []));
        setAnimes(transformData(categoriesData.anime || []));
        setBollywoodContent(transformData(categoriesData.bollywood || []));
        
        setError(null);
      } catch (err) {
        console.error("Erreur lors du chargement des données:", err);
        setError("Impossible de charger les données. Utilisation des données de secours.");
        
        // Utilisation des données de secours en cas d'erreur
        useFallbackData();
      } finally {
        setIsLoading(false);
      }
    };
    
    loadContentData();
  }, []);
  
  // Fonction pour utiliser des données de secours en cas d'erreur
  const useFallbackData = () => {
    // Données de secours pour la démo
    const mockTrendingData: ContentItem[] = [
      {
        id: "drama-1",
        title: "La Voie du Dragon",
        imageUrl: "/static/placeholders/drama1.svg",
        backdropUrl: "/static/placeholders/drama1-backdrop.svg",
        category: "Drama",
        rating: 4.8,
        year: 2024,
        description: "Un voyage initiatique dans la Chine ancienne.",
        tags: ["nouveau", "populaire"]
      },
      {
        id: "drama-2",
        title: "Cerisiers en Fleurs",
        imageUrl: "/static/placeholders/drama2.svg",
        backdropUrl: "/static/placeholders/drama2-backdrop.svg",
        category: "Drama",
        rating: 4.5,
        year: 2023,
        description: "Une romance bouleversante au Japon.",
        tags: ["drama"]
      },
      {
        id: "film-1",
        title: "Le Dernier Samouraï",
        imageUrl: "/static/placeholders/movie1.svg",
        backdropUrl: "/static/placeholders/movie1-backdrop.svg",
        category: "Film",
        rating: 4.9,
        year: 2023,
        description: "Épopée historique et combats spectaculaires.",
        tags: ["film", "action"]
      },
      {
        id: "anime-1",
        title: "Esprit Combattant",
        imageUrl: "/static/placeholders/anime1.svg",
        backdropUrl: "/static/placeholders/anime1-backdrop.svg",
        category: "Anime",
        rating: 4.7,
        year: 2024,
        description: "Un shonen explosif au sommet du sport.",
        tags: ["anime", "sport"]
      }
    ];

    const mockRecentData: ContentItem[] = [
      {
        id: "bollywood-1",
        title: "Danse des Étoiles",
        imageUrl: "/static/placeholders/bollywood1.svg",
        backdropUrl: "/static/placeholders/bollywood1-backdrop.svg",
        category: "Bollywood",
        rating: 4.6,
        year: 2024,
        description: "Bollywood, danse et passion.",
        tags: ["bollywood", "nouveau"]
      },
      {
        id: "drama-3",
        title: "Cœurs Entrelacés",
        imageUrl: "/static/placeholders/drama3.svg",
        backdropUrl: "/static/placeholders/drama3-backdrop.svg",
        category: "Drama",
        rating: 4.3,
        year: 2024,
        description: "Deux destins croisés à Séoul.",
        tags: ["drama"]
      },
      {
        id: "anime-2",
        title: "Voyage Astral",
        imageUrl: "/static/placeholders/anime2.svg",
        backdropUrl: "/static/placeholders/anime2-backdrop.svg",
        category: "Anime",
        rating: 4.4,
        year: 2023,
        description: "Science-fiction et aventure cosmique.",
        tags: ["anime", "sf"]
      }
    ];

    setTrendingContent(mockTrendingData);
    setRecentlyAdded(mockRecentData);
    setKoreanDramas([mockTrendingData[0], mockRecentData[1]]);
    setJapaneseDramas([mockTrendingData[1], mockTrendingData[2]]);
    setAnimes([mockTrendingData[3], mockRecentData[2]]);
    setBollywoodContent([mockRecentData[0]]);
  };

  return (
    <div className={styles.container}>
      {/* Navigation principale moderne */}
      <MainNavigation />

      {/* Bannière héro personnalisée */}
      <HeroBanner
        content={[
          {
            title: "FloDrama",
            subtitle: "Votre plateforme de streaming asiatique",
            description: "Découvrez les meilleurs dramas, films, animes et contenus Bollywood avec une expérience visuelle inégalée.",
            image: "/static/hero/hero-banner.svg"
          }
        ]}
      />

      <main className={styles.main}>
        {/* Message d'erreur si nécessaire */}
        {error && (
          <div className="bg-flo-fuchsia/10 border-l-4 border-flo-fuchsia text-flo-white p-4 mb-8 rounded-r">
            <p className="font-bold">Attention</p>
            <p>{error}</p>
          </div>
        )}
        
        {/* Indicateur de chargement */}
        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-flo-fuchsia"></div>
          </div>
        ) : (
          <>
            {/* Sections de contenu */}
            <section className={styles.contentSection}>
              <ContentRow
                title="Tendances"
                items={trendingContent}
                className="mb-12"
              />
            </section>

            <section className={styles.contentSection}>
              <ContentRow
                title="Ajouts Récents"
                items={recentlyAdded}
                className="mb-12"
              />
            </section>
            
            <section className={styles.contentSection}>
              <ContentRow
                title="Dramas Coréens"
                items={koreanDramas}
                className="mb-12"
              />
            </section>
            
            <section className={styles.contentSection}>
              <ContentRow
                title="Dramas Japonais"
                items={japaneseDramas}
                className="mb-12"
              />
            </section>
            
            <section className={styles.contentSection}>
              <ContentRow
                title="Animes"
                items={animes}
                className="mb-12"
              />
            </section>
            
            <section className={styles.contentSection}>
              <ContentRow
                title="Bollywood"
                items={bollywoodContent}
                className="mb-12"
              />
            </section>
            
            {/* Section "À propos" */}
            <section className="mb-16 px-4 py-8 bg-gradient-to-r from-flo-night via-flo-violet/10 to-flo-night rounded-lg">
              <div className="max-w-4xl mx-auto text-center">
                <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-flo-blue via-flo-fuchsia to-flo-violet bg-clip-text text-transparent">
                  Bienvenue sur FloDrama
                </h2>
                <p className="text-flo-gray mb-6 text-lg">
                  Votre plateforme de référence pour les dramas, films, animes et plus encore !
                  Découvrez chaque jour de nouveaux contenus asiatiques en haute qualité.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                  <div className="p-4">
                    <div className="text-flo-fuchsia text-4xl mb-2">+1000</div>
                    <div className="text-flo-white font-medium">Dramas et Films</div>
                  </div>
                  <div className="p-4">
                    <div className="text-flo-blue text-4xl mb-2">+500</div>
                    <div className="text-flo-white font-medium">Animes</div>
                  </div>
                  <div className="p-4">
                    <div className="text-flo-violet text-4xl mb-2">+200</div>
                    <div className="text-flo-white font-medium">Films Bollywood</div>
                  </div>
                </div>
              </div>
            </section>
          </>
        )}
      </main>

      {/* Footer moderne */}
      <Footer />
    </div>
  );
}
