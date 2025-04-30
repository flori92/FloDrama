#!/bin/bash

# Script de correction des dépendances pour FloDrama
# Créé le 8 avril 2025

set -e

echo "🚀 Correction des dépendances pour FloDrama"

echo "📋 Installation des dépendances manquantes..."
npm install --save uuid @types/uuid
npm install --save-dev @types/jest @types/testing-library__jest-dom

echo "📋 Création des fichiers de types manquants..."

# Création du répertoire pour les types personnalisés
mkdir -p ./src/types

# Création du fichier de types pour @lynx-js/core
cat > ./src/types/lynx-js-core.d.ts << EOF
declare module '@lynx-js/core' {
  import React from 'react';
  
  export const View: React.FC<{
    className?: string;
    style?: React.CSSProperties;
    [key: string]: any;
  }>;
  
  export const Text: React.FC<{
    className?: string;
    style?: React.CSSProperties;
    [key: string]: any;
  }>;
  
  export const Video: React.ForwardRefExoticComponent<{
    src?: string;
    className?: string;
    autoPlay?: boolean;
    crossOrigin?: string;
    onMouseMove?: (event: React.MouseEvent) => void;
    onClick?: (event: React.MouseEvent) => void;
    onEnded?: () => void;
    [key: string]: any;
  } & React.RefAttributes<HTMLVideoElement>>;
}

declare module '@lynx-js/hooks' {
  export function useHotkeys(options: {
    [key: string]: () => void;
  }): void;
}
EOF

# Mise à jour du fichier tsconfig.json pour inclure les types personnalisés
cat > ./tsconfig.json << EOF
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
      "@/*": ["src/*"]
    },
    "types": ["node", "jest", "@testing-library/jest-dom"]
  },
  "include": ["src", "src/types"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
EOF

echo "📋 Correction des imports dans le composant VideoPlayer..."

# Création du répertoire pour les features s'il n'existe pas
mkdir -p ./src/components/features

# Création d'un composant WatchParty minimal
cat > ./src/components/features/WatchParty.tsx << EOF
import React from 'react';

interface WatchPartyProps {
  videoId: string;
  episodeId: string;
  currentTime?: number;
  isPlaying?: boolean;
  onClose?: () => void;
}

const WatchParty: React.FC<WatchPartyProps> = ({
  videoId,
  episodeId,
  currentTime = 0,
  isPlaying = false,
  onClose
}) => {
  return (
    <div className="watch-party">
      <div className="watch-party__header">
        <h3>Watch Party</h3>
        <button onClick={onClose}>Fermer</button>
      </div>
      <div className="watch-party__content">
        <p>Regardez ensemble avec vos amis!</p>
        <p>ID de la vidéo: {videoId}</p>
        <p>ID de l'épisode: {episodeId}</p>
        <p>Temps actuel: {currentTime}s</p>
        <p>Statut: {isPlaying ? 'En lecture' : 'En pause'}</p>
      </div>
    </div>
  );
};

export default WatchParty;
EOF

echo "✅ Correction des dépendances terminée avec succès!"
echo "📌 Vous pouvez maintenant relancer le déploiement avec ./scripts/deployer-hybride-aws-vercel.sh"
