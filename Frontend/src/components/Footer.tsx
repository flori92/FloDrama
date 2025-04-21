import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  return (
    <footer className="bg-flo-black text-flo-white pt-10 pb-6 px-4 mt-8 border-t border-flo-violet/20">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-lg font-bold mb-4 text-flo-violet font-sans">À propos</h3>
            <ul className="space-y-2">
              <li><Link to="/about" className="hover:text-flo-blue transition-colors">Qui sommes-nous</Link></li>
              <li><Link to="/contact" className="hover:text-flo-blue transition-colors">Contact</Link></li>
              <li><Link to="/careers" className="hover:text-flo-blue transition-colors">Carrières</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-bold mb-4 text-flo-violet font-sans">Aide</h3>
            <ul className="space-y-2">
              <li><Link to="/faq" className="hover:text-flo-blue transition-colors">FAQ</Link></li>
              <li><Link to="/support" className="hover:text-flo-blue transition-colors">Support</Link></li>
              <li><Link to="/terms" className="hover:text-flo-blue transition-colors">Conditions d'utilisation</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-bold mb-4 text-flo-violet font-sans">Contenu</h3>
            <ul className="space-y-2">
              <li><Link to="/category/dramas" className="hover:text-flo-blue transition-colors">Dramas</Link></li>
              <li><Link to="/category/movies" className="hover:text-flo-blue transition-colors">Films</Link></li>
              <li><Link to="/category/anime" className="hover:text-flo-blue transition-colors">Animés</Link></li>
              <li><Link to="/category/bollywood" className="hover:text-flo-blue transition-colors">Bollywood</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-bold mb-4 text-flo-violet font-sans">Suivez-nous</h3>
            <ul className="space-y-2">
              <li><a href="#" className="hover:text-flo-blue transition-colors">Facebook</a></li>
              <li><a href="#" className="hover:text-flo-blue transition-colors">Twitter</a></li>
              <li><a href="#" className="hover:text-flo-blue transition-colors">Instagram</a></li>
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