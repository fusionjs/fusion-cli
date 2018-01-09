/* eslint-env node */

/*
This is where webpack-related things should be defined
*/

const {Plugin} = require('fusion-core');
const envVarsPlugin = require('./environment-variables-plugin');

// custom loaders: see build/compiler.js
// eslint-disable-next-line import/no-unresolved, import/no-extraneous-dependencies
const chunkUrlMap = require('__SECRET_BUNDLE_MAP_LOADER__!');
// eslint-disable-next-line import/no-unresolved, import/no-extraneous-dependencies
const syncChunks = require('__SECRET_SYNC_CHUNK_IDS_LOADER__!');

module.exports = function() {
  const {assetPath, cdnUrl} = envVarsPlugin().of();
  return new Plugin({
    Service: class CompilationMetaData {
      constructor() {
        this.syncChunks = syncChunks;
        this.preloadChunks = [];
        this.chunkUrlMap = chunkUrlMap;
        this.webpackPublicPath = cdnUrl || assetPath;
      }
    },
  });
};
