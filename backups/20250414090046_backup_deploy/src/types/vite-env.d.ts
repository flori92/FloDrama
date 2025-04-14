/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string
  // plus d'env vars...
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
