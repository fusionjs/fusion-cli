/* eslint-env node */
/**
 * Webpack plugin for being able to mark async chunks as being already preloaded
 * This is meant for the client
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
      var promise = new Promise(function(resolve, reject) {
        result = [resolve, reject];
      });
      result[2] = promise;
      installedChunks[chunkId] = result;
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
