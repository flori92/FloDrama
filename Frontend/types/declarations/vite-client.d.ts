/// <reference types="vite/client" />

// Déclaration pour les modules CSS/SCSS
declare module '*.scss' {
  const content: Record<string, string>;
  export default content;
}

declare module '*.css' {
  const content: Record<string, string>;
  export default content;
}

// Déclaration pour les fichiers d'images
declare module '*.png';
declare module '*.jpg';
declare module '*.jpeg';
declare module '*.gif';
declare module '*.svg' {
  import * as React from 'react';
  const SVG: React.FC<React.SVGProps<SVGSVGElement>>;
  export default SVG;
}

// Déclaration pour import.meta.env
interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string;
  readonly VITE_API_URL: string;
  readonly VITE_SOCKET_URL: string;
  // autres variables d'environnement...
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
