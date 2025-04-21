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
      },
      fontFamily: {
        'sans': ['SF Pro Display', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
        'serif': ['Playfair Display', 'ui-serif', 'Georgia'],
      },
    },
  },
  plugins: [],
}
