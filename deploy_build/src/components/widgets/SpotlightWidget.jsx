import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getAssetUrl } from '../../api/metadata';

/**
 * Widget Spotlight pour mettre en avant une catégorie ou un type de contenu
 * @param {string} title - Titre du widget
 * @param {string} description - Description explicative
 * @param {string} image - URL de l'image de fond
 * @param {Array} items - Liste des éléments à afficher
 */
const SpotlightWidget = ({ title, description, image, items = [] }) => {
  if (!items.length) return null;
  
  // Utiliser le poster du premier élément si aucune image n'est fournie
  const backgroundImage = image || (items[0] && getAssetUrl(items[0].poster));
  
  return (
    <section className="bg-gray-800 rounded-xl overflow-hidden my-8">
      <div className="md:flex">
        {/* Partie contenu */}
        <div className="md:w-1/2 p-6 flex flex-col justify-center">
          <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>
          <p className="text-gray-400 mb-6">{description}</p>
          
          {/* Miniatures des contenus */}
          <div className="grid grid-cols-3 gap-4">
            {items.slice(0, 3).map(item => (
              <Link 
                key={item.id} 
                to={`/${item.section}/${item.id}`} 
                className="cursor-pointer group"
              >
                <div className="relative overflow-hidden rounded-lg mb-2">
                  <img 
                    src={getAssetUrl(item.poster)} 
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                </div>
                <h3 className="font-medium text-xs truncate text-white">{item.title}</h3>
              </Link>
            ))}
          </div>
          
          {/* Bouton Voir tout */}
          <Link 
            to={`/category/${title.toLowerCase().replace(/\s+/g, '-')}`}
            className="mt-6 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded self-start flex items-center"
          >
            <span>Voir tout</span>
            <ArrowRight size={16} className="ml-2" />
          </Link>
        </div>
        
        {/* Partie image */}
        <div className="md:w-1/2">
          <img 
            src={backgroundImage} 
            alt={title}
            className="w-full h-full object-cover"
          />
        </div>
      </div>
    </section>
  );
};

export default SpotlightWidget;
