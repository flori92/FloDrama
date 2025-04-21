import React from 'react';
import { Play } from 'lucide-react';

const HeroBanner: React.FC = () => {
  return (
    <div className="relative h-[60vh] rounded-lg overflow-hidden">
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: 'url(/static/hero/hero-banner.svg)'
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-gray-900 to-transparent" />
      </div>
      
      <div className="relative h-full flex items-center p-8">
        <div className="max-w-2xl">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            Découvrez le meilleur du divertissement asiatique
          </h1>
          <p className="text-lg text-gray-300 mb-8">
            Dramas, films, anime et plus encore. Tout ce que vous aimez, au même endroit.
          </p>
          <button className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg">
            <Play className="w-5 h-5" />
            <span>Commencer à regarder</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default HeroBanner; 