import React from 'react';
import ContentCard from '../cards/ContentCard';

/**
 * Widget de collection pour afficher une sélection thématique
 * @param {string} title - Titre du widget
 * @param {string} subtitle - Sous-titre explicatif
 * @param {Array} items - Liste des éléments à afficher
 */
const CollectionWidget = ({ title, subtitle, items = [] }) => {
  if (!items.length) return null;
  
  return (
    <section className="bg-gray-800 rounded-xl p-6 space-y-6 my-8">
      <div>
        <h2 className="text-2xl font-bold text-white">{title}</h2>
        <p className="text-gray-400">{subtitle}</p>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {items.map(item => (
          <ContentCard key={item.id} item={item} size="md" />
        ))}
      </div>
    </section>
  );
};

export default CollectionWidget;
