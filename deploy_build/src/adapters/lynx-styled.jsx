/**
 * Adaptateur pour @lynx/styled
 * Fournit une implémentation de styled-components pour simuler @lynx/styled
 */
import React from 'react';
import styled from 'styled-components';

// Thème par défaut
const defaultTheme = {
  colors: {
    primary: '#007bff',
    secondary: '#6c757d',
    success: '#28a745',
    danger: '#dc3545',
    warning: '#ffc107',
    info: '#17a2b8',
    light: '#f8f9fa',
    dark: '#343a40',
    text: '#212529',
    textSecondary: '#6c757d',
    background: '#ffffff',
    border: '#dee2e6'
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32
  },
  fontSizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 24,
    xxl: 32
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 16,
    pill: 9999
  }
};

// Contexte de thème
const ThemeContext = React.createContext(defaultTheme);

// Provider de thème
const ThemeProvider = ({ theme = defaultTheme, children }) => (
  <ThemeContext.Provider value={theme}>
    {children}
  </ThemeContext.Provider>
);

// Hook pour utiliser le thème
const useTheme = () => React.useContext(ThemeContext);

// Exporter les fonctionnalités
export {
  styled,
  ThemeProvider,
  useTheme,
  defaultTheme as theme
};
