import React from 'react';
import { ThemeProvider as LynxThemeProvider } from '@lynx/core';
import { AppConfig } from '../app.config';

// Configuration du thème pour différentes plateformes
const theme = {
  // Couleurs principales
  colors: {
    ...AppConfig.ui.theme.colors,
    // Couleurs spécifiques par plateforme
    platform: {
      ios: {
        statusBar: '#000000',
        navigationBar: '#1e1e1e'
      },
      android: {
        statusBar: '#121212',
        navigationBar: '#1e1e1e'
      },
      web: {
        header: '#1e1e1e',
        footer: '#121212'
      }
    }
  },

  // Typographie
  typography: {
    fontFamily: {
      regular: 'Roboto',
      medium: 'Roboto-Medium',
      bold: 'Roboto-Bold'
    },
    fontSize: {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 18,
      xl: 20,
      xxl: 24
    },
    lineHeight: {
      xs: 16,
      sm: 20,
      md: 24,
      lg: 28,
      xl: 32,
      xxl: 36
    }
  },

  // Espacements
  spacing: {
    ...AppConfig.ui.theme.layout.spacing,
    container: {
      xs: 16,
      sm: 24,
      md: 32,
      lg: 40
    }
  },

  // Points de rupture
  breakpoints: {
    ...AppConfig.ui.theme.layout.breakpoints,
    values: {
      mobile: 0,
      tablet: 600,
      desktop: 1024,
      wide: 1440
    }
  },

  // Animations
  animations: {
    ...AppConfig.ui.theme.animations,
    transitions: {
      short: 200,
      medium: 300,
      long: 500
    }
  },

  // Bordures et ombres
  shape: {
    borderRadius: {
      xs: 4,
      sm: 8,
      md: 12,
      lg: 16,
      xl: 24
    },
    shadows: {
      sm: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5
      },
      md: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4.65,
        elevation: 8
      },
      lg: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 6.27,
        elevation: 10
      }
    }
  },

  // Composants personnalisés
  components: {
    Button: {
      variants: {
        primary: {
          backgroundColor: AppConfig.ui.theme.colors.primary,
          color: '#ffffff',
          borderRadius: 8,
          padding: 16
        },
        secondary: {
          backgroundColor: 'transparent',
          borderColor: AppConfig.ui.theme.colors.primary,
          borderWidth: 1,
          color: AppConfig.ui.theme.colors.primary,
          borderRadius: 8,
          padding: 16
        },
        text: {
          backgroundColor: 'transparent',
          color: AppConfig.ui.theme.colors.primary,
          padding: 8
        }
      }
    },
    Card: {
      backgroundColor: AppConfig.ui.theme.colors.surface,
      borderRadius: 12,
      padding: 16,
      margin: 8,
      ...theme.shape.shadows.md
    },
    Input: {
      backgroundColor: AppConfig.ui.theme.colors.surface,
      borderRadius: 8,
      padding: 12,
      color: AppConfig.ui.theme.colors.text,
      placeholderColor: 'rgba(255, 255, 255, 0.5)'
    }
  }
};

export const ThemeProvider = ({ children }) => {
  return (
    <LynxThemeProvider theme={theme}>
      {children}
    </LynxThemeProvider>
  );
};
