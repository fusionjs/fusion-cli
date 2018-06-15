/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env node */

const loadFusionRC = require('../load-fusionrc.js');

const fusionConfig = loadFusionRC(process.cwd());

const testFolder = process.env.TEST_FOLDER || '__tests__';

function getReactVersion() {
  try {
    // $FlowFixMe
    const meta = require(process.cwd() + '/package.json');
    return meta.dependencies.react
      .split('.')
      .shift()
      .match(/\d+/);
  } catch (e) {
    return '16';
  }
}

function coveragePatterns() /*: Array<string> */ {
  const additionalCoveragePatterns =
    fusionConfig.additionalCoveragePatterns || [];

  return ['**/*.js', '!**/__integration__/**', '!**/node_modules/**'].concat(
    additionalCoveragePatterns
  );
}

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
    require.resolve(`./jest-framework-setup-${getReactVersion()}.js`),
  ],
  snapshotSerializers: [require.resolve('enzyme-to-json/serializer')],
  testMatch: [`**/${testFolder}/**/*.js`],
  collectCoverageFrom: coveragePatterns(),
  testResultsProcessor: require.resolve('./results-processor.js'),
};
