import React from 'react';
import { Link } from 'react-router-dom';
import PageTransition from '../components/animations/PageTransition';

/**
 * Page 404 - Page non trouvée
 * @param {Object} props - Propriétés du composant
 * @param {string} props.message - Message personnalisé à afficher (optionnel)
 */
const NotFoundPage = ({ message }) => {
  return (
    <PageTransition>
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
        <h1 className="text-6xl font-bold text-pink-500 mb-4">404</h1>
        <h2 className="text-3xl font-semibold mb-6">Page non trouvée</h2>
        <p className="text-lg text-gray-400 mb-8 max-w-md">
          {message || "Désolé, la page que vous recherchez n'existe pas ou a été déplacée."}
        </p>
        <Link 
          to="/" 
          className="px-6 py-3 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors duration-300"
        >
          Retour à l'accueil
        </Link>
      </div>
    </PageTransition>
  );
};

export default NotFoundPage;
