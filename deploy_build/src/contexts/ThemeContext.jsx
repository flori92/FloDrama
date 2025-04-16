import React, { createContext, useState, useContext, useEffect, useCallback, useMemo } from 'react';

/**
 * Contexte pour gérer le thème de l'application
 */
const ThemeContext = createContext();

/**
 * Fournisseur du contexte de thème
 * Gère le thème (clair/sombre) et les préférences d'affichage
 */
export const ThemeProvider = ({ children }) => {
  // État pour stocker le thème actuel
  const [isDarkMode, setIsDarkMode] = useState(true);
  
  // Thèmes disponibles (mémorisés pour éviter les recréations inutiles)
  const themes = useMemo(() => ({
    dark: {
      background: '#141414',
      surface: '#1f1f1f',
      primary: '#E50914',
      secondary: '#0071eb',
      text: '#ffffff',
      textSecondary: '#b3b3b3',
      border: 'rgba(255, 255, 255, 0.1)',
      error: '#ff5252',
      success: '#4caf50',
      warning: '#fb8c00'
    },
    light: {
      background: '#f5f5f5',
      surface: '#ffffff',
      primary: '#E50914',
      secondary: '#0071eb',
      text: '#333333',
      textSecondary: '#666666',
      border: 'rgba(0, 0, 0, 0.1)',
      error: '#b00020',
      success: '#388e3c',
      warning: '#f57c00'
    }
  }), []);
  
  // Thème actuel
  const currentTheme = isDarkMode ? themes.dark : themes.light;
  
  // Appliquer le thème au document (avec useCallback pour éviter les recréations inutiles)
  const applyThemeToDocument = useCallback(() => {
    const theme = isDarkMode ? themes.dark : themes.light;
    
    // Appliquer les variables CSS
    document.documentElement.style.setProperty('--background-color', theme.background);
    document.documentElement.style.setProperty('--surface-color', theme.surface);
    document.documentElement.style.setProperty('--primary-color', theme.primary);
    document.documentElement.style.setProperty('--secondary-color', theme.secondary);
    document.documentElement.style.setProperty('--text-color', theme.text);
    document.documentElement.style.setProperty('--text-secondary-color', theme.textSecondary);
    document.documentElement.style.setProperty('--border-color', theme.border);
    document.documentElement.style.setProperty('--error-color', theme.error);
    document.documentElement.style.setProperty('--success-color', theme.success);
    document.documentElement.style.setProperty('--warning-color', theme.warning);
    
    // Appliquer la classe au body
    document.body.classList.toggle('dark-theme', isDarkMode);
    document.body.classList.toggle('light-theme', !isDarkMode);
    
    // Définir la couleur du thème pour la barre d'adresse mobile
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', theme.background);
    }
  }, [isDarkMode, themes]);
  
  // Charger le thème depuis le stockage local au montage
  useEffect(() => {
    const storedTheme = localStorage.getItem('flodrama_theme');
    
    if (storedTheme) {
      setIsDarkMode(storedTheme === 'dark');
    } else {
      // Détecter la préférence du système
      const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDarkMode(prefersDarkMode);
    }
  }, []);
  
  // Mettre à jour le document lorsque le thème change
  useEffect(() => {
    applyThemeToDocument();
    localStorage.setItem('flodrama_theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode, applyThemeToDocument]);
  
  /**
   * Basculer entre les thèmes clair et sombre
   */
  const toggleTheme = () => {
    setIsDarkMode(prev => !prev);
  };
  
  /**
   * Définir le thème
   * @param {boolean} darkMode - True pour le thème sombre, false pour le thème clair
   */
  const setTheme = (darkMode) => {
    setIsDarkMode(darkMode);
  };
  
  // Valeur du contexte
  const value = {
    isDarkMode,
    currentTheme,
    toggleTheme,
    setTheme
  };
  
  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

/**
 * Hook personnalisé pour utiliser le contexte de thème
 * @returns {Object} - Fonctions et données du thème
 */
export const useTheme = () => {
  const context = useContext(ThemeContext);
  
  if (!context) {
    throw new Error('useTheme doit être utilisé à l\'intérieur d\'un ThemeProvider');
  }
  
  return context;
};
