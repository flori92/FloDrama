/**
 * Composant générique pour les pages du footer
 * Utilisé comme modèle pour toutes les pages d'information
 */

import React from 'react';
import Footer from '../../componets/Footer/Footer';

const FooterPage = ({ title, children }) => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-gray-900">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto bg-black bg-opacity-60 rounded-lg shadow-lg overflow-hidden">
          <div className="p-6 md:p-10">
            <h1 className="text-3xl font-bold text-white mb-8 border-b border-flodrama-fuchsia pb-4">
              {title}
            </h1>
            
            <div className="text-gray-200 leading-relaxed space-y-6">
              {children}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default FooterPage;
