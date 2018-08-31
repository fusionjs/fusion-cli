/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
/* eslint-env node */

/*::
import type {SyncChunkDataState} from "../types.js";
*/

class SyncChunkDataStateHydratorPlugin {
  /*::
  syncChunkDataState: SyncChunkDataState;
  */

  constructor(syncChunkDataState /*: SyncChunkDataState*/) {
    this.syncChunkDataState = syncChunkDataState;
  }

  apply(compiler /*: any */) {
    const name = this.constructor.name;
    compiler.hooks.invalid.tap(name, () => {
      this.syncChunkDataState.reset();
    });

    compiler.hooks.compilation.tap(name, compilation => {
      compilation.hooks.afterOptimizeChunkAssets.tap(name, () => {
        const mainEntrypoint = compilation.entrypoints.get('main');
        const chunkIds = mainEntrypoint.chunks.map(c => c.id);
        const chunkPaths = mainEntrypoint.chunks.map(c => c.files[0]);
        this.syncChunkDataState.resolve({
          ids: chunkIds,
          paths: chunkPaths,
        });
      });
    });
  }
}

module.exports = SyncChunkDataStateHydratorPlugin;
