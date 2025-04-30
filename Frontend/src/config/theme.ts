export const theme = {
  colors: {
    background: {
      primary: '#15151c',
      secondary: '#18181b',
      card: 'rgba(24, 24, 27, 0.8)',
    },
    primary: {
      main: '#7b61ff',
      light: '#a259ff',
      gradient: 'linear-gradient(135deg, #7b61ff 0%, #a259ff 100%)',
    },
    accent: {
      blue: '#4361ee',
      fuchsia: '#b16cea',
      violet: '#9D4EDD',
    },
    text: {
      primary: '#ffffff',
      secondary: '#a1a1aa',
    },
  },
  typography: {
    fontFamily: {
      primary: 'Inter, Segoe UI, sans-serif',
    },
    sizes: {
      h1: '2.5rem',
      h2: '2rem',
      h3: '1.5rem',
      body: '1rem',
      small: '0.875rem',
    },
    weights: {
      regular: 400,
      medium: 500,
      bold: 700,
    },
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
  },
  borderRadius: {
    sm: '0.25rem',
    md: '0.5rem',
    lg: '1rem',
  },
  shadows: {
    card: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    hover: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  },
  transitions: {
    default: 'all 0.3s ease-in-out',
    hover: 'all 0.2s ease-in-out',
  },
  zIndex: {
    modal: 1000,
    header: 100,
    sidebar: 90,
  },
}; 