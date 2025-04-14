import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Facebook, 
  Twitter, 
  Instagram, 
  Youtube, 
  Heart, 
  ExternalLink,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

/**
 * Composant Footer amélioré avec thème sombre et disclaimer légal
 * Inspiré du design de CinePulse
 */
const Footer = () => {
  const [showLegalInfo, setShowLegalInfo] = useState(false);

  const currentYear = new Date().getFullYear();
  
  // Animation pour les liens
  const linkHoverVariants = {
    initial: { x: 0 },
    hover: { x: 5, transition: { duration: 0.2 } }
  };
  
  // Animation pour les icônes sociales
  const socialIconVariants = {
    initial: { scale: 1 },
    hover: { scale: 1.2, transition: { duration: 0.2 } }
  };
  
  // Animation pour le disclaimer
  const disclaimerVariants = {
    closed: { height: 0, opacity: 0 },
    open: { height: 'auto', opacity: 1, transition: { duration: 0.3 } }
  };

  return (
    <footer className="relative pt-16 pb-8" style={{ backgroundColor: 'var(--color-background-darker)' }}>
      {/* Séparateur supérieur avec effet de glassmorphism */}
      <div 
        className="absolute top-0 left-0 right-0 h-px"
        style={{ 
          background: 'linear-gradient(90deg, rgba(var(--color-accent-rgb), 0) 0%, rgba(var(--color-accent-rgb), 0.5) 50%, rgba(var(--color-accent-rgb), 0) 100%)',
          boxShadow: '0 0 10px rgba(var(--color-accent-rgb), 0.3)'
        }}
      />
      
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Logo et description */}
          <div className="col-span-1 lg:col-span-1">
            <Link to="/" className="block mb-4">
              <img 
                src="/assets/logo.png" 
                alt="FloDrama" 
                className="h-10"
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/160x40/121118/ffffff?text=FloDrama';
                }}
              />
            </Link>
            <p className="mb-4" style={{ color: 'var(--color-text-secondary)' }}>
              FloDrama est votre plateforme de streaming dédiée aux dramas, films et séries du monde entier, avec une attention particulière pour le cinéma français.
            </p>
            <div className="flex space-x-4">
              <motion.a 
                href="https://facebook.com" 
                target="_blank" 
                rel="noopener noreferrer"
                variants={socialIconVariants}
                initial="initial"
                whileHover="hover"
                className="social-icon"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                <Facebook size={20} />
              </motion.a>
              <motion.a 
                href="https://twitter.com" 
                target="_blank" 
                rel="noopener noreferrer"
                variants={socialIconVariants}
                initial="initial"
                whileHover="hover"
                className="social-icon"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                <Twitter size={20} />
              </motion.a>
              <motion.a 
                href="https://instagram.com" 
                target="_blank" 
                rel="noopener noreferrer"
                variants={socialIconVariants}
                initial="initial"
                whileHover="hover"
                className="social-icon"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                <Instagram size={20} />
              </motion.a>
              <motion.a 
                href="https://youtube.com" 
                target="_blank" 
                rel="noopener noreferrer"
                variants={socialIconVariants}
                initial="initial"
                whileHover="hover"
                className="social-icon"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                <Youtube size={20} />
              </motion.a>
            </div>
          </div>
          
          {/* Navigation */}
          <div>
            <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>Navigation</h3>
            <ul className="space-y-2">
              {[
                { name: 'Accueil', path: '/' },
                { name: 'Films', path: '/movies' },
                { name: 'Séries', path: '/series' },
                { name: 'Dramas', path: '/dramas' },
                { name: 'Cinéma Français', path: '/french-cinema' }
              ].map((item, index) => (
                <li key={index}>
                  <motion.div
                    variants={linkHoverVariants}
                    initial="initial"
                    whileHover="hover"
                  >
                    <Link 
                      to={item.path}
                      className="footer-link flex items-center"
                      style={{ color: 'var(--color-text-secondary)' }}
                    >
                      {item.name}
                    </Link>
                  </motion.div>
                </li>
              ))}
            </ul>
          </div>
          
          {/* Catégories */}
          <div>
            <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>Catégories</h3>
            <ul className="space-y-2">
              {[
                { name: 'Action', path: '/category/action' },
                { name: 'Comédie', path: '/category/comedy' },
                { name: 'Romance', path: '/category/romance' },
                { name: 'Thriller', path: '/category/thriller' },
                { name: 'Documentaire', path: '/category/documentary' }
              ].map((item, index) => (
                <li key={index}>
                  <motion.div
                    variants={linkHoverVariants}
                    initial="initial"
                    whileHover="hover"
                  >
                    <Link 
                      to={item.path}
                      className="footer-link flex items-center"
                      style={{ color: 'var(--color-text-secondary)' }}
                    >
                      {item.name}
                    </Link>
                  </motion.div>
                </li>
              ))}
            </ul>
          </div>
          
          {/* Support */}
          <div>
            <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>Support</h3>
            <ul className="space-y-2">
              {[
                { name: 'FAQ', path: '/faq' },
                { name: 'Contact', path: '/contact' },
                { name: 'Conditions d\'utilisation', path: '/terms' },
                { name: 'Politique de confidentialité', path: '/privacy' },
                { name: 'À propos', path: '/about' }
              ].map((item, index) => (
                <li key={index}>
                  <motion.div
                    variants={linkHoverVariants}
                    initial="initial"
                    whileHover="hover"
                  >
                    <Link 
                      to={item.path}
                      className="footer-link flex items-center"
                      style={{ color: 'var(--color-text-secondary)' }}
                    >
                      {item.name}
                    </Link>
                  </motion.div>
                </li>
              ))}
            </ul>
          </div>
        </div>
        
        {/* Disclaimer légal avec animation */}
        <div className="mb-8">
          <motion.button
            onClick={() => setShowLegalInfo(!showLegalInfo)}
            className="flex items-center justify-between w-full p-4 rounded-lg mb-2"
            style={{ 
              backgroundColor: 'rgba(var(--color-accent-rgb), 0.1)',
              color: 'var(--color-text-primary)'
            }}
            whileHover={{ backgroundColor: 'rgba(var(--color-accent-rgb), 0.15)' }}
          >
            <span className="font-semibold">Informations légales importantes</span>
            {showLegalInfo ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </motion.button>
          
          <motion.div
            variants={disclaimerVariants}
            initial="closed"
            animate={showLegalInfo ? "open" : "closed"}
            className="overflow-hidden"
          >
            <div 
              className="p-6 rounded-lg"
              style={{ 
                backgroundColor: 'rgba(var(--color-background-lighter-rgb), 0.05)',
                color: 'var(--color-text-secondary)',
                border: '1px solid rgba(var(--color-accent-rgb), 0.1)'
              }}
            >
              <h4 className="font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>Disclaimer légal</h4>
              <p className="mb-3 text-sm">
                FloDrama est une plateforme de démonstration à but éducatif et n'héberge aucun contenu protégé par des droits d'auteur. Tous les contenus référencés sont fournis par des services tiers légitimes et nous ne sommes pas responsables de leur disponibilité ou de leur contenu.
              </p>
              <p className="mb-3 text-sm">
                Les noms, images et descriptions des films et séries sont utilisés uniquement à des fins d'identification dans le cadre de cette démonstration technique. Tous les droits appartiennent à leurs propriétaires respectifs.
              </p>
              <p className="mb-3 text-sm">
                L'utilisation de cette plateforme implique l'acceptation de nos conditions d'utilisation et de notre politique de confidentialité. FloDrama se réserve le droit de modifier ces conditions à tout moment sans préavis.
              </p>
              <p className="text-sm">
                Pour toute question concernant les droits d'auteur ou pour signaler un contenu inapproprié, veuillez nous contacter à l'adresse <a href="mailto:legal@flodrama.com" className="underline" style={{ color: 'var(--color-accent)' }}>legal@flodrama.com</a>.
              </p>
            </div>
          </motion.div>
        </div>
        
        {/* Copyright et mentions légales */}
        <div className="border-t pt-6" style={{ borderColor: 'rgba(var(--color-text-secondary-rgb), 0.1)' }}>
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm mb-4 md:mb-0" style={{ color: 'var(--color-text-secondary)' }}>
              &copy; {currentYear} FloDrama. Tous droits réservés.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <a 
                href="https://cinepulse.fr" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm flex items-center"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                CinePulse <ExternalLink size={14} className="ml-1" />
              </a>
              <a 
                href="https://xalaflix.io" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm flex items-center"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                XalaFlix <ExternalLink size={14} className="ml-1" />
              </a>
              <span className="text-sm flex items-center" style={{ color: 'var(--color-text-secondary)' }}>
                Fait avec <Heart size={14} className="mx-1" style={{ color: 'var(--color-accent)' }} /> en France
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
