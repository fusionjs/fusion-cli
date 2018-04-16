/* eslint-env node */
/**
 * Webpack plugin for being able to mark async chunks as being already preloaded
 * This is meant for the client and ensures that webpack only requests for chunks
 * once. This is necessary because we automatically inline scripts for async chunks
 * that are used during the server side render. We use Object.defineProperty to make
 * the values lazy so `new Promise` is not executed until the promise polyfill is loaded.
 */

const Template = require('webpack/lib/Template');

class ChunkPreloadPlugin {
  apply(compiler) {
    compiler.hooks.compilation.tap('ChunkPreloadPlugin', function(compilation) {
      compilation.mainTemplate.hooks.localVars.tap(
        'ChunkPreloadPlugin',
        function(source) {
          var buf = [source];
          buf.push('');
          buf.push('// chunk preloading');
          buf.push(
            `
  if (window.__PRELOADED_CHUNKS__) {
    window.__PRELOADED_CHUNKS__.forEach(function(chunkId) {
      var result;
      Object.defineProperty(installedChunks, chunkId, {
        get: function() {
          if (result) {
            return result;
          }
          var promise = new Promise(function(resolve, reject) {
            result = [resolve, reject];
          });
          result[2] = promise;
          return result;
        }
      });
    });
  }

  var rejectChunkPreload = function(chunkId, err) {
    var chunk = installedChunks[chunkId];
    if(chunk !== 0) {
      if(chunk) chunk[1](new Error('Loading chunk ' + chunkId + ' failed. ' + (err.message ? err.message : err)));
      installedChunks[chunkId] = undefined;
    }
  }

  window.__HANDLE_ERROR = rejectChunkPreload;

  if (window.__UNHANDLED_ERRORS__) {
    window.__UNHANDLED_ERRORS__.forEach(unhandled => rejectChunkPreload(unhandled[0], unhandled[1]));
  }
        `
          );
          return Template.asString(buf);
        }
      );
    });
  }
}

module.exports = ChunkPreloadPlugin;
