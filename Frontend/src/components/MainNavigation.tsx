import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import SearchBar from './SearchBar';
import NotificationBell from './NotificationBell';
import '../styles/MainNavigation.css';

interface MainNavigationProps {
  userId: string;
  token: string;
}

const MainNavigation: React.FC<MainNavigationProps> = ({ userId, token }) => {
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isScrolled, setIsScrolled] = useState<boolean>(false);
  const navigate = useNavigate();
  
  const { scrollY } = useScroll();
  const navBackground = useTransform(
    scrollY,
    [0, 100],
    ['rgba(0, 0, 0, 0)', 'rgba(0, 0, 0, 0.9)']
  );

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSearchStart = () => {
    // Actions à effectuer au début de la recherche
    console.log('Recherche en cours...');
  };

  const handleSearchComplete = (results: any[]) => {
    setSearchResults(results);
    console.log(`${results.length} résultats trouvés`);
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <motion.nav 
      className={`main-navigation ${isScrolled ? 'scrolled' : ''}`}
      style={{ backgroundColor: navBackground }}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="nav-container">
        <div className="nav-left">
          <Link to="/" className="nav-logo">
            <motion.div 
              className="logo-text"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              FloDrama
            </motion.div>
          </Link>
          
          <div className={`nav-links ${isMenuOpen ? 'active' : ''}`}>
            <Link to="/dramas" className="nav-link">Dramas</Link>
            <Link to="/anime" className="nav-link">Anime</Link>
            <Link to="/bollywood" className="nav-link">Bollywood</Link>
            <Link to="/films" className="nav-link">Films</Link>
            <Link to="/nouveautes" className="nav-link">Nouveautés</Link>
          </div>
        </div>
        
        <div className="nav-right">
          <div className="search-container">
            <SearchBar 
              userId={userId}
              onSearchStart={handleSearchStart}
              onSearchComplete={handleSearchComplete}
            />
          </div>
          
          <div className="notification-container">
            <NotificationBell userId={userId} token={token} />
          </div>
          
          <Link to="/profile" className="profile-link">
            <motion.div 
              className="profile-avatar"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <span>👤</span>
            </motion.div>
          </Link>
          
          <button 
            className="mobile-menu-button"
            onClick={toggleMenu}
            aria-label="Menu"
          >
            <span className={`menu-icon ${isMenuOpen ? 'open' : ''}`}></span>
          </button>
        </div>
      </div>
      
      {/* Menu mobile */}
      <motion.div 
        className={`mobile-menu ${isMenuOpen ? 'open' : ''}`}
        initial={false}
        animate={isMenuOpen ? { height: 'auto', opacity: 1 } : { height: 0, opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Link to="/dramas" className="mobile-nav-link" onClick={() => setIsMenuOpen(false)}>Dramas</Link>
        <Link to="/anime" className="mobile-nav-link" onClick={() => setIsMenuOpen(false)}>Anime</Link>
        <Link to="/bollywood" className="mobile-nav-link" onClick={() => setIsMenuOpen(false)}>Bollywood</Link>
        <Link to="/films" className="mobile-nav-link" onClick={() => setIsMenuOpen(false)}>Films</Link>
        <Link to="/nouveautes" className="mobile-nav-link" onClick={() => setIsMenuOpen(false)}>Nouveautés</Link>
        <Link to="/profile" className="mobile-nav-link" onClick={() => setIsMenuOpen(false)}>Profil</Link>
      </motion.div>
    </motion.nav>
  );
};

export default MainNavigation;
