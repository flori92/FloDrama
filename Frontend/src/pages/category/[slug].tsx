import React, { useEffect, useState, Suspense } from 'react';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import { getDynamicComponent } from '../../components/component-registry';
import { getContentByCategory } from '../../services/apiService';

// Labels pour les catégories
const CATEGORY_LABELS: Record<string, string> = {
  dramas: 'Dramas',
  movies: 'Films',
  anime: 'Animés',
  bollywood: 'Bollywood',
  trending: 'Tendances',
};

interface ContentItem {
  id: string | number;
  title: string;
  image: string;
  year?: string | number;
  match?: number;
  rating?: string;
  description?: string;
  categories?: string[];
}

const CategoryPage: React.FC = () => {
  const router = useRouter();
  const { slug } = router.query;
  const categoryName = typeof slug === 'string' ? slug : '';
  
  const [contentData, setContentData] = useState<{
    items: ContentItem[];
    isLoading: boolean;
    error: string | null;
  }>({
    items: [],
    isLoading: true,
    error: null
  });

  const title = CATEGORY_LABELS[categoryName] || categoryName;

  useEffect(() => {
    // Récupération des données uniquement quand le slug est disponible
    if (!categoryName) return;
    
    const fetchCategoryContent = async () => {
      try {
        const result = await getContentByCategory(categoryName, 1, 24);
        
        setContentData({
          items: result.items || [],
          isLoading: false,
          error: null
        });
      } catch (error) {
        console.error(`Erreur lors de la récupération des données pour ${categoryName}:`, error);
        setContentData({
          items: [],
          isLoading: false,
          error: "Une erreur est survenue lors du chargement du contenu. Veuillez réessayer ultérieurement."
        });
      }
    };

    fetchCategoryContent();
  }, [categoryName]);

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header (Navigation) */}
      <Suspense fallback={<div className="h-16 w-full bg-black/80 animate-pulse" />}>
        {getDynamicComponent('Header')}
      </Suspense>

      <main className="container mx-auto px-4 py-12">
        {/* Titre de la page de catégorie */}
        <motion.h1 
          className="text-3xl md:text-5xl font-bold mb-8 text-center bg-gradient-to-r from-blue-500 to-fuchsia-500 bg-clip-text text-transparent font-['SF_Pro_Display',-apple-system,BlinkMacSystemFont,'Segoe_UI',Roboto,'Helvetica_Neue',Arial,sans-serif]"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {title}
        </motion.h1>

        {/* Affichage du message d'erreur */}
        {contentData.error && (
          <div className="bg-red-500/20 border border-red-500 rounded-lg p-4 text-white mb-8">
            {contentData.error}
          </div>
        )}

        {/* Affichage du chargement */}
        {contentData.isLoading && (
          <div className="flex justify-center items-center py-12">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-fuchsia-500 rounded-full animate-spin"></div>
          </div>
        )}

        {/* Grille de contenu */}
        {!contentData.isLoading && !contentData.error && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 md:gap-6">
            {contentData.items.map(item => (
              <div key={item.id} className="transition-all duration-300 hover:scale-105">
                <Suspense fallback={<div className="w-full aspect-[2/3] bg-gray-800 animate-pulse rounded-md" />}>
                  {getDynamicComponent('ContentCard', item)}
                </Suspense>
              </div>
            ))}
          </div>
        )}

        {/* Message quand aucun contenu n'est trouvé */}
        {!contentData.isLoading && !contentData.error && contentData.items.length === 0 && (
          <p className="text-center text-white/60 py-12">
            Aucun contenu trouvé pour cette catégorie.
          </p>
        )}
      </main>

      {/* Footer */}
      <Suspense fallback={<div className="h-64 w-full bg-black animate-pulse mt-8" />}>
        {getDynamicComponent('Footer')}
      </Suspense>
    </div>
  );
};

export default CategoryPage;
