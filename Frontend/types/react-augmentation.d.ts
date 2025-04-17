// Augmentation des types React pour assurer la compatibilité
import * as React from 'react';

declare module 'react' {
  // Assure que ReactNode est compatible entre les différentes versions de React
  interface ReactPortal {
    children?: React.ReactNode;
  }
}
