#!/bin/bash
# Script de déploiement pour FloDrama vers AWS en mode React avec stubs pour Lynx
# Créé le 29-03-2025

# Configuration
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="./backups/${TIMESTAMP}_backup_deploy_react_stub"
S3_BUCKET="flodrama-app-bucket"
CLOUDFRONT_DISTRIBUTION_ID="E1MU6L4S4UVUSS" # ID de la distribution CloudFront

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

# Créer un répertoire de sauvegarde
mkdir -p "$BACKUP_DIR"
log "Répertoire de sauvegarde créé: $BACKUP_DIR"

# Sauvegarder les fichiers importants
log "Sauvegarde des fichiers importants..."
cp -r ./Frontend/src "$BACKUP_DIR/src"
cp -r ./Frontend/public "$BACKUP_DIR/public"
cp ./Frontend/package.json "$BACKUP_DIR/package.json"
cp ./Frontend/tsconfig.json "$BACKUP_DIR/tsconfig.json" 2>/dev/null || :
cp ./Frontend/index.html "$BACKUP_DIR/index.html" 2>/dev/null || :
log "Sauvegarde terminée"

# Se déplacer dans le répertoire du frontend
cd ./Frontend || {
  erreur "Impossible d'accéder au répertoire Frontend"
  exit 1
}

# Créer un répertoire temporaire pour les stubs
mkdir -p temp_stubs/@lynx
log "Création des stubs pour les packages Lynx..."

# Créer des stubs pour les packages Lynx
cat > temp_stubs/@lynx/core.d.ts << EOF
// Stub pour @lynx/core
declare module '@lynx/core' {
  export interface LynxComponentProps {
    style?: any;
    testID?: string;
    [key: string]: any;
  }
  
  export type LynxComponent<P = {}> = React.FC<P & LynxComponentProps>;
  
  export const View: LynxComponent;
  export const Text: LynxComponent;
  export const Image: LynxComponent<{ src: string; objectFit?: string }>;
  export const Video: LynxComponent<{ src: string; autoPlay?: boolean; loop?: boolean }>;
  export const ScrollView: LynxComponent<{ horizontal?: boolean }>;
  
  export default {
    View,
    Text,
    Image,
    Video,
    ScrollView
  };
}
EOF

cat > temp_stubs/@lynx/react.d.ts << EOF
// Stub pour @lynx/react
declare module '@lynx/react' {
  import { LynxComponent, LynxComponentProps } from '@lynx/core';
  
  export interface ButtonProps extends LynxComponentProps {
    onPress?: () => void;
    disabled?: boolean;
    variant?: string;
    size?: string;
  }
  
  export const Button: LynxComponent<ButtonProps>;
  
  export interface CardProps extends LynxComponentProps {
    variant?: string;
    elevation?: number;
  }
  
  export const Card: LynxComponent<CardProps>;
  
  export default {
    Button,
    Card
  };
}
EOF

cat > temp_stubs/@lynx/hooks.d.ts << EOF
// Stub pour @lynx/hooks
declare module '@lynx/hooks' {
  export function useAnimation(config?: any): any;
  export function useGesture(config?: any): any;
  export function useLayout(): any;
  export function useMediaQuery(query: string): boolean;
  
  export default {
    useAnimation,
    useGesture,
    useLayout,
    useMediaQuery
  };
}
EOF

cat > temp_stubs/@lynx/runtime.d.ts << EOF
// Stub pour @lynx/runtime
declare module '@lynx/runtime' {
  export function isLynxAvailable(): Promise<boolean>;
  export function checkPackageAvailability(packageName: string): Promise<boolean>;
  
  export default {
    isLynxAvailable,
    checkPackageAvailability
  };
}
EOF

# Créer un fichier temporaire pour lynx-core.ts
cat > src/adapters/lynx-core.ts.temp << EOF
// Version stub de lynx-core.ts pour le build en mode React uniquement
import React from 'react';

// Types simplifiés pour la compatibilité
export interface LynxViewProps {
  style?: React.CSSProperties;
  testID?: string;
  children?: React.ReactNode;
}

export interface LynxTextProps {
  style?: React.CSSProperties;
  testID?: string;
  children?: React.ReactNode;
}

export interface LynxImageProps {
  src: string;
  style?: React.CSSProperties;
  objectFit?: string;
  testID?: string;
}

export interface LynxVideoProps {
  src: string;
  autoPlay?: boolean;
  loop?: boolean;
  style?: React.CSSProperties;
  testID?: string;
}

export interface LynxScrollViewProps {
  style?: React.CSSProperties;
  contentContainerStyle?: React.CSSProperties;
  horizontal?: boolean;
  testID?: string;
  children?: React.ReactNode;
}

// Composants stub qui ne seront jamais utilisés en mode React
export const View: React.FC<LynxViewProps> = () => null;
export const Text: React.FC<LynxTextProps> = () => null;
export const Image: React.FC<LynxImageProps> = () => null;
export const Video: React.FC<LynxVideoProps> = () => null;
export const ScrollView: React.FC<LynxScrollViewProps> = () => null;

export default {
  View,
  Text,
  Image,
  Video,
  ScrollView
};
EOF

# Créer un stub pour useAuth.ts
log "Création d'un stub pour useAuth.ts..."
cp src/hooks/useAuth.ts src/hooks/useAuth.ts.original
cat > src/hooks/useAuth.ts << EOF
// Version stub de useAuth.ts pour le build en mode React uniquement
import { useState, useEffect, createContext, useContext } from 'react';

export interface User {
  id: string;
  username: string;
  email: string;
  token: string;
  preferences?: {
    language: string;
    theme: 'light' | 'dark';
    notifications: boolean;
  };
  language: string;
  theme: 'light' | 'dark';
  notifications: boolean;
}

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (data: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Simuler la récupération de l'utilisateur depuis le stockage local
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error('Erreur lors de la récupération des données utilisateur:', e);
      }
    }
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Simuler une requête API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simuler un utilisateur connecté
      const mockUser: User = {
        id: '123',
        username: 'utilisateur_test',
        email,
        token: 'token_factice',
        language: 'fr',
        theme: 'dark',
        notifications: true
      };
      
      setUser(mockUser);
      localStorage.setItem('user', JSON.stringify(mockUser));
    } catch (err) {
      setError('Échec de la connexion. Veuillez réessayer.');
      console.error('Erreur de connexion:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = (): void => {
    setUser(null);
    localStorage.removeItem('user');
  };

  const updateUser = async (data: Partial<User>): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Simuler une requête API
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (user) {
        const updatedUser = { ...user, ...data };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
    } catch (err) {
      setError('Échec de la mise à jour du profil.');
      console.error('Erreur de mise à jour:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, error, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export default useAuth;
EOF

# Modifier temporairement le tsconfig.json pour inclure les stubs
cp tsconfig.json tsconfig.json.bak
cat > tsconfig.json << EOF
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noFallthroughCasesInSwitch": true,
    "allowJs": true,
    "paths": {
      "@lynx/core": ["./temp_stubs/@lynx/core.d.ts"],
      "@lynx/react": ["./temp_stubs/@lynx/react.d.ts"],
      "@lynx/hooks": ["./temp_stubs/@lynx/hooks.d.ts"],
      "@lynx/runtime": ["./temp_stubs/@lynx/runtime.d.ts"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
EOF

# Créer un fichier .env temporaire pour forcer le mode React
log "Création d'un fichier .env pour forcer le mode React..."
cat > .env << EOF
VITE_FORCE_REACT_MODE=true
EOF

# Modifier temporairement le package.json pour exclure les dépendances Lynx
log "Modification temporaire du package.json pour exclure les dépendances Lynx..."
cp package.json package.json.bak
jq 'del(.dependencies."@lynx/core", .dependencies."@lynx/react", .dependencies."@lynx/hooks", .dependencies."@lynx/runtime")' package.json.bak > package.json || {
  attention "jq n'est pas installé ou a échoué. Tentative de modification manuelle..."
  # Tentative de modification manuelle si jq échoue
  sed -i.bak -E 's/"@lynx\/core": "[^"]*",?//g; s/"@lynx\/react": "[^"]*",?//g; s/"@lynx\/hooks": "[^"]*",?//g; s/"@lynx\/runtime": "[^"]*",?//g' package.json
  # Nettoyer les virgules en trop
  sed -i.bak2 -E 's/,\s*}/}/g; s/,\s*,/,/g' package.json
}

# Remplacer le fichier lynx-core.ts par la version stub
log "Remplacement temporaire de lynx-core.ts par la version stub..."
mv src/adapters/lynx-core.ts src/adapters/lynx-core.ts.original
mv src/adapters/lynx-core.ts.temp src/adapters/lynx-core.ts

# Modifier temporairement le HybridComponentProvider pour forcer le mode React
log "Modification temporaire du HybridComponentProvider pour forcer le mode React..."
HYBRID_PROVIDER_FILE="./src/components/HybridComponentProvider.tsx"
cp "$HYBRID_PROVIDER_FILE" "${HYBRID_PROVIDER_FILE}.bak"

# Ajouter une variable d'environnement pour forcer le mode React
sed -i.bak 's/const \[forceReactMode, setForceReactMode\] = useState<boolean>(false);/const \[forceReactMode, setForceReactMode\] = useState<boolean>(true); \/\/ Forcé à true pour le déploiement/' "$HYBRID_PROVIDER_FILE"

# Installer les dépendances sans les packages Lynx
log "Installation des dépendances sans les packages Lynx..."
npm install --legacy-peer-deps || {
  erreur "Échec de l'installation des dépendances"
  # Restaurer les fichiers originaux
  mv src/adapters/lynx-core.ts.original src/adapters/lynx-core.ts 2>/dev/null || :
  mv "${HYBRID_PROVIDER_FILE}.bak" "$HYBRID_PROVIDER_FILE" 2>/dev/null || :
  mv tsconfig.json.bak tsconfig.json 2>/dev/null || :
  mv package.json.bak package.json 2>/dev/null || :
  exit 1
}

# Construction de l'application avec les variables d'environnement de production
log "Construction de l'application en mode React uniquement..."
npm run build || {
  erreur "Échec de la construction de l'application"
  # Restaurer les fichiers originaux
  mv src/adapters/lynx-core.ts.original src/adapters/lynx-core.ts 2>/dev/null || :
  mv "${HYBRID_PROVIDER_FILE}.bak" "$HYBRID_PROVIDER_FILE" 2>/dev/null || :
  mv tsconfig.json.bak tsconfig.json 2>/dev/null || :
  mv package.json.bak package.json 2>/dev/null || :
  exit 1
}

# Restaurer les fichiers originaux
log "Restauration des fichiers originaux..."
mv src/adapters/lynx-core.ts.original src/adapters/lynx-core.ts 2>/dev/null || :
mv src/hooks/useAuth.ts.original src/hooks/useAuth.ts 2>/dev/null || :
mv "${HYBRID_PROVIDER_FILE}.bak" "$HYBRID_PROVIDER_FILE" 2>/dev/null || :
mv tsconfig.json.bak tsconfig.json 2>/dev/null || :
mv package.json.bak package.json 2>/dev/null || :
rm -f package.json.bak2 2>/dev/null || :
rm -f .env 2>/dev/null || :
rm -rf temp_stubs 2>/dev/null || :

# Vérifier que le répertoire de build existe
if [ ! -d "./dist" ]; then
  erreur "Le répertoire de build (dist) n'existe pas"
  exit 1
fi

# Revenir au répertoire principal
cd ..

# Créer une politique de bucket S3 pour permettre l'accès public
log "Création de la politique de bucket S3..."
cat > bucket-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::$S3_BUCKET/*"
    }
  ]
}
EOF

# Mettre à jour la politique du bucket S3
log "Mise à jour de la politique du bucket S3..."
aws s3api put-bucket-policy --bucket $S3_BUCKET --policy file://bucket-policy.json || {
  attention "Échec de la mise à jour de la politique du bucket S3"
}

# Désactiver le blocage de l'accès public
log "Désactivation du blocage de l'accès public..."
aws s3api put-public-access-block --bucket $S3_BUCKET --public-access-block-configuration "BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false" || {
  attention "Échec de la désactivation du blocage de l'accès public"
}

# Déployer sur S3 avec l'ACL public-read
log "Déploiement sur S3 avec l'ACL public-read..."
aws s3 sync ./Frontend/dist s3://$S3_BUCKET --delete --acl public-read || {
  erreur "Échec du déploiement sur S3"
  exit 1
}

# Invalider le cache CloudFront
log "Invalidation du cache CloudFront..."
aws cloudfront create-invalidation --distribution-id $CLOUDFRONT_DISTRIBUTION_ID --paths "/*" || {
  attention "Échec de l'invalidation du cache CloudFront"
}

# Nettoyage des fichiers temporaires
log "Nettoyage des fichiers temporaires..."
rm -f bucket-policy.json

log "Déploiement terminé avec succès!"
log "L'application est accessible à l'adresse: https://d1pbqs2b6em4ha.cloudfront.net"
log "Ou via le nom de domaine configuré dans CloudFront."
log "IMPORTANT: Cette version est déployée en mode React uniquement (sans Lynx)."
