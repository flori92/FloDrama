import React from 'react';
import { NavLink } from 'react-router-dom';
import { Search, User } from 'lucide-react';

const categories = [
  { name: 'Accueil', path: '/' },
  { name: 'Dramas', path: '/category/dramas' },
  { name: 'Films', path: '/category/movies' },
  { name: 'Animés', path: '/category/anime' },
  { name: 'Bollywood', path: '/category/bollywood' },
  { name: 'App', path: '/app' },
  { name: 'WatchParty', path: '/watchparty' },
];

const Header: React.FC = () => {
  return (
    <header className="bg-flo-black text-flo-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto flex items-center justify-between py-3 px-4">
        {/* Logo */}
        <NavLink to="/" className="text-2xl font-bold font-sans tracking-tight bg-gradient-to-r from-flo-violet to-flo-blue bg-clip-text text-transparent">
          FloDrama
        </NavLink>
        {/* Navigation */}
        <nav className="flex-1 flex justify-center">
          <ul className="flex space-x-6">
            {categories.map(cat => (
              <li key={cat.name}>
                <NavLink
                  to={cat.path}
                  className={({ isActive }) =>
                    `px-3 py-1 rounded-full font-semibold transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-flo-blue ` +
                    (isActive
                      ? 'bg-gradient-to-r from-flo-violet to-flo-blue text-flo-white'
                      : 'text-flo-white hover:bg-gradient-to-r hover:from-flo-violet hover:to-flo-fuchsia hover:text-flo-white')
                  }
                  end={cat.path === '/'}
                >
                  {cat.name}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        {/* Actions */}
        <div className="flex items-center space-x-4">
          {/* Barre de recherche */}
          <form className="relative hidden md:block">
            <input
              type="text"
              placeholder="Rechercher..."
              className="pl-10 pr-4 py-1 rounded-full bg-flo-gray/20 text-flo-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-flo-violet"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-flo-violet" />
          </form>
          {/* Profil/connexion */}
          <NavLink
            to="/profile"
            className="flex items-center px-3 py-1 rounded-full bg-flo-violet hover:bg-flo-blue text-flo-white font-semibold transition-colors duration-200"
          >
            <User className="w-5 h-5 mr-2" />
            <span className="hidden md:inline">Profil</span>
          </NavLink>
        </div>
      </div>
    </header>
  );
};

export default Header;