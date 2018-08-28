/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env node */

/*::
import type {ChunkIndexState} from "./types.js";
*/

const ImportDependency = require('webpack/lib/dependencies/ImportDependency');

const InstrumentedImportDependencyTemplate = require('./instrumented-import-dependency-template');

/**
 * Webpack plugin to replace standard ImportDependencyTemplate with custom one
 * See InstrumentedImportDependencyTemplate for more info
 */

class InstrumentedImportDependencyTemplatePlugin {
  /*:: clientChunkIndexState: ?ChunkIndexState; */

  constructor(clientChunkIndexState /*: ?ChunkIndexState*/) {
    this.clientChunkIndexState = clientChunkIndexState;
  }

  apply(compiler /*: any */) {
    const name = this.constructor.name;
    /**
     * The standard plugin is added on `compile`,
     * which sets the default value for `ImportDependency` in  the `dependencyTemplates` map.
     * `make` is the subsequent lifeycle method, so we can override this value here.
     */
    compiler.hooks.make.tapAsync(name, (compilation, done) => {
      if (this.clientChunkIndexState) {
        // server
        this.clientChunkIndexState.result.then(chunkIndex => {
          compilation.dependencyTemplates.set(
            ImportDependency,
            new InstrumentedImportDependencyTemplate(chunkIndex)
          );
          done();
        });
      } else {
        // client
        compilation.dependencyTemplates.set(
          ImportDependency,
          new InstrumentedImportDependencyTemplate()
        );
        done();
      }
    });
  }
}

module.exports = InstrumentedImportDependencyTemplatePlugin;
