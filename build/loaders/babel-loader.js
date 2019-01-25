/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
/* eslint-env node */

const crypto = require('crypto');
const path = require('path');

const Worker = require('jest-worker').default;
const babel = require('@babel/core');
const loaderUtils = require('loader-utils');

const PersistentDiskCache = require('../persistent-disk-cache.js');
// const TranslationsExtractor = require('../babel-plugins/babel-plugin-i18n');

const {translationsDiscoveryKey} = require('./loader-context.js');

/*::
import type {TranslationsDiscoveryContext} from "./loader-context.js";
*/

module.exports = webpackLoader;

const {version: fusionCLIVersion} = require('../../package.json');

function webpackLoader(source /*: string */, inputSourceMap /*: Object */) {
  // Make the loader async
  const callback = this.async();

  loader
    .call(this, source, inputSourceMap, this[translationsDiscoveryKey])
    .then(([code, map]) => callback(null, code, map), err => callback(err));
}

let worker;
let cache;
let cleanup;

function getCache(cacheDir) {
  if (!cache) {
    cache = new PersistentDiskCache(cacheDir);
  }
  return cache;
}

async function loader(
  source,
  inputSourceMap,
  discoveryState /*: TranslationsDiscoveryContext*/
) {
  if (!cleanup) {
    cleanup = true;
    this._compiler.hooks.done.tap('babel-loader', () => {
      if (worker) {
        worker.end();
        worker = void 0;
      }
      // console.log('clear worker');
    });
  }

  if (!worker) {
    worker = new Worker(require.resolve('./babel-worker.js'));
    worker.getStdout().pipe(process.stdout);
    worker.getStderr().pipe(process.stderr);
  }

  const filename = this.resourcePath;
  const loaderOptions = loaderUtils.getOptions(this);

  const optionsA = {
    filename,
    sourceRoot: this.rootContext,
    sourceMap: this.sourceMap,
    inputSourceMap: inputSourceMap || void 0,
    sourceFileName: relative(this.rootContext, filename),
  };

  const cacheKey = crypto
    // non-cryptographic purposes
    // md4 is the fastest built-in algorithm
    .createHash('md4')
    // Changing any of the following values should yield a new cache key,
    // thus our hash should take into account them all
    .update(source)
    .update(filename) // Analysis/transforms might depend on filenames
    .update(JSON.stringify(loaderOptions))
    .update(babel.version)
    .update(fusionCLIVersion)
    .digest('hex');

  const cacheDir = path.join(process.cwd(), 'node_modules/.fusion_babel-cache');

  const diskCache = getCache(cacheDir);

  const result = await diskCache.get(cacheKey, async () => {
    // console.log('before');
    // $FlowFixMe
    const workerResult = await worker.transform(source, optionsA, this.query);
    // console.log('DONE!!');
    return workerResult;
  });

  if (result) {
    const {code, map, metadata} = result;

    if (discoveryState && metadata.translationIds) {
      discoveryState.set(filename, new Set(metadata.translationIds));
    }

    return [code, map];
  }

  // If the file was ignored, pass through the original content.
  return [source, inputSourceMap];
}

function relative(root, file) {
  const rootPath = root.replace(/\\/g, '/').split('/')[1];
  const filePath = file.replace(/\\/g, '/').split('/')[1];
  // If the file is in a completely different root folder
  // use the absolute path of the file
  if (rootPath && rootPath !== filePath) {
    return file;
  }
  return path.relative(root, file);
}
