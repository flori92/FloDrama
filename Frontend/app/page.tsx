"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import styles from "./page.module.css";

// Types
interface ContentItem {
  id: string;
  title: string;
  image: string;
  category: string;
  rating: number;
  year: number;
}

export default function Home() {
  const [trendingContent, setTrendingContent] = useState<ContentItem[]>([]);
  const [recentlyAdded, setRecentlyAdded] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fonction pour récupérer le contenu tendance
    const fetchTrendingContent = async () => {
      try {
        // Simulation de données pour la démo
        const mockTrendingData = [
          {
            id: "1",
            title: "La Voie du Dragon",
            image: "/static/placeholders/drama1.jpg",
            category: "Drama",
            rating: 4.8,
            year: 2024
          },
          {
            id: "2",
            title: "Cerisiers en Fleurs",
            image: "/static/placeholders/drama2.jpg",
            category: "Drama",
            rating: 4.5,
            year: 2023
          },
          {
            id: "3",
            title: "Le Dernier Samouraï",
            image: "/static/placeholders/movie1.jpg",
            category: "Film",
            rating: 4.9,
            year: 2023
          },
          {
            id: "4",
            title: "Esprit Combattant",
            image: "/static/placeholders/anime1.jpg",
            category: "Anime",
            rating: 4.7,
            year: 2024
          }
        ];

        const mockRecentData = [
          {
            id: "5",
            title: "Danse des Étoiles",
            image: "/static/placeholders/bollywood1.jpg",
            category: "Bollywood",
            rating: 4.6,
            year: 2024
          },
          {
            id: "6",
            title: "Cœurs Entrelacés",
            image: "/static/placeholders/drama3.jpg",
            category: "Drama",
            rating: 4.3,
            year: 2024
          },
          {
            id: "7",
            title: "Voyage Astral",
            image: "/static/placeholders/anime2.jpg",
            category: "Anime",
            rating: 4.4,
            year: 2023
          }
        ];

        setTrendingContent(mockTrendingData);
        setRecentlyAdded(mockRecentData);
        setIsLoading(false);
      } catch (error) {
        console.error("Erreur lors de la récupération du contenu:", error);
        setIsLoading(false);
      }
    };

    fetchTrendingContent();
  }, []);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>FloDrama</h1>
        <nav className={styles.nav}>
          <Link href="/" className={styles.navLink}>Accueil</Link>
          <Link href="/dramas" className={styles.navLink}>Dramas</Link>
          <Link href="/films" className={styles.navLink}>Films</Link>
          <Link href="/animes" className={styles.navLink}>Animes</Link>
          <Link href="/bollywood" className={styles.navLink}>Bollywood</Link>
          <Link href="/watchparty" className={styles.navLink}>WatchParty</Link>
          <Link href="/recherche" className={styles.navLink}>Recherche</Link>
        </nav>
      </header>

      <main className={styles.main}>
        <section className={styles.heroSection}>
          <h2>Bienvenue sur FloDrama</h2>
          <p>Votre plateforme de référence pour les dramas, films, animes et plus encore !</p>
        </section>

        <section className={styles.contentSection}>
          <h2>Tendances</h2>
          {isLoading ? (
            <p>Chargement...</p>
          ) : (
            <div className={styles.contentGrid}>
              {trendingContent.map(item => (
                <div key={item.id} className={styles.contentCard}>
                  <div className={styles.imageContainer}>
                    <div className={styles.placeholder}>
                      {item.title.substring(0, 1)}
                    </div>
                  </div>
                  <h3>{item.title}</h3>
                  <p>{item.category} • {item.year}</p>
                  <div className={styles.rating}>★ {item.rating}</div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className={styles.contentSection}>
          <h2>Ajouts Récents</h2>
          {isLoading ? (
            <p>Chargement...</p>
          ) : (
            <div className={styles.contentGrid}>
              {recentlyAdded.map(item => (
                <div key={item.id} className={styles.contentCard}>
                  <div className={styles.imageContainer}>
                    <div className={styles.placeholder}>
                      {item.title.substring(0, 1)}
                    </div>
                  </div>
                  <h3>{item.title}</h3>
                  <p>{item.category} • {item.year}</p>
                  <div className={styles.rating}>★ {item.rating}</div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      <footer className={styles.footer}>
        <p> 2025 FloDrama - Tous droits réservés</p>
      </footer>
    </div>
  );
}
