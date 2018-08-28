/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
/*eslint-env node */

/*::
import type {ChunkIndexState} from "../types.js";
*/

/*::
export type ClientChunkIndexContext = ChunkIndexState;
*/
exports.clientChunkIndexContextKey = Symbol(
  'context key for client chunk index'
);
