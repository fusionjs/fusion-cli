/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
/*eslint-env node */

/*::
import type {
  ChunkIndexState,
  TranslationsManifest,
  TranslationsManifestState,
  ChunkUrlMapState,
  SyncChunkDataState,
} from "../types.js";
*/

/*::
export type ClientChunkIndexContext = ChunkIndexState;
*/
exports.clientChunkIndexContextKey = Symbol(
  'loader context key for client chunk index'
);

/*::
export type TranslationsManifestContext = TranslationsManifestState;
*/
exports.translationsManifestContextKey = Symbol(
  'loader context key for translations manifest'
);

/*::
export type TranslationsDiscoveryContext = TranslationsManifest;
*/
exports.translationsDiscoveryKey = Symbol(
  'loader context key for translations discovery'
);

/*::
export type ChunkUrlMapContext = ChunkUrlMapState;
*/
exports.chunkUrlMapContextKey = Symbol('loader context key for chunk url map');

/*::
export type SyncChunkDataContext = SyncChunkDataState;
*/
exports.syncChunkDataContextKey = Symbol(
  'loader context key for sync chunk data'
);
