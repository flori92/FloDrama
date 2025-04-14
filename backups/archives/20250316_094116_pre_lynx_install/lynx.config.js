module.exports = {
  // Configuration générale de l'application
  appName: 'FloDrama',
  version: '1.0.0',
  
  // Plateformes supportées
  platforms: {
    web: {
      enabled: true,
      port: 3000,
      publicPath: '/assets/',
      optimization: {
        splitChunks: true,
        treeshaking: true,
        minify: true
      }
    },
    android: {
      enabled: true,
      minSdkVersion: 21,
      targetSdkVersion: 33,
      buildTools: '33.0.0',
      nativeModules: ['@lynx-js/video-player']
    },
    ios: {
      enabled: true,
      deploymentTarget: '13.0',
      nativeModules: ['@lynx-js/video-player']
    }
  },

  // Performance et optimisations
  performance: {
    preload: {
      enabled: true,
      routes: ['/home', '/player', '/search']
    },
    caching: {
      enabled: true,
      strategy: 'network-first',
      duration: 3600
    },
    compression: {
      enabled: true,
      level: 6
    }
  },

  // Gestion des assets
  assets: {
    images: {
      optimization: {
        quality: 85,
        responsive: true,
        formats: ['webp', 'jpeg']
      }
    },
    fonts: {
      preload: true,
      formats: ['woff2', 'woff']
    },
    video: {
      optimization: {
        quality: 'auto',
        formats: ['hls', 'dash']
      }
    }
  },

  // Configuration i18n
  i18n: {
    defaultLocale: 'fr',
    supportedLocales: ['fr', 'en', 'ko'],
    fallbackLocale: 'fr',
    loadPath: '/locales/{{lng}}/{{ns}}.json'
  },

  // Sécurité
  security: {
    headers: {
      'Content-Security-Policy': {
        enabled: true,
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          mediaSrc: ["'self'", 'https:']
        }
      },
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff'
    },
    ssl: {
      enabled: true,
      redirectToHttps: true
    }
  },

  // Configuration des tests
  testing: {
    setupFiles: ['./src/tests/setup.js'],
    coverage: {
      enabled: true,
      threshold: {
        statements: 80,
        branches: 80,
        functions: 80,
        lines: 80
      }
    },
    reporters: ['default', 'jest-junit']
  },

  // Configuration du développement
  development: {
    devTools: {
      enabled: true,
      port: 9229
    },
    hot: true,
    sourceMap: true,
    overlay: true
  },

  // Configuration de la production
  production: {
    sourcemap: false,
    optimization: {
      minimize: true,
      splitChunks: true,
      runtimeChunk: true
    },
    analyze: false
  },

  // Plugins Lynx.js
  plugins: [
    '@lynx-js/router',
    '@lynx-js/state',
    '@lynx-js/i18n',
    '@lynx-js/animations'
  ],

  // Configuration des modules natifs
  nativeModules: {
    '@lynx-js/video-player': {
      android: {
        package: 'org.lynxjs.videoplayer',
        buildTypes: ['debug', 'release']
      },
      ios: {
        frameworks: ['AVFoundation', 'CoreMedia']
      }
    }
  }
};
