/* eslint-env node */

const testFolder = process.env.TEST_FOLDER || '__tests__';

module.exports = {
  cache: true,
  displayName: 'browser',
  browser: true,
  rootDir: process.cwd(),
  testEnvironment: 'jsdom',
  testPathIgnorePatterns: ['.*\\.node\\.js'],
  transform: {
    '^.+\\.js$': require.resolve('../jest-transformer.js'),
  },
  transformIgnorePatterns: ['/node_modules/(?!(fusion-cli.*build))'],
  coverageReporters: ['json', 'cobertura', 'lcov', 'text'],
  setupFiles: [
    require.resolve('../jest-framework-shims.js'),
    require.resolve('../jest-framework-setup.js'),
  ],
  snapshotSerializers: [require.resolve('enzyme-to-json/serializer')],
  testMatch: [`**/${testFolder}/**/*.js`],
};
