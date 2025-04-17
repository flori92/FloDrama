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
    { label: 'Film', path: '/film' },
    { label: 'Bollywood', path: '/bollywood' },
    { label: 'Animé', path: '/anime' },
    { label: 'App', path: '/app' }
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
            src="/assets/logo.svg" 
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
          {/* Barre de recherche */}
          <form 
            className={`header-search-form ${isSearchFocused ? 'focused' : ''}`}
            onSubmit={handleSearchSubmit}
          >
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              className="header-search-input"
            />
            <button type="submit" className="header-search-button">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </button>
          </form>

          {/* Bouton Ma Liste */}
          <Link to="/ma-liste" className="header-my-list-button">
            Ma Liste
          </Link>

          {/* Menu utilisateur */}
          <div className="header-user-menu-container" ref={userMenuRef}>
            <button 
              className="header-user-button"
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              aria-expanded={isUserMenuOpen}
              aria-label="Menu utilisateur"
            >
              <div className="header-user-avatar">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              </div>
              <svg className={`header-user-chevron ${isUserMenuOpen ? 'open' : ''}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>

            <AnimatePresence>
              {isUserMenuOpen && (
                <motion.div
                  className="header-user-dropdown"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <ul className="header-user-menu-list">
                    <li className="header-user-menu-item">
                      <Link to="/profil" className="header-user-menu-link">
                        Mon profil
                      </Link>
                    </li>
                    <li className="header-user-menu-item">
                      <Link to="/parametres" className="header-user-menu-link">
                        Paramètres
                      </Link>
                    </li>
                    <li className="header-user-menu-item">
                      <Link to="/recommandations" className="header-user-menu-link">
                        Recommandations
                      </Link>
                    </li>
                    <li className="header-user-menu-divider"></li>
                    <li className="header-user-menu-item">
                      <button className="header-user-menu-button">
                        Déconnexion
                      </button>
                    </li>
                  </ul>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

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
              <li className="header-mobile-nav-item">
                <Link to="/ma-liste" className="header-mobile-nav-link">
                  Ma Liste
                </Link>
              </li>
              <li className="header-mobile-nav-divider"></li>
              <li className="header-mobile-nav-item">
                <Link to="/profil" className="header-mobile-nav-link">
                  Mon profil
                </Link>
              </li>
              <li className="header-mobile-nav-item">
                <Link to="/parametres" className="header-mobile-nav-link">
                  Paramètres
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
