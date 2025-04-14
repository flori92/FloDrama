import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Bell, User, Menu, X, ChevronDown, Info, HelpCircle, Mail, Code, FileText, Shield, CreditCard, Download, Smartphone, Film, Tv, Home, Bookmark } from 'lucide-react';

/**
 * Barre de navigation principale de FloDrama
 * Version améliorée avec thème sombre et effets de survol
 */
const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSupportMenuOpen, setIsSupportMenuOpen] = useState(false);
  const location = useLocation();
  
  // Détecter le défilement pour changer l'apparence de la navbar
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  // Fermer le menu mobile lors du changement de route
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsSupportMenuOpen(false);
  }, [location]);
  
  // Liens de navigation avec icônes
  const navLinks = [
    { name: 'Accueil', path: '/home', icon: <Home size={16} /> },
    { name: 'Dramas', path: '/category/dramas', icon: <Tv size={16} /> },
    { name: 'Films', path: '/category/movies', icon: <Film size={16} /> },
    { name: 'Anime', path: '/category/animes', icon: <Tv size={16} /> },
    { name: 'Explorer', path: '/search', icon: <Search size={16} /> },
    { name: 'Ma Liste', path: '/watchlist', icon: <Bookmark size={16} /> }
  ];

  // Liens du menu support
  const supportLinks = [
    { name: 'À propos', path: '/support/about', icon: <Info size={16} /> },
    { name: 'FAQ', path: '/support/faq', icon: <HelpCircle size={16} /> },
    { name: 'Aide', path: '/support/help', icon: <HelpCircle size={16} /> },
    { name: 'Contact', path: '/support/contact', icon: <Mail size={16} /> },
    { name: 'Technologies', path: '/support/technologies', icon: <Code size={16} /> },
    { name: 'Conditions d\'utilisation', path: '/support/terms', icon: <FileText size={16} /> },
    { name: 'Politique de confidentialité', path: '/support/privacy', icon: <Shield size={16} /> },
    { name: 'Abonnements', path: '/subscription', icon: <CreditCard size={16} /> },
    { name: 'Mon compte', path: '/account', icon: <User size={16} /> },
    { name: 'Télécharger l\'application', path: '/download', icon: <Download size={16} /> }
  ];

  // Animations
  const navbarVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.5,
        ease: "easeOut" 
      }
    }
  };

  const linkVariants = {
    hover: { 
      scale: 1.05,
      transition: { duration: 0.2 }
    }
  };

  const mobileMenuVariants = {
    hidden: { opacity: 0, height: 0, overflow: 'hidden' },
    visible: { 
      opacity: 1, 
      height: 'auto',
      transition: { 
        duration: 0.3,
        staggerChildren: 0.05,
        delayChildren: 0.1
      }
    },
    exit: { 
      opacity: 0, 
      height: 0,
      transition: { 
        duration: 0.3,
        when: "afterChildren",
        staggerChildren: 0.05,
        staggerDirection: -1
      }
    }
  };

  const mobileItemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: { duration: 0.2 }
    },
    exit: { 
      opacity: 0, 
      x: -20,
      transition: { duration: 0.2 }
    }
  };

  const dropdownVariants = {
    hidden: { opacity: 0, y: -5, height: 0, transition: { duration: 0.2 } },
    visible: { opacity: 1, y: 0, height: 'auto', transition: { duration: 0.3 } }
  };

  // Effet de glassmorphism pour la navbar
  const getNavbarBackground = () => {
    if (isScrolled) {
      return {
        backgroundColor: 'var(--color-background)',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
      };
    }
    return {
      background: 'linear-gradient(to bottom, rgba(18, 17, 24, 0.9) 0%, rgba(18, 17, 24, 0) 100%)'
    };
  };

  return (
    <motion.nav 
      className="fixed w-full z-50 px-6 py-4 transition-all duration-300"
      initial="hidden"
      animate="visible"
      variants={navbarVariants}
      style={getNavbarBackground()}
    >
      <div className="flex items-center justify-between">
        {/* Logo et liens de navigation */}
        <div className="flex items-center space-x-8">
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="flex items-center"
          >
            <img 
              src="/assets/logo/flodrama-logo.svg" 
              alt="FloDrama Logo" 
              className="h-8 w-8 mr-2" 
            />
            <Link to="/" className="text-3xl font-bold" style={{ color: 'var(--color-accent)' }}>
              FloDrama
            </Link>
          </motion.div>
          
          {/* Liens de navigation (desktop) */}
          <div className="hidden md:flex space-x-6">
            {navLinks.map((link) => (
              <motion.div
                key={link.path}
                variants={linkVariants}
                whileHover="hover"
              >
                <Link 
                  to={link.path} 
                  className="nav-link flex items-center relative group"
                  style={{ 
                    color: location.pathname === link.path ? 'var(--color-accent)' : 'var(--color-text-primary)'
                  }}
                >
                  <span className="mr-1.5">{link.icon}</span>
                  <span>{link.name}</span>
                  
                  {/* Indicateur de lien actif */}
                  <span 
                    className={`absolute -bottom-1 left-0 h-0.5 bg-current transition-all duration-300 ${
                      location.pathname === link.path ? 'w-full' : 'w-0 group-hover:w-full'
                    }`}
                    style={{ backgroundColor: 'var(--color-accent)' }}
                  />
                </Link>
              </motion.div>
            ))}
            
            {/* Menu déroulant Support */}
            <div className="relative">
              <motion.button
                className="nav-link flex items-center relative group"
                onClick={() => setIsSupportMenuOpen(!isSupportMenuOpen)}
                style={{ 
                  color: location.pathname.includes('/support') ? 'var(--color-accent)' : 'var(--color-text-primary)'
                }}
                whileHover="hover"
                variants={linkVariants}
              >
                <span>Support</span>
                <ChevronDown
                  size={16}
                  className={`ml-1 transition-transform duration-300 ${isSupportMenuOpen ? 'rotate-180' : ''}`}
                />
                
                {/* Indicateur de lien actif */}
                <span 
                  className={`absolute -bottom-1 left-0 h-0.5 transition-all duration-300 ${
                    location.pathname.includes('/support') ? 'w-full' : 'w-0 group-hover:w-full'
                  }`}
                  style={{ backgroundColor: 'var(--color-accent)' }}
                />
              </motion.button>
              
              <AnimatePresence>
                {isSupportMenuOpen && (
                  <motion.div
                    className="absolute right-0 mt-2 w-56 rounded-lg shadow-lg overflow-hidden z-50"
                    variants={dropdownVariants}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    style={{ 
                      backgroundColor: 'var(--color-background-secondary)',
                      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
                      border: '1px solid rgba(255, 255, 255, 0.05)'
                    }}
                  >
                    <div className="py-1">
                      {supportLinks.map((link) => (
                        <Link
                          key={link.path}
                          to={link.path}
                          className="flex items-center px-4 py-2 text-sm transition-all hover:bg-opacity-20 group"
                          style={{ 
                            color: location.pathname === link.path ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                            backgroundColor: location.pathname === link.path ? 'rgba(var(--color-accent-rgb), 0.1)' : 'transparent'
                          }}
                        >
                          <span 
                            className="mr-2 transition-transform duration-300 group-hover:scale-110"
                            style={{ color: location.pathname === link.path ? 'var(--color-accent)' : 'var(--color-text-secondary)' }}
                          >
                            {link.icon}
                          </span>
                          <span className="transition-transform duration-300 group-hover:translate-x-1">
                            {link.name}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
        
        {/* Icônes de droite */}
        <div className="flex items-center space-x-4">
          <motion.div 
            whileHover={{ scale: 1.1 }} 
            whileTap={{ scale: 0.9 }}
            className="relative group"
          >
            <Link to="/search" className="nav-link flex items-center justify-center w-8 h-8 rounded-full transition-all duration-300 group-hover:bg-opacity-10">
              <Search 
                size={20} 
                className="transition-all duration-300"
                style={{ color: 'var(--color-text-primary)' }}
              />
            </Link>
            <span className="absolute -bottom-5 left-1/2 transform -translate-x-1/2 text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap" style={{ color: 'var(--color-text-secondary)' }}>
              Rechercher
            </span>
          </motion.div>
          
          <motion.div 
            whileHover={{ scale: 1.1 }} 
            whileTap={{ scale: 0.9 }}
            className="relative group"
          >
            <Link to="/notifications" className="nav-link flex items-center justify-center w-8 h-8 rounded-full transition-all duration-300 group-hover:bg-opacity-10">
              <Bell 
                size={20} 
                className="transition-all duration-300"
                style={{ color: 'var(--color-text-primary)' }}
              />
            </Link>
            <span className="absolute -bottom-5 left-1/2 transform -translate-x-1/2 text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap" style={{ color: 'var(--color-text-secondary)' }}>
              Notifications
            </span>
          </motion.div>
          
          <motion.div 
            whileHover={{ scale: 1.1 }} 
            whileTap={{ scale: 0.9 }}
            className="relative group"
          >
            <Link to="/account" className="nav-link flex items-center justify-center w-8 h-8 rounded-full transition-all duration-300 group-hover:bg-opacity-10">
              <User 
                size={20} 
                className="transition-all duration-300"
                style={{ color: 'var(--color-text-primary)' }}
              />
            </Link>
            <span className="absolute -bottom-5 left-1/2 transform -translate-x-1/2 text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap" style={{ color: 'var(--color-text-secondary)' }}>
              Compte
            </span>
          </motion.div>
          
          {/* Bouton menu mobile */}
          <motion.button 
            className="md:hidden flex items-center justify-center w-8 h-8 rounded-full transition-all duration-300"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            style={{ 
              color: isMobileMenuOpen ? 'var(--color-accent)' : 'var(--color-text-primary)',
              backgroundColor: isMobileMenuOpen ? 'rgba(var(--color-accent-rgb), 0.1)' : 'transparent'
            }}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </motion.button>
        </div>
      </div>
      
      {/* Menu mobile avec animation */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            className="md:hidden mt-4 rounded-lg p-4 overflow-hidden"
            variants={mobileMenuVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            style={{ 
              backgroundColor: 'var(--color-background-secondary)',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(255, 255, 255, 0.05)'
            }}
          >
            <div className="flex flex-col space-y-3">
              {navLinks.map((link) => (
                <motion.div
                  key={link.path}
                  variants={mobileItemVariants}
                >
                  <Link 
                    to={link.path} 
                    className="nav-link flex items-center py-2 px-3 rounded-md transition-all hover:bg-opacity-10"
                    style={{ 
                      color: location.pathname === link.path ? 'var(--color-accent)' : 'var(--color-text-primary)',
                      backgroundColor: location.pathname === link.path ? 'rgba(var(--color-accent-rgb), 0.1)' : 'transparent'
                    }}
                  >
                    <span className="mr-2">{link.icon}</span>
                    {link.name}
                  </Link>
                </motion.div>
              ))}
              
              {/* Section Support dans le menu mobile */}
              <motion.div variants={mobileItemVariants}>
                <button
                  className="nav-link flex items-center justify-between w-full px-3 py-2 rounded-md text-base font-medium transition-all hover:bg-opacity-10"
                  onClick={() => setIsSupportMenuOpen(!isSupportMenuOpen)}
                  style={{ 
                    color: location.pathname.includes('/support') ? 'var(--color-accent)' : 'var(--color-text-primary)',
                    backgroundColor: location.pathname.includes('/support') ? 'rgba(var(--color-accent-rgb), 0.1)' : 'transparent'
                  }}
                >
                  <span>Support</span>
                  <ChevronDown
                    size={16}
                    className={`transition-transform duration-300 ${isSupportMenuOpen ? 'rotate-180' : ''}`}
                  />
                </button>
                
                <AnimatePresence>
                  {isSupportMenuOpen && (
                    <motion.div
                      className="pl-4 mt-1 space-y-1"
                      variants={dropdownVariants}
                      initial="hidden"
                      animate="visible"
                      exit="hidden"
                    >
                      {supportLinks.map((link) => (
                        <motion.div key={link.path} variants={mobileItemVariants}>
                          <Link
                            to={link.path}
                            className="flex items-center px-3 py-2 rounded-md text-sm font-medium transition-all hover:bg-opacity-10"
                            style={{ 
                              color: location.pathname === link.path ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                              backgroundColor: location.pathname === link.path ? 'rgba(var(--color-accent-rgb), 0.1)' : 'transparent'
                            }}
                          >
                            <span className="mr-2">{link.icon}</span>
                            {link.name}
                          </Link>
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default Navbar;
