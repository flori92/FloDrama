import React from 'react';
import { NavLink } from 'react-router-dom';

const Footer: React.FC = () => {
  return (
    <footer className="bg-flo-black text-flo-white pt-10 pb-6 px-4 mt-8 border-t border-flo-violet/20">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-lg font-bold mb-4 text-flo-violet font-sans">À propos</h3>
            <ul className="space-y-2">
              <li><NavLink to="/about" className={({isActive}) => `transition-colors ${isActive ? 'bg-gradient-to-r from-flo-violet to-flo-fuchsia text-flo-white px-2 rounded' : 'text-flo-white hover:text-flo-fuchsia'}`}>Qui sommes-nous</NavLink></li>
              <li><NavLink to="/contact" className={({isActive}) => `transition-colors ${isActive ? 'bg-gradient-to-r from-flo-violet to-flo-fuchsia text-flo-white px-2 rounded' : 'text-flo-white hover:text-flo-fuchsia'}`}>Contact</NavLink></li>
              <li><NavLink to="/careers" className={({isActive}) => `transition-colors ${isActive ? 'bg-gradient-to-r from-flo-violet to-flo-fuchsia text-flo-white px-2 rounded' : 'text-flo-white hover:text-flo-fuchsia'}`}>Carrières</NavLink></li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-bold mb-4 text-flo-violet font-sans">Aide</h3>
            <ul className="space-y-2">
              <li><NavLink to="/faq" className={({isActive}) => `transition-colors ${isActive ? 'bg-gradient-to-r from-flo-violet to-flo-fuchsia text-flo-white px-2 rounded' : 'text-flo-white hover:text-flo-fuchsia'}`}>FAQ</NavLink></li>
              <li><NavLink to="/support" className={({isActive}) => `transition-colors ${isActive ? 'bg-gradient-to-r from-flo-violet to-flo-fuchsia text-flo-white px-2 rounded' : 'text-flo-white hover:text-flo-fuchsia'}`}>Support</NavLink></li>
              <li><NavLink to="/terms" className={({isActive}) => `transition-colors ${isActive ? 'bg-gradient-to-r from-flo-violet to-flo-fuchsia text-flo-white px-2 rounded' : 'text-flo-white hover:text-flo-fuchsia'}`}>Conditions d'utilisation</NavLink></li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-bold mb-4 text-flo-violet font-sans">Contenu</h3>
            <ul className="space-y-2">
              <li><NavLink to="/category/dramas" className={({isActive}) => `transition-colors ${isActive ? 'bg-gradient-to-r from-flo-violet to-flo-fuchsia text-flo-white px-2 rounded' : 'text-flo-white hover:text-flo-fuchsia'}`}>Dramas</NavLink></li>
              <li><NavLink to="/category/movies" className={({isActive}) => `transition-colors ${isActive ? 'bg-gradient-to-r from-flo-violet to-flo-fuchsia text-flo-white px-2 rounded' : 'text-flo-white hover:text-flo-fuchsia'}`}>Films</NavLink></li>
              <li><NavLink to="/category/anime" className={({isActive}) => `transition-colors ${isActive ? 'bg-gradient-to-r from-flo-violet to-flo-fuchsia text-flo-white px-2 rounded' : 'text-flo-white hover:text-flo-fuchsia'}`}>Animés</NavLink></li>
              <li><NavLink to="/category/bollywood" className={({isActive}) => `transition-colors ${isActive ? 'bg-gradient-to-r from-flo-violet to-flo-fuchsia text-flo-white px-2 rounded' : 'text-flo-white hover:text-flo-fuchsia'}`}>Bollywood</NavLink></li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-bold mb-4 text-flo-violet font-sans">Suivez-nous</h3>
            <ul className="space-y-2">
              <li><a href="#" className="hover:text-flo-fuchsia transition-colors">Facebook</a></li>
              <li><a href="#" className="hover:text-flo-fuchsia transition-colors">Twitter</a></li>
              <li><a href="#" className="hover:text-flo-fuchsia transition-colors">Instagram</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-10 pt-8 border-t border-flo-violet/10 text-center text-flo-gray text-sm">
          <p>&copy; {new Date().getFullYear()} FloDrama. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;