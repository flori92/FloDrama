// Nouveau Footer issu de 'A faire/Footer (1).tsx'
import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Facebook, Twitter, Instagram, ArrowRight } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-black text-white pt-10 pb-6 px-4 mt-8 border-t border-white/30">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* À propos */}
          <div>
            <h3 className="text-lg font-medium mb-4 relative inline-block group">
              À propos de FloDrama
              <span className="absolute left-0 bottom-0 w-0 h-0.5 bg-gradient-to-r from-blue-500 to-fuchsia-500 group-hover:w-full transition-all duration-300"></span>
            </h3>
            <ul className="space-y-3">
              <FooterLink to="/about">À propos</FooterLink>
              <FooterLink to="/careers">Emplois</FooterLink>
              <FooterLink to="/contact">Contact</FooterLink>
            </ul>
          </div>
          
          {/* Regarder */}
          <div>
            <h3 className="text-lg font-medium mb-4 relative inline-block group">
              Regarder
              <span className="absolute left-0 bottom-0 w-0 h-0.5 bg-gradient-to-r from-blue-500 to-fuchsia-500 group-hover:w-full transition-all duration-300"></span>
            </h3>
            <ul className="space-y-3">
              <FooterLink to="/category/dramas">Dramas</FooterLink>
              <FooterLink to="/category/movies">Films</FooterLink>
              <FooterLink to="/category/anime">Animés</FooterLink>
              <FooterLink to="/category/bollywood">Bollywood</FooterLink>
              <FooterLink to="/app">App</FooterLink>
              <FooterLink to="/watchparty">WatchParty</FooterLink>
            </ul>
          </div>
          
          {/* Assistance */}
          <div>
            <h3 className="text-lg font-medium mb-4 relative inline-block group">
              Assistance
              <span className="absolute left-0 bottom-0 w-0 h-0.5 bg-gradient-to-r from-blue-500 to-fuchsia-500 group-hover:w-full transition-all duration-300"></span>
            </h3>
            <ul className="space-y-3">
              <FooterLink to="/faq">FAQ</FooterLink>
              <FooterLink to="/support">Appareils compatibles</FooterLink>
              <FooterLink to="/privacy">Confidentialité</FooterLink>
            </ul>
          </div>
          
          {/* Légal */}
          <div>
            <h3 className="text-lg font-medium mb-4 relative inline-block group">
              Légal
              <span className="absolute left-0 bottom-0 w-0 h-0.5 bg-gradient-to-r from-blue-500 to-fuchsia-500 group-hover:w-full transition-all duration-300"></span>
            </h3>
            <ul className="space-y-3">
              <FooterLink to="/terms">Conditions d'utilisation</FooterLink>
              <FooterLink to="/privacy-policy">Politique de confidentialité</FooterLink>
              <FooterLink to="/cookie-preferences">Préférences de cookies</FooterLink>
            </ul>
          </div>
        </div>
        
        {/* Réseaux sociaux */}
        <div className="mt-10 pt-6 border-t border-white/10 flex flex-col md:flex-row justify-between items-center">
          <p className="text-white/60 text-sm mb-4 md:mb-0">
            &copy; {new Date().getFullYear()} FloDrama. Tous droits réservés.
          </p>
          
          <div className="flex space-x-4">
            <motion.a 
              href="https://facebook.com" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="p-2 rounded-full border border-white/30 text-white hover:bg-gradient-to-r hover:from-blue-500 hover:to-fuchsia-500 transition-all duration-200"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <Facebook className="w-5 h-5" />
            </motion.a>
            <motion.a 
              href="https://twitter.com" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="p-2 rounded-full border border-white/30 text-white hover:bg-gradient-to-r hover:from-blue-500 hover:to-fuchsia-500 transition-all duration-200"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <Twitter className="w-5 h-5" />
            </motion.a>
            <motion.a 
              href="https://instagram.com" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="p-2 rounded-full border border-white/30 text-white hover:bg-gradient-to-r hover:from-blue-500 hover:to-fuchsia-500 transition-all duration-200"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <Instagram className="w-5 h-5" />
            </motion.a>
          </div>
        </div>
      </div>
    </footer>
  );
};

// Composant lien de pied de page réutilisable avec animation
const FooterLink: React.FC<{ to: string; children: React.ReactNode }> = ({ to, children }) => {
  return (
    <li>
      <motion.div whileHover={{ x: 5 }} className="inline-block">
        <NavLink 
          to={to} 
          className={({ isActive }) => 
            `group flex items-center transition-colors duration-200 ${
              isActive 
                ? 'text-white bg-gradient-to-r from-blue-500 to-fuchsia-500 bg-clip-text text-transparent' 
                : 'text-white/60 hover:text-white'
            }`
          }
        >
          <span>{children}</span>
          <ArrowRight className="w-0 h-4 ml-0 opacity-0 group-hover:w-4 group-hover:ml-1 group-hover:opacity-100 transition-all duration-200" />
        </NavLink>
      </motion.div>
    </li>
  );
};

export default Footer;