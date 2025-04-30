import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { Search, User, Bell, Menu } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Main content categories for the primary navigation
const mainCategories = [
  { name: 'Accueil', path: '/' },
  { name: 'Dramas', path: '/category/dramas' },
  { name: 'Films', path: '/category/movies' },
  { name: 'Animés', path: '/category/anime' },
  { name: 'Bollywood', path: '/category/bollywood' },
  // Removed 'App' and 'WatchParty' as per Recommendation 1.2
  // { name: 'App', path: '/app' },
  // { name: 'WatchParty', path: '/watchparty' },
];

const Header: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Effet de détection du scroll
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.header 
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, type: "spring", stiffness: 260, damping: 20 }}
      className={`sticky top-0 z-50 ${
        isScrolled 
          ? 'bg-black/90 backdrop-blur-md shadow-lg' 
          : 'bg-transparent'
      } transition-all duration-300`}
    >
      <div className="container mx-auto flex items-center justify-between py-4 px-4">
        {/* Logo */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
        >
          <NavLink to="/" className="text-2xl font-medium tracking-tight bg-gradient-to-r from-blue-500 to-fuchsia-500 bg-clip-text text-transparent">
            FloDrama
          </NavLink>
        </motion.div>

        {/* Menu Burger Mobile */}
        <button
          className="md:hidden text-white focus:outline-none"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          <Menu className="w-6 h-6" />
        </button>

        {/* Navigation Desktop */}
        <nav className="hidden md:flex flex-1 justify-center">
          <ul className="flex space-x-6">
            {mainCategories.map(cat => (
              <motion.li key={cat.name} whileHover={{ scale: 1.05 }}>
                <NavLink
                  to={cat.path}
                  className={({ isActive }) =>
                    `px-3 py-1 rounded-full font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 ` +
                    (isActive
                      ? 'bg-gradient-to-r from-blue-500 to-fuchsia-500 text-white'
                      : 'text-white hover:bg-white/10')
                  }
                  end={cat.path === '/'}
                >
                  {cat.name}
                </NavLink>
              </motion.li>
            ))}
            {/* Link to WatchParty could be added here as a distinct button if desired */}
            {/* <motion.li whileHover={{ scale: 1.05 }}>
              <NavLink to="/watchparty" className="px-3 py-1 rounded-full font-medium text-white hover:bg-white/10">WatchParty</NavLink>
            </motion.li> */}
          </ul>
        </nav>

        {/* Actions Desktop */}
        <div className="hidden md:flex items-center space-x-4">
          {/* Barre de recherche */}
          <motion.form 
            className="relative"
            whileHover={{ scale: 1.02 }}
          >
            <input
              type="text"
              placeholder="Rechercher..."
              className="pl-10 pr-4 py-1 rounded-full bg-white/10 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-500 border border-white/30"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/60" />
          </motion.form>
          
          {/* Notifications */}
          <motion.div whileHover={{ scale: 1.1 }}>
            <button className="p-2 rounded-full hover:bg-gradient-to-r hover:from-blue-500 hover:to-fuchsia-500 text-white border border-white/30">
              <Bell className="w-5 h-5" />
            </button>
          </motion.div>
          
          {/* Profil */}
          <motion.div whileHover={{ scale: 1.1 }}>
            <NavLink
              to="/profile"
              className="flex items-center px-3 py-1 rounded-full bg-white text-black hover:bg-white/90 font-medium transition-colors duration-200"
            >
              <User className="w-5 h-5 mr-2" />
              <span>Profil</span>
            </NavLink>
          </motion.div>
        </div>
      </div>
      
      {/* Menu Mobile */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            className="md:hidden bg-black border-t border-white/30"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <ul className="flex flex-col p-4 space-y-3">
              {/* Main categories first */}
              {mainCategories.map(cat => (
                <li key={cat.name}>
                  <NavLink
                    to={cat.path}
                    className={({ isActive }) =>
                      `block px-3 py-2 rounded-lg font-medium transition-colors duration-200 ` +
                      (isActive
                        ? 'bg-gradient-to-r from-blue-500 to-fuchsia-500 text-white'
                        : 'text-white hover:bg-white/10')
                    }
                    end={cat.path === '/'}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {cat.name}
                  </NavLink>
                </li>
              ))}
              
              {/* Separator and other links (like WatchParty) */}
              <li className="pt-2 border-t border-white/30">
                 <NavLink
                    to="/watchparty" // Assuming this path exists
                    className={({ isActive }) =>
                      `block px-3 py-2 rounded-lg font-medium transition-colors duration-200 ` +
                      (isActive
                        ? 'bg-gradient-to-r from-blue-500 to-fuchsia-500 text-white'
                        : 'text-white hover:bg-white/10')
                    }
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    WatchParty
                  </NavLink>
              </li>
              {/* Link for App download could go in Footer or a dedicated section */}
              {/* <li className="pt-2">
                 <NavLink to="/app" ...>
                    Télécharger l'App
                 </NavLink>
              </li> */}
              
              {/* Search bar */}
              <li className="pt-2 border-t border-white/30">
                <form className="relative">
                  <input
                    type="text"
                    placeholder="Rechercher..."
                    className="w-full pl-10 pr-4 py-2 rounded-lg bg-white/10 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-500 border border-white/30"
                  />
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/60" />
                </form>
              </li>
              
              {/* Profile link */}
              <li>
                <NavLink
                  to="/profile"
                  className="flex items-center px-3 py-2 rounded-lg bg-white text-black hover:bg-white/90 font-medium transition-colors duration-200"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <User className="w-5 h-5 mr-2" />
                  <span>Profil</span>
                </NavLink>
              </li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
};

export default Header;

