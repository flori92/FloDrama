module.exports = {
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.(ts|tsx|js|jsx)$': '@swc/jest',
  },
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|webp|svg)$': '<rootDir>/src/__mocks__/fileMock.js',
    '^react$': '<rootDir>/node_modules/react',
    '^react-dom$': '<rootDir>/node_modules/react-dom',
    '^react-router-dom$': '<rootDir>/node_modules/react-router-dom',
    // Mocks pour les imports Lynx
    '@lynx/core': '<rootDir>/src/__mocks__/lynx-core.js',
    '@lynx/react': '<rootDir>/src/__mocks__/lynx-react.js',
    '@lynx/player': '<rootDir>/src/__mocks__/lynx-player.js',
    '@lynx/web': '<rootDir>/src/__mocks__/lynx-web.js'
  },
  setupFilesAfterEnv: [
    '<rootDir>/src/setupTests.ts'
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/.next/',
    '/out/',
    '/build/',
    '/coverage/'
  ],
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/__mocks__/**',
    '!src/test/**'
  ],
  moduleFileExtensions: [
    'ts',
    'tsx',
    'js',
    'jsx',
    'json',
    'node'
  ],
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname'
  ],
  resetMocks: true
};
