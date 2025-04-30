import React, { useState, useEffect, Suspense } from 'react';
import { motion } from 'framer-motion';
import { getDynamicComponent } from '../components/component-registry';
import { getContentByCategory, getFeaturedContent } from '../services/apiService';
import { CDN_BASE_URL } from '../config';
import { useRouter } from 'next/router';

// Types pour les données
interface ContentData {
  trending: any[];
  dramas: any[];
  movies: any[];
  anime: any[];
  bollywood: any[];
  featured: any[];
  isLoading: boolean;
  error: string | null;
}

const HomePage: React.FC = () => {
  // État pour stocker les données de contenu
  const [contentData, setContentData] = useState<ContentData>({
    trending: [],
    dramas: [],
    movies: [],
    anime: [],
    bollywood: [],
    featured: [],
    isLoading: true,
    error: null
  });

  const router = useRouter();

  // Récupération des données au chargement de la page
  useEffect(() => {
    const fetchAllContent = async () => {
      try {
        // Récupération des données en parallèle pour optimiser le chargement
        const [trending, dramas, movies, anime, bollywood, featured] = await Promise.all([
          getContentByCategory('trending', 1, 20),
          getContentByCategory('dramas', 1, 20),
          getContentByCategory('movies', 1, 20),
          getContentByCategory('anime', 1, 20),
          getContentByCategory('bollywood', 1, 20),
          getFeaturedContent(12)
        ]);

        // Mise à jour de l'état avec les données récupérées
        setContentData({
          trending: trending.items || [],
          dramas: dramas.items || [],
          movies: movies.items || [],
          anime: anime.items || [],
          bollywood: bollywood.items || [],
          featured: featured.items || [],
          isLoading: false,
          error: null
        });
      } catch (error) {
        console.error('Erreur lors de la récupération des données :', error);
        setContentData(prev => ({
          ...prev,
          isLoading: false,
          error: "Une erreur est survenue lors du chargement du contenu. Veuillez réessayer ultérieurement."
        }));
      }
    };

    fetchAllContent();
  }, []);

  // Données pour le Hero Banner (issues du trending ou featured)
  const heroBannerData = contentData.featured.slice(0, 3).map(item => ({
    id: item.id,
    title: item.title,
    subtitle: item.categories?.[0] || 'Exclusivité',
    description: item.description,
    image: item.image,
    logo: item.logo || null, // Utiliser une image de logo si disponible
    category: item.categories?.[0] || ''
  }));

  // Données pour les cartes de catégories
  const categoryCardsData = [
    {
      title: 'Dramas',
      slug: 'dramas',
      image: `${CDN_BASE_URL}/categories/drama-category.jpg`,
      gradient: 'from-purple-600/80 to-fuchsia-500/80'
    },
    {
      title: 'Films',
      slug: 'movies',
      image: `${CDN_BASE_URL}/categories/movie-category.jpg`,
      gradient: 'from-blue-600/80 to-blue-400/80'
    },
    {
      title: 'Animés',
      slug: 'anime',
      image: `${CDN_BASE_URL}/categories/anime-category.jpg`,
      gradient: 'from-teal-500/80 to-green-400/80'
    },
    {
      title: 'Bollywood',
      slug: 'bollywood',
      image: `${CDN_BASE_URL}/categories/bollywood-category.jpg`,
      gradient: 'from-orange-500/80 to-red-400/80'
    }
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header (Navigation) */}
      <Suspense fallback={<div className="h-16 w-full bg-black/80 animate-pulse" />}>
        {getDynamicComponent('Header')}
      </Suspense>

      {/* Corps principal */}
      <main>
        {/* Message d'erreur (si présent) */}
        {contentData.error && (
          <div className="container mx-auto my-8 px-4">
            <div className="bg-red-500/20 border border-red-500 rounded-lg p-4 text-white">
              {contentData.error}
            </div>
          </div>
        )}

        {/* Hero Banner */}
        <Suspense fallback={<div className="h-[85vh] w-full bg-gradient-to-r from-blue-500/20 to-fuchsia-500/20 animate-pulse" />}>
          {getDynamicComponent('HeroBanner', { 
            contents: contentData.isLoading ? [] : heroBannerData 
          })}
        </Suspense>

        {/* Contenu en tendance */}
        <Suspense fallback={<div className="h-64 w-full bg-black animate-pulse my-8" />}>
          {getDynamicComponent('ContentRow', {
            title: 'Tendances',
            items: contentData.trending,
            onSeeAll: () => router.push('/category/trending')
          })}
        </Suspense>

        {/* Dramas */}
        <Suspense fallback={<div className="h-64 w-full bg-black animate-pulse my-8" />}>
          {getDynamicComponent('ContentRow', {
            title: 'Dramas',
            items: contentData.dramas,
            onSeeAll: () => router.push('/category/dramas')
          })}
        </Suspense>

        {/* Films */}
        <Suspense fallback={<div className="h-64 w-full bg-black animate-pulse my-8" />}>
          {getDynamicComponent('ContentRow', {
            title: 'Films',
            items: contentData.movies,
            onSeeAll: () => router.push('/category/movies')
          })}
        </Suspense>

        {/* Section Mise en avant */}
        <Suspense fallback={<div className="h-96 w-full bg-black animate-pulse my-8" />}>
          {getDynamicComponent('FeaturedSection', {
            title: 'Sélection du moment',
            subtitle: 'Notre sélection de contenus à ne pas manquer ce mois-ci',
            items: contentData.featured,
            onSeeAll: () => router.push('/category/featured')
          })}
        </Suspense>

        {/* Animés */}
        <Suspense fallback={<div className="h-64 w-full bg-black animate-pulse my-8" />}>
          {getDynamicComponent('ContentRow', {
            title: 'Animés',
            items: contentData.anime,
            onSeeAll: () => router.push('/category/anime')
          })}
        </Suspense>

        {/* Bollywood */}
        <Suspense fallback={<div className="h-64 w-full bg-black animate-pulse my-8" />}>
          {getDynamicComponent('ContentRow', {
            title: 'Bollywood',
            items: contentData.bollywood,
            onSeeAll: () => router.push('/category/bollywood')
          })}
        </Suspense>

        {/* Cartes de catégories */}
        <div className="container mx-auto px-4 py-12">
          <h2 className="text-3xl font-bold mb-8 text-white">Explorez par catégorie</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {categoryCardsData.map((category, index) => (
              <Suspense key={category.slug} fallback={<div className="h-48 w-full bg-gradient-to-r from-blue-500/20 to-fuchsia-500/20 animate-pulse rounded-lg" />}>
                {getDynamicComponent('CategoryCard', {
                  ...category,
                  onClick: () => router.push(`/category/${category.slug}`)
                })}
              </Suspense>
            ))}
          </div>
        </div>

      </main>

      {/* Footer */}
      <Suspense fallback={<div className="h-64 w-full bg-black animate-pulse mt-8" />}>
        {getDynamicComponent('Footer')}
      </Suspense>
    </div>
  );
};

export default HomePage;
