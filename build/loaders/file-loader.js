/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
/* eslint-env node */

const path = require('path');
const fs = require('fs');
const loaderUtils = require('loader-utils');

/*::
import type {DevContext} from "./loader-context.js";
*/
const {devContextKey} = require('./loader-context.js');

module.exports = function fileLoader(content /*: string */) {
  const dev /*: DevContext */ = this[devContextKey];

  const done = assetContents => {
    const url = loaderUtils.interpolateName(this, '[hash].[ext]', {
      context: this.rootContext,
      content: assetContents,
    });

    // This should match webpack config.output.path option, except
    // assets should always go into client dist directory, regardless of source
    const outputPath = path.posix.join(dev ? '/' : '../client', url);
    this.emitFile(outputPath, assetContents);
    return `module.exports = __webpack_public_path__ + ${JSON.stringify(url)};`;
  };

  // Webpack produces a JS module from JSON automatically.
  // However, assetURL should yield the raw JSON instead.
  if (path.extname(this.resourcePath) === '.json') {
    const callback = this.async();

    fs.readFile(this.resourcePath, 'utf8', (err, result) => {
      if (err) {
        return void callback(err);
      }
      return void callback(null, done(result));
    });
  }

  return done(content);
};

module.exports.raw = true;
