/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env node */

const baseJestConfig = require('../base-jest-config.js');

module.exports = {
  ...baseJestConfig,
  displayName: 'node',
  browser: false,
  testEnvironment: 'node',
  testPathIgnorePatterns: ['.*\\.browser\\.js'],
};
