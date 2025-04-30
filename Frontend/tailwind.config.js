/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // Fusion des palettes et options du fichier tailwind.config (1).js
      colors: {
        'flo-violet': '#9D4EDD',
        'flo-blue': '#4361EE',
        'flo-gradient': 'linear-gradient(90deg, #4361EE 0%, #9D4EDD 100%)',
        'flo-black': '#000000',
        'flo-white': '#FFFFFF',
        'flo-white-60': 'rgba(255,255,255,0.6)',
        'flo-white-80': 'rgba(255,255,255,0.8)',
        'flo-border': 'rgba(255,255,255,0.3)',
        'flo-gold': '#D4AF37',
        'flo-orange': '#EA580C',
        'flo-jade': '#047857',
        'flo-night': '#1E3A8A',
        'flo-gray': '#D1D5DB',
        // Palette sémantique issue de la recommandation (A faire)
        primary: {
          DEFAULT: '#4361EE',
          dark: '#3a54d4',
        },
        secondary: {
          DEFAULT: '#9D4EDD',
          dark: '#8a3cc7',
        },
        accent: {
          gold: '#D4AF37',
          orange: '#EA580C',
          jade: '#047857',
          night: '#1E3A8A',
        },
        neutral: {
          DEFAULT: '#D1D5DB',
          50: '#F9FAFB',
          100: '#F3F4F6',
          200: '#E5E7EB',
          300: '#D1D5DB',
          400: '#9CA3AF',
          500: '#6B7280',
          600: '#4B5563',
          700: '#374151',
          800: '#1F2937',
          900: '#111826',
          950: '#0d1117',
        },
        text: {
          primary: '#FFFFFF',
          secondary: 'rgba(255, 255, 255, 0.8)',
          tertiary: 'rgba(255, 255, 255, 0.6)',
          disabled: 'rgba(255, 255, 255, 0.4)',
        },
      },
      fontFamily: {
        'sans': ['SF Pro Display', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
        'serif': ['Playfair Display', 'ui-serif', 'Georgia'],
      },
    },
  },
  plugins: [],
}
