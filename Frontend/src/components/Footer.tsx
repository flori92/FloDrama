import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-800 p-6">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">À propos</h3>
            <ul className="space-y-2">
              <li><Link to="/about" className="hover:text-gray-300">Qui sommes-nous</Link></li>
              <li><Link to="/contact" className="hover:text-gray-300">Contact</Link></li>
              <li><Link to="/careers" className="hover:text-gray-300">Carrières</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Aide</h3>
            <ul className="space-y-2">
              <li><Link to="/faq" className="hover:text-gray-300">FAQ</Link></li>
              <li><Link to="/support" className="hover:text-gray-300">Support</Link></li>
              <li><Link to="/terms" className="hover:text-gray-300">Conditions d'utilisation</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Contenu</h3>
            <ul className="space-y-2">
              <li><Link to="/dramas" className="hover:text-gray-300">Dramas</Link></li>
              <li><Link to="/movies" className="hover:text-gray-300">Films</Link></li>
              <li><Link to="/anime" className="hover:text-gray-300">Anime</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Suivez-nous</h3>
            <ul className="space-y-2">
              <li><a href="#" className="hover:text-gray-300">Facebook</a></li>
              <li><a href="#" className="hover:text-gray-300">Twitter</a></li>
              <li><a href="#" className="hover:text-gray-300">Instagram</a></li>
            </ul>
          </div>
        </div>
        
        <div className="mt-8 pt-8 border-t border-gray-700 text-center">
          <p>&copy; {new Date().getFullYear()} FloDrama. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 