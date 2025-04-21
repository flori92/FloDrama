import React from 'react';
import { Link } from 'react-router-dom';
import { Search, Bell, User } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <header className="bg-gray-800 p-4">
      <div className="container mx-auto flex items-center justify-between">
        <Link to="/" className="text-2xl font-bold text-white">
          FloDrama
        </Link>
        
        <div className="flex items-center space-x-4">
          <button className="p-2 hover:bg-gray-700 rounded-full">
            <Search className="w-6 h-6" />
          </button>
          <button className="p-2 hover:bg-gray-700 rounded-full">
            <Bell className="w-6 h-6" />
          </button>
          <Link to="/profile" className="p-2 hover:bg-gray-700 rounded-full">
            <User className="w-6 h-6" />
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Header; 