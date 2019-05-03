/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env node */

const {translationsDiscoveryKey} = require('../loaders/loader-context.js');

/*::
import type {TranslationsManifestState, TranslationsManifest} from "../types.js";
*/

class I18nDiscoveryPlugin {
  /*::
  manifest: TranslationsManifestState;
  discoveryState: Map<string, Set<string>>;
  */
  constructor(
    deferredManifest /*: TranslationsManifestState*/,
    discoveryState /*: Map<string, Set<string>>*/
  ) {
    this.manifest = deferredManifest;
    this.discoveryState = discoveryState;
  }
  apply(compiler /*: any */) {
    const name = this.constructor.name;
    // "thisCompilation" is not run in child compilations
    compiler.hooks.thisCompilation.tap(name, compilation => {
      compilation.hooks.normalModuleLoader.tap(name, (context, module) => {
        context[translationsDiscoveryKey] = this.discoveryState;
      });
    });
    // if resolve at 'make' - discoverState will be empty
    // if resolve at 'afterCompile' or 'done' - instrumentation plugin is
    //  waiting for this to resolve from the 'make' step - build breaks
    compiler.hooks.done.tap(name, () => {
      this.manifest.resolve(this.discoveryState);
    });
    compiler.hooks.invalid.tap(name, filename => {
      this.manifest.reset();
      this.discoveryState.delete(filename);
    });
  }
}

module.exports = I18nDiscoveryPlugin;
