/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
/*eslint-env node */

const loaderIndex = {
  chunkIdsLoader: {
    alias: '__SECRET_CHUNK_ID_LOADER__',
    path: require.resolve('./chunk-ids-loader.js'),
  },
  fileLoader: {
    alias: '__SECRET_FILE_LOADER__',
    path: require.resolve('./file-loader.js'),
  },
  babelLoader: {
    path: require.resolve('./babel-loader.js'),
  },
  i18nManifestLoader: {
    alias: '__SECRET_I18N_MANIFEST_INSTRUMENTATION_LOADER__',
    path: require.resolve('./i18n-manifest-loader.js'),
  },
};

module.exports = loaderIndex;
