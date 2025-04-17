import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import './Header.css';

/**
 * Composant Header pour FloDrama
 * Implémente la navigation principale, la barre de recherche et les contrôles utilisateur
 */
const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const searchInputRef = useRef(null);
  const userMenuRef = useRef(null);

  // Items de navigation principaux
  const navItems = [
    { label: 'Accueil', path: '/' },
    { label: 'Dramas', path: '/dramas' },
    { label: 'Films', path: '/films' },
    { label: 'Nouveautés', path: '/nouveautes' },
    { label: 'Top 10', path: '/top10' }
  ];

  // Détecter le défilement pour modifier l'apparence du header
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fermer le menu utilisateur lorsqu'on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fermer le menu mobile lors du changement de page
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Gérer la soumission du formulaire de recherche
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    
    if (searchQuery.trim()) {
      navigate(`/recherche?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setIsSearchFocused(false);
      if (searchInputRef.current) {
        searchInputRef.current.blur();
      }
    }
  };

  return (
    <header className={`header ${isScrolled ? 'header-scrolled' : ''}`}>
      <div className="header-container">
        {/* Logo */}
        <Link to="/" className="header-logo-container">
          <img 
            src="/assets/logo/flodrama-logo.svg" 
            alt="FloDrama" 
            className="header-logo"
          />
        </Link>

        {/* Navigation principale - Desktop */}
        <nav className="header-nav desktop-nav">
          <ul className="header-nav-list">
            {navItems.map((item) => (
              <li key={item.path} className="header-nav-item">
                <Link 
                  to={item.path}
                  className={`header-nav-link ${location.pathname === item.path ? 'active' : ''}`}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Contrôles de droite */}
        <div className="header-controls">
          {/* Boutons de connexion/inscription */}
          <Link to="/connexion" className="header-auth-button connexion">
            Connexion
          </Link>
          <Link to="/inscription" className="header-auth-button inscription">
            Inscription
          </Link>

          {/* Bouton menu mobile */}
          <button 
            className={`header-mobile-menu-button ${isMobileMenuOpen ? 'active' : ''}`}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-expanded={isMobileMenuOpen}
            aria-label="Menu principal"
          >
            <span className="header-mobile-menu-bar"></span>
            <span className="header-mobile-menu-bar"></span>
            <span className="header-mobile-menu-bar"></span>
          </button>
        </div>
      </div>

      {/* Navigation mobile */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.nav
            className="header-mobile-nav"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <ul className="header-mobile-nav-list">
              {navItems.map((item) => (
                <li key={item.path} className="header-mobile-nav-item">
                  <Link 
                    to={item.path}
                    className={`header-mobile-nav-link ${location.pathname === item.path ? 'active' : ''}`}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
              <li className="header-mobile-nav-divider"></li>
              <li className="header-mobile-nav-item">
                <Link to="/connexion" className="header-mobile-nav-link">
                  Connexion
                </Link>
              </li>
              <li className="header-mobile-nav-item">
                <Link to="/inscription" className="header-mobile-nav-link">
                  Inscription
                </Link>
              </li>
            </ul>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;
