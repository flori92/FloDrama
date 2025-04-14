import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Facebook, Twitter, Instagram, Youtube, Mail, Heart } from 'lucide-react';

/**
 * Pied de page de l'application FloDrama
 * Affiche les liens de navigation, les réseaux sociaux et les informations légales
 */
const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  const footerLinks = [
    {
      title: 'Navigation',
      links: [
        { name: 'Accueil', path: '/' },
        { name: 'Dramas', path: '/dramas' },
        { name: 'Films', path: '/movies' },
        { name: 'Recherche', path: '/search' },
        { name: 'Abonnements', path: '/subscription' }
      ]
    },
    {
      title: 'Support',
      links: [
        { name: 'À propos', path: '/support/about' },
        { name: 'FAQ', path: '/support/faq' },
        { name: 'Contact', path: '/support/contact' },
        { name: 'Aide', path: '/support/help' },
        { name: 'Technologies', path: '/support/technologies' },
        { name: 'Signaler un problème', path: '/report' }
      ]
    },
    {
      title: 'Légal',
      links: [
        { name: 'Conditions d\'utilisation', path: '/support/terms' },
        { name: 'Politique de confidentialité', path: '/support/privacy' },
        { name: 'Cookies', path: '/legal/cookies' },
        { name: 'RGPD', path: '/legal/gdpr' }
      ]
    }
  ];
  
  const socialLinks = [
    { name: 'Facebook', icon: <Facebook size={20} />, url: 'https://facebook.com/flodrama' },
    { name: 'Twitter', icon: <Twitter size={20} />, url: 'https://twitter.com/flodrama' },
    { name: 'Instagram', icon: <Instagram size={20} />, url: 'https://instagram.com/flodrama' },
    { name: 'YouTube', icon: <Youtube size={20} />, url: 'https://youtube.com/flodrama' },
    { name: 'Email', icon: <Mail size={20} />, url: 'mailto:hotline@flodrama.com' }
  ];
  
  return (
    <motion.footer 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="bg-gray-800 text-gray-300 pt-12 pb-6"
    >
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between mb-10">
          {/* Logo et description */}
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="mb-8 md:mb-0 md:w-1/3"
          >
            <div className="flex items-center mb-4">
              <div className="mr-3 bg-gray-700 p-2 rounded">
                <div className="relative w-8 h-8">
                  <div className="absolute inset-0 bg-blue-500 rounded opacity-20"></div>
                  <div className="absolute inset-1 bg-gray-600 rounded flex items-center justify-center">
                    <div className="text-pink-500 text-lg transform translate-x-0.5">▶</div>
                  </div>
                </div>
              </div>
              <h2 className="text-xl font-bold text-white">FloDrama</h2>
            </div>
            <p className="text-sm text-gray-400 mb-4">
              Votre plateforme de streaming dédiée aux dramas asiatiques, films, Bollywood et animes. 
              Découvrez des histoires captivantes du monde entier.
            </p>
            <div className="flex space-x-3">
              {socialLinks.map((social, index) => (
                <motion.a 
                  key={index}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-gray-700 p-2 rounded-full text-gray-300 hover:bg-pink-500 hover:text-white transition-colors"
                  whileHover={{ scale: 1.1 }}
                  aria-label={social.name}
                >
                  {social.icon}
                </motion.a>
              ))}
            </div>
          </motion.div>
          
          {/* Liens de navigation */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-8 md:w-2/3">
            {footerLinks.map((section, index) => (
              <motion.div 
                key={index}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <h3 className="text-white font-semibold mb-4">{section.title}</h3>
                <ul className="space-y-2">
                  {section.links.map((link, linkIndex) => (
                    <li key={linkIndex}>
                      <Link 
                        to={link.path}
                        className="text-gray-400 hover:text-pink-500 transition-colors text-sm"
                      >
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
        
        {/* Barre de séparation */}
        <motion.div 
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.7, delay: 0.5 }}
          className="border-t border-gray-700 mb-6 pt-6"
        >
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-gray-500 mb-4 md:mb-0">
              &copy; {currentYear} FloDrama. Tous droits réservés.
            </p>
            <p className="text-sm text-gray-500 flex items-center">
              Conçu avec <Heart size={14} className="mx-1 text-pink-500" /> en France
            </p>
          </div>
        </motion.div>
      </div>
    </motion.footer>
  );
};

export default Footer;
