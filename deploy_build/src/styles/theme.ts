/**
 * Thème partagé pour FloDrama
 * Définit les constantes visuelles et les styles à utiliser dans toute l'application
 * Compatible avec Lynx et React
 */

// Couleurs principales
export const colors = {
  // Couleurs de base
  primary: {
    blue: '#3B82F6', // blue-500
    fuchsia: '#D946EF', // fuchsia-500
    gradient: 'linear-gradient(135deg, #3B82F6 0%, #D946EF 100%)',
  },
  background: {
    main: '#000000',
    card: '#121212',
    overlay: 'rgba(0, 0, 0, 0.75)',
  },
  text: {
    primary: '#FFFFFF',
    secondary: 'rgba(255, 255, 255, 0.6)', // white/60
    tertiary: 'rgba(255, 255, 255, 0.3)', // white/30
    dark: '#000000',
  },
  // Couleurs fonctionnelles
  status: {
    success: '#10B981', // green-500
    warning: '#F59E0B', // amber-500
    error: '#EF4444', // red-500
    info: '#3B82F6', // blue-500
  },
  // Couleurs d'accentuation
  accent: {
    blue: '#3B82F6', // blue-500
    fuchsia: '#D946EF', // fuchsia-500
    purple: '#8B5CF6', // violet-500
    pink: '#EC4899', // pink-500
  },
};

// Typographie
export const typography = {
  fontFamily: 'SF Pro Display, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif',
  fontSizes: {
    xs: '0.75rem', // 12px
    sm: '0.875rem', // 14px
    base: '1rem', // 16px
    lg: '1.125rem', // 18px
    xl: '1.25rem', // 20px
    '2xl': '1.5rem', // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem', // 36px
    '5xl': '3rem', // 48px
    '6xl': '3.75rem', // 60px
  },
  fontWeights: {
    thin: 100,
    extralight: 200,
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
    black: 900,
  },
  lineHeights: {
    none: 1,
    tight: 1.25,
    snug: 1.375,
    normal: 1.5,
    relaxed: 1.625,
    loose: 2,
  },
};

// Espacements
export const spacing = {
  0: '0',
  0.5: '0.125rem', // 2px
  1: '0.25rem', // 4px
  1.5: '0.375rem', // 6px
  2: '0.5rem', // 8px
  2.5: '0.625rem', // 10px
  3: '0.75rem', // 12px
  3.5: '0.875rem', // 14px
  4: '1rem', // 16px
  5: '1.25rem', // 20px
  6: '1.5rem', // 24px
  7: '1.75rem', // 28px
  8: '2rem', // 32px
  9: '2.25rem', // 36px
  10: '2.5rem', // 40px
  11: '2.75rem', // 44px
  12: '3rem', // 48px
  14: '3.5rem', // 56px
  16: '4rem', // 64px
  20: '5rem', // 80px
  24: '6rem', // 96px
  28: '7rem', // 112px
  32: '8rem', // 128px
  36: '9rem', // 144px
  40: '10rem', // 160px
  44: '11rem', // 176px
  48: '12rem', // 192px
  52: '13rem', // 208px
  56: '14rem', // 224px
  60: '15rem', // 240px
  64: '16rem', // 256px
  72: '18rem', // 288px
  80: '20rem', // 320px
  96: '24rem', // 384px
};

// Bordures
export const borders = {
  radius: {
    none: '0',
    sm: '0.125rem', // 2px
    md: '0.375rem', // 6px
    lg: '0.5rem', // 8px
    xl: '0.75rem', // 12px
    '2xl': '1rem', // 16px
    '3xl': '1.5rem', // 24px
    full: '9999px',
  },
  width: {
    0: '0',
    1: '1px',
    2: '2px',
    4: '4px',
    8: '8px',
  },
};

// Ombres
export const shadows = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
  none: 'none',
};

// Animations et transitions
export const animations = {
  // Durées de transition
  durations: {
    fastest: '50ms',
    faster: '100ms',
    fast: '150ms',
    normal: '200ms',
    slow: '300ms',
    slower: '400ms',
    slowest: '500ms',
  },
  // Fonctions de timing
  easings: {
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
    bounce: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  },
  // Animations prédéfinies
  keyframes: {
    fadeIn: {
      from: { opacity: 0 },
      to: { opacity: 1 },
    },
    fadeOut: {
      from: { opacity: 1 },
      to: { opacity: 0 },
    },
    scaleIn: {
      from: { transform: 'scale(0.95)', opacity: 0 },
      to: { transform: 'scale(1)', opacity: 1 },
    },
    scaleOut: {
      from: { transform: 'scale(1)', opacity: 1 },
      to: { transform: 'scale(0.95)', opacity: 0 },
    },
    slideInBottom: {
      from: { transform: 'translateY(10%)', opacity: 0 },
      to: { transform: 'translateY(0)', opacity: 1 },
    },
    slideOutBottom: {
      from: { transform: 'translateY(0)', opacity: 1 },
      to: { transform: 'translateY(10%)', opacity: 0 },
    },
    pulse: {
      '0%, 100%': { opacity: 1 },
      '50%': { opacity: 0.5 },
    },
    shimmer: {
      '0%': { backgroundPosition: '-200% 0' },
      '100%': { backgroundPosition: '200% 0' },
    },
    spin: {
      from: { transform: 'rotate(0deg)' },
      to: { transform: 'rotate(360deg)' },
    },
    ripple: {
      '0%': { transform: 'scale(0)', opacity: 1 },
      '100%': { transform: 'scale(4)', opacity: 0 },
    },
    wave: {
      '0%': { transform: 'translateY(0)' },
      '50%': { transform: 'translateY(-10px)' },
      '100%': { transform: 'translateY(0)' },
    },
    gradient: {
      '0%': { backgroundPosition: '0% 50%' },
      '50%': { backgroundPosition: '100% 50%' },
      '100%': { backgroundPosition: '0% 50%' },
    },
  },
};

// Effets spéciaux
export const effects = {
  // Dégradés
  gradients: {
    primary: 'linear-gradient(135deg, #3B82F6 0%, #D946EF 100%)',
    secondary: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)',
    dark: 'linear-gradient(180deg, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.8) 100%)',
    shimmer: 'linear-gradient(90deg, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.1) 50%, rgba(255, 255, 255, 0) 100%)',
  },
  // Flous
  blurs: {
    sm: '4px',
    md: '8px',
    lg: '16px',
    xl: '24px',
    '2xl': '40px',
  },
  // Filtres
  filters: {
    grayscale: 'grayscale(1)',
    sepia: 'sepia(0.35)',
    saturate: 'saturate(1.5)',
    brightness: 'brightness(1.1)',
    contrast: 'contrast(1.1)',
    blur: 'blur(8px)',
  },
  // Effets de survol
  hover: {
    scale: 'transform: scale(1.05); transition: transform 0.2s ease-in-out;',
    glow: 'box-shadow: 0 0 15px rgba(59, 130, 246, 0.5); transition: box-shadow 0.2s ease-in-out;',
    lift: 'transform: translateY(-4px); transition: transform 0.2s ease-in-out;',
    darken: 'filter: brightness(0.9); transition: filter 0.2s ease-in-out;',
    brighten: 'filter: brightness(1.1); transition: filter 0.2s ease-in-out;',
  },
};

// Breakpoints pour le responsive
export const breakpoints = {
  xs: '320px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
};

// Z-index
export const zIndices = {
  hide: -1,
  auto: 'auto',
  base: 0,
  docked: 10,
  dropdown: 1000,
  sticky: 1100,
  banner: 1200,
  overlay: 1300,
  modal: 1400,
  popover: 1500,
  skipLink: 1600,
  toast: 1700,
  tooltip: 1800,
};

// Thème complet
const theme = {
  colors,
  typography,
  spacing,
  borders,
  shadows,
  animations,
  effects,
  breakpoints,
  zIndices,
};

export default theme;
