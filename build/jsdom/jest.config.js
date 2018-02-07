/* eslint-env node */

const testFolder = process.env.TEST_FOLDER || '__tests__';

module.exports = {
  cache: true,
  displayName: 'browser',
  browser: true,
  coverageDirectory: `<rootDir>/coverage-jsdom`,
  rootDir: process.cwd(),
  testEnvironment: 'jsdom',
  testPathIgnorePatterns: ['.*\\.node\\.js'],
  transform: {
    '^.+\\.js$': require.resolve('../jest-transformer.js'),
  },
  transformIgnorePatterns: ['/node_modules/(?!(fusion-cli.*build))'],
  // 'cobertura', 'lcov', 'text' coverage reports are written by the merge-coverage script
  coverageReporters: ['json'],
  setupFiles: [
    require.resolve('../jest-framework-shims.js'),
    require.resolve('../jest-framework-setup.js'),
  ],
  snapshotSerializers: [require.resolve('enzyme-to-json/serializer')],
  testMatch: [`**/${testFolder}/**/*.js`],
};
