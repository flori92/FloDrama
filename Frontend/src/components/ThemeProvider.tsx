import React, { createContext, useContext, useEffect, useState } from "react";
import { createGlobalStyle } from 'styled-components';
import { theme } from '../config/theme';

type Theme = "dark" | "light" | "system";

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

const GlobalStyle = createGlobalStyle`
  :root {
    --background-primary: ${theme.colors.background.primary};
    --background-secondary: ${theme.colors.background.secondary};
    --primary-main: ${theme.colors.primary.main};
    --primary-light: ${theme.colors.primary.light};
    --accent-blue: ${theme.colors.accent.blue};
    --accent-fuchsia: ${theme.colors.accent.fuchsia};
    --accent-violet: ${theme.colors.accent.violet};
    --text-primary: ${theme.colors.text.primary};
    --text-secondary: ${theme.colors.text.secondary};
  }

  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: ${theme.typography.fontFamily.primary};
    background-color: var(--background-primary);
    color: var(--text-primary);
    line-height: 1.5;
  }

  h1, h2, h3, h4, h5, h6 {
    font-weight: ${theme.typography.weights.bold};
    color: var(--primary-main);
  }

  a {
    color: var(--primary-light);
    text-decoration: none;
    transition: ${theme.transitions.hover};

    &:hover {
      color: var(--accent-fuchsia);
    }
  }

  button {
    background: ${theme.colors.primary.gradient};
    border: none;
    border-radius: ${theme.borderRadius.md};
    color: var(--text-primary);
    padding: ${theme.spacing.sm} ${theme.spacing.md};
    cursor: pointer;
    transition: ${theme.transitions.hover};

    &:hover {
      transform: translateY(-2px);
      box-shadow: ${theme.shadows.hover};
    }
  }

  .card {
    background: var(--background-secondary);
    border-radius: ${theme.borderRadius.lg};
    padding: ${theme.spacing.md};
    box-shadow: ${theme.shadows.card};
    transition: ${theme.transitions.hover};

    &:hover {
      box-shadow: ${theme.shadows.hover};
    }
  }
`;

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "flodrama-ui-theme",
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
  );

  useEffect(() => {
    const root = window.document.documentElement;

    root.classList.remove("light", "dark");

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light";

      root.classList.add(systemTheme);
      return;
    }

    root.classList.add(theme);
  }, [theme]);

  const value = {
    theme,
    setTheme: (theme: Theme) => {
      localStorage.setItem(storageKey, theme);
      setTheme(theme);
    },
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      <GlobalStyle />
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined)
    throw new Error("useTheme doit être utilisé dans un ThemeProvider");

  return context;
};
