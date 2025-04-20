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
        // Palette principale de FloDrama
        flo: {
          night: '#181824',
          violet: '#9D4EDD',
          fuchsia: '#F72585',
          blue: '#5F5FFF',
          white: '#FFFFFF',
          gray: '#C7C7D9',
        },
        
        // Couleurs principales
        primary: '#9D4EDD',
        accent: '#F72585',
        'flo-fuchsia': '#F72585',
        'flo-blue': '#5F5FFF',
        
        // Couleurs pour les catégories
        'anime-blue': '#4361EE',
        'bollywood-orange': '#FB5607',
        'korean-green': '#06D6A0',
        'japanese-purple': '#7209B7',
      },
      fontFamily: {
        'montserrat': ['Montserrat', 'sans-serif'],
        'inter': ['Inter', 'sans-serif'],
        'playfair': ['"Playfair Display"', 'serif'],
      },
      backgroundImage: {
        'gradient-flo': 'linear-gradient(to bottom, rgba(24,24,36,0.8), rgba(157,78,221,0.5))',
        'gradient-card': 'linear-gradient(to top, rgba(24,24,36,0.9), rgba(24,24,36,0) 70%)',
      },
      boxShadow: {
        'flo': '0 4px 6px -1px rgba(157, 78, 221, 0.1), 0 2px 4px -1px rgba(157, 78, 221, 0.06)',
      },
    },
  },
  plugins: [],
};
