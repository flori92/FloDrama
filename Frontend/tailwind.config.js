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
        'flo-gradient': 'linear-gradient(90deg, #9D4EDD 0%, #4361EE 100%)',
        'flo-black': '#15151c',
        'flo-white': '#FFFFFF',
        'flo-gold': '#D4AF37',
        'flo-orange': '#EA580C',
        'flo-jade': '#047857',
        'flo-night': '#1E3A8A',
        'flo-gray': '#D1D5DB',
      },
      fontFamily: {
        'sans': ['Inter', 'Montserrat', 'SF Pro Display', 'ui-sans-serif', 'system-ui'],
        'serif': ['Playfair Display', 'ui-serif', 'Georgia'],
      },
    },
  },
  plugins: [],
}
