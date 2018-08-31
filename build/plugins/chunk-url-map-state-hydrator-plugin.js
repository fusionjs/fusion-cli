/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env node */

/*::
import type {ChunkUrlMapState} from "../types.js";
*/

class ChunkUrlMapStateHydratorPlugin {
  /*:: chunkUrlMapState: ChunkUrlMapState; */

  constructor(chunkUrlMapState /*: ChunkUrlMapState */) {
    this.chunkUrlMapState = chunkUrlMapState;
  }
  apply(compiler /*: any */) {
    const name = this.constructor.name;

    compiler.hooks.invalid.tap(name, () => {
      this.chunkUrlMapState.reset();
    });

    compiler.hooks.compilation.tap(name, compilation => {
      compilation.hooks.afterOptimizeChunkAssets.tap(name, chunks => {
        const chunkMap = new Map();

        chunks.forEach(chunk => {
          const [filename] = chunk.files;
          const inner = new Map();
          inner.set('es5', filename);
          chunkMap.set(chunk.id, inner);
        });

        this.chunkUrlMapState.resolve(chunkMap);
      });
    });
  }
}

module.exports = ChunkUrlMapStateHydratorPlugin;
