import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-top">
          <div className="footer-logo">
            <Link to="/" className="logo-link">
              <span className="logo-text flo-logo">FloDrama</span>
            </Link>
            <p className="tagline">Votre portail vers les meilleurs dramas et animes asiatiques</p>
          </div>
          
          <div className="footer-nav">
            <div className="footer-nav-column">
              <h3 className="footer-heading flo-section-title">Explorer</h3>
              <ul className="footer-links">
                <li><Link to="/dramas" className="flo-link">Dramas</Link></li>
                <li><Link to="/animes" className="flo-link">Animes</Link></li>
                <li><Link to="/films" className="flo-link">Films</Link></li>
                <li><Link to="/bollywood" className="flo-link">Bollywood</Link></li>
                <li><Link to="/nouveautes" className="flo-link">Nouveautés</Link></li>
              </ul>
            </div>
            
            <div className="footer-nav-column">
              <h3 className="footer-heading flo-section-title">Compte</h3>
              <ul className="footer-links">
                <li><Link to="/profile" className="flo-link">Mon Profil</Link></li>
                <li><Link to="/ma-liste" className="flo-link">Ma Liste</Link></li>
                <li><Link to="/historique" className="flo-link">Historique</Link></li>
                <li><Link to="/parametres" className="flo-link">Paramètres</Link></li>
                <li><Link to="/aide" className="flo-link">Aide</Link></li>
              </ul>
            </div>
            
            <div className="footer-nav-column">
              <h3 className="footer-heading flo-section-title">À propos</h3>
              <ul className="footer-links">
                <li><Link to="/a-propos" className="flo-link">À propos de nous</Link></li>
                <li><Link to="/contact" className="flo-link">Contact</Link></li>
                <li><Link to="/faq" className="flo-link">FAQ</Link></li>
                <li><Link to="/mentions-legales" className="flo-link">Mentions légales</Link></li>
                <li><Link to="/confidentialite" className="flo-link">Confidentialité</Link></li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="footer-bottom">
          <div className="social-links">
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="social-link flo-interactive">
              <span className="sr-only">Facebook</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
              </svg>
            </a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="social-link flo-interactive">
              <span className="sr-only">Twitter</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path>
              </svg>
            </a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="social-link flo-interactive">
              <span className="sr-only">Instagram</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
              </svg>
            </a>
            <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="social-link flo-interactive">
              <span className="sr-only">YouTube</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"></path>
                <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon>
              </svg>
            </a>
          </div>
          
          <div className="copyright">
            <p>&copy; {currentYear} FloDrama. Tous droits réservés.</p>
          </div>
          
          <div className="language-selector">
            <select name="language" id="language-select" className="flo-interactive">
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

export default Footer;
