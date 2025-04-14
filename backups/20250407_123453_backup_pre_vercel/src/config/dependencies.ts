/**
 * Configuration des dépendances pour FloDrama
 * Centralise la gestion des versions et des packages
 */

export const DEPENDENCIES = {
  // Dépendances principales
  core: {
    lynx: {
      version: '^1.0.0',
      packages: [
        '@lynx/core',
        '@lynx/react',
        '@lynx/hooks',
        '@lynx/runtime'
      ]
    },
    react: {
      version: '^18.0.0',
      packages: [
        'react',
        'react-dom',
        '@types/react',
        '@types/react-dom'
      ]
    }
  },

  // Composants React de fallback
  fallbacks: {
    video: {
      package: 'react-player',
      version: '^2.12.0'
    },
    carousel: {
      package: 'react-slick',
      version: '^0.29.0'
    },
    modal: {
      package: 'react-modal',
      version: '^3.16.1'
    },
    form: {
      package: 'react-hook-form',
      version: '^7.45.0'
    },
    animation: {
      package: 'framer-motion',
      version: '^10.12.0'
    }
  },

  // Outils de développement
  devTools: {
    testing: {
      packages: [
        '@testing-library/react',
        '@testing-library/jest-dom',
        '@testing-library/user-event'
      ]
    },
    bundler: {
      packages: [
        'vite',
        '@vitejs/plugin-react',
        'typescript'
      ]
    }
  }
};

/**
 * Vérifie si une dépendance React est nécessaire
 */
export const needsReactFallback = (componentName: string): boolean => {
  try {
    // Vérifier si le composant Lynx est disponible
    const lynxComponent = require(`@lynx/core/${componentName}`);
    return !lynxComponent;
  } catch {
    return true;
  }
};

/**
 * Génère le package.json pour les dépendances
 */
export const generateDependencies = () => {
  const dependencies: Record<string, string> = {};
  const devDependencies: Record<string, string> = {};

  // Ajouter les dépendances principales
  DEPENDENCIES.core.lynx.packages.forEach(pkg => {
    dependencies[pkg] = DEPENDENCIES.core.lynx.version;
  });

  DEPENDENCIES.core.react.packages.forEach(pkg => {
    dependencies[pkg] = DEPENDENCIES.core.react.version;
  });

  // Ajouter les fallbacks React
  Object.values(DEPENDENCIES.fallbacks).forEach(({ package: pkg, version }) => {
    dependencies[pkg] = version;
  });

  // Ajouter les outils de développement
  Object.values(DEPENDENCIES.devTools).forEach(({ packages }) => {
    packages.forEach(pkg => {
      devDependencies[pkg] = 'latest';
    });
  });

  return { dependencies, devDependencies };
};
