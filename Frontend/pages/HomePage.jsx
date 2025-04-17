// Nouvelle page d'accueil immersive FloDrama, issue de la fusion et modernisation de HomePage et EnhancedHomePage
// Utilise la palette, la typographie et la navigation FloDrama
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import EnhancedHeroBanner from '../components/hero/EnhancedHeroBanner';
import EnhancedContentCarousel from '../components/carousel/EnhancedContentCarousel';
import Footer from '../components/layout/Footer';
import { fetchAllItems, fetchPopularItems, fetchRecentItems, fetchItemsByType, fetchContinueWatching } from '../api/enhanced-metadata';
import { useWatchlist } from '../hooks/useWatchlist';
import { useAuth } from '../hooks/useAuth';
import '../styles/HomePage.css';

const HomePage = () => {
  const navigate = useNavigate();
  const { isInWatchlist, toggleWatchlist } = useWatchlist();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [featuredItem, setFeaturedItem] = useState(null);
  const [sections, setSections] = useState({
    continueWatching: { title: 'Continuer à regarder', items: [] },
    popular: { title: 'Populaires', items: [] },
    recent: { title: 'Récemment ajoutés', items: [] },
    dramas: { title: 'Dramas', items: [] },
    movies: { title: 'Films', items: [] },
    anime: { title: 'Animés', items: [] },
    bollywood: { title: 'Bollywood', items: [] },
    watchparty: { title: 'WatchParty', items: [] },
    app: { title: 'App', items: [] },
    frenchMovies: { title: 'Cinéma Français', items: [] },
    nouveautes: { title: 'Nouveautés', items: [] },
    tendances: { title: 'Tendances', items: [] },
    recommandes: { title: 'Recommandés pour vous', items: [] },
    romance: { title: 'Romance', items: [] }
  });
  const sectionsRef = useRef({});
  const [visibleSections, setVisibleSections] = useState({});

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const id = entry.target.id;
          setVisibleSections((prev) => ({ ...prev, [id]: entry.isIntersecting }));
        });
      },
      { threshold: 0.1 }
    );
    const currentSectionsRef = { ...sectionsRef.current };
    Object.keys(currentSectionsRef).forEach((key) => {
      if (currentSectionsRef[key]) observer.observe(currentSectionsRef[key]);
    });
    return () => {
      Object.keys(currentSectionsRef).forEach((key) => {
        if (currentSectionsRef[key]) observer.unobserve(currentSectionsRef[key]);
      });
    };
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const allItems = await fetchAllItems();
        if (!allItems || allItems.length === 0) throw new Error('Aucune donnée disponible');
        const potentialFeatured = allItems.filter(item => item.backdropUrl && item.rating >= 8).sort((a, b) => b.rating - a.rating);
        setFeaturedItem(potentialFeatured.length > 0 ? potentialFeatured[Math.floor(Math.random() * Math.min(5, potentialFeatured.length))] : allItems[0]);
        setSections({
          continueWatching: { title: 'Continuer à regarder', items: await fetchContinueWatching(user?.id) },
          popular: { title: 'Populaires', items: await fetchPopularItems() },
          recent: { title: 'Récemment ajoutés', items: await fetchRecentItems() },
          dramas: { title: 'Dramas', items: await fetchItemsByType('drama') },
          movies: { title: 'Films', items: await fetchItemsByType('movie') },
          anime: { title: 'Animés', items: await fetchItemsByType('anime') },
          bollywood: { title: 'Bollywood', items: await fetchItemsByType('bollywood') },
          watchparty: { title: 'WatchParty', items: await fetchItemsByType('watchparty') },
          app: { title: 'App', items: await fetchItemsByType('app') },
          frenchMovies: { title: 'Cinéma Français', items: await fetchItemsByType('frenchMovies') },
          nouveautes: { title: 'Nouveautés', items: await fetchItemsByType('nouveautes') },
          tendances: { title: 'Tendances', items: await fetchItemsByType('tendances') },
          recommandes: { title: 'Recommandés pour vous', items: await fetchItemsByType('recommandes') },
          romance: { title: 'Romance', items: await fetchItemsByType('romance') }
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [user]);

  if (isLoading) return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2" style={{ borderColor: 'var(--color-accent)' }}></div></div>;
  if (error) return <div className="text-red-500 text-center mt-10">Erreur : {error}</div>;

  return (
    <div className="homepage-bg min-h-screen flex flex-col" style={{ background: 'linear-gradient(to right, #121118 60%, #1A1926 100%)' }}>
      <main className="flex-1 w-full mx-auto px-0 md:px-4 pt-2">
        {featuredItem && <EnhancedHeroBanner item={featuredItem} />}
        <div className="space-y-12 mt-8">
          {Object.entries(sections).map(([key, section]) => (
            section.items.length > 0 && (
              <motion.section
                key={key}
                id={`section-${key}`}
                ref={el => sectionsRef.current[key] = el}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: visibleSections[`section-${key}`] ? 1 : 0, y: visibleSections[`section-${key}`] ? 0 : 20 }}
                transition={{ duration: 0.5 }}
                className="enhanced-content-section"
              >
                <EnhancedContentCarousel
                  title={section.title}
                  items={section.items}
                  onItemClick={() => {}}
                  isWatchlist={false}
                  category={key}
                />
              </motion.section>
            )
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default HomePage;
