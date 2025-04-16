/**
 * Adaptateur pour @lynx/styled
 * Fournit une implémentation de styled-components pour simuler @lynx/styled
 */
import React, { createContext, useContext, ReactNode } from 'react';
import styled, { ThemeProvider as StyledThemeProvider } from 'styled-components';

// Définition du thème
interface ThemeColors {
  primary: string;
  secondary: string;
  success: string;
  danger: string;
  warning: string;
  info: string;
  light: string;
  dark: string;
  text: string;
  textSecondary: string;
  background: string;
  border: string;
}

interface ThemeSpacing {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
}

interface ThemeFontSizes {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  xxl: number;
}

interface ThemeBorderRadius {
  sm: number;
  md: number;
  lg: number;
  pill: number;
}

export interface Theme {
  colors: ThemeColors;
  spacing: ThemeSpacing;
  fontSizes: ThemeFontSizes;
  borderRadius: ThemeBorderRadius;
}

// Thème par défaut
const defaultTheme: Theme = {
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
const ThemeContext = createContext<Theme>(defaultTheme);

// Props pour le ThemeProvider
interface ThemeProviderProps {
  theme?: Theme;
  children: ReactNode;
}

// Provider de thème - utilisation du ThemeProvider de styled-components
export const ThemeProvider: React.FC<ThemeProviderProps> = ({ theme = defaultTheme, children }) => {
  return (
    <StyledThemeProvider theme={theme}>
      {children}
    </StyledThemeProvider>
  );
};

// Hook pour utiliser le thème
const useTheme = (): Theme => useContext(ThemeContext);

// Exporter les fonctionnalités
export {
  styled,
  useTheme,
  defaultTheme as theme
};
