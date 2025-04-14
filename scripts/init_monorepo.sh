#!/bin/bash
# Script d'initialisation du monorepo FloDrama avec Turborepo
# Créé le 29-03-2025

# Couleurs pour les messages
ROUGE='\033[0;31m'
VERT='\033[0;32m'
JAUNE='\033[0;33m'
NC='\033[0m' # No Color

# Fonction pour afficher les messages
log() {
  echo -e "${VERT}[$(date +"%Y-%m-%d %H:%M:%S")] $1${NC}"
}

erreur() {
  echo -e "${ROUGE}[$(date +"%Y-%m-%d %H:%M:%S")] ERREUR: $1${NC}"
}

attention() {
  echo -e "${JAUNE}[$(date +"%Y-%m-%d %H:%M:%S")] ATTENTION: $1${NC}"
}

# Vérifier si Node.js est installé
if ! command -v node &> /dev/null; then
  erreur "Node.js n'est pas installé. Veuillez l'installer avant de continuer."
  exit 1
fi

# Vérifier si Yarn est installé
if ! command -v yarn &> /dev/null; then
  attention "Yarn n'est pas installé. Installation en cours..."
  npm install -g yarn
fi

# Créer le répertoire du monorepo
MONOREPO_DIR="../FloDrama-Monorepo"
log "Création du répertoire monorepo: $MONOREPO_DIR"
mkdir -p "$MONOREPO_DIR"
cd "$MONOREPO_DIR" || {
  erreur "Impossible d'accéder au répertoire $MONOREPO_DIR"
  exit 1
}

# Initialiser Turborepo
log "Initialisation de Turborepo..."
npx create-turbo@latest --use-yarn

# Créer la structure de répertoires
log "Création de la structure de répertoires..."
mkdir -p apps/mobile apps/desktop packages/ui packages/core packages/api packages/theme packages/utils

# Initialiser le package.json racine
log "Configuration du package.json racine..."
cat > package.json << EOF
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
    "test": "turbo run test",
    "clean": "turbo run clean",
    "format": "prettier --write \"**/*.{ts,tsx,md}\"",
    "web": "yarn workspace @flodrama/web",
    "mobile": "yarn workspace @flodrama/mobile",
    "desktop": "yarn workspace @flodrama/desktop",
    "ui": "yarn workspace @flodrama/ui",
    "core": "yarn workspace @flodrama/core",
    "api": "yarn workspace @flodrama/api",
    "theme": "yarn workspace @flodrama/theme"
  },
  "devDependencies": {
    "prettier": "^2.8.8",
    "turbo": "latest"
  },
  "engines": {
    "node": ">=14.0.0"
  },
  "packageManager": "yarn@1.22.19"
}
EOF

# Configurer le package UI
log "Configuration du package UI..."
mkdir -p packages/ui/src
cat > packages/ui/package.json << EOF
{
  "name": "@flodrama/ui",
  "version": "0.1.0",
  "main": "./dist/index.js",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "sideEffects": false,
  "license": "MIT",
  "files": [
    "dist/**"
  ],
  "scripts": {
    "build": "tsup src/index.tsx --format esm,cjs --dts --external react",
    "dev": "tsup src/index.tsx --format esm,cjs --watch --dts --external react",
    "lint": "eslint \"src/**/*.ts*\"",
    "clean": "rm -rf .turbo && rm -rf node_modules && rm -rf dist"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@types/react-native": "^0.71.0",
    "eslint": "^8.40.0",
    "eslint-config-custom": "*",
    "react": "^18.2.0",
    "tsconfig": "*",
    "tsup": "^6.7.0",
    "typescript": "^5.0.4"
  },
  "dependencies": {
    "react-native-web": "^0.19.0",
    "styled-components": "^6.0.0"
  },
  "peerDependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-native": "^0.71.0"
  }
}
EOF

# Créer le fichier index.tsx pour UI
cat > packages/ui/src/index.tsx << EOF
export * from './components';
export * from './types';
EOF

# Créer les répertoires pour les composants UI
mkdir -p packages/ui/src/components packages/ui/src/types

# Créer un fichier de types de base
cat > packages/ui/src/types/index.ts << EOF
export interface BaseProps {
  testID?: string;
  style?: any;
  className?: string;
}

export interface TextProps extends BaseProps {
  children: React.ReactNode;
  variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'body1' | 'body2' | 'caption';
  color?: string;
  align?: 'left' | 'center' | 'right';
}

export interface ButtonProps extends BaseProps {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'text';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  fullWidth?: boolean;
  loading?: boolean;
}

export interface CardProps extends BaseProps {
  children: React.ReactNode;
  variant?: 'elevation' | 'outlined';
  padding?: number | string;
}
EOF

# Créer un fichier d'exportation pour les composants
cat > packages/ui/src/components/index.ts << EOF
export * from './Button';
export * from './Card';
export * from './Text';
EOF

# Créer un composant Button de base
mkdir -p packages/ui/src/components/Button
cat > packages/ui/src/components/Button/index.tsx << EOF
import React from 'react';
import { Pressable, Text } from 'react-native';
import styled from 'styled-components/native';
import { ButtonProps } from '../../types';

const StyledButton = styled(Pressable)<{
  variant: string;
  size: string;
  disabled: boolean;
  fullWidth: boolean;
}>\`
  background-color: \${(props) => 
    props.disabled 
      ? '#cccccc' 
      : props.variant === 'primary' 
        ? '#E50914' 
        : props.variant === 'secondary' 
          ? '#333333' 
          : 'transparent'
  };
  border-radius: 4px;
  padding: \${(props) => 
    props.size === 'small' 
      ? '8px 16px' 
      : props.size === 'large' 
        ? '16px 32px' 
        : '12px 24px'
  };
  align-items: center;
  justify-content: center;
  width: \${(props) => props.fullWidth ? '100%' : 'auto'};
  border-width: \${(props) => 
    props.variant === 'outline' ? '1px' : '0px'
  };
  border-color: \${(props) => 
    props.variant === 'outline' ? '#E50914' : 'transparent'
  };
\`;

const ButtonText = styled(Text)<{
  variant: string;
  disabled: boolean;
}>\`
  color: \${(props) => 
    props.disabled 
      ? '#666666' 
      : props.variant === 'primary' || props.variant === 'secondary' 
        ? '#FFFFFF' 
        : '#E50914'
  };
  font-weight: 600;
  font-size: 16px;
\`;

export const Button = ({
  children,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  fullWidth = false,
  testID,
  style,
  loading = false,
  ...props
}: ButtonProps) => {
  return (
    <StyledButton
      onPress={disabled ? undefined : onPress}
      variant={variant}
      size={size}
      disabled={disabled}
      fullWidth={fullWidth}
      testID={testID}
      style={style}
      {...props}
    >
      <ButtonText variant={variant} disabled={disabled}>
        {loading ? 'Chargement...' : children}
      </ButtonText>
    </StyledButton>
  );
};

export default Button;
EOF

# Configurer le package Theme
log "Configuration du package Theme..."
mkdir -p packages/theme/src
cat > packages/theme/package.json << EOF
{
  "name": "@flodrama/theme",
  "version": "0.1.0",
  "main": "./dist/index.js",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "sideEffects": false,
  "license": "MIT",
  "files": [
    "dist/**"
  ],
  "scripts": {
    "build": "tsup src/index.ts --format esm,cjs --dts",
    "dev": "tsup src/index.ts --format esm,cjs --watch --dts",
    "lint": "eslint \"src/**/*.ts*\"",
    "clean": "rm -rf .turbo && rm -rf node_modules && rm -rf dist"
  },
  "devDependencies": {
    "eslint": "^8.40.0",
    "eslint-config-custom": "*",
    "tsconfig": "*",
    "tsup": "^6.7.0",
    "typescript": "^5.0.4"
  }
}
EOF

# Créer le fichier index.ts pour Theme
cat > packages/theme/src/index.ts << EOF
export * from './colors';
export * from './typography';
export * from './spacing';
export * from './theme';
EOF

# Créer les fichiers de thème
cat > packages/theme/src/colors.ts << EOF
export const colors = {
  // Couleurs principales
  primary: {
    main: '#E50914',
    light: '#FF4D4F',
    dark: '#B00710',
    contrastText: '#FFFFFF',
  },
  secondary: {
    main: '#333333',
    light: '#555555',
    dark: '#111111',
    contrastText: '#FFFFFF',
  },
  
  // Couleurs de fond
  background: {
    default: '#141414',
    paper: '#1F1F1F',
    elevated: '#2A2A2A',
  },
  
  // Couleurs de texte
  text: {
    primary: '#FFFFFF',
    secondary: '#AAAAAA',
    disabled: '#666666',
  },
  
  // Couleurs d'état
  success: {
    main: '#4CAF50',
    light: '#7BC67E',
    dark: '#3B873E',
    contrastText: '#FFFFFF',
  },
  warning: {
    main: '#FF9800',
    light: '#FFB547',
    dark: '#C77700',
    contrastText: '#000000',
  },
  error: {
    main: '#F44336',
    light: '#F88078',
    dark: '#D32F2F',
    contrastText: '#FFFFFF',
  },
  info: {
    main: '#2196F3',
    light: '#64B6F7',
    dark: '#0B79D0',
    contrastText: '#FFFFFF',
  },
  
  // Couleurs diverses
  divider: 'rgba(255, 255, 255, 0.12)',
  overlay: 'rgba(0, 0, 0, 0.5)',
  backdrop: 'rgba(0, 0, 0, 0.8)',
};

export type ColorPalette = typeof colors;
EOF

cat > packages/theme/src/typography.ts << EOF
export const typography = {
  fontFamily: {
    primary: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    secondary: '"Bebas Neue", sans-serif',
  },
  fontWeight: {
    light: 300,
    regular: 400,
    medium: 500,
    semiBold: 600,
    bold: 700,
  },
  fontSize: {
    xs: '0.75rem',     // 12px
    sm: '0.875rem',    // 14px
    md: '1rem',        // 16px
    lg: '1.125rem',    // 18px
    xl: '1.25rem',     // 20px
    '2xl': '1.5rem',   // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem',  // 36px
    '5xl': '3rem',     // 48px
    '6xl': '3.75rem',  // 60px
  },
  lineHeight: {
    none: 1,
    tight: 1.25,
    snug: 1.375,
    normal: 1.5,
    relaxed: 1.625,
    loose: 2,
  },
  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },
  variants: {
    h1: {
      fontFamily: 'secondary',
      fontSize: '5xl',
      fontWeight: 'bold',
      lineHeight: 'tight',
      letterSpacing: 'wide',
    },
    h2: {
      fontFamily: 'secondary',
      fontSize: '4xl',
      fontWeight: 'bold',
      lineHeight: 'tight',
      letterSpacing: 'normal',
    },
    h3: {
      fontFamily: 'secondary',
      fontSize: '3xl',
      fontWeight: 'bold',
      lineHeight: 'snug',
      letterSpacing: 'normal',
    },
    h4: {
      fontFamily: 'primary',
      fontSize: '2xl',
      fontWeight: 'semiBold',
      lineHeight: 'snug',
      letterSpacing: 'normal',
    },
    h5: {
      fontFamily: 'primary',
      fontSize: 'xl',
      fontWeight: 'semiBold',
      lineHeight: 'normal',
      letterSpacing: 'normal',
    },
    h6: {
      fontFamily: 'primary',
      fontSize: 'lg',
      fontWeight: 'semiBold',
      lineHeight: 'normal',
      letterSpacing: 'normal',
    },
    body1: {
      fontFamily: 'primary',
      fontSize: 'md',
      fontWeight: 'regular',
      lineHeight: 'relaxed',
      letterSpacing: 'normal',
    },
    body2: {
      fontFamily: 'primary',
      fontSize: 'sm',
      fontWeight: 'regular',
      lineHeight: 'relaxed',
      letterSpacing: 'normal',
    },
    caption: {
      fontFamily: 'primary',
      fontSize: 'xs',
      fontWeight: 'regular',
      lineHeight: 'normal',
      letterSpacing: 'normal',
    },
    button: {
      fontFamily: 'primary',
      fontSize: 'md',
      fontWeight: 'semiBold',
      lineHeight: 'none',
      letterSpacing: 'wide',
      textTransform: 'uppercase',
    },
  },
};

export type Typography = typeof typography;
EOF

cat > packages/theme/src/spacing.ts << EOF
export const spacing = {
  // Base spacing unit (4px)
  unit: 4,
  
  // Spacing scale
  xs: 4,     // 4px
  sm: 8,     // 8px
  md: 16,    // 16px
  lg: 24,    // 24px
  xl: 32,    // 32px
  '2xl': 48, // 48px
  '3xl': 64, // 64px
  '4xl': 96, // 96px
  '5xl': 128, // 128px
  
  // Fonctions utilitaires
  getValue: (size: keyof typeof spacing | number): number => {
    if (typeof size === 'number') return size;
    return spacing[size] || spacing.md;
  },
  
  // Fonction pour générer des espacements cohérents
  getSpacing: (size: keyof typeof spacing | number): string => {
    const value = typeof size === 'number' ? size : spacing[size] || spacing.md;
    return `${value}px`;
  },
};

export type Spacing = typeof spacing;
EOF

cat > packages/theme/src/theme.ts << EOF
import { colors } from './colors';
import { typography } from './typography';
import { spacing } from './spacing';

export const theme = {
  colors,
  typography,
  spacing,
  
  // Breakpoints pour le responsive design
  breakpoints: {
    xs: 0,
    sm: 600,
    md: 960,
    lg: 1280,
    xl: 1920,
  },
  
  // Animations et transitions
  animation: {
    timing: {
      quick: '150ms',
      normal: '300ms',
      slow: '500ms',
    },
    easing: {
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
  },
  
  // Ombres
  shadows: {
    none: 'none',
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  },
  
  // Bordures
  border: {
    radius: {
      none: '0',
      sm: '0.125rem',
      md: '0.25rem',
      lg: '0.5rem',
      xl: '1rem',
      full: '9999px',
    },
    width: {
      none: '0',
      thin: '1px',
      thick: '2px',
      heavy: '4px',
    },
  },
};

export type Theme = typeof theme;
export default theme;
EOF

# Initialiser l'application web avec Next.js
log "Initialisation de l'application web avec Next.js..."
mkdir -p apps/web
cd apps/web || exit 1

# Créer un package.json pour l'application web
cat > package.json << EOF
{
  "name": "@flodrama/web",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "@flodrama/theme": "*",
    "@flodrama/ui": "*",
    "next": "^13.4.1",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-native-web": "^0.19.0",
    "styled-components": "^6.0.0"
  },
  "devDependencies": {
    "@types/node": "^18.16.3",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "eslint": "^8.40.0",
    "eslint-config-next": "^13.4.1",
    "typescript": "^5.0.4"
  }
}
EOF

# Initialiser l'application mobile avec React Native
log "Initialisation de l'application mobile avec React Native..."
cd ../mobile || exit 1

# Créer un package.json pour l'application mobile
cat > package.json << EOF
{
  "name": "@flodrama/mobile",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "android": "react-native run-android",
    "ios": "react-native run-ios",
    "start": "react-native start",
    "test": "jest",
    "lint": "eslint ."
  },
  "dependencies": {
    "@flodrama/theme": "*",
    "@flodrama/ui": "*",
    "react": "^18.2.0",
    "react-native": "^0.71.0",
    "react-native-gesture-handler": "^2.9.0",
    "react-native-reanimated": "^3.0.0",
    "react-native-safe-area-context": "^4.5.0",
    "react-native-screens": "^3.20.0"
  },
  "devDependencies": {
    "@babel/core": "^7.20.0",
    "@babel/preset-env": "^7.20.0",
    "@babel/runtime": "^7.20.0",
    "@react-native-community/eslint-config": "^3.2.0",
    "@tsconfig/react-native": "^2.0.2",
    "@types/jest": "^29.2.1",
    "@types/react": "^18.2.0",
    "@types/react-test-renderer": "^18.0.0",
    "babel-jest": "^29.2.1",
    "eslint": "^8.40.0",
    "jest": "^29.2.1",
    "metro-react-native-babel-preset": "0.73.9",
    "react-test-renderer": "18.2.0",
    "typescript": "^5.0.4"
  },
  "jest": {
    "preset": "react-native"
  }
}
EOF

# Initialiser l'application desktop avec Capacitor
log "Initialisation de l'application desktop avec Capacitor..."
cd ../desktop || exit 1

# Créer un package.json pour l'application desktop
cat > package.json << EOF
{
  "name": "@flodrama/desktop",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "electron:dev": "concurrently \"yarn dev\" \"electron .\"",
    "electron:build": "yarn build && electron-builder"
  },
  "dependencies": {
    "@capacitor/core": "^4.0.0",
    "@capacitor/electron": "^4.0.0",
    "@flodrama/theme": "*",
    "@flodrama/ui": "*",
    "electron-is-dev": "^2.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-native-web": "^0.19.0",
    "styled-components": "^6.0.0"
  },
  "devDependencies": {
    "@capacitor/cli": "^4.0.0",
    "@types/node": "^18.16.3",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@vitejs/plugin-react": "^4.0.0",
    "concurrently": "^8.0.1",
    "electron": "^24.3.0",
    "electron-builder": "^23.6.0",
    "typescript": "^5.0.4",
    "vite": "^4.3.5"
  },
  "build": {
    "appId": "com.flodrama.desktop",
    "productName": "FloDrama",
    "mac": {
      "category": "public.app-category.entertainment"
    },
    "win": {
      "target": "nsis"
    },
    "linux": {
      "target": "AppImage"
    }
  }
}
EOF

# Revenir au répertoire racine du monorepo
cd ../../

# Créer un fichier README.md
log "Création du fichier README.md..."
cat > README.md << EOF
# FloDrama Monorepo

Ce monorepo contient le code source de l'application FloDrama pour toutes les plateformes:
- Web (React)
- Mobile (React Native)
- Desktop (Capacitor/Electron)

## Structure du projet

\`\`\`
flodrama/
├── apps/
│   ├── mobile/          # Application React Native
│   ├── web/             # Application React pour le web
│   └── desktop/         # Application desktop avec Capacitor
├── packages/
│   ├── ui/              # Composants UI partagés
│   ├── core/            # Logique métier partagée
│   ├── api/             # Clients API partagés
│   ├── theme/           # Thème partagé
│   └── utils/           # Utilitaires partagés
\`\`\`

## Commandes disponibles

### Commandes globales

- \`yarn build\`: Construire toutes les applications et packages
- \`yarn dev\`: Lancer tous les environnements de développement
- \`yarn lint\`: Linter tous les projets
- \`yarn test\`: Exécuter tous les tests
- \`yarn clean\`: Nettoyer tous les projets

### Commandes spécifiques

- \`yarn web build\`: Construire l'application web
- \`yarn mobile ios\`: Lancer l'application mobile sur iOS
- \`yarn mobile android\`: Lancer l'application mobile sur Android
- \`yarn desktop electron:build\`: Construire l'application desktop

## Développement

1. Installer les dépendances: \`yarn install\`
2. Lancer l'environnement de développement: \`yarn dev\`

## Déploiement

Le déploiement est géré automatiquement par AWS CodePipeline:
- Web: AWS S3 + CloudFront
- Mobile: App Store et Google Play via AWS Device Farm
- Desktop: Génération d'installateurs via AWS CodeBuild
EOF

# Créer un fichier .gitignore
log "Création du fichier .gitignore..."
cat > .gitignore << EOF
# Dépendances
node_modules
.pnp
.pnp.js

# Tests
coverage

# Production
build
dist
out
.next
.nuxt
.turbo

# Divers
.DS_Store
.env.local
.env.development.local
.env.test.local
.env.production.local
.env

# Logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Éditeur
.idea
.vscode
*.swp
*.swo

# Mobile
.gradle
local.properties
*.iml
*.hprof
.cxx/
*.keystore
!debug.keystore

# iOS
Pods/
*.xcworkspace
*.pbxuser
!default.pbxuser
*.mode1v3
!default.mode1v3
*.mode2v3
!default.mode2v3
*.perspectivev3
!default.perspectivev3
xcuserdata
*.xccheckout
*.moved-aside
DerivedData
*.hmap
*.ipa
*.xcuserstate
project.xcworkspace

# Android
.idea
.gradle
local.properties
*.iml
/android/build/
/android/app/build/
/android/captures/
/android/app/release/

# Capacitor
/ios/App/public/
/android/app/src/main/assets/public/
EOF

# Installer les dépendances
log "Installation des dépendances..."
yarn install

log "Initialisation du monorepo terminée avec succès!"
log "Pour commencer à développer, accédez au répertoire $MONOREPO_DIR et exécutez 'yarn dev'"
