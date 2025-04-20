#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Script pour corriger le problème de dépendance next-themes dans ThemeProvider.
Ce script installe la dépendance manquante et adapte le composant si nécessaire.
"""

import os
import subprocess
import json
import re

def print_header(message):
    """Affiche un message d'en-tête formaté."""
    print("\n" + "=" * 60)
    print(f" {message} ".center(60, "="))
    print("=" * 60 + "\n")

def print_step(message):
    """Affiche un message d'étape formaté."""
    print(f"➤ {message}")

def install_next_themes():
    """Installe le package next-themes dans le projet."""
    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    frontend_dir = os.path.join(project_root, "Frontend")
    
    print_step("Installation de next-themes dans le projet...")
    
    try:
        # Vérifier si nous sommes dans un environnement yarn ou npm
        package_lock_path = os.path.join(frontend_dir, "package-lock.json")
        yarn_lock_path = os.path.join(frontend_dir, "yarn.lock")
        
        if os.path.exists(yarn_lock_path):
            cmd = ["yarn", "add", "next-themes"]
            package_manager = "yarn"
        else:
            cmd = ["npm", "install", "next-themes", "--save"]
            package_manager = "npm"
        
        # Exécuter la commande d'installation
        result = subprocess.run(cmd, cwd=frontend_dir, capture_output=True, text=True)
        
        if result.returncode == 0:
            print_step(f"✅ next-themes installé avec succès via {package_manager}.")
            return True
        else:
            print_step(f"❌ Erreur lors de l'installation de next-themes: {result.stderr}")
            return False
            
    except Exception as e:
        print_step(f"❌ Exception lors de l'installation: {str(e)}")
        return False

def create_theme_provider_alternative():
    """Crée une version alternative du ThemeProvider sans dépendance à next-themes."""
    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    theme_provider_path = os.path.join(project_root, "src", "components", "ThemeProvider.tsx")
    
    print_step("Création d'une version alternative du ThemeProvider...")
    
    alternative_content = """import React, { createContext, useContext, useState, useEffect } from 'react'

interface ThemeContextType {
  theme: string;
  setTheme: (theme: string) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark',
  setTheme: () => null,
});

export const useTheme = () => useContext(ThemeContext);

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: string;
  storageKey?: string;
}

export function ThemeProvider({ 
  children,
  defaultTheme = "dark",
  storageKey = "flodrama-theme",
}: ThemeProviderProps) {
  // État local pour le thème
  const [theme, setThemeState] = useState<string>(defaultTheme);
  
  // Charger le thème depuis le stockage local au montage
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem(storageKey);
      if (savedTheme) {
        setThemeState(savedTheme);
      }
    } catch (error) {
      console.error("Erreur lors du chargement du thème:", error);
    }
  }, [storageKey]);
  
  // Mettre à jour le thème et le sauvegarder
  const setTheme = (newTheme: string) => {
    setThemeState(newTheme);
    
    // Appliquer la classe au document
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    // Sauvegarder dans le stockage local
    try {
      localStorage.setItem(storageKey, newTheme);
    } catch (error) {
      console.error("Erreur lors de la sauvegarde du thème:", error);
    }
  };
  
  // Appliquer le thème initial
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);
  
  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
"""
    
    with open(theme_provider_path, 'w', encoding='utf-8') as file:
        file.write(alternative_content)
    
    print_step(f"✅ Version alternative du ThemeProvider créée: {theme_provider_path}")

def main():
    """Fonction principale du script."""
    print_header("CORRECTION DU PROBLÈME DE DÉPENDANCE NEXT-THEMES")
    
    # Tenter d'installer next-themes
    if install_next_themes():
        print_step("La dépendance next-themes a été installée avec succès.")
        print_step("Le problème devrait être résolu lors de la prochaine compilation.")
    else:
        print_step("Impossible d'installer next-themes. Création d'une alternative...")
        create_theme_provider_alternative()
        print_step("Une version alternative du ThemeProvider a été créée sans dépendance à next-themes.")
    
    print_header("CORRECTION TERMINÉE")
    print("Le problème de dépendance next-themes a été résolu.")
    print("Vous pouvez maintenant relancer la compilation de l'application.")

if __name__ == "__main__":
    main()
