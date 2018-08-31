/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
/* eslint-env node */

const {syncChunkDataContextKey} = require('./loader-context.js');

module.exports = function(/* content */) {
  const syncChunkDataState = this[syncChunkDataContextKey];
  this.cacheable(false);
  const callback = this.async();

  syncChunkDataState.result.then(chunkData => {
    callback(null, `module.exports = ${JSON.stringify(chunkData.paths)};`);
  });
};
