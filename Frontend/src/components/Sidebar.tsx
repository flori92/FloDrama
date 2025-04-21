import React from 'react';
import { Link } from 'react-router-dom';
import { Home, Search, Bookmark, History, Settings } from 'lucide-react';

const Sidebar: React.FC = () => {
  return (
    <aside className="w-64 bg-gray-800 p-4">
      <nav className="space-y-2">
        <Link to="/" className="flex items-center space-x-2 p-2 hover:bg-gray-700 rounded-lg">
          <Home className="w-5 h-5" />
          <span>Accueil</span>
        </Link>
        
        <Link to="/search" className="flex items-center space-x-2 p-2 hover:bg-gray-700 rounded-lg">
          <Search className="w-5 h-5" />
          <span>Recherche</span>
        </Link>
        
        <Link to="/watchlist" className="flex items-center space-x-2 p-2 hover:bg-gray-700 rounded-lg">
          <Bookmark className="w-5 h-5" />
          <span>Ma liste</span>
        </Link>
        
        <Link to="/history" className="flex items-center space-x-2 p-2 hover:bg-gray-700 rounded-lg">
          <History className="w-5 h-5" />
          <span>Historique</span>
        </Link>
        
        <Link to="/settings" className="flex items-center space-x-2 p-2 hover:bg-gray-700 rounded-lg">
          <Settings className="w-5 h-5" />
          <span>Paramètres</span>
        </Link>
      </nav>
      
      <div className="mt-8">
        <h3 className="text-sm font-semibold text-gray-400 uppercase px-2">Catégories</h3>
        <nav className="mt-2 space-y-1">
          <Link to="/category/dramas" className="block p-2 hover:bg-gray-700 rounded-lg">Dramas</Link>
          <Link to="/category/movies" className="block p-2 hover:bg-gray-700 rounded-lg">Films</Link>
          <Link to="/category/anime" className="block p-2 hover:bg-gray-700 rounded-lg">Anime</Link>
          <Link to="/category/bollywood" className="block p-2 hover:bg-gray-700 rounded-lg">Bollywood</Link>
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar; 