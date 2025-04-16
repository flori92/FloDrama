import React from 'react';

declare module 'react' {
  // Extension du type ReactNode pour inclure les éléments JSX
  interface ReactElement {
    type: any;
    props: any;
    key: string | null;
  }

  // Correction du type pour Suspense
  interface SuspenseProps {
    children?: React.ReactNode;
    fallback: NonNullable<React.ReactNode>;
  }
}
