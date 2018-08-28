/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
/*eslint-env node */

/*::
import type {ClientChunkIndexContext} from "./loader-context.js";
*/

const {clientChunkIndexContextKey} = require('./loader-context.js');

async function getChunks(
  chunkIndexState /*: ClientChunkIndexContext*/,
  filename /*: string*/
) {
  const chunkIndex = await chunkIndexState.result;
  const chunks = chunkIndex.get(filename);
  if (!chunks) {
    throw new Error(
      `Attempted to get client bundle chunk ids for "${filename}" but it is not the client bundle.`
    );
  }
  return Array.from(chunks.values());
}

async function chunkIdsLoader() {
  /**
   * This loader is not cacheable because the chunk id for a file is dependent
   * on where/how it is imported, not the file contents itself.
   */
  this.cacheable(false);
  const callback = this.async();

  const clientChunkIndex /*: ClientChunkIndexContext*/ = this[
    clientChunkIndexContextKey
  ];

  const filename = this.resourcePath;

  if (!clientChunkIndex) {
    return void callback('Chunk index context missing from chunk ids loader.');
  }

  try {
    const source = `module.exports = ${JSON.stringify(
      await getChunks(clientChunkIndex, filename)
    )};`;
    return void callback(null, source);
  } catch (err) {
    return void callback(err);
  }
}

module.exports = chunkIdsLoader;
