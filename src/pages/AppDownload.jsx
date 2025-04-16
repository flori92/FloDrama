import React from 'react';
import { motion } from 'framer-motion';
import { Apple, Download, Smartphone, Tablet, Laptop, CheckCircle } from 'lucide-react';

/**
 * Page de téléchargement des applications mobiles FloDrama
 */
const AppDownload = () => {
  // Animation variants
  const pageVariants = {
    initial: { opacity: 0 },
    animate: { 
      opacity: 1,
      transition: { 
        duration: 0.5,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    initial: { y: 20, opacity: 0 },
    animate: { 
      y: 0, 
      opacity: 1,
      transition: { duration: 0.5 }
    }
  };

  // Fonctionnalités des applications
  const appFeatures = [
    { 
      icon: <Download size={24} />, 
      title: "Téléchargement hors-ligne", 
      description: "Téléchargez vos dramas préférés pour les regarder sans connexion internet." 
    },
    { 
      icon: <Smartphone size={24} />, 
      title: "Interface optimisée", 
      description: "Une expérience utilisateur fluide et intuitive sur tous les appareils." 
    },
    { 
      icon: <CheckCircle size={24} />, 
      title: "Qualité HD & 4K", 
      description: "Profitez de vos contenus en haute définition selon votre abonnement." 
    }
  ];

  // Appareils compatibles
  const compatibleDevices = [
    { icon: <Smartphone size={24} />, name: "Smartphones" },
    { icon: <Tablet size={24} />, name: "Tablettes" },
    { icon: <Laptop size={24} />, name: "Smart TV" }
  ];

  return (
    <motion.div 
      className="pt-24 pb-16 bg-gray-900 min-h-screen"
      variants={pageVariants}
      initial="initial"
      animate="animate"
    >
      <div className="container mx-auto px-4">
        {/* En-tête */}
        <motion.div 
          className="text-center mb-16"
          variants={itemVariants}
        >
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            FloDrama <span className="text-pink-500">Mobile</span>
          </h1>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Emportez vos dramas préférés partout avec vous grâce à nos applications mobiles pour iOS et Android.
          </p>
        </motion.div>

        {/* Section de téléchargement */}
        <motion.div 
          className="flex flex-col md:flex-row justify-center items-center gap-8 mb-20"
          variants={itemVariants}
        >
          {/* iOS */}
          <motion.div 
            className="bg-gray-800 rounded-xl p-8 w-full md:w-1/2 max-w-md flex flex-col items-center text-center"
            whileHover={{ y: -5, transition: { duration: 0.2 } }}
          >
            <div className="bg-black w-20 h-20 rounded-full flex items-center justify-center mb-6">
              <Apple size={40} className="text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">iOS</h2>
            <p className="text-gray-400 mb-6">
              Disponible sur iPhone et iPad
            </p>
            <a 
              href="https://apps.apple.com/fr/app/flodrama" 
              target="_blank" 
              rel="noopener noreferrer"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center"
            >
              <Apple size={20} className="mr-2" />
              Télécharger sur l'App Store
            </a>
            <p className="text-gray-500 text-sm mt-4">
              Compatible iOS 14.0 ou supérieur
            </p>
          </motion.div>

          {/* Android */}
          <motion.div 
            className="bg-gray-900 p-8 rounded-xl shadow-2xl"
            variants={itemVariants}
            whileHover={{ y: -5, transition: { duration: 0.2 } }}
          >
            <div className="bg-black w-20 h-20 rounded-full flex items-center justify-center mb-6">
              <Smartphone size={40} className="text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Android</h2>
            <p className="text-gray-400 mb-6">
              Profitez de FloDrama sur votre appareil Android
            </p>
            <a 
              href="https://play.google.com/store/apps/details?id=com.flodrama.app" 
              target="_blank" 
              rel="noopener noreferrer"
              className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center"
            >
              <Smartphone size={20} className="mr-2" />
              Télécharger sur Google Play
            </a>
          </motion.div>
        </motion.div>

        {/* Fonctionnalités */}
        <motion.div 
          className="mb-20"
          variants={itemVariants}
        >
          <h2 className="text-3xl font-bold text-white text-center mb-10">
            Fonctionnalités exclusives
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {appFeatures.map((feature, index) => (
              <motion.div 
                key={index}
                className="bg-gray-800 rounded-lg p-6"
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
              >
                <div className="text-pink-500 mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-400">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Appareils compatibles */}
        <motion.div 
          className="text-center"
          variants={itemVariants}
        >
          <h2 className="text-3xl font-bold text-white mb-10">
            Appareils compatibles
          </h2>
          <div className="flex flex-wrap justify-center gap-8">
            {compatibleDevices.map((device, index) => (
              <div key={index} className="flex flex-col items-center">
                <div className="bg-gray-800 w-16 h-16 rounded-full flex items-center justify-center mb-3">
                  <div className="text-pink-500">
                    {device.icon}
                  </div>
                </div>
                <p className="text-white">{device.name}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div 
          className="mt-20 text-center"
          variants={itemVariants}
        >
          <h2 className="text-2xl font-bold text-white mb-6">
            Prêt à emporter FloDrama partout avec vous ?
          </h2>
          <p className="text-gray-400 mb-8 max-w-2xl mx-auto">
            Téléchargez notre application dès maintenant et profitez de votre premier mois d'abonnement Ultimate offert.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <a 
              href="https://apps.apple.com/fr/app/flodrama" 
              target="_blank" 
              rel="noopener noreferrer"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center"
            >
              <Apple size={20} className="mr-2" />
              App Store
            </a>
            <a 
              href="https://play.google.com/store/apps/details?id=com.flodrama.app" 
              target="_blank" 
              rel="noopener noreferrer"
              className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center"
            >
              <Smartphone size={20} className="mr-2" />
              Google Play
            </a>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default AppDownload;
