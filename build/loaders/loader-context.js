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
  ClientChunkMetadataState,
  TranslationsManifest,
  TranslationsManifestState,
} from "../types.js";
*/

/*::
export type ClientChunkMetadataContext = ClientChunkMetadataState;
*/
exports.clientChunkMetadataContextKey = Symbol(
  'loader context key for client chunk metadata'
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
