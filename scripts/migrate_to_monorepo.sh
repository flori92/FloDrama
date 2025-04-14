#!/bin/bash

# Configuration des couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Variables globales
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MONOREPO_DIR="$SCRIPT_DIR/../FloDrama-Monorepo"
MIGRATION_LOG="$SCRIPT_DIR/migration_log.txt"

# Création du fichier de log
touch "$MIGRATION_LOG"

# Fonctions de logging
log_info() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] INFO: $1" | tee -a "$MIGRATION_LOG"
}

log_success() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] SUCCESS: $1" | tee -a "$MIGRATION_LOG"
}

log_error() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] ERROR: $1" | tee -a "$MIGRATION_LOG"
}

check_error() {
    local success_msg="$1"
    local error_msg="$2"
    if [ $? -eq 0 ]; then
        log_success "$success_msg"
    else
        log_error "$error_msg"
        cat "$MIGRATION_LOG"
        exit 1
    fi
}

# Début de la migration
log_info "Démarrage de la migration vers le monorepo"

# 1. Création de la structure de base du monorepo
log_info "Création de la structure du monorepo..."

# Nettoyage du répertoire existant
rm -rf "$MONOREPO_DIR"
mkdir -p "$MONOREPO_DIR"
check_error "Nettoyage du répertoire monorepo effectué" "Erreur lors du nettoyage du répertoire monorepo"

# Création de la structure
mkdir -p "$MONOREPO_DIR"/{apps/{web,mobile,desktop},packages/{ui,core,api,theme,utils}}/src
check_error "Structure du monorepo créée" "Erreur lors de la création de la structure"

# 2. Copie des fichiers existants
log_info "Copie des fichiers existants..."

# Copie des composants UI
log_info "Copie des composants UI..."
mkdir -p "$MONOREPO_DIR/packages/ui/src/components"
cp -r /Users/floriace/FLO_DRAMA/FloDrama/src/components/* "$MONOREPO_DIR/packages/ui/src/components/" 2>> "$MIGRATION_LOG"
check_error "Composants UI copiés" "Erreur lors de la copie des composants UI"

# Copie des hooks
log_info "Copie des hooks..."
mkdir -p "$MONOREPO_DIR/packages/ui/src/hooks"
cp -r /Users/floriace/FLO_DRAMA/FloDrama/src/hooks/* "$MONOREPO_DIR/packages/ui/src/hooks/" 2>> "$MIGRATION_LOG"
check_error "Hooks copiés" "Erreur lors de la copie des hooks"

# Copie du thème
log_info "Copie du thème..."
mkdir -p "$MONOREPO_DIR/packages/theme/src"
cp -r /Users/floriace/FLO_DRAMA/FloDrama/src/themes/* "$MONOREPO_DIR/packages/theme/src/" 2>> "$MIGRATION_LOG"
check_error "Thème copié" "Erreur lors de la copie du thème"

# Copie des utilitaires
log_info "Copie des utilitaires..."
mkdir -p "$MONOREPO_DIR/packages/utils/src"
cp -r /Users/floriace/FLO_DRAMA/FloDrama/src/utils/* "$MONOREPO_DIR/packages/utils/src/" 2>> "$MIGRATION_LOG"
check_error "Utilitaires copiés" "Erreur lors de la copie des utilitaires"

# Copie de l'API
log_info "Copie de l'API..."
mkdir -p "$MONOREPO_DIR/packages/api/src"
cp -r /Users/floriace/FLO_DRAMA/FloDrama/src/api/* "$MONOREPO_DIR/packages/api/src/" 2>> "$MIGRATION_LOG"
check_error "API copiée" "Erreur lors de la copie de l'API"

# 3. Configuration des packages
log_info "Configuration des packages..."

# Configuration TypeScript racine
cat > "$MONOREPO_DIR/tsconfig.json" << EOL
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "compilerOptions": {
    "target": "es2017",
    "module": "esnext",
    "lib": ["dom", "dom.iterable", "esnext"],
    "declaration": true,
    "declarationMap": true,
    "jsx": "react-jsx",
    "strict": true,
    "moduleResolution": "node",
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "baseUrl": ".",
    "paths": {
      "@flodrama/*": ["packages/*/src"]
    }
  },
  "exclude": ["node_modules", "**/dist"]
}
EOL
check_error "TypeScript racine configuré" "Erreur lors de la configuration TypeScript racine"

# Configuration TypeScript pour UI
cat > "$MONOREPO_DIR/packages/ui/tsconfig.json" << EOL
{
  "extends": "../../tsconfig.json",
  "include": ["src"],
  "exclude": ["node_modules", "dist"],
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "composite": true,
    "jsx": "react-jsx",
    "lib": ["dom", "dom.iterable", "esnext"],
    "module": "esnext",
    "target": "es6",
    "strict": true,
    "moduleResolution": "node",
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "allowSyntheticDefaultImports": true,
    "declaration": true,
    "declarationMap": true
  }
}
EOL
check_error "TypeScript UI configuré" "Erreur lors de la configuration TypeScript UI"

# Configuration TypeScript pour Theme
cat > "$MONOREPO_DIR/packages/theme/tsconfig.json" << EOL
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "target": "es2017",
    "module": "esnext",
    "moduleResolution": "node",
    "declaration": true,
    "sourceMap": true,
    "outDir": "./dist",
    "strict": true,
    "esModuleInterop": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
EOL
check_error "TypeScript Theme configuré" "Erreur lors de la configuration TypeScript Theme"

# Configuration TypeScript pour Utils
cat > "$MONOREPO_DIR/packages/utils/tsconfig.json" << EOL
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "target": "es2017",
    "module": "esnext",
    "moduleResolution": "node",
    "declaration": true,
    "sourceMap": true,
    "outDir": "./dist",
    "strict": true,
    "esModuleInterop": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
EOL
check_error "TypeScript Utils configuré" "Erreur lors de la configuration TypeScript Utils"

# Configuration TypeScript pour API
cat > "$MONOREPO_DIR/packages/api/tsconfig.json" << EOL
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "target": "es2017",
    "module": "esnext",
    "moduleResolution": "node",
    "declaration": true,
    "sourceMap": true,
    "outDir": "./dist",
    "strict": true,
    "esModuleInterop": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
EOL
check_error "TypeScript API configuré" "Erreur lors de la configuration TypeScript API"

# Installation des dépendances globales
log_info "Installation des dépendances globales..."
yarn global add tsup typescript @types/node 2>> "$MIGRATION_LOG"
check_error "Dépendances globales installées" "Erreur lors de l'installation des dépendances globales"

# Mise à jour du package.json de UI pour une architecture React pure
cat > "$MONOREPO_DIR/packages/ui/package.json" << EOL
{
  "name": "@flodrama/ui",
  "version": "0.1.0",
  "private": true,
  "main": "./dist/index.js",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "sideEffects": false,
  "license": "MIT",
  "files": ["dist/**"],
  "scripts": {
    "build": "tsup src/index.tsx --format esm,cjs --dts --clean --tsconfig tsconfig.json",
    "dev": "tsup src/index.tsx --format esm,cjs --watch --dts --clean --tsconfig tsconfig.json",
    "lint": "eslint \"src/**/*.ts*\"",
    "clean": "rm -rf .turbo && rm -rf node_modules && rm -rf dist"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0",
    "tsup": "^8.0.0",
    "eslint": "^8.0.0"
  }
}
EOL

# Création des composants React purs
log_info "Création des composants React..."

# Button component
mkdir -p "$MONOREPO_DIR/packages/ui/src/components/Button"
cat > "$MONOREPO_DIR/packages/ui/src/components/Button/Button.tsx" << EOL
import React, { ButtonHTMLAttributes } from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'small' | 'medium' | 'large';
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'medium',
  className = '',
  children,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variantStyles = {
    primary: 'bg-gradient-to-r from-blue-500 to-fuchsia-500 text-white hover:from-blue-600 hover:to-fuchsia-600',
    secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200',
    outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50'
  };

  const sizeStyles = {
    small: 'px-3 py-1.5 text-sm',
    medium: 'px-4 py-2 text-base',
    large: 'px-6 py-3 text-lg'
  };

  return (
    <button
      className={\`\${baseStyles} \${variantStyles[variant]} \${sizeStyles[size]} \${className}\`}
      {...props}
    >
      {children}
    </button>
  );
};
EOL

cat > "$MONOREPO_DIR/packages/ui/src/components/Button/index.ts" << EOL
export * from './Button';
EOL

# Components index
cat > "$MONOREPO_DIR/packages/ui/src/components/index.ts" << EOL
export * from './Button';
EOL

# Hooks
mkdir -p "$MONOREPO_DIR/packages/ui/src/hooks"
cat > "$MONOREPO_DIR/packages/ui/src/hooks/useMediaQuery.ts" << EOL
import { useEffect, useState } from 'react';

export const useMediaQuery = (query: string): boolean => {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    setMatches(mediaQuery.matches);

    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [query]);

  return matches;
};
EOL

cat > "$MONOREPO_DIR/packages/ui/src/hooks/index.ts" << EOL
export * from './useMediaQuery';
EOL

# Index principal de UI
cat > "$MONOREPO_DIR/packages/ui/src/index.tsx" << EOL
export * from './components';
export * from './hooks';
EOL

log_success "Composants React créés"

# Package Theme
cat > "$MONOREPO_DIR/packages/theme/package.json" << EOL
{
  "name": "@flodrama/theme",
  "version": "0.1.0",
  "private": true,
  "main": "./dist/index.js",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "sideEffects": false,
  "license": "MIT",
  "files": ["dist/**"],
  "scripts": {
    "build": "tsup src/index.ts --format esm,cjs --dts --clean --tsconfig tsconfig.json",
    "dev": "tsup src/index.ts --format esm,cjs --watch --dts --clean --tsconfig tsconfig.json",
    "lint": "eslint \"src/**/*.ts*\"",
    "clean": "rm -rf .turbo && rm -rf node_modules && rm -rf dist"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "tsup": "^8.0.0",
    "eslint": "^8.0.0"
  }
}
EOL
check_error "Package Theme configuré" "Erreur lors de la configuration du package Theme"

# Package Utils
cat > "$MONOREPO_DIR/packages/utils/package.json" << EOL
{
  "name": "@flodrama/utils",
  "version": "0.1.0",
  "private": true,
  "main": "./dist/index.js",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "sideEffects": false,
  "license": "MIT",
  "files": ["dist/**"],
  "scripts": {
    "build": "tsup src/index.ts --format esm,cjs --dts --clean --tsconfig tsconfig.json",
    "dev": "tsup src/index.ts --format esm,cjs --watch --dts --clean --tsconfig tsconfig.json",
    "lint": "eslint \"src/**/*.ts*\"",
    "clean": "rm -rf .turbo && rm -rf node_modules && rm -rf dist"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "tsup": "^8.0.0",
    "eslint": "^8.0.0"
  }
}
EOL
check_error "Package Utils configuré" "Erreur lors de la configuration du package Utils"

# Package API
cat > "$MONOREPO_DIR/packages/api/package.json" << EOL
{
  "name": "@flodrama/api",
  "version": "0.1.0",
  "private": true,
  "main": "./dist/index.js",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "sideEffects": false,
  "license": "MIT",
  "files": ["dist/**"],
  "scripts": {
    "build": "tsup src/index.ts --format esm,cjs --dts --clean --tsconfig tsconfig.json",
    "dev": "tsup src/index.ts --format esm,cjs --watch --dts --clean --tsconfig tsconfig.json",
    "lint": "eslint \"src/**/*.ts*\"",
    "clean": "rm -rf .turbo && rm -rf node_modules && rm -rf dist"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "tsup": "^8.0.0",
    "eslint": "^8.0.0"
  }
}
EOL
check_error "Package API configuré" "Erreur lors de la configuration du package API"

# Configuration racine du monorepo
cat > "$MONOREPO_DIR/package.json" << EOL
{
  "name": "flodrama-monorepo",
  "version": "0.1.0",
  "private": true,
  "workspaces": [
    "apps/*",
    "packages/*"
  ],
  "scripts": {
    "build": "turbo run build",
    "dev": "turbo run dev",
    "lint": "turbo run lint",
    "clean": "turbo run clean"
  },
  "devDependencies": {
    "turbo": "latest",
    "typescript": "^5.0.0"
  }
}
EOL
check_error "Package racine configuré" "Erreur lors de la configuration du package racine"

# Configuration Turborepo
cat > "$MONOREPO_DIR/turbo.json" << EOL
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["**/.env.*local"],
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**", "build/**"]
    },
    "lint": {
      "outputs": []
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "clean": {
      "cache": false
    }
  }
}
EOL
check_error "Turborepo configuré" "Erreur lors de la configuration de Turborepo"

# 4. Installation des dépendances package par package
log_info "Installation des dépendances..."

# Theme
cd "$MONOREPO_DIR/packages/theme" || exit 1
yarn install --frozen-lockfile 2>> "$MIGRATION_LOG"
check_error "Dépendances du thème installées" "Erreur lors de l'installation des dépendances du thème"

# Utils
cd "$MONOREPO_DIR/packages/utils" || exit 1
yarn install --frozen-lockfile 2>> "$MIGRATION_LOG"
check_error "Dépendances utils installées" "Erreur lors de l'installation des dépendances utils"

# API
cd "$MONOREPO_DIR/packages/api" || exit 1
yarn install --frozen-lockfile 2>> "$MIGRATION_LOG"
check_error "Dépendances API installées" "Erreur lors de l'installation des dépendances API"

# UI
cd "$MONOREPO_DIR/packages/ui" || exit 1
yarn install --frozen-lockfile 2>> "$MIGRATION_LOG"
check_error "Dépendances UI installées" "Erreur lors de l'installation des dépendances UI"

# Root
cd "$MONOREPO_DIR" || exit 1
yarn install --frozen-lockfile 2>> "$MIGRATION_LOG"
check_error "Dépendances racine installées" "Erreur lors de l'installation des dépendances racine"

# 5. Création des fichiers index.ts pour chaque package
log_info "Création des fichiers index.ts..."

# UI
mkdir -p "$MONOREPO_DIR/packages/ui/src/components"
mkdir -p "$MONOREPO_DIR/packages/ui/src/hooks"

# Components index
cat > "$MONOREPO_DIR/packages/ui/src/components/index.ts" << EOL
// Export des composants
export * from './Button';
EOL

# Button component
mkdir -p "$MONOREPO_DIR/packages/ui/src/components/Button"
cat > "$MONOREPO_DIR/packages/ui/src/components/Button/Button.tsx" << EOL
import React, { ButtonHTMLAttributes } from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'small' | 'medium' | 'large';
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'medium',
  className = '',
  children,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variantStyles = {
    primary: 'bg-gradient-to-r from-blue-500 to-fuchsia-500 text-white hover:from-blue-600 hover:to-fuchsia-600',
    secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200',
    outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50'
  };

  const sizeStyles = {
    small: 'px-3 py-1.5 text-sm',
    medium: 'px-4 py-2 text-base',
    large: 'px-6 py-3 text-lg'
  };

  return (
    <button
      className={\`\${baseStyles} \${variantStyles[variant]} \${sizeStyles[size]} \${className}\`}
      {...props}
    >
      {children}
    </button>
  );
};
EOL

cat > "$MONOREPO_DIR/packages/ui/src/components/Button/index.ts" << EOL
export * from './Button';
EOL

# Hooks index
cat > "$MONOREPO_DIR/packages/ui/src/hooks/index.ts" << EOL
// Export des hooks
export * from './useMediaQuery';
EOL

# useMediaQuery hook
mkdir -p "$MONOREPO_DIR/packages/ui/src/hooks"
cat > "$MONOREPO_DIR/packages/ui/src/hooks/useMediaQuery.ts" << EOL
import { useEffect, useState } from 'react';

export const useMediaQuery = (query: string): boolean => {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    setMatches(mediaQuery.matches);

    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [query]);

  return matches;
};
EOL

# Création des fichiers du système hybride
log_info "Création des fichiers du système hybride..."

# Création du dossier hybrid
mkdir -p "$MONOREPO_DIR/packages/ui/src/hybrid"

# HybridComponentProvider.tsx
cat > "$MONOREPO_DIR/packages/ui/src/hybrid/HybridComponentProvider.tsx" << EOL
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface HybridSystemContextType {
  isLynxAvailable: boolean;
  forceReact: boolean;
  setForceReact: (force: boolean) => void;
}

const HybridSystemContext = createContext<HybridSystemContextType | null>(null);

export const useHybridSystemContext = () => {
  const context = useContext(HybridSystemContext);
  if (!context) {
    throw new Error('useHybridSystemContext must be used within a HybridComponentProvider');
  }
  return context;
};

export interface HybridComponentProviderProps {
  children: ReactNode;
}

export const HybridComponentProvider: React.FC<HybridComponentProviderProps> = ({ children }) => {
  const [isLynxAvailable, setIsLynxAvailable] = useState(false);
  const [forceReact, setForceReact] = useState(false);

  useEffect(() => {
    const checkLynxAvailability = async () => {
      try {
        // Vérifier si Lynx est disponible
        const lynx = await import('@lynx-js/core');
        setIsLynxAvailable(!!lynx);
      } catch {
        setIsLynxAvailable(false);
      }
    };

    checkLynxAvailability();
  }, []);

  return (
    <HybridSystemContext.Provider value={{ isLynxAvailable, forceReact, setForceReact }}>
      {children}
    </HybridSystemContext.Provider>
  );
};
EOL

# useHybridSystem.ts
cat > "$MONOREPO_DIR/packages/ui/src/hybrid/useHybridSystem.ts" << EOL
import { useHybridSystemContext } from './HybridComponentProvider';

export const useHybridSystem = () => {
  const { isLynxAvailable, forceReact, setForceReact } = useHybridSystemContext();

  return {
    isLynxAvailable,
    forceReact,
    setForceReact,
    useLynx: isLynxAvailable && !forceReact
  };
};
EOL

# HybridComponent.tsx
cat > "$MONOREPO_DIR/packages/ui/src/hybrid/HybridComponent.tsx" << EOL
import React, { Suspense } from 'react';
import { useHybridSystem } from './useHybridSystem';

interface HybridComponentProps {
  lynxComponent: React.LazyExoticComponent<React.ComponentType<any>>;
  reactComponent: React.LazyExoticComponent<React.ComponentType<any>>;
  fallback?: React.ReactNode;
  [key: string]: any;
}

export const HybridComponent: React.FC<HybridComponentProps> = ({
  lynxComponent: LynxComponent,
  reactComponent: ReactComponent,
  fallback = null,
  ...props
}) => {
  const { useLynx } = useHybridSystem();
  const Component = useLynx ? LynxComponent : ReactComponent;

  return (
    <Suspense fallback={fallback}>
      <Component {...props} />
    </Suspense>
  );
};
EOL

# useHybridComponent.ts
cat > "$MONOREPO_DIR/packages/ui/src/hybrid/useHybridComponent.ts" << EOL
import { useCallback } from 'react';
import { useHybridSystem } from './useHybridSystem';

export const useHybridComponent = <T extends Record<string, any>>(
  lynxImport: () => Promise<T>,
  reactImport: () => Promise<T>
) => {
  const { useLynx } = useHybridSystem();

  const loadComponent = useCallback(async () => {
    try {
      const module = await (useLynx ? lynxImport() : reactImport());
      return module;
    } catch (error) {
      console.error('Erreur lors du chargement du composant:', error);
      // Fallback vers React en cas d'erreur
      return reactImport();
    }
  }, [useLynx, lynxImport, reactImport]);

  return { loadComponent };
};
EOL

# HybridSystemControlPanel.tsx
cat > "$MONOREPO_DIR/packages/ui/src/hybrid/HybridSystemControlPanel.tsx" << EOL
import React from 'react';
import { useHybridSystem } from './useHybridSystem';

export const HybridSystemControlPanel: React.FC = () => {
  const { isLynxAvailable, forceReact, setForceReact } = useHybridSystem();

  return (
    <div
      style={{
        position: process.env.NODE_ENV === 'development' ? 'fixed' : 'none',
        bottom: '20px',
        right: '20px',
        padding: '10px',
        backgroundColor: '#f0f0f0',
        borderRadius: '5px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
      }}
    >
      <div>
        <strong>État du système hybride:</strong>
      </div>
      <div>
        Lynx disponible: {isLynxAvailable ? '✅' : '❌'}
      </div>
      <div>
        Mode forcé React: {forceReact ? '✅' : '❌'}
      </div>
      <button
        onClick={() => setForceReact(!forceReact)}
        style={{
          padding: '5px 10px',
          borderRadius: '3px',
          border: '1px solid #ccc',
          backgroundColor: forceReact ? '#ff4444' : '#44ff44',
          cursor: 'pointer'
        }}
      >
        {forceReact ? 'Désactiver React forcé' : 'Activer React forcé'}
      </button>
    </div>
  );
};
EOL

# index.ts pour hybrid
cat > "$MONOREPO_DIR/packages/ui/src/hybrid/index.ts" << EOL
export { HybridComponentProvider } from './HybridComponentProvider';
export type { HybridComponentProviderProps } from './HybridComponentProvider';
export { useHybridSystem } from './useHybridSystem';
export { HybridComponent } from './HybridComponent';
export { useHybridComponent } from './useHybridComponent';
export { HybridSystemControlPanel } from './HybridSystemControlPanel';
EOL

log_success "Fichiers du système hybride créés"

# Index principal de UI
cat > "$MONOREPO_DIR/packages/ui/src/index.tsx" << EOL
export * from './components';
export * from './hooks';
export * from './hybrid';
EOL

log_success "Index UI créé"

# Theme
mkdir -p "$MONOREPO_DIR/packages/theme/src"
cat > "$MONOREPO_DIR/packages/theme/src/theme.ts" << EOL
// Export du thème
export const theme = {};
EOL

cat > "$MONOREPO_DIR/packages/theme/src/index.ts" << EOL
export * from './theme';
EOL
check_error "Index Theme créé" "Erreur lors de la création de l'index Theme"

# Utils
mkdir -p "$MONOREPO_DIR/packages/utils/src"
cat > "$MONOREPO_DIR/packages/utils/src/utils.ts" << EOL
/**
 * Formate une date en chaîne de caractères selon le format français
 * @param date - La date à formater
 * @returns La date formatée en chaîne de caractères
 */
export const formatDate = (date: Date): string => {
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

/**
 * Vérifie si une chaîne est vide ou ne contient que des espaces
 * @param str - La chaîne à vérifier
 * @returns true si la chaîne est vide ou ne contient que des espaces
 */
export const isEmpty = (str: string): boolean => {
  return str.trim().length === 0;
};
EOL

cat > "$MONOREPO_DIR/packages/utils/src/index.ts" << EOL
export { formatDate, isEmpty } from './utils';
EOL

log_success "Index Utils créé"

# API
mkdir -p "$MONOREPO_DIR/packages/api/src"
cat > "$MONOREPO_DIR/packages/api/src/api.ts" << EOL
/**
 * Configuration de base pour les requêtes API
 */
export interface ApiConfig {
  baseUrl: string;
  headers?: Record<string, string>;
}

/**
 * Client API pour FloDrama
 */
export class ApiClient {
  private baseUrl: string;
  private headers: Record<string, string>;

  constructor(config: ApiConfig) {
    this.baseUrl = config.baseUrl;
    this.headers = {
      'Content-Type': 'application/json',
      ...config.headers
    };
  }

  /**
   * Effectue une requête GET
   * @param endpoint - Le point de terminaison de l'API
   * @returns La réponse de l'API
   */
  async get<T>(endpoint: string): Promise<T> {
    const response = await fetch(\`\${this.baseUrl}\${endpoint}\`, {
      method: 'GET',
      headers: this.headers
    });

    if (!response.ok) {
      throw new Error(\`Erreur HTTP: \${response.status}\`);
    }

    return response.json();
  }

  /**
   * Effectue une requête POST
   * @param endpoint - Le point de terminaison de l'API
   * @param data - Les données à envoyer
   * @returns La réponse de l'API
   */
  async post<T>(endpoint: string, data: unknown): Promise<T> {
    const response = await fetch(\`\${this.baseUrl}\${endpoint}\`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(\`Erreur HTTP: \${response.status}\`);
    }

    return response.json();
  }
}

/**
 * Crée une instance du client API avec la configuration par défaut
 * @param config - Configuration optionnelle pour surcharger les valeurs par défaut
 * @returns Une instance du client API
 */
export const createApiClient = (config?: Partial<ApiConfig>): ApiClient => {
  const defaultConfig: ApiConfig = {
    baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
    headers: {}
  };

  return new ApiClient({
    ...defaultConfig,
    ...config,
    headers: {
      ...defaultConfig.headers,
      ...config?.headers
    }
  });
};
EOL

cat > "$MONOREPO_DIR/packages/api/src/index.ts" << EOL
export { ApiClient, createApiClient } from './api';
export type { ApiConfig } from './api';
EOL

log_success "Index API créé"

# 6. Build initial
log_info "Build initial des packages..."

# Build de chaque package séparément avec nettoyage préalable
(cd "$MONOREPO_DIR/packages/theme" && yarn clean && yarn build) 2>> "$MIGRATION_LOG"
check_error "Build du package theme réussi" "Erreur lors du build du package theme"

(cd "$MONOREPO_DIR/packages/utils" && yarn clean && yarn build) 2>> "$MIGRATION_LOG"
check_error "Build du package utils réussi" "Erreur lors du build du package utils"

(cd "$MONOREPO_DIR/packages/api" && yarn clean && yarn build) 2>> "$MIGRATION_LOG"
check_error "Build du package api réussi" "Erreur lors du build du package api"

(cd "$MONOREPO_DIR/packages/ui" && yarn clean && TSUP_FORCE=true yarn build) 2>> "$MIGRATION_LOG"
check_error "Build du package ui réussi" "Erreur lors du build du package ui"

(cd "$MONOREPO_DIR" && yarn build) 2>> "$MIGRATION_LOG"
check_error "Build global réussi" "Erreur lors du build global"

log_success "Build initial réussi"

log_success "Migration terminée avec succès !"
log_info "Log complet disponible dans : $MIGRATION_LOG"
