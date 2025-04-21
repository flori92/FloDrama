import React from 'react';
import { ChevronRight } from 'lucide-react';

interface ContentGridProps {
  title: string;
  category?: string;
  searchQuery?: string;
}

const ContentGrid: React.FC<ContentGridProps> = ({ title, category, searchQuery }) => {
  // @ts-expect-error: Ajout dynamique MEDIA_CDN_URL sur window par aws-config-global.js
  const CDN_URL = (typeof window !== 'undefined' && window.MEDIA_CDN_URL) ? window.MEDIA_CDN_URL : 'https://d1323ouxr1qbdp.cloudfront.net';

  // Simuler des données de contenu
  const contentItems = Array.from({ length: 6 }, (_, i) => ({
    id: i + 1,
    title: `Titre ${i + 1}`,
    image: `${CDN_URL}/placeholders/${category || 'drama'}-${i + 1}.webp`,
    type: category || 'drama'
  }));

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-2xl md:text-3xl font-bold font-sans bg-gradient-to-r from-flo-violet to-flo-blue bg-clip-text text-transparent drop-shadow">
          {title}
        </h2>
        <button className="flex items-center text-flo-blue hover:text-flo-violet font-semibold transition-colors">
          <span>Voir tout</span>
          <ChevronRight className="w-5 h-5 ml-1" />
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {contentItems.map((item) => (
          <div key={item.id} className="group bg-flo-black rounded-xl shadow-md overflow-hidden transition-transform hover:scale-105">
            <div className="aspect-[2/3] relative">
              <img
                src={item.image}
                alt={item.title}
                className="w-full h-full object-cover group-hover:brightness-110 transition-all duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
            <h3 className="mt-2 px-2 text-base font-semibold truncate text-flo-white">
              {item.title}
            </h3>
          </div>
        ))}
      </div>
    </section>
  );
};

export default ContentGrid;