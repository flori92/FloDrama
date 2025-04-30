const colors = require("tailwindcss/colors");

/** @type {import("tailwindcss").Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // Recommendation 3.2: Define a consistent and semantic color palette
      colors: {
        // Primary brand colors (using existing flo-blue and flo-violet)
        primary: {
          DEFAULT: "#4361EE", // flo-blue
          dark: "#3a54d4", // Slightly darker shade for hover/active
        },
        secondary: {
          DEFAULT: "#9D4EDD", // flo-violet
          dark: "#8a3cc7", // Slightly darker shade
        },
        // Accent colors (can be used sparingly for highlights)
        accent: {
          gold: "#D4AF37", // flo-gold
          orange: "#EA580C", // flo-orange
          jade: "#047857", // flo-jade
          night: "#1E3A8A", // flo-night
        },
        // Neutral colors for backgrounds, borders, text
        neutral: {
          DEFAULT: "#D1D5DB", // flo-gray (Consider renaming based on usage)
          50: "#F9FAFB",
          100: "#F3F4F6",
          200: "#E5E7EB",
          300: "#D1D5DB", // Existing flo-gray
          400: "#9CA3AF",
          500: "#6B7280",
          600: "#4B5563",
          700: "#374151",
          800: "#1F2937", // Good for dark card backgrounds
          900: "#111826", // Good for darker backgrounds
          950: "#0d1117", // Very dark, close to black
        },
        // Text colors
        text: {
          primary: "#FFFFFF", // flo-white
          secondary: "rgba(255, 255, 255, 0.8)", // flo-white-80
          tertiary: "rgba(255, 255, 255, 0.6)", // flo-white-60
          disabled: "rgba(255, 255, 255, 0.4)",
          inverse: "#111826", // For text on light backgrounds
        },
        // Border colors
        border: {
          DEFAULT: "rgba(255, 255, 255, 0.3)", // flo-border
          medium: "rgba(255, 255, 255, 0.5)",
          light: "rgba(255, 255, 255, 0.1)",
        },
        // Background colors (can alias neutrals or define specifics)
        background: {
          DEFAULT: "#000000", // flo-black
          paper: "#111826", // e.g., neutral-900
          card: "#1F2937", // e.g., neutral-800
        },
        // Keep the gradient definition if used via a utility class, though gradients are often applied directly
        // 'flo-gradient': 'linear-gradient(90deg, #4361EE 0%, #9D4EDD 100%)',
      },
      // Recommendation 3.2: Define consistent font families
      fontFamily: {
        // Use semantic names
        sans: [
          "SF Pro Display",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
        serif: ["Playfair Display", "ui-serif", "Georgia"],
        // Add mono if needed
        // mono: [...] 
      },
      // Recommendation 3.2: Define consistent spacing scale (example)
      spacing: {
        // Add custom spacing values if needed, complementing Tailwind's defaults
        "18": "4.5rem", // Example: 72px
        "112": "28rem", // Example: 448px
      },
      // Recommendation 3.2: Define consistent border radius scale (example)
      borderRadius: {
        sm: "0.125rem", // 2px
        DEFAULT: "0.25rem", // 4px
        md: "0.375rem", // 6px
        lg: "0.5rem", // 8px
        xl: "0.75rem", // 12px
        "2xl": "1rem", // 16px
        full: "9999px",
      },
    },
  },
  plugins: [
    // Add plugins if needed, e.g., for line clamping or aspect ratio
    // require('@tailwindcss/line-clamp'),
    // require('@tailwindcss/aspect-ratio'),
  ],
};

