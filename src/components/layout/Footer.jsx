import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import './Footer.css';

/**
 * Composant Footer pour FloDrama
 * Implémente le pied de page avec les liens, informations légales et réseaux sociaux
 */
const Footer = () => {
  const [showLegalInfo, setShowLegalInfo] = useState(false);
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="footer">
      <div className="footer-separator"></div>
      
      <div className="footer-container">
        <div className="footer-content">
          {/* Logo et description */}
          <div className="footer-brand">
            <Link to="/" className="footer-logo-link">
              <img 
                src="/assets/logo/flodrama-logo.svg" 
                alt="FloDrama" 
                className="footer-logo"
                onError={(e) => {
                  e.target.src = '/assets/logo/flodrama-logo-fallback.png';
                }}
              />
            </Link>
            <p className="footer-description">
              FloDrama est votre plateforme de streaming dédiée aux dramas, films et séries asiatiques, avec une attention particulière pour les productions coréennes, japonaises et chinoises.
            </p>
            <div className="footer-social">
              <a 
                href="https://facebook.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="footer-social-link"
                aria-label="Facebook"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                </svg>
              </a>
              <a 
                href="https://twitter.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="footer-social-link"
                aria-label="Twitter"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
                </svg>
              </a>
              <a 
                href="https://instagram.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="footer-social-link"
                aria-label="Instagram"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                </svg>
              </a>
              <a 
                href="https://youtube.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="footer-social-link"
                aria-label="YouTube"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"></path>
                  <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon>
                </svg>
              </a>
            </div>
          </div>
          
          {/* Liens de navigation */}
          <div className="footer-links-section">
            <h3 className="footer-heading">Navigation</h3>
            <ul className="footer-links">
              <li className="footer-link-item">
                <Link to="/" className="footer-link">Accueil</Link>
              </li>
              <li className="footer-link-item">
                <Link to="/dramas" className="footer-link">Dramas</Link>
              </li>
              <li className="footer-link-item">
                <Link to="/film" className="footer-link">Film</Link>
              </li>
              <li className="footer-link-item">
                <Link to="/bollywood" className="footer-link">Bollywood</Link>
              </li>
              <li className="footer-link-item">
                <Link to="/anime" className="footer-link">Animé</Link>
              </li>
              <li className="footer-link-item">
                <Link to="/app" className="footer-link">App</Link>
              </li>
            </ul>
          </div>
          
          {/* Catégories */}
          <div className="footer-links-section">
            <h3 className="footer-heading">Genres</h3>
            <ul className="footer-links">
              <li className="footer-link-item">
                <Link to="/categories/romance" className="footer-link">Romance</Link>
              </li>
              <li className="footer-link-item">
                <Link to="/categories/action" className="footer-link">Action</Link>
              </li>
              <li className="footer-link-item">
                <Link to="/categories/comedie" className="footer-link">Comédie</Link>
              </li>
              <li className="footer-link-item">
                <Link to="/categories/thriller" className="footer-link">Thriller</Link>
              </li>
              <li className="footer-link-item">
                <Link to="/categories/fantastique" className="footer-link">Fantastique</Link>
              </li>
              <li className="footer-link-item">
                <Link to="/categories/historique" className="footer-link">Historique</Link>
              </li>
            </ul>
          </div>
          
          {/* Aide et support */}
          <div className="footer-links-section">
            <h3 className="footer-heading">Aide et support</h3>
            <ul className="footer-links">
              <li className="footer-link-item">
                <Link to="/faq" className="footer-link">FAQ</Link>
              </li>
              <li className="footer-link-item">
                <Link to="/contact" className="footer-link">Contact</Link>
              </li>
              <li className="footer-link-item">
                <Link to="/compte" className="footer-link">Mon compte</Link>
              </li>
              <li className="footer-link-item">
                <Link to="/recommandations" className="footer-link">
                  Recommandations
                </Link>
              </li>
              <li className="footer-link-item">
                <Link to="/parametres" className="footer-link">Paramètres</Link>
              </li>
            </ul>
          </div>
        </div>
        
        {/* Disclaimer légal */}
        <button 
          className="footer-disclaimer-button"
          onClick={() => setShowLegalInfo(!showLegalInfo)}
          aria-expanded={showLegalInfo}
        >
          <span className="footer-disclaimer-button-text">Informations légales importantes</span>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
            {showLegalInfo ? (
              <polyline points="18 15 12 9 6 15"></polyline>
            ) : (
              <polyline points="6 9 12 15 18 9"></polyline>
            )}
          </svg>
        </button>
        
        <AnimatePresence>
          {showLegalInfo && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="footer-disclaimer-wrapper"
            >
              <div className="footer-disclaimer-content">
                <h4 className="footer-disclaimer-title">Disclaimer légal</h4>
                <p className="footer-disclaimer-text">
                  FloDrama est une plateforme de démonstration à but éducatif et n'héberge aucun contenu protégé par des droits d'auteur. Tous les contenus référencés sont fournis par des services tiers légitimes et nous ne sommes pas responsables de leur disponibilité ou de leur contenu.
                </p>
                <p className="footer-disclaimer-text">
                  Les noms, images et descriptions des films et séries sont utilisés uniquement à des fins d'identification dans le cadre de cette démonstration technique. Tous les droits appartiennent à leurs propriétaires respectifs.
                </p>
                <p className="footer-disclaimer-text">
                  L'utilisation de cette plateforme implique l'acceptation de nos conditions d'utilisation et de notre politique de confidentialité. FloDrama se réserve le droit de modifier ces conditions à tout moment sans préavis.
                </p>
                <p className="footer-disclaimer-text">
                  Pour toute question concernant les droits d'auteur ou pour signaler un contenu inapproprié, veuillez nous contacter à l'adresse <a href="mailto:legal@flodrama.com">legal@flodrama.com</a>.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Copyright et mentions légales */}
        <div className="footer-bottom">
          <p className="footer-copyright">
            &copy; {currentYear} FloDrama. Tous droits réservés.
          </p>
          <div className="footer-bottom-links">
            <Link to="/conditions-utilisation" className="footer-bottom-link">
              Conditions d'utilisation
            </Link>
            <Link to="/confidentialite" className="footer-bottom-link">
              Politique de confidentialité
            </Link>
            <Link to="/cookies" className="footer-bottom-link">
              Cookies
            </Link>
            <span className="footer-made-with">
              Fait avec 
              <svg className="footer-heart" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
              </svg>
              en France
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
