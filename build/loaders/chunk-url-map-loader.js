/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env node */

const {chunkUrlMapContextKey} = require('./loader-context.js');

module.exports = function chunkUrlMapLoader() {
  this.cacheable(false);
  const chunkUrlMapState = this[chunkUrlMapContextKey];
  const callback = this.async();
  chunkUrlMapState.result.then(chunkUrlMap => {
    callback(null, generateSource(chunkUrlMap));
  });
};

function generateSource(chunkUrlMap) {
  return `module.exports = new Map(
    ${JSON.stringify(
      Array.from(chunkUrlMap.entries()).map(entry => {
        entry[1] = Array.from(entry[1].entries());
        return entry;
      })
    )}.map(entry => { //[number, Map<string,string>]
      entry[1] = new Map(
        entry[1].map(group => {
          group[1] = __webpack_public_path__ + group[1];
          return group;
        })
      );
      return entry;
    })
  );`;
}
