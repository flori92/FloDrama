import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Bell, User, Menu, X, ChevronDown, Info, HelpCircle, Mail, Code, FileText, Shield, CreditCard, Download } from 'lucide-react';

/**
 * Barre de navigation principale de FloDrama
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
  
  // Liens de navigation
  const navLinks = [
    { name: 'Accueil', path: '/' },
    { name: 'Dramas', path: '/dramas' },
    { name: 'Films', path: '/movies' },
    { name: 'Bollywood', path: '/bollywood' },
    { name: 'Anime', path: '/anime' },
    { name: 'Catégories', path: '/categories' }
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
      color: "#FF00FF", // text-pink-500
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

  return (
    <motion.nav 
      className={`fixed w-full z-50 px-6 py-4 transition-all duration-300 ${
        isScrolled ? 'bg-gray-900' : 'bg-gradient-to-b from-black to-transparent'
      }`}
      initial="hidden"
      animate="visible"
      variants={navbarVariants}
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
            <Link to="/" className="text-3xl font-bold text-pink-500">FloDrama</Link>
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
                  className={`transition-colors ${
                    location.pathname === link.path ? 'text-pink-500' : 'text-white'
                  }`}
                >
                  {link.name}
                </Link>
              </motion.div>
            ))}
            
            {/* Menu déroulant Support */}
            <div className="relative">
              <button
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center ${
                  location.pathname.includes('/support')
                    ? 'text-pink-500'
                    : 'text-white hover:text-pink-500 hover:bg-gray-800'
                }`}
                onClick={() => setIsSupportMenuOpen(!isSupportMenuOpen)}
              >
                Support
                <ChevronDown
                  size={16}
                  className={`ml-1 transition-transform ${isSupportMenuOpen ? 'rotate-180' : ''}`}
                />
              </button>
              
              <AnimatePresence>
                {isSupportMenuOpen && (
                  <motion.div
                    className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-gray-800 ring-1 ring-black ring-opacity-5 overflow-hidden z-50"
                    variants={dropdownVariants}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                  >
                    <div className="py-1">
                      {supportLinks.map((link) => (
                        <Link
                          key={link.path}
                          to={link.path}
                          className={`flex items-center px-4 py-2 text-sm ${
                            location.pathname === link.path
                              ? 'bg-gray-700 text-pink-500'
                              : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                          }`}
                        >
                          <span className="mr-2">{link.icon}</span>
                          {link.name}
                        </Link>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
        
        {/* Boutons d'action */}
        <div className="flex items-center space-x-4">
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link 
              to="/download"
              className="hidden md:flex items-center bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white px-4 py-2 rounded-lg font-medium text-sm"
            >
              <Download size={16} className="mr-2" />
              Télécharger
            </Link>
          </motion.div>
          
          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
            <Link to="/search" className="text-white hover:text-pink-500 transition-colors">
              <Search size={20} />
            </Link>
          </motion.div>
          
          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
            <Link to="/notifications" className="text-white hover:text-pink-500 transition-colors">
              <Bell size={20} />
            </Link>
          </motion.div>
          
          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
            <Link to="/profile" className="text-white hover:text-pink-500 transition-colors">
              <User size={20} />
            </Link>
          </motion.div>
          
          {/* Bouton menu mobile */}
          <motion.button 
            className="md:hidden text-white hover:text-pink-500 transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </motion.button>
        </div>
      </div>
      
      {/* Menu mobile avec animation */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            className="md:hidden mt-4 bg-gray-900 rounded-lg p-4 overflow-hidden"
            variants={mobileMenuVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <div className="flex flex-col space-y-3">
              {navLinks.map((link) => (
                <motion.div
                  key={link.path}
                  variants={mobileItemVariants}
                >
                  <Link 
                    to={link.path} 
                    className={`block hover:text-pink-500 transition-colors py-2 ${
                      location.pathname === link.path ? 'text-pink-500' : 'text-white'
                    }`}
                  >
                    {link.name}
                  </Link>
                </motion.div>
              ))}
              
              {/* Section Support dans le menu mobile */}
              <motion.div variants={mobileItemVariants}>
                <button
                  className={`flex items-center justify-between w-full px-3 py-2 rounded-md text-base font-medium ${
                    location.pathname.includes('/support')
                      ? 'text-pink-500'
                      : 'text-white hover:text-pink-500 hover:bg-gray-800'
                  }`}
                  onClick={() => setIsSupportMenuOpen(!isSupportMenuOpen)}
                >
                  <span>Support</span>
                  <ChevronDown
                    size={16}
                    className={`transition-transform ${isSupportMenuOpen ? 'rotate-180' : ''}`}
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
                            className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${
                              location.pathname === link.path
                                ? 'bg-gray-700 text-pink-500'
                                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                            }`}
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
