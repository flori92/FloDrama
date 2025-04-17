import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import PageTransition from '../components/animations/PageTransition';

/**
 * Page dédiée aux dramas
 */
const DramaPage = () => {
  const { category } = useParams();
  const [dramas, setDramas] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Simuler le chargement des données
    const fetchDramas = async () => {
      try {
        // Dans une implémentation réelle, nous ferions un appel API ici
        // Simulation de données pour le moment
        setTimeout(() => {
          setDramas([
            { id: 1, title: 'Crash Landing on You', image: '/placeholder/drama1.jpg' },
            { id: 2, title: 'Itaewon Class', image: '/placeholder/drama2.jpg' },
            { id: 3, title: 'Goblin', image: '/placeholder/drama3.jpg' },
            { id: 4, title: 'Descendants of the Sun', image: '/placeholder/drama4.jpg' },
          ]);
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Erreur lors du chargement des dramas:', error);
        setLoading(false);
      }
    };
    
    fetchDramas();
  }, [category]);
  
  return (
    <PageTransition>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">
          {category ? `Dramas - ${category}` : 'Tous les dramas'}
        </h1>
        
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {dramas.map(drama => (
              <div key={drama.id} className="bg-gray-800 rounded-lg overflow-hidden shadow-lg transition-transform duration-300 hover:scale-105">
                <div className="aspect-w-16 aspect-h-9 bg-gray-700">
                  <img 
                    src={drama.image} 
                    alt={drama.title}
                    className="object-cover w-full h-full"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/placeholder/default.jpg';
                    }}
                  />
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-semibold mb-2">{drama.title}</h3>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">Drama</span>
                    <button className="text-blue-500 hover:text-blue-400">
                      Voir plus
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageTransition>
  );
};

export default DramaPage;
