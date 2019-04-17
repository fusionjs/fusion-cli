/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env node */
/* eslint-disable no-console */

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

let loggedNotice = false;

/*::
import type {
  WebpackOptions 
} from "webpack";

export type FusionRC = {
  babel?: {plugins?: Array<any>, presets?: Array<any>, exclude?: mixed},
  assumeNoImportSideEffects?: boolean,
  experimentalCompile?: boolean,
  nodeBuiltins?: {[string]: any},
  overrideWebpackConfig:? (any) => any
};
*/

module.exports = function validateConfig(dir /*: string */) /*: FusionRC */ {
  const configPath = path.join(dir, '.fusionrc.js');
  let config;
  if (fs.existsSync(configPath)) {
    // $FlowFixMe
    config = require(configPath);
    if (!isValid(config)) {
      throw new Error('.fusionrc.js is invalid');
    }
  } else {
    config = {};
  }
  return config;
};

function isValid(config) {
  if (!(typeof config === 'object' && config !== null)) {
    throw new Error('.fusionrc.js must export an object');
  }

  if (
    !Object.keys(config).every(key =>
      [
        'babel',
        'assumeNoImportSideEffects',
        'experimentalCompile',
        'nodeBuiltins',
        'overrideWebpackConfig',
      ].includes(key)
    )
  ) {
    throw new Error(`Invalid property in .fusionrc.js`);
  }

  if (
    config.babel &&
    !Object.keys(config.babel).every(el =>
      ['plugins', 'presets', 'exclude'].includes(el)
    )
  ) {
    throw new Error(
      `Only "plugins", "presets", and "exclude" are supported in fusionrc.js babel config`
    );
  }

  if (
    !(
      config.assumeNoImportSideEffects === false ||
      config.assumeNoImportSideEffects === true ||
      config.assumeNoImportSideEffects === void 0
    )
  ) {
    throw new Error(
      'assumeNoImportSideEffects must be true, false, or undefined in fusionrc.js babel config'
    );
  }

  return true;
}
