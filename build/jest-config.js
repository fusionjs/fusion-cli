/* eslint-env node */

// Handle test execution matching for environments.
// node - Runs all universal .js and .node.js tests.
// browser - Runs all universal .js and .browser.js tests.
// integration - Runs only .integration.js tests.
const jestEnvIgnorePatterns = {
  node: ['.*\\.browser\\.js', '.*\\.integration\\.js'],
  jsdom: ['.*\\.node\\.js', '.*\\.integration\\.js'],
  integration: [],
};

const jestTestMatchPatterns = {
  integration: ['/**/__tests__/**/*.integration.js'],
  node: ['**/__tests__/**/*.js'],
  jsdom: ['**/__tests__/**/*.js'],
};

module.exports = {
  cache: true,
  globals: {
    // Parity with create-universal-package globals.
    // https://github.com/rtsao/create-universal-package#globals
    __NODE__: process.env.JEST_ENV === 'node',
    __BROWSER__: process.env.JEST_ENV === 'jsdom',
    __DEV__: process.env.NODE_ENV !== 'production',
  },
  coverageDirectory: `<rootDir>/coverage-${process.env.JEST_ENV}`,
  // 'cobertura', 'lcov', 'text' coverage reports are written by the merge-coverage script
  coverageReporters: ['json'],
  rootDir: process.cwd(),
  setupFiles: [
    require.resolve('./jest-framework-shims.js'),
    require.resolve('./jest-framework-setup.js'),
  ],
  snapshotSerializers: [require.resolve('enzyme-to-json/serializer')],
  testMatch: jestTestMatchPatterns[process.env.JEST_ENV],
  testPathIgnorePatterns: jestEnvIgnorePatterns[process.env.JEST_ENV],
  transform: {
    '^.+\\.js$': require.resolve('./jest-transformer.js'),
  },
  transformIgnorePatterns: ['/node_modules/(?!(fusion-cli.*build))'],
};
