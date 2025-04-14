/**
 * Configuration globale de FloDrama
 */

// API
export const API_BASE_URL = process.env.VITE_API_BASE_URL || 'https://71e6p3gfk1.execute-api.us-east-1.amazonaws.com/prod';

// Cache
export const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Thème
export const THEME = {
  colors: {
    primary: {
      gradient: 'linear-gradient(135deg, #3B82F6 0%, #F0ABFC 100%)',
      solid: '#3B82F6'
    },
    blue: {
      500: '#3B82F6'
    },
    fuchsia: {
      500: '#F0ABFC'
    },
    background: '#000000',
    text: {
      primary: '#FFFFFF',
      secondary: 'rgba(255, 255, 255, 0.6)',
      muted: 'rgba(255, 255, 255, 0.3)'
    }
  },
  fonts: {
    primary: 'SF Pro Display, -apple-system, BlinkMacSystemFont, system-ui, sans-serif'
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem'
  },
  borderRadius: {
    sm: '0.25rem',
    md: '0.5rem',
    lg: '1rem',
    full: '9999px'
  },
  transitions: {
    default: 'all 0.3s ease',
    fast: 'all 0.15s ease',
    slow: 'all 0.5s ease'
  }
};
