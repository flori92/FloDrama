import React from 'react';
import { motion } from 'framer-motion';
import { Apple, Smartphone, Tv, Laptop, Download, ArrowRight, Check } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import { getAssetUrl } from '../api/metadata';

/**
 * Page de téléchargement de l'application FloDrama
 * Permet aux utilisateurs de télécharger les versions iOS et Android
 */
const DownloadAppPage = () => {
  // Animation des éléments
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4 }
    }
  };
  
  // Fonctionnalités de l'application
  const features = [
    {
      icon: <Smartphone size={24} />,
      title: 'Application mobile',
      description: 'Profitez de FloDrama sur vos appareils mobiles iOS et Android'
    },
    {
      icon: <Tv size={24} />,
      title: 'Casting TV',
      description: 'Diffusez facilement vos dramas sur votre téléviseur'
    },
    {
      icon: <Download size={24} />,
      title: 'Téléchargement hors-ligne',
      description: 'Téléchargez vos épisodes pour les regarder sans connexion'
    },
    {
      icon: <Laptop size={24} />,
      title: 'Multi-plateforme',
      description: 'Synchronisez votre expérience sur tous vos appareils'
    }
  ];
  
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Navbar />
      
      <main className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        {/* En-tête */}
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-fuchsia-500 to-purple-600">
            FloDrama sur tous vos appareils
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Téléchargez l'application FloDrama pour profiter de vos dramas, films et animés préférés où que vous soyez.
          </p>
        </motion.div>
        
        {/* Section de téléchargement */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">
          {/* iOS */}
          <motion.div 
            className="bg-gray-800 rounded-2xl p-8 border border-gray-700 flex flex-col items-center"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="w-24 h-24 bg-gray-700 rounded-full flex items-center justify-center mb-6">
              <Apple size={48} className="text-white" />
            </div>
            <h2 className="text-2xl font-bold mb-2">FloDrama pour iOS</h2>
            <p className="text-gray-400 text-center mb-6">
              Disponible pour iPhone et iPad
            </p>
            <div className="mt-auto">
              <button 
                className="bg-fuchsia-600 hover:bg-fuchsia-700 text-white px-6 py-3 rounded-lg font-medium flex items-center transition-colors"
                onClick={() => alert("L'application iOS sera bientôt disponible !")}
              >
                <Apple size={20} className="mr-2" />
                Bientôt disponible
              </button>
            </div>
          </motion.div>
          
          {/* Android */}
          <motion.div 
            className="bg-gray-800 rounded-2xl p-8 border border-gray-700 flex flex-col items-center"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="w-24 h-24 bg-gray-700 rounded-full flex items-center justify-center mb-6">
              <Smartphone size={48} className="text-white" />
            </div>
            <h2 className="text-2xl font-bold mb-2">FloDrama pour Android</h2>
            <p className="text-gray-400 text-center mb-6">
              Compatible avec tous les appareils Android
            </p>
            <div className="mt-auto">
              <button 
                className="bg-fuchsia-600 hover:bg-fuchsia-700 text-white px-6 py-3 rounded-lg font-medium flex items-center transition-colors"
                onClick={() => alert("L'application Android sera bientôt disponible !")}
              >
                <Smartphone size={20} className="mr-2" />
                Bientôt disponible
              </button>
            </div>
          </motion.div>
        </div>
        
        {/* Fonctionnalités */}
        <motion.div 
          className="mb-20"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <h2 className="text-3xl font-bold mb-10 text-center">Fonctionnalités de l'application</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div 
                key={index}
                className="bg-gray-800 rounded-xl p-6 border border-gray-700"
                variants={itemVariants}
              >
                <div className="w-12 h-12 bg-fuchsia-600 rounded-lg flex items-center justify-center mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
        
        {/* Casting TV */}
        <motion.div 
          className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-2xl p-8 mb-20"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <div className="flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 mb-8 md:mb-0 md:pr-8">
              <h2 className="text-3xl font-bold mb-4">Profitez de FloDrama sur grand écran</h2>
              <p className="text-gray-300 mb-6">
                L'application FloDrama est compatible avec Chromecast et AirPlay, vous permettant de diffuser facilement vos contenus préférés sur votre téléviseur.
              </p>
              <ul className="space-y-3">
                {['Chromecast', 'AirPlay', 'Smart TV', 'Android TV'].map((item, index) => (
                  <li key={index} className="flex items-center">
                    <div className="w-6 h-6 bg-fuchsia-600 rounded-full flex items-center justify-center mr-3">
                      <Check size={14} />
                    </div>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <button className="mt-8 bg-fuchsia-600 hover:bg-fuchsia-700 text-white px-6 py-3 rounded-lg font-medium flex items-center transition-colors">
                En savoir plus
                <ArrowRight size={18} className="ml-2" />
              </button>
            </div>
            <div className="md:w-1/2 flex justify-center">
              <img 
                src={getAssetUrl('images/tv-casting.png')} 
                alt="Casting TV" 
                className="rounded-lg max-w-full h-auto shadow-2xl"
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/500x300?text=TV+Casting';
                }}
              />
            </div>
          </div>
        </motion.div>
        
        {/* Notification */}
        <motion.div 
          className="bg-gray-800 rounded-xl p-6 border border-gray-700 text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.6 }}
        >
          <h3 className="text-xl font-semibold mb-4">Soyez informé du lancement</h3>
          <p className="text-gray-400 mb-6">
            Inscrivez-vous pour être notifié dès que les applications FloDrama seront disponibles au téléchargement.
          </p>
          <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <input
              type="email"
              placeholder="Votre adresse email"
              className="bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
            />
            <button className="bg-fuchsia-600 hover:bg-fuchsia-700 text-white px-6 py-3 rounded-lg font-medium transition-colors">
              M'inscrire
            </button>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default DownloadAppPage;
