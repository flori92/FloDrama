/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        flo: {
          night: '#181824',
          violet: '#9D4EDD',
          fuchsia: '#F72585',
          blue: '#5F5FFF',
          white: '#FFFFFF',
          gray: '#C7C7D9',
        },
        primary: '#9D4EDD',
        accent: '#F72585',
        'flo-fuchsia': '#F72585',
        'flo-blue': '#5F5FFF',
      },
    },
  },
  plugins: [],
};
