/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        // Palette principale
        'drama-red': '#B91C1C', // Rouge profond - Couleur principale
        'drama-black': '#000000', // Noir - Contraste et élégance
        'drama-white': '#FFFFFF', // Blanc - Clarté et lisibilité
        'drama-gold': '#D4AF37', // Or - Accents pour les éléments premium
        
        // Palette secondaire
        'anime-blue': '#1E3A8A', // Bleu nuit - Pour les contenus anime
        'bollywood-orange': '#EA580C', // Orange vif - Pour les contenus bollywood
        'korean-green': '#047857', // Vert jade - Pour les contenus coréens
        'japanese-purple': '#7E22CE', // Violet - Pour les contenus japonais
        
        // Compatibilité avec l'ancien système
        flo: {
          night: '#181824',
          red: '#B91C1C',
          gold: '#D4AF37',
          white: '#FFFFFF',
          black: '#000000',
        },
        primary: '#B91C1C',
        accent: '#D4AF37',
      },
      fontFamily: {
        'montserrat': ['Montserrat', 'sans-serif'],
        'inter': ['Inter', 'sans-serif'],
        'playfair': ['"Playfair Display"', 'serif'],
      },
      backgroundImage: {
        'gradient-drama': 'linear-gradient(to bottom, rgba(0,0,0,0.7), rgba(185,28,28,0.5))',
      },
      boxShadow: {
        'drama': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      },
    },
  },
  plugins: [],
};
