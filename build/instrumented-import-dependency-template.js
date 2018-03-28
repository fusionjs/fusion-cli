/* eslint-env node */
const ImportDependencyTemplate = require('webpack/lib/dependencies/ImportDependency')
  .Template;

/**
 * We create an extension to the original ImportDependency template
 * that adds an extra property to the promise returned by import()
 * that has the chunkId. Additionally, on the server, we add a synchronous
 * require to the beginning of the file
 *
 * At a high level, if module `foo` was in chunk with id 5, we turn:
 *
 * import('foo')
 * // Returns a promise
 *
 * into:
 *
 * Object.defineProperty(import('foo'), {__CHUNK_IDS: [5]})
 * // Also returns a promise, but with an extra non-enumerable property
 *
 * // And on the server we add:
 * __webpack_require__('foo');
 */

class InstrumentedImportDependencyTemplate extends ImportDependencyTemplate {
  constructor(clientChunkMap) {
    super();
    if (clientChunkMap) {
      this.clientChunkMap = clientChunkMap;
    }
  }
  /**
   * TODO(#15): Possibly figure out cleaner implemenetation by extending `super` to avoid duplicating code
   * For now, we'll just override this method entirely with a modified version
   * Based on https://github.com/webpack/webpack/blob/5e38646f589b5b6325556f3127e7b61df33d3cb9/lib/dependencies/ImportDependency.js
   */
  apply(dep, source, runtime) {
    const depBlock = dep.block;
    const content = runtime.moduleNamespacePromise({
      block: dep.block,
      module: dep.module,
      request: dep.request,
      strict: dep.originModule.buildMeta.strictHarmonyModule,
      message: 'import()',
    });

    if (this.clientChunkMap && dep.module) {
      /**
       * Add requires to dynamic imports on the server
       */
      const stringifiedId = JSON.stringify(dep.module.id);

      const request = content
        ? `${content};__webpack_require__(${stringifiedId});`
        : `__webpack_require__(${stringifiedId});`;

      const preloadSrc = `/* PRE-REQUIRE DYNAMIC IMPORTS */${request}`;
      // TODO(#16): investigate sourcemap implications of this
      source.insert(0, preloadSrc);
    }

    // TODO(#17): throw with nice error message here if not in manifest
    const chunkIds = this.clientChunkMap
      ? // server-side, use values from client bundle
        Array.from(
          this.clientChunkMap.get(
            dep.module.resource || dep.originModule.resource
          )
        )
      : // client-side, use built-in values
        getChunkGroupIds(depBlock.chunkGroup);
    // Add `__CHUNK_IDS` property to promise returned by `import()`` if they exist
    const customContent = chunkIds
      ? `Object.defineProperty(${content}, "__CHUNK_IDS", {value:${JSON.stringify(
          chunkIds
        )}})`
      : content;

    // replace with `customContent` instead of `content`
    source.replace(depBlock.range[0], depBlock.range[1] - 1, customContent);
  }
}

module.exports = InstrumentedImportDependencyTemplate;

/**
 * Adapted from
 * https://github.com/webpack/webpack/blob/5e38646f589b5b6325556f3127e7b61df33d3cb9/lib/dependencies/DepBlockHelpers.js
 */
function getChunkGroupIds(chunkGroup) {
  if (chunkGroup && !chunkGroup.isInitial()) {
    if (Array.isArray(chunkGroup.chunks)) {
      return chunkGroup.chunks.map(c => c.id);
    }
    return [chunkGroup.id];
  }
}
