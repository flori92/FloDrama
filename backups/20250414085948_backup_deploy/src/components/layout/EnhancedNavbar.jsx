import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './EnhancedNavbar.css';

/**
 * Barre de navigation améliorée pour FloDrama
 * Avec animation de transparence au défilement et menu responsive
 */
const EnhancedNavbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const location = useLocation();

  // Détecter le défilement pour changer l'apparence de la navbar
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      if (scrollPosition > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Gérer la soumission du formulaire de recherche
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/recherche?q=${encodeURIComponent(searchQuery)}`;
      setSearchQuery('');
    }
  };

  // Vérifier si un lien est actif
  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <nav className={`enhanced-navbar ${isScrolled ? 'scrolled' : ''}`}>
      <div className="navbar-container">
        <div className="navbar-left">
          <Link to="/" className="navbar-logo">
            <img src="/assets/icons/logo.svg" alt="FloDrama" />
          </Link>
          <div className={`navbar-links ${isMenuOpen ? 'active' : ''}`}>
            <Link to="/" className={isActive('/') ? 'active' : ''}>
              Accueil
            </Link>
            <Link to="/dramas" className={isActive('/dramas') ? 'active' : ''}>
              Dramas
            </Link>
            <Link to="/films" className={isActive('/films') ? 'active' : ''}>
              Films
            </Link>
            <Link to="/nouveautes" className={isActive('/nouveautes') ? 'active' : ''}>
              Nouveautés
            </Link>
            <Link to="/ma-liste" className={isActive('/ma-liste') ? 'active' : ''}>
              Ma Liste
            </Link>
          </div>
        </div>

        <div className="navbar-right">
          <form onSubmit={handleSearchSubmit} className="search-form">
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            <button type="submit" className="search-button">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
                <path fill="none" d="M0 0h24v24H0z"/>
                <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" fill="currentColor"/>
              </svg>
            </button>
          </form>

          <Link to="/profil" className="profile-link">
            <div className="profile-avatar">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
                <path fill="none" d="M0 0h24v24H0z"/>
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" fill="currentColor"/>
              </svg>
            </div>
          </Link>

          <button 
            className="menu-toggle" 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default EnhancedNavbar;
