/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
/*eslint-env node */

/*::
import type {ChunkIndex, ChunkIndexState} from "../types.js";
*/

class ChunkIndexStateHydratorPlugin {
  /*::
  name: string;
  chunkIndexState: ChunkIndexState;
  */
  constructor(chunkIndexState /*: ChunkIndexState*/) {
    this.chunkIndexState = chunkIndexState;
  }
  apply(compiler /*: Object*/) {
    const name = this.constructor.name;
    compiler.hooks.invalid.tap(name, () => {
      this.chunkIndexState.reset();
    });
    compiler.hooks.compilation.tap(name, compilation => {
      compilation.hooks.afterOptimizeChunkAssets.tap(name, chunks => {
        const chunkIdsByFile = chunkIndexFromWebpackChunks(chunks);
        this.chunkIndexState.resolve(chunkIdsByFile);
      });
    });
  }
}

module.exports = ChunkIndexStateHydratorPlugin;

function chunkIndexFromWebpackChunks(chunks) /*: ChunkIndex*/ {
  const chunkIdsByFile = new Map();
  chunks.forEach(c => {
    const chunkId = c.id;
    const files = Array.from(c.modulesIterable, m => {
      if (m.resource) {
        return m.resource;
      }
      if (m.modules) {
        return m.modules.map(module => module.resource);
      }
      return [];
    }).reduce((list, next) => {
      return list.concat(next);
    }, []);
    files.forEach(path => {
      if (!chunkIdsByFile.has(path)) {
        chunkIdsByFile.set(path, new Set());
      }
      const chunkIds = chunkIdsByFile.get(path);
      if (chunkIds) {
        chunkIds.add(chunkId);
      }
    });
  });
  return chunkIdsByFile;
}
