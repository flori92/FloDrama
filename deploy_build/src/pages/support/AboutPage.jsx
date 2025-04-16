import React from 'react';
import { motion } from 'framer-motion';
import { Globe, Film, Heart, Users, Award } from 'lucide-react';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import PageTransition from '../../components/animations/PageTransition';

/**
 * Page À propos pour FloDrama
 * Présente l'histoire et la mission de la plateforme
 */
const AboutPage = () => {
  const features = [
    {
      icon: <Globe size={24} />,
      title: "Contenu international",
      description: "Des dramas et films asiatiques soigneusement sélectionnés, provenant de Corée, Chine, Japon, Thaïlande, et bien plus encore."
    },
    {
      icon: <Film size={24} />,
      title: "Qualité premium",
      description: "Streaming en haute définition avec sous-titres professionnels en français pour une expérience immersive."
    },
    {
      icon: <Heart size={24} />,
      title: "Passion authentique",
      description: "Une équipe passionnée qui sélectionne avec soin chaque titre pour vous offrir le meilleur du divertissement asiatique."
    },
    {
      icon: <Users size={24} />,
      title: "Communauté engagée",
      description: "Rejoignez des milliers de fans de dramas asiatiques et partagez vos découvertes et recommandations."
    },
    {
      icon: <Award size={24} />,
      title: "Exclusivités",
      description: "Des contenus exclusifs et des avant-premières disponibles uniquement sur FloDrama."
    }
  ];
  
  return (
    <PageTransition type="slide" direction="left">
      <div className="bg-gray-900 text-white min-h-screen">
        <Navbar />
        
        <div className="container mx-auto px-4 py-12 pt-24">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-5xl mx-auto"
          >
            <div className="flex items-center justify-center mb-10">
              <div className="bg-gray-800 p-6 rounded-lg shadow-lg inline-block">
                <div className="relative w-24 h-24 mx-auto">
                  <div className="absolute inset-0 bg-blue-500 rounded-lg opacity-20"></div>
                  <div className="absolute inset-2 bg-gray-700 rounded-lg flex items-center justify-center">
                    <div className="text-pink-500 text-5xl transform translate-x-1">▶</div>
                  </div>
                </div>
              </div>
            </div>
            
            <h1 className="text-4xl font-bold text-center mb-2 text-pink-500">FloDrama</h1>
            <h2 className="text-2xl font-semibold text-center mb-10 text-gray-300">
              Votre plateforme de streaming dédiée aux dramas asiatiques
            </h2>
            
            <div className="bg-gray-800 rounded-lg p-8 mb-12">
              <h3 className="text-2xl font-semibold mb-6">Notre histoire</h3>
              
              <div className="space-y-4 text-gray-300">
                <p>
                  FloDrama est né en 2025 de la passion d'une équipe de fans de dramas asiatiques qui souhaitaient créer une plateforme dédiée à ce type de contenu, offrant une expérience de visionnage optimale avec des sous-titres de qualité professionnelle.
                </p>
                
                <p>
                  Face à la popularité croissante des dramas asiatiques dans le monde entier, nous avons constaté un manque de plateformes spécialisées proposant une expérience utilisateur moderne et un catalogue diversifié. C'est ainsi que FloDrama a vu le jour, avec l'ambition de devenir la référence pour les amateurs de dramas et films asiatiques.
                </p>
                
                <p>
                  Aujourd'hui, FloDrama propose des milliers d'heures de contenu provenant de toute l'Asie : dramas coréens, chinois, japonais, films, productions Bollywood et animes. Notre équipe travaille sans relâche pour enrichir notre catalogue et améliorer constamment l'expérience utilisateur.
                </p>
              </div>
            </div>
            
            <div className="mb-12">
              <h3 className="text-2xl font-semibold mb-8 text-center">Ce qui nous distingue</h3>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {features.map((feature, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="bg-gray-800 p-6 rounded-lg"
                  >
                    <div className="w-12 h-12 mb-4 flex items-center justify-center bg-gray-700 rounded-full text-pink-500">
                      {feature.icon}
                    </div>
                    <h4 className="text-xl font-medium mb-2">{feature.title}</h4>
                    <p className="text-gray-300">{feature.description}</p>
                  </motion.div>
                ))}
              </div>
            </div>
            
            <div className="bg-gray-800 rounded-lg p-8 mb-12">
              <h3 className="text-2xl font-semibold mb-6">Notre mission</h3>
              
              <div className="space-y-4 text-gray-300">
                <p>
                  Notre mission est de promouvoir la richesse culturelle asiatique à travers ses productions audiovisuelles et de rendre ces contenus accessibles au public francophone. Nous croyons fermement que les dramas asiatiques offrent une perspective unique et des histoires captivantes qui méritent d'être découvertes par un public plus large.
                </p>
                
                <p>
                  Nous nous engageons à :
                </p>
                
                <ul className="list-disc pl-6 space-y-2">
                  <li>Proposer un catalogue diversifié et régulièrement mis à jour</li>
                  <li>Offrir des sous-titres de qualité professionnelle en français</li>
                  <li>Garantir une expérience utilisateur fluide et intuitive</li>
                  <li>Soutenir l'industrie créative asiatique en respectant les droits d'auteur</li>
                  <li>Créer une communauté passionnée autour des dramas asiatiques</li>
                </ul>
              </div>
            </div>
            
            <div className="text-center">
              <h3 className="text-2xl font-semibold mb-6">Rejoignez l'aventure FloDrama</h3>
              <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
                Que vous soyez un fan de longue date des dramas asiatiques ou simplement curieux de découvrir ce monde fascinant, FloDrama vous ouvre ses portes.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a 
                  href="/register" 
                  className="px-6 py-3 bg-pink-500 text-white rounded-md hover:bg-pink-600 transition-colors"
                >
                  S'inscrire gratuitement
                </a>
                <a 
                  href="/browse" 
                  className="px-6 py-3 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors"
                >
                  Explorer le catalogue
                </a>
              </div>
            </div>
          </motion.div>
        </div>
        
        <Footer />
      </div>
    </PageTransition>
  );
};

export default AboutPage;
