/**
 * PremiumContentExample
 * 
 * Page d'exemple montrant comment protéger du contenu premium
 * avec le composant WithSubscriptionCheck.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Crown, Star, Play } from 'lucide-react';
import Footer from '../components/layout/Footer';
import PageTransition from '../components/animations/PageTransition';
import WithSubscriptionCheck from '../components/payment/WithSubscriptionCheck';

const PremiumContentExample = ({ blurred }) => {
  // Liste de contenus premium fictifs
  const premiumContent = [
    {
      id: 1,
      title: 'Exclusivité FloDrama',
      description: 'Accédez en avant-première à nos nouveaux dramas',
      image: '/assets/images/premium/exclusive.jpg',
      tag: 'Nouveau'
    },
    {
      id: 2,
      title: 'Collection 4K Ultra HD',
      description: 'Regardez vos dramas préférés en qualité exceptionnelle',
      image: '/assets/images/premium/4k.jpg',
      tag: 'Populaire'
    },
    {
      id: 3,
      title: 'Téléchargements illimités',
      description: 'Téléchargez vos dramas pour les regarder hors ligne',
      image: '/assets/images/premium/download.jpg',
      tag: 'Exclusif'
    }
  ];

  return (
    <PageTransition type="fade">
      <div className={`bg-gray-900 text-white min-h-screen ${blurred ? 'blur-sm' : ''}`}>
        
        <div className="container mx-auto px-4 py-12 pt-24">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-6xl mx-auto"
          >
            <div className="flex items-center mb-8">
              <Crown size={28} className="text-yellow-500 mr-3" />
              <h1 className="text-4xl font-bold">Contenu Premium</h1>
            </div>
            
            <p className="text-xl text-gray-400 mb-12">
              Découvrez notre sélection exclusive de contenus premium disponibles pour nos abonnés.
            </p>
            
            {/* Bannière principale */}
            <div className="relative rounded-xl overflow-hidden mb-12 h-80">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-800 to-pink-700 opacity-90"></div>
              <div className="absolute inset-0 flex flex-col justify-center px-8 md:px-16">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">Expérience FloDrama Premium</h2>
                <p className="text-lg md:text-xl text-gray-200 mb-6 max-w-2xl">
                  Profitez d'une expérience de visionnage optimale avec notre abonnement premium.
                  Qualité 4K, téléchargements illimités et accès anticipé aux nouveautés.
                </p>
                <button className="bg-pink-500 hover:bg-pink-600 text-white px-6 py-3 rounded-lg font-medium inline-flex items-center transition-colors w-fit">
                  <Play size={20} className="mr-2" />
                  Regarder maintenant
                </button>
              </div>
            </div>
            
            {/* Grille de contenu premium */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
              {premiumContent.map((item) => (
                <motion.div
                  key={item.id}
                  whileHover={{ y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="bg-gray-800 rounded-xl overflow-hidden shadow-lg"
                >
                  <div className="relative h-48 bg-gray-700">
                    {/* Image de couverture (à remplacer par de vraies images) */}
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-pink-600 opacity-80"></div>
                    
                    {/* Tag */}
                    <div className="absolute top-4 right-4 bg-pink-500 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center">
                      <Star size={12} className="mr-1" />
                      {item.tag}
                    </div>
                    
                    {/* Titre */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black to-transparent">
                      <h3 className="text-xl font-bold">{item.title}</h3>
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <p className="text-gray-300 mb-4">{item.description}</p>
                    <button className="w-full bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg font-medium transition-colors">
                      Voir les détails
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
        
        <Footer />
      </div>
    </PageTransition>
  );
};

// Exporter le composant avec la vérification d'abonnement
export default WithSubscriptionCheck(PremiumContentExample);
