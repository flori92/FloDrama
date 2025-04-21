import React from 'react';
import { Play } from 'lucide-react';

const HeroBanner: React.FC = () => {
  return (
    <section className="relative h-[60vh] rounded-2xl overflow-hidden flex items-center justify-center mb-8 shadow-lg">
      {/* Image de fond + dégradé */}
      <div className="absolute inset-0">
        <div
          className="w-full h-full bg-cover bg-center"
          style={{ backgroundImage: 'url(/static/hero/hero-banner.svg)' }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-flo-violet/90 via-flo-blue/70 to-flo-black/70" />
      </div>
      {/* Contenu */}
      <div className="relative z-10 flex flex-col items-start max-w-2xl p-8">
        <h1 className="text-4xl md:text-6xl font-bold font-sans mb-4 bg-gradient-to-r from-flo-violet to-flo-blue bg-clip-text text-transparent drop-shadow-lg">
          Découvrez le meilleur du divertissement asiatique
        </h1>
        <p className="text-lg md:text-2xl text-flo-gray mb-8 font-sans">
          Dramas, films, animés, Bollywood et bien plus encore. Tout ce que vous aimez, au même endroit.
        </p>
        <div className="flex space-x-4">
          <button className="flex items-center space-x-2 bg-gradient-to-r from-flo-violet to-flo-blue hover:from-flo-blue hover:to-flo-violet text-flo-white px-8 py-3 rounded-full font-bold shadow-lg transition-all duration-200">
            <Play className="w-5 h-5" />
            <span>Commencer à regarder</span>
          </button>
          <button className="flex items-center space-x-2 border-2 border-flo-violet text-flo-violet hover:bg-flo-violet hover:text-flo-white px-8 py-3 rounded-full font-bold transition-all duration-200">
            <span>En savoir plus</span>
          </button>
        </div>
      </div>
    </section>
  );
};

export default HeroBanner;