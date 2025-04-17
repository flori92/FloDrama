import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Bell, User, ChevronDown, Menu, X } from 'lucide-react';

/**
 * En-tête amélioré pour FloDrama
 * Inclut la navigation, la recherche et les fonctionnalités utilisateur
 */
const EnhancedHeader = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  
  // Navigation principale
  const navItems = [
    { label: 'Accueil', path: '/' },
    { label: 'Dramas', path: '/dramas' },
    { label: 'Films', path: '/films' },
    { label: 'Anime', path: '/anime' },
    { label: 'Ma Liste', path: '/ma-liste' }
  ];
  
  // Détecter le défilement pour changer l'apparence de l'en-tête
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    
    window.addEventListener('scroll', handleScroll);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);
  
  // Gérer la soumission de la recherche
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchOpen(false);
      setSearchQuery('');
    }
  };
  
  // Fermer le menu mobile lors du changement de page
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);
  
  return (
    <header
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        padding: '15px 40px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        transition: 'background-color 0.3s ease',
        backgroundColor: isScrolled ? 'rgba(20, 20, 20, 0.95)' : 'transparent',
        boxShadow: isScrolled ? '0 2px 10px rgba(0, 0, 0, 0.3)' : 'none'
      }}
    >
      {/* Logo et navigation principale */}
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {/* Logo */}
        <Link to="/" style={{ marginRight: '30px', textDecoration: 'none' }}>
          <h1
            style={{
              margin: 0,
              fontSize: '28px',
              fontWeight: 'bold',
              color: '#E50914',
              textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)'
            }}
          >
            FloDrama
          </h1>
        </Link>
        
        {/* Navigation sur desktop */}
        <nav
          style={{
            display: 'none',
            '@media (min-width: 768px)': {
              display: 'flex'
            }
          }}
        >
          <ul
            style={{
              display: 'flex',
              listStyle: 'none',
              margin: 0,
              padding: 0,
              gap: '20px'
            }}
          >
            {navItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  style={{
                    color: 'white',
                    textDecoration: 'none',
                    fontSize: '16px',
                    fontWeight: location.pathname === item.path ? 'bold' : 'normal',
                    opacity: location.pathname === item.path ? 1 : 0.8,
                    transition: 'opacity 0.2s ease'
                  }}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        
        {/* Bouton du menu mobile */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          style={{
            background: 'none',
            border: 'none',
            color: 'white',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            '@media (min-width: 768px)': {
              display: 'none'
            }
          }}
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>
      
      {/* Actions utilisateur */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        {/* Recherche */}
        <div style={{ position: 'relative' }}>
          <AnimatePresence>
            {isSearchOpen ? (
              <motion.form
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: '250px', opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                onSubmit={handleSearchSubmit}
                style={{ display: 'flex', alignItems: 'center' }}
              >
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher..."
                  autoFocus
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    backgroundColor: 'rgba(0, 0, 0, 0.6)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    borderRadius: '4px',
                    color: 'white',
                    fontSize: '14px'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setIsSearchOpen(false)}
                  style={{
                    position: 'absolute',
                    right: '8px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'white',
                    cursor: 'pointer',
                    padding: '0'
                  }}
                >
                  <X size={16} />
                </button>
              </motion.form>
            ) : (
              <button
                onClick={() => setIsSearchOpen(true)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'white',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <Search size={24} />
              </button>
            )}
          </AnimatePresence>
        </div>
        
        {/* Notifications */}
        <button
          style={{
            background: 'none',
            border: 'none',
            color: 'white',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            position: 'relative'
          }}
        >
          <Bell size={24} />
          <span
            style={{
              position: 'absolute',
              top: '-5px',
              right: '-5px',
              width: '16px',
              height: '16px',
              borderRadius: '50%',
              backgroundColor: '#E50914',
              fontSize: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            3
          </span>
        </button>
        
        {/* Profil utilisateur */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            style={{
              background: 'none',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '4px',
                backgroundColor: '#E50914',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <User size={20} />
            </div>
            <ChevronDown size={16} />
          </button>
          
          {/* Menu du profil */}
          <AnimatePresence>
            {isProfileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                style={{
                  position: 'absolute',
                  top: '45px',
                  right: '0',
                  width: '200px',
                  backgroundColor: 'rgba(20, 20, 20, 0.95)',
                  borderRadius: '4px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
                  zIndex: 1000
                }}
              >
                <ul
                  style={{
                    listStyle: 'none',
                    margin: 0,
                    padding: '8px 0'
                  }}
                >
                  <li>
                    <Link
                      to="/profile"
                      style={{
                        display: 'block',
                        padding: '10px 16px',
                        color: 'white',
                        textDecoration: 'none',
                        fontSize: '14px'
                      }}
                    >
                      Mon profil
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/settings"
                      style={{
                        display: 'block',
                        padding: '10px 16px',
                        color: 'white',
                        textDecoration: 'none',
                        fontSize: '14px'
                      }}
                    >
                      Paramètres
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/help"
                      style={{
                        display: 'block',
                        padding: '10px 16px',
                        color: 'white',
                        textDecoration: 'none',
                        fontSize: '14px'
                      }}
                    >
                      Aide
                    </Link>
                  </li>
                  <li style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', marginTop: '8px' }}>
                    <button
                      onClick={() => {
                        // Logique de déconnexion
                        setIsProfileMenuOpen(false);
                      }}
                      style={{
                        display: 'block',
                        width: '100%',
                        textAlign: 'left',
                        padding: '10px 16px',
                        color: 'white',
                        backgroundColor: 'transparent',
                        border: 'none',
                        fontSize: '14px',
                        cursor: 'pointer'
                      }}
                    >
                      Déconnexion
                    </button>
                  </li>
                </ul>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      
      {/* Menu mobile */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            style={{
              position: 'absolute',
              top: '70px',
              left: 0,
              right: 0,
              backgroundColor: 'rgba(20, 20, 20, 0.95)',
              zIndex: 999,
              overflow: 'hidden'
            }}
          >
            <nav style={{ padding: '20px' }}>
              <ul
                style={{
                  listStyle: 'none',
                  margin: 0,
                  padding: 0
                }}
              >
                {navItems.map((item) => (
                  <li key={item.path} style={{ marginBottom: '15px' }}>
                    <Link
                      to={item.path}
                      style={{
                        color: 'white',
                        textDecoration: 'none',
                        fontSize: '18px',
                        fontWeight: location.pathname === item.path ? 'bold' : 'normal',
                        opacity: location.pathname === item.path ? 1 : 0.8
                      }}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default EnhancedHeader;
