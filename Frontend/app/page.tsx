"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./page.module.css";
import dynamic from 'next/dynamic';

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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulation de données pour la démo
    const mockTrendingData: ContentItem[] = [
      {
        id: "1",
        title: "La Voie du Dragon",
        imageUrl: "/static/placeholders/drama1.jpg",
        category: "Drama",
        rating: 4.8,
        year: 2024,
        description: "Un voyage initiatique dans la Chine ancienne.",
        tags: ["nouveau", "populaire"]
      },
      {
        id: "2",
        title: "Cerisiers en Fleurs",
        imageUrl: "/static/placeholders/drama2.jpg",
        category: "Drama",
        rating: 4.5,
        year: 2023,
        description: "Une romance bouleversante au Japon.",
        tags: ["drama"]
      },
      {
        id: "3",
        title: "Le Dernier Samouraï",
        imageUrl: "/static/placeholders/movie1.jpg",
        category: "Film",
        rating: 4.9,
        year: 2023,
        description: "Épopée historique et combats spectaculaires.",
        tags: ["film", "action"]
      },
      {
        id: "4",
        title: "Esprit Combattant",
        imageUrl: "/static/placeholders/anime1.jpg",
        category: "Anime",
        rating: 4.7,
        year: 2024,
        description: "Un shonen explosif au sommet du sport.",
        tags: ["anime", "sport"]
      }
    ];

    const mockRecentData: ContentItem[] = [
      {
        id: "5",
        title: "Danse des Étoiles",
        imageUrl: "/static/placeholders/bollywood1.jpg",
        category: "Bollywood",
        rating: 4.6,
        year: 2024,
        description: "Bollywood, danse et passion.",
        tags: ["bollywood", "nouveau"]
      },
      {
        id: "6",
        title: "Cœurs Entrelacés",
        imageUrl: "/static/placeholders/drama3.jpg",
        category: "Drama",
        rating: 4.3,
        year: 2024,
        description: "Deux destins croisés à Séoul.",
        tags: ["drama"]
      },
      {
        id: "7",
        title: "Voyage Astral",
        imageUrl: "/static/placeholders/anime2.jpg",
        category: "Anime",
        rating: 4.4,
        year: 2023,
        description: "Science-fiction et aventure cosmique.",
        tags: ["anime", "sf"]
      }
    ];

    setTrendingContent(mockTrendingData);
    setRecentlyAdded(mockRecentData);
    setIsLoading(false);
  }, []);

  return (
    <div className={styles.container}>
      {/* Navigation principale moderne */}
      <MainNavigation />

      {/* Bannière héro personnalisée - décommentée pour tester progressivement */}
      <HeroBanner
        content={[
          {
            title: "FloDrama, la référence du drama et du cinéma asiatique",
            subtitle: "Tendances, nouveautés et exclusivités",
            description: "Découvrez chaque jour les meilleurs dramas, films, animes et plus encore, avec une expérience visuelle inégalée.",
            image: "/static/hero/hero-banner.jpg"
          }
        ]}
      />

      <main className={styles.main}>
        {/* Commenté temporairement pour tester le build
        <section className={styles.contentSection}>
          <ContentRow
            title="Tendances"
            items={trendingContent}
            className="mb-8"
          />
        </section>

        <section className={styles.contentSection}>
          <ContentRow
            title="Ajouts Récents"
            items={recentlyAdded}
            className="mb-8"
          />
        </section>
        */}
      </main>

      {/* Footer moderne - commenté temporairement pour tester le build
      <Footer />
      */}
    </div>
  );
}
