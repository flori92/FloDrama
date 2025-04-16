module.exports = {
  // Configuration du plugin TypeScript pour Lynx
  lynxTypeScript: {
    // Chemins des types personnalisés
    typeRoots: [
      './node_modules/@types',
      './src/types'
    ],
    
    // Alias des types
    typeAliases: {
      '@lynx/react': {
        path: './node_modules/@lynx/react/types',
        exports: ['*']
      },
      '@lynx/player': {
        path: './node_modules/@lynx/player/types',
        exports: ['PlayerConfig', 'LynxPlayer']
      }
    },

    // Configuration des déclarations de types
    declarations: {
      outDir: './dist/types',
      emitDeclarationOnly: false,
      declarationMap: true
    },

    // Options de vérification des types
    typeCheck: {
      strict: true,
      skipLibCheck: true,
      esModuleInterop: true,
      allowSyntheticDefaultImports: true,
      forceConsistentCasingInFileNames: true,
      moduleResolution: 'bundler'
    },

    // Configuration des plugins TypeScript
    plugins: [
      {
        name: '@lynx/typescript-plugin',
        options: {
          reactNamespace: '@lynx/react',
          jsxFactory: 'createElement',
          jsxFragmentFactory: 'Fragment'
        }
      }
    ],

    // Configuration des transformations
    transforms: {
      before: [
        {
          name: '@lynx/typescript-transform-paths',
          options: {
            paths: {
              '@/*': ['./src/*'],
              '@components/*': ['./src/components/*'],
              '@services/*': ['./src/services/*']
            }
          }
        }
      ],
      after: [
        {
          name: '@lynx/typescript-transform-imports',
          options: {
            module: {
              '@lynx/react': {
                transform: '@lynx/react/dist/{{member}}'
              }
            }
          }
        }
      ]
    }
  }
};
