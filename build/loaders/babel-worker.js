/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
/* eslint-env node */

const path = require('path');
const babel = require('@babel/core');
const loaderUtils = require('loader-utils');
const getBabelConfig = require('../get-babel-config.js');

const TranslationsExtractor = require('../babel-plugins/babel-plugin-i18n');

/*::
import type {TranslationsDiscoveryContext} from "./loader-context.js";
*/

const cache = {};

class LoaderError extends Error {
  /*::
  hideStack: boolean
  */
  constructor(err) {
    super();
    const {name, message, codeFrame, hideStack} = formatError(err);
    this.name = 'BabelLoaderError';
    this.message = `${name ? `${name}: ` : ''}${message}\n\n${codeFrame}\n`;
    this.hideStack = hideStack;
    Error.captureStackTrace(this, this.constructor);
  }
}

let isRightWorker = false;

// let filenames = [];

exports.transform = function transform(
  source /*: string */,
  optionsA /*: any */,
  query /*: any */
) {
  let metadata /*: {translationIds?: Array<string>} */ = {};

  let isFile = false;

  // filenames.push(optionsA.filename);

  // if (optionsA.filename.includes('es2017')) {
  //   setTimeout(() => {
  //     console.log(process.env.JEST_WORKER_ID, filenames);
  //   }, 10000);
  //
  //   console.log(process.env.JEST_WORKER_ID);
  //   isRightWorker = true;
  //   isFile = true;
  // } else {
  //   // console.log('ELSE', optionsA.filename);
  // }

  // if (isRightWorker) {
  //   console.log(
  //     optionsA.filename,
  //     process.env.JEST_WORKER_ID,
  //     '[START WORKER]'
  //   );
  // }

  // process.stdout.write('yoo');

  // isFile && console.log('here00');

  const loaderOptions = loaderUtils.getOptions({query});

  // isFile && console.log('here0');

  // const stuff = {...loaderOptions, ...yo};
  // console.log('partialconfig', stuff.overrides);
  const config = babel.loadPartialConfig({
    ...optionsA,
    ...babelStuff(loaderOptions),
  });

  // isFile && console.log('here1');

  const options = config.options;

  let translationIds = new Set();
  // Add the discovery plugin
  // This only does side effects, so it is ok this doesn't affect cache key
  // This plugin is here because webpack config -> loader options
  // requires serialization. But we want to pass translationsIds directly.
  options.plugins.unshift([TranslationsExtractor, {translationIds}]);

  // console.log('yo', options);
  const transformed = transform2(source, options);

  if (translationIds.size > 0) {
    metadata.translationIds = Array.from(translationIds.values());
  }
  //
  // if (optionsA.filename.includes('es2017')) {
  //   console.log('\n[RETURN]', optionsA.filename);
  // }

  if (!transformed) {
    return null;
  }

  return {metadata, ...transformed};
};

function transform2(source, options) {
  const filename = options.filename;

  // if (filename.includes('es2017')) {
  //   console.log('inner', filename);
  // }

  let ast;

  // console.log(filename);
  if (cache[filename]) {
    ast = cache[filename];
    // console.log('cache HIT! ' + filename);
  } else {
    ast = babel.parseSync(source, options);
    cache[filename] = ast;
    // console.log('cache miss' + filename);
  }

  let result;
  try {
    result = babel.transformFromAstSync(ast, source, options);
  } catch (err) {
    throw err.message && err.codeFrame ? new LoaderError(err) : err;
  }

  if (!result) return null;

  // We don't return the full result here because some entries are not
  // really serializable. For a full list of properties see here:
  // https://github.com/babel/babel/blob/master/packages/babel-core/src/transformation/index.js
  // For discussion on this topic see here:
  // https://github.com/babel/babel-loader/pull/629
  const {code, map, sourceType} = result;

  if (map && (!map.sourcesContent || !map.sourcesContent.length)) {
    map.sourcesContent = [source];
  }

  return {code, map, sourceType};
}

const STRIP_FILENAME_RE = /^[^:]+: /;

function formatError(err) {
  if (err instanceof SyntaxError) {
    err.name = 'SyntaxError';
    err.message = err.message.replace(STRIP_FILENAME_RE, '');
    err.hideStack = true;
  } else if (err instanceof TypeError) {
    err.name = null;
    err.message = err.message.replace(STRIP_FILENAME_RE, '');
    err.hideStack = true;
  }
  return err;
}

/*::

type BabelMetaConfig = {
  legacy: boolean,
  dir: string,
  experimentalCompile: boolean,
  assumeNoImportSideEffects: boolean,
  dev: boolean,
  runtime: string,
  fusionBabelConfig: any,
};

*/

function babelStuff(metaConfig /*: BabelMetaConfig */) {
  const {
    dir,
    legacy,
    experimentalCompile,
    assumeNoImportSideEffects,
    dev,
    runtime,
    fusionBabelConfig,
  } = metaConfig;

  const target =
    runtime === 'server'
      ? 'node-bundled'
      : legacy
      ? 'browser-legacy'
      : 'browser-modern';

  const config = getBabelConfig({
    dev,
    fusionTransforms: true,
    assumeNoImportSideEffects,
    target,
    specOnly: false,
    plugins:
      fusionBabelConfig && fusionBabelConfig.plugins
        ? fusionBabelConfig.plugins
        : [],
    presets:
      fusionBabelConfig && fusionBabelConfig.presets
        ? fusionBabelConfig.presets
        : [],
  });

  if (!experimentalCompile) {
    // $FlowFixMe
    config.overrides = [
      {
        include: [
          // Explictly only transpile user source code as well as fusion-cli entry files
          path.join(dir, 'src'),
          /fusion-cli\/entries/,
          /fusion-cli\/plugins/,
        ],
        ...getBabelConfig({
          target,
          specOnly: true,
        }),
      },
    ];
  }

  return config;
}
