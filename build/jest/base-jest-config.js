/* eslint-env node */

const testFolder = process.env.TEST_FOLDER || '__tests__';

const meta = require(process.cwd() + '/package.json');
const reactVersion = meta.dependencies.react
  .split('.')
  .shift()
  .match(/\d+/);

module.exports = {
  cache: false,
  coverageDirectory: `${process.cwd()}/coverage`,
  coverageReporters: ['json'],
  rootDir: process.cwd(),
  transform: {
    '^.+\\.js$': require.resolve('./jest-transformer.js'),
  },
  transformIgnorePatterns: ['/node_modules/(?!(fusion-cli.*build))'],
  setupFiles: [
    require.resolve('./jest-framework-shims.js'),
    require.resolve(`./jest-framework-setup-${reactVersion}.js`),
  ],
  snapshotSerializers: [require.resolve('enzyme-to-json/serializer')],
  testMatch: [`**/${testFolder}/**/*.js`],
  collectCoverageFrom: ['**.js', '!**/__integration__/**'],
  testResultsProcessor: require.resolve('./results-processor.js'),
};
