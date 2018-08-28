/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
/* eslint-env node */

const path = require('path');
const loaderUtils = require('loader-utils');

module.exports = function fileLoader(content /*: string */) {
  const url = loaderUtils.interpolateName(this, '[hash].[ext]', {
    context: this.rootContext,
    content,
  });

  // Assets should always go into client dist directory, regardless of source
  const outputPath = path.posix.join('../client', url);

  this.emitFile(outputPath, content);

  return `module.exports = __webpack_public_path__ + ${JSON.stringify(url)};`;
};
