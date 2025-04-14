import React from 'react';
import { motion } from 'framer-motion';
import { Apple, Download, Smartphone, Tablet, Laptop, CheckCircle, Home, Search, Bookmark, User } from 'lucide-react';
import './AppDownload.css';

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
      icon: <Smartphone size={24} />, 
      title: "Streaming HD sur mobile et tablette", 
      description: "Profitez de vos contenus en haute définition sur tous vos appareils." 
    },
    { 
      icon: <Download size={24} />, 
      title: "Téléchargement pour visionnage hors ligne", 
      description: "Téléchargez vos dramas préférés pour les regarder sans connexion internet." 
    },
    { 
      icon: <CheckCircle size={24} />, 
      title: "Synchronisation de votre liste entre tous vos appareils", 
      description: "Retrouvez votre liste de visionnage sur tous vos appareils automatiquement." 
    },
    { 
      icon: <CheckCircle size={24} />, 
      title: "Notifications pour les nouveaux épisodes", 
      description: "Soyez alerté dès qu'un nouvel épisode de vos séries préférées est disponible." 
    },
    { 
      icon: <CheckCircle size={24} />, 
      title: "Interface optimisée pour le mobile", 
      description: "Une expérience utilisateur fluide et intuitive spécialement conçue pour les appareils mobiles." 
    }
  ];

  // Contenu du smartphone (correspondant à l'image)
  const phoneContent = [
    {
      id: 'crash-landing',
      title: 'Crash Landing on You',
      image: 'https://images.unsplash.com/photo-1616530940355-351fabd9524b?q=80&w=1935&auto=format&fit=crop',
      year: 2020,
      rating: 9.2
    },
    {
      id: 'solo-leveling',
      title: 'Solo Leveling',
      image: 'https://images.unsplash.com/photo-1578632292335-df3abbb0d586?q=80&w=1887&auto=format&fit=crop',
      year: 2023,
      rating: 8.9
    },
    {
      id: 'queen-of-tears',
      title: 'Queen of Tears',
      image: 'https://images.unsplash.com/photo-1581338834647-b0fb40704e21?q=80&w=1887&auto=format&fit=crop',
      year: 2024,
      rating: 9.1
    },
    {
      id: 'parasite',
      title: 'Parasite',
      image: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=1925&auto=format&fit=crop',
      year: 2019,
      rating: 9.5
    }
  ];

  return (
    <div className="app-download-page">
      <div className="app-container">
        {/* En-tête */}
        <motion.div 
          className="app-header"
          variants={itemVariants}
          initial="initial"
          animate="animate"
        >
          <h1 className="app-title">Application Mobile</h1>
          <p className="app-description">
            Profitez de FloDrama partout où vous allez avec notre application mobile.
            Regardez vos dramas, films et animés préférés sur votre smartphone ou
            tablette, même hors connexion grâce au téléchargement.
          </p>
        </motion.div>

        {/* Section principale avec smartphone et fonctionnalités */}
        <div className="app-main-section">
          {/* Colonne de gauche - Fonctionnalités */}
          <motion.div 
            className="app-features"
            variants={pageVariants}
            initial="initial"
            animate="animate"
          >
            <h2 className="features-title">Fonctionnalités</h2>
            <ul className="features-list">
              {appFeatures.map((feature, index) => (
                <motion.li 
                  key={index}
                  className="feature-item"
                  variants={itemVariants}
                >
                  <div className="feature-icon">
                    <span className="icon-wrapper">{feature.icon}</span>
                  </div>
                  <div className="feature-content">
                    <h3 className="feature-title">{feature.title}</h3>
                    <p className="feature-description">{feature.description}</p>
                  </div>
                </motion.li>
              ))}
            </ul>

            {/* Boutons de téléchargement */}
            <motion.div 
              className="download-buttons"
              variants={itemVariants}
            >
              <a href="#" className="download-button app-store">
                <div className="button-icon">
                  <Apple size={24} />
                </div>
                <div className="button-text">
                  <span className="button-label">Télécharger sur</span>
                  <span className="button-store">App Store</span>
                </div>
              </a>
              <a href="#" className="download-button google-play">
                <div className="button-icon">
                  <Smartphone size={24} />
                </div>
                <div className="button-text">
                  <span className="button-label">Télécharger sur</span>
                  <span className="button-store">Google Play</span>
                </div>
              </a>
            </motion.div>
          </motion.div>

          {/* Colonne de droite - Smartphone */}
          <motion.div 
            className="app-smartphone"
            variants={itemVariants}
            initial="initial"
            animate="animate"
          >
            <div className="smartphone-container">
              <div className="smartphone-frame">
                <div className="smartphone-header">
                  <div className="smartphone-notch"></div>
                </div>
                <div className="smartphone-content">
                  {/* Header du smartphone */}
                  <div className="phone-app-header">
                    <h3 className="phone-app-title">FloDrama</h3>
                  </div>
                  
                  {/* Section Tendances */}
                  <div className="phone-section">
                    <h4 className="phone-section-title">Tendances</h4>
                    <div className="phone-grid">
                      {phoneContent.map((item, index) => (
                        <div key={index} className="phone-card">
                          <div className="phone-card-image" style={{ backgroundImage: `url(${item.image})` }}>
                            <div className="phone-card-overlay"></div>
                          </div>
                          <div className="phone-card-title">{item.title}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Navigation du smartphone */}
                  <div className="phone-navigation">
                    <div className="nav-item active">
                      <Home size={20} />
                      <span>Accueil</span>
                    </div>
                    <div className="nav-item">
                      <Search size={20} />
                      <span>Recherche</span>
                    </div>
                    <div className="nav-item">
                      <Bookmark size={20} />
                      <span>Ma Liste</span>
                    </div>
                    <div className="nav-item">
                      <User size={20} />
                      <span>Profil</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default AppDownload;
