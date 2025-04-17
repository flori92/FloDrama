import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Youtube, Mail, Heart, ChevronUp } from 'lucide-react';
import './EnhancedFooter.css';

/**
 * Pied de page amélioré pour FloDrama
 * Contient les liens utiles, les réseaux sociaux et les informations légales
 * Design moderne et responsive
 */
const EnhancedFooter = () => {
  // Année actuelle pour le copyright
  const currentYear = new Date().getFullYear();
  
  // Liens du pied de page
  const footerLinks = [
    {
      title: 'FloDrama',
      links: [
        { label: 'À propos', path: '/about' },
        { label: 'Nous contacter', path: '/contact' },
        { label: 'Carrières', path: '/careers' },
        { label: 'Blog', path: '/blog' }
      ]
    },
    {
      title: 'Aide',
      links: [
        { label: 'FAQ', path: '/faq' },
        { label: 'Appareils compatibles', path: '/devices' },
        { label: 'Conditions d\'utilisation', path: '/terms' },
        { label: 'Confidentialité', path: '/privacy' }
      ]
    },
    {
      title: 'Contenu',
      links: [
        { label: 'Dramas', path: '/dramas' },
        { label: 'Films', path: '/films' },
        { label: 'Anime', path: '/anime' },
        { label: 'Nouveautés', path: '/nouveautes' }
      ]
    }
  ];
  
  // Réseaux sociaux
  const socialLinks = [
    { icon: <Facebook size={20} />, label: 'Facebook', url: 'https://facebook.com/flodrama' },
    { icon: <Twitter size={20} />, label: 'Twitter', url: 'https://twitter.com/flodrama' },
    { icon: <Instagram size={20} />, label: 'Instagram', url: 'https://instagram.com/flodrama' },
    { icon: <Youtube size={20} />, label: 'YouTube', url: 'https://youtube.com/flodrama' }
  ];
  
  // Fonction pour remonter en haut de la page
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };
  
  return (
    <footer className="enhanced-footer">
      {/* Bouton pour remonter en haut de la page */}
      <button 
        className="scroll-to-top-button"
        onClick={scrollToTop}
        aria-label="Remonter en haut de la page"
      >
        <ChevronUp size={24} />
      </button>
      
      <div className="footer-container">
        {/* Logo et description */}
        <div className="footer-brand">
          <Link to="/" className="footer-logo">
            <img src="/assets/logo.svg" alt="FloDrama" />
          </Link>
          <p className="footer-tagline">
            La meilleure plateforme de streaming pour les dramas et films asiatiques.
          </p>
          
          {/* Réseaux sociaux */}
          <div className="footer-social">
            {socialLinks.map((social, index) => (
              <a
                key={`social-${index}`}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                className="social-link"
                aria-label={social.label}
              >
                {social.icon}
              </a>
            ))}
          </div>
        </div>
        
        {/* Liens */}
        <div className="footer-links-container">
          {footerLinks.map((section, index) => (
            <div key={`section-${index}`} className="footer-links-section">
              <h3 className="footer-links-title">{section.title}</h3>
              <ul className="footer-links-list">
                {section.links.map((link, linkIndex) => (
                  <li key={`link-${linkIndex}`} className="footer-link-item">
                    <Link to={link.path} className="footer-link">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          
          {/* Newsletter */}
          <div className="footer-links-section">
            <h3 className="footer-links-title">Newsletter</h3>
            <p className="footer-newsletter-text">
              Inscrivez-vous pour recevoir les dernières actualités et offres spéciales.
            </p>
            <form className="footer-newsletter-form">
              <input
                type="email"
                placeholder="Votre email"
                className="footer-newsletter-input"
                aria-label="Adresse email pour la newsletter"
              />
              <button
                type="submit"
                className="footer-newsletter-button"
                aria-label="S'inscrire à la newsletter"
              >
                <Mail size={18} />
              </button>
            </form>
          </div>
        </div>
      </div>
      
      {/* Barre de bas de page */}
      <div className="footer-bottom">
        <div className="footer-bottom-container">
          <p className="footer-copyright">
            &copy; {currentYear} FloDrama. Tous droits réservés.
          </p>
          <p className="footer-made-with">
            Fait avec <Heart size={14} className="heart-icon" /> en France
          </p>
          <div className="footer-language-selector">
            <select aria-label="Sélectionner la langue">
              <option value="fr">Français</option>
              <option value="en">English</option>
              <option value="ko">한국어</option>
              <option value="ja">日本語</option>
              <option value="zh">中文</option>
            </select>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default EnhancedFooter;
