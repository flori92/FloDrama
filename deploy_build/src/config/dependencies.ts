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
  
  // UI Components
  ui: {
    tailwind: {
      version: '^3.3.0',
      packages: [
        'tailwindcss',
        'postcss',
        'autoprefixer'
      ]
    },
    radix: {
      version: '^1.0.0',
      packages: [
        '@radix-ui/react-slot',
        '@radix-ui/react-dialog',
        '@radix-ui/react-dropdown-menu'
      ]
    }
  }
};

/**
 * Vérifie si un composant Lynx est disponible
 * @param componentName Nom du composant
 * @returns Promise<boolean> true si le composant est disponible en version Lynx
 */
export async function needsReactFallback(componentName: string): Promise<boolean> {
  try {
    // Vérifier si Lynx est disponible
    await import('@lynx/core');
    
    // Vérifier si le composant spécifique est disponible
    const lynxComponents = await import('@lynx/react');
    return !lynxComponents[componentName];
  } catch (error) {
    // Si l'import échoue, on doit utiliser la version React
    console.warn(`[dependencies] Lynx not available for ${componentName}, using React fallback`);
    return true;
  }
}

/**
 * Vérifie si une dépendance est disponible
 * @param packageName Nom du package
 * @returns Promise<boolean> true si le package est disponible
 */
export async function isDependencyAvailable(packageName: string): Promise<boolean> {
  try {
    await import(packageName);
    return true;
  } catch (error) {
    console.warn(`[dependencies] Package ${packageName} not available`);
    return false;
  }
}
