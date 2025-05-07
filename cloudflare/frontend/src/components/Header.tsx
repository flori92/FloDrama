import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Header.css';

const Header: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const navigate = useNavigate();

  // Détecter le défilement pour changer l'apparence du header
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <header className={`header ${isScrolled ? 'scrolled' : ''}`}>
      <div className="header-container">
        <div className="header-logo">
          <Link to="/" className="logo-link">
            <span className="logo-text flo-logo">FloDrama</span>
          </Link>
        </div>
        
        <nav className="header-nav">
          <ul className="nav-list">
            <li className="nav-item">
              <Link to="/" className="nav-link flo-link">Accueil</Link>
            </li>
            <li className="nav-item">
              <Link to="/films" className="nav-link flo-link">Films</Link>
            </li>
            <li className="nav-item">
              <Link to="/dramas" className="nav-link flo-link">Dramas</Link>
            </li>
            <li className="nav-item">
              <Link to="/animes" className="nav-link flo-link">Animes</Link>
            </li>
            <li className="nav-item">
              <Link to="/bollywood" className="nav-link flo-link">Bollywood</Link>
            </li>
            <li className="nav-item">
              <Link to="/ma-liste" className="nav-link flo-link">Ma Liste</Link>
            </li>
          </ul>
        </nav>
        
        <div className="header-actions">
          <form onSubmit={handleSearch} className="search-form">
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            <button type="submit" className="search-button">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </button>
          </form>
          
          <div className="user-menu">
            <button className="user-button">
              <div className="user-avatar flo-bg-gradient">
                <span>F</span>
              </div>
            </button>
            <div className="user-dropdown">
              <Link to="/diagnostic" className="dropdown-item">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
                Diagnostic
              </Link>
            </div>
          </div>
          
          <button className="mobile-menu-button" onClick={toggleMenu}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
        </div>
      </div>
      
      <div className={`mobile-menu ${isMenuOpen ? 'active' : ''}`}>
        <ul className="nav-list">
          <li className="nav-item">
            <Link to="/" className="nav-link flo-link">Accueil</Link>
          </li>
          <li className="nav-item">
            <Link to="/films" className="nav-link flo-link">Films</Link>
          </li>
          <li className="nav-item">
            <Link to="/dramas" className="nav-link flo-link">Dramas</Link>
          </li>
          <li className="nav-item">
            <Link to="/animes" className="nav-link flo-link">Animes</Link>
          </li>
          <li className="nav-item">
            <Link to="/bollywood" className="nav-link flo-link">Bollywood</Link>
          </li>
          <li className="nav-item">
            <Link to="/ma-liste" className="nav-link flo-link">Ma Liste</Link>
          </li>
          <li className="nav-item">
            <Link to="/diagnostic" className="nav-link flo-link">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '8px', verticalAlign: 'middle'}}>
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
              </svg>
              Diagnostic
            </Link>
          </li>
        </ul>
      </div>
    </header>
  );
};

export default Header;
