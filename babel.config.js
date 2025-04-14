module.exports = {
  presets: [
    '@babel/preset-env',
    '@babel/preset-react',
    '@babel/preset-typescript'
  ],
  plugins: [
    '@babel/plugin-transform-runtime',
    ['module-resolver', {
      root: ['./src'],
      alias: {
        '@': './src',
        '@components': './src/components',
        '@services': './src/services',
        '@pages': './src/pages',
        '@hooks': './src/hooks',
        '@utils': './src/utils',
        '@types': './src/types',
        'react': '@lynx/react',
        'react/jsx-runtime': '@lynx/react/jsx-runtime'
      }
    }]
  ]
};
