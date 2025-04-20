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
        'flo-blue': '#1E3A8A',
        'flo-fuchsia': '#B91C1C',
        'flo-violet': '#7E22CE',
        'flo-gray': '#D1D5DB',
      },
    },
  },
  plugins: [],
}
