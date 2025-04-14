#!/bin/bash
# Script de configuration de l'environnement de développement pour FloDrama
# Auteur: Cascade AI
# Date: 2025-04-07

# Couleurs pour les logs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Configuration de l'environnement de développement FloDrama ===${NC}"

# Créer un dossier pour les logs
LOG_DIR="logs"
mkdir -p $LOG_DIR
LOG_FILE="$LOG_DIR/setup-dev-$(date +%Y%m%d_%H%M%S).log"

# Fonction pour logger les actions
log() {
    echo -e "$1" | tee -a $LOG_FILE
}

# 1. Vérifier et installer les dépendances nécessaires
log "${BLUE}1. Vérification des dépendances...${NC}"

# Liste des dépendances à vérifier
DEPS=("node" "npm" "git" "vercel" "aws")

for dep in "${DEPS[@]}"; do
    if ! command -v $dep &> /dev/null; then
        log "${YELLOW}$dep n'est pas installé. Installation...${NC}"
        
        case $dep in
            node|npm)
                log "${YELLOW}Pour installer Node.js et npm, veuillez visiter https://nodejs.org/${NC}"
                ;;
            git)
                log "${YELLOW}Pour installer Git, veuillez visiter https://git-scm.com/${NC}"
                ;;
            vercel)
                log "${YELLOW}Installation de Vercel CLI...${NC}"
                npm install -g vercel
                ;;
            aws)
                log "${YELLOW}Pour installer AWS CLI, veuillez visiter https://aws.amazon.com/cli/${NC}"
                ;;
        esac
    else
        log "${GREEN}$dep est déjà installé${NC}"
    fi
done

# 2. Mettre à jour package.json avec les dernières dépendances
log "${BLUE}2. Mise à jour de package.json...${NC}"

# Sauvegarder l'ancien package.json
cp package.json package.json.bak

# Créer un nouveau package.json optimisé
cat > package.json << EOF
{
  "name": "flodrama",
  "version": "1.0.0",
  "private": true,
  "description": "Plateforme de streaming dédiée aux dramas et films asiatiques",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "lint": "eslint src --ext .js,.jsx,.ts,.tsx",
    "format": "prettier --write 'src/**/*.{js,jsx,ts,tsx,css,scss}'",
    "test": "vitest run",
    "test:watch": "vitest",
    "deploy": "bash scripts/deploiement-automatique-complet.sh",
    "deploy:force": "bash scripts/remplacer-page-maintenance-force.sh"
  },
  "dependencies": {
    "@emotion/react": "^11.11.0",
    "@emotion/styled": "^11.11.0",
    "@mui/icons-material": "^5.11.16",
    "@mui/material": "^5.13.0",
    "axios": "^1.4.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-player": "^2.12.0",
    "react-router-dom": "^6.11.1"
  },
  "devDependencies": {
    "@types/node": "^20.1.4",
    "@types/react": "^18.2.6",
    "@types/react-dom": "^18.2.4",
    "@typescript-eslint/eslint-plugin": "^5.59.5",
    "@typescript-eslint/parser": "^5.59.5",
    "@vitejs/plugin-react": "^4.0.0",
    "eslint": "^8.40.0",
    "eslint-plugin-react": "^7.32.2",
    "eslint-plugin-react-hooks": "^4.6.0",
    "prettier": "^2.8.8",
    "typescript": "^5.0.4",
    "vite": "^4.3.5",
    "vitest": "^0.31.0"
  }
}
EOF

# 3. Créer une configuration Vite optimisée
log "${BLUE}3. Création d'une configuration Vite optimisée...${NC}"

cat > vite.config.ts << EOF
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@components': resolve(__dirname, 'src/components'),
      '@pages': resolve(__dirname, 'src/pages'),
      '@services': resolve(__dirname, 'src/services'),
      '@hooks': resolve(__dirname, 'src/hooks'),
      '@utils': resolve(__dirname, 'src/utils'),
      '@assets': resolve(__dirname, 'src/assets'),
      '@styles': resolve(__dirname, 'src/styles'),
      '@types': resolve(__dirname, 'src/types')
    }
  },
  server: {
    port: 3000,
    open: true
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: ['@mui/material', '@mui/icons-material', '@emotion/react', '@emotion/styled']
        }
      }
    }
  }
});
EOF

# 4. Créer un fichier .env pour le développement
log "${BLUE}4. Création du fichier .env pour le développement...${NC}"

cat > .env.development << EOF
VITE_APP_TITLE=FloDrama (Dev)
VITE_APP_API_URL=http://localhost:3001/api
VITE_APP_MAINTENANCE_MODE=false
VITE_APP_ENV=development
VITE_APP_DEBUG=true
EOF

cat > .env.production << EOF
VITE_APP_TITLE=FloDrama
VITE_APP_API_URL=https://api.flodrama.com
VITE_APP_MAINTENANCE_MODE=false
VITE_APP_ENV=production
VITE_APP_DEBUG=false
EOF

# 5. Installer les dépendances
log "${BLUE}5. Installation des dépendances...${NC}"
npm install

# 6. Créer un fichier README.md avec la documentation
log "${BLUE}6. Création de la documentation...${NC}"

mkdir -p docs
cat > README.md << EOF
# FloDrama

Plateforme de streaming dédiée aux dramas et films asiatiques.

## Environnement de développement

### Prérequis

- Node.js (v18+)
- npm (v9+)
- Git
- Vercel CLI (pour le déploiement)
- AWS CLI (pour la gestion des ressources AWS)

### Installation

\`\`\`bash
# Cloner le dépôt
git clone https://github.com/flori92/FloDrama.git
cd FloDrama

# Installer les dépendances
npm install

# Démarrer le serveur de développement
npm run dev
\`\`\`

### Scripts disponibles

- \`npm run dev\` : Démarrer le serveur de développement
- \`npm run build\` : Construire l'application pour la production
- \`npm run preview\` : Prévisualiser la version de production localement
- \`npm run lint\` : Vérifier le code avec ESLint
- \`npm run format\` : Formater le code avec Prettier
- \`npm run test\` : Exécuter les tests unitaires
- \`npm run deploy\` : Déployer l'application sur Vercel
- \`npm run deploy:force\` : Forcer le déploiement sans page de maintenance

## Architecture

L'application utilise une architecture hybride :
- **Frontend** : React + Vite, déployé sur Vercel
- **Backend** : Services AWS (Lambda, DynamoDB, S3)

## Déploiement

L'application est déployée sur Vercel à l'adresse [https://flodrama.vercel.app](https://flodrama.vercel.app).

## Documentation

Pour plus d'informations, consultez les documents dans le dossier \`docs/\`.
EOF

# 7. Créer un fichier .gitignore
log "${BLUE}7. Création du fichier .gitignore...${NC}"

cat > .gitignore << EOF
# Dépendances
node_modules
.pnp
.pnp.js

# Production
dist
build

# Fichiers de test
coverage

# Fichiers d'environnement
.env.local
.env.development.local
.env.test.local
.env.production.local

# Logs
logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
lerna-debug.log*

# Éditeur
.vscode/*
!.vscode/extensions.json
.idea
.DS_Store
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?

# Vercel
.vercel
.turbo

# Fichiers temporaires
.temp
.tmp
EOF

# 8. Créer un fichier .prettierrc
log "${BLUE}8. Création du fichier .prettierrc...${NC}"

cat > .prettierrc << EOF
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "es5",
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "bracketSpacing": true,
  "arrowParens": "avoid"
}
EOF

# 9. Créer un fichier .eslintrc.js
log "${BLUE}9. Création du fichier .eslintrc.js...${NC}"

cat > .eslintrc.js << EOF
module.exports = {
  root: true,
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: ['react', '@typescript-eslint'],
  rules: {
    'react/react-in-jsx-scope': 'off',
    'react/prop-types': 'off',
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
};
EOF

# 10. Créer un fichier tsconfig.json
log "${BLUE}10. Création du fichier tsconfig.json...${NC}"

cat > tsconfig.json << EOF
{
  "compilerOptions": {
    "target": "ESNext",
    "useDefineForClassFields": true,
    "lib": ["DOM", "DOM.Iterable", "ESNext"],
    "allowJs": false,
    "skipLibCheck": true,
    "esModuleInterop": false,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "module": "ESNext",
    "moduleResolution": "Node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@components/*": ["src/components/*"],
      "@pages/*": ["src/pages/*"],
      "@services/*": ["src/services/*"],
      "@hooks/*": ["src/hooks/*"],
      "@utils/*": ["src/utils/*"],
      "@assets/*": ["src/assets/*"],
      "@styles/*": ["src/styles/*"],
      "@types/*": ["src/types/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
EOF

cat > tsconfig.node.json << EOF
{
  "compilerOptions": {
    "composite": true,
    "module": "ESNext",
    "moduleResolution": "Node",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}
EOF

# 11. Créer un rapport de configuration
log "${BLUE}11. Création du rapport de configuration...${NC}"

REPORT_FILE="docs/rapport-configuration-$(date +%Y%m%d).md"
mkdir -p docs

cat > $REPORT_FILE << EOF
# Rapport de configuration de l'environnement de développement FloDrama

## Date: $(date +"%d/%m/%Y %H:%M:%S")

## Résumé

Ce rapport documente la configuration de l'environnement de développement pour le projet FloDrama. L'objectif est de fournir une base solide pour le développement futur de l'application.

## Actions réalisées

1. Vérification et installation des dépendances nécessaires
2. Mise à jour du fichier package.json avec les dernières dépendances
3. Création d'une configuration Vite optimisée
4. Configuration des variables d'environnement pour le développement et la production
5. Installation des dépendances
6. Création de la documentation
7. Configuration des outils de développement (ESLint, Prettier)
8. Configuration de TypeScript

## Structure du projet

\`\`\`
FloDrama/
├── dist/               # Dossier de build (généré)
├── docs/               # Documentation
├── logs/               # Logs
├── node_modules/       # Dépendances (généré)
├── public/             # Fichiers statiques
├── scripts/            # Scripts de déploiement et d'automatisation
├── src/                # Code source
│   ├── assets/         # Images, fonts, etc.
│   ├── components/     # Composants React réutilisables
│   ├── hooks/          # Hooks personnalisés
│   ├── pages/          # Pages/routes de l'application
│   ├── services/       # Services (API, authentification, etc.)
│   ├── styles/         # Styles globaux
│   ├── types/          # Définitions de types TypeScript
│   ├── utils/          # Fonctions utilitaires
│   ├── App.tsx         # Composant principal
│   ├── main.tsx        # Point d'entrée
│   └── vite-env.d.ts   # Déclarations de types pour Vite
├── .env.development    # Variables d'environnement pour le développement
├── .env.production     # Variables d'environnement pour la production
├── .eslintrc.js        # Configuration ESLint
├── .gitignore          # Fichiers à ignorer par Git
├── .prettierrc         # Configuration Prettier
├── index.html          # Page HTML principale
├── package.json        # Dépendances et scripts
├── README.md           # Documentation principale
├── tsconfig.json       # Configuration TypeScript
├── tsconfig.node.json  # Configuration TypeScript pour Node
└── vite.config.ts      # Configuration Vite
\`\`\`

## Prochaines étapes

1. Développer les composants de base de l'interface utilisateur
2. Implémenter les services d'API pour communiquer avec le backend
3. Configurer l'authentification des utilisateurs
4. Développer les fonctionnalités de streaming vidéo
5. Mettre en place des tests unitaires et d'intégration
6. Optimiser les performances de l'application

## Ressources

- [Documentation React](https://reactjs.org/docs/getting-started.html)
- [Documentation Vite](https://vitejs.dev/guide/)
- [Documentation TypeScript](https://www.typescriptlang.org/docs/)
- [Documentation Material UI](https://mui.com/material-ui/getting-started/overview/)
- [Documentation Vercel](https://vercel.com/docs)
EOF

# 12. Créer une structure de dossiers pour le code source
log "${BLUE}12. Création de la structure de dossiers pour le code source...${NC}"

mkdir -p src/{assets,components,hooks,pages,services,styles,types,utils}

# 13. Créer un fichier index.html de base
log "${BLUE}13. Création du fichier index.html de base...${NC}"

cat > index.html << EOF
<!DOCTYPE html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="FloDrama - Votre plateforme de streaming dédiée aux dramas et films asiatiques" />
    <meta name="theme-color" content="#3b82f6" />
    <title>FloDrama</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
EOF

# 14. Sauvegarde automatique
log "${BLUE}14. Sauvegarde automatique du projet...${NC}"

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="backups"
mkdir -p $BACKUP_DIR
BACKUP_FILE="${BACKUP_DIR}/${TIMESTAMP}_backup_dev_setup.tar.gz"

tar -czf $BACKUP_FILE --exclude="node_modules" --exclude="dist" --exclude=".git" --exclude="backups" .
log "${GREEN}Sauvegarde créée: $BACKUP_FILE${NC}"

# 15. Commit des changements
log "${BLUE}15. Commit des changements...${NC}"

git add .
git commit -m "✨ [FEAT] Configuration de l'environnement de développement"
git push origin main

echo -e "${GREEN}=== Configuration de l'environnement de développement terminée ===${NC}"
echo -e "${YELLOW}Consultez le rapport pour plus de détails: $REPORT_FILE${NC}"
echo -e "${YELLOW}Pour démarrer le serveur de développement, exécutez: npm run dev${NC}"
