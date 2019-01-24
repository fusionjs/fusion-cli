/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env node */

const fs = require('fs');
const path = require('path');

const webpack = require('webpack');
const chalk = require('chalk');
const webpackHotMiddleware = require('webpack-hot-middleware');
const rimraf = require('rimraf');

const webpackDevMiddleware = require('../lib/simple-webpack-dev-middleware');
const getWebpackConfig = require('./get-webpack-config.js');
const {
  DeferredState,
  SyncState,
  MergedDeferredState,
} = require('./shared-state-containers.js');
const mergeChunkMetadata = require('./merge-chunk-metadata');
const loadFusionRC = require('./load-fusionrc.js');

function getStatsLogger({dir, logger, env}) {
  return (err, stats) => {
    // syntax errors are logged 4 times (once by webpack, once by babel, once on server and once on client)
    // we only want to log each syntax error once
    function dedupeErrors(items) {
      const re = /BabelLoaderError(.|\n)+( {4}at transpile)/gim;
      return items.map(item => item.replace(re, '$2'));
    }

    const isProd = env === 'production';

    if (err) {
      logger.error(err.stack || err);
      if (err.details) {
        logger.error(err.details);
      }
      return;
    }

    const file = path.resolve(dir, '.fusion/stats.json');
    const info = stats.toJson({context: path.resolve(dir)});
    fs.writeFile(file, JSON.stringify(info, null, 2), () => {});

    if (stats.hasErrors()) {
      dedupeErrors(info.errors).forEach(e => logger.error(e));
    }
    // TODO(#13): These logs seem to be kinda noisy for dev.
    if (isProd) {
      info.children.forEach(child => {
        child.assets
          .slice()
          .filter(asset => {
            return !asset.name.endsWith('.map');
          })
          .sort((a, b) => {
            return b.size - a.size;
          })
          .forEach(asset => {
            logger.info(`Entrypoint: ${chalk.bold(child.name)}`);
            logger.info(`Asset: ${chalk.bold(asset.name)}`);
            logger.info(`Size: ${chalk.bold(asset.size)} bytes`);
          });
      });
    }
    if (stats.hasWarnings()) {
      dedupeErrors(info.warnings).forEach(e => logger.warn(e));
    }
  };
}

/*::
type CompilerType = {
  on: (type: any, callback: any) => any,
  start: (callback: any) => any,
  getMiddleware: () => any,
  clean: () => any,
};
*/

/*::
type CompilerOpts = {
  dir?: string,
  env: "production" | "development",
  watch?: boolean,
  forceLegacyBuild?: boolean,
  logger?: any,
  preserveNames?: boolean,
};
*/

function Compiler(
  {
    dir = '.',
    env,
    forceLegacyBuild,
    preserveNames,
    watch = false,
    logger = console,
  } /*: CompilerOpts */
) /*: CompilerType */ {
  const clientChunkMetadata = new DeferredState();
  const legacyClientChunkMetadata = new DeferredState();
  const legacyBuildEnabled = new SyncState(
    forceLegacyBuild || !watch || env === 'production'
  );
  const mergedClientChunkMetadata /*: any */ = new MergedDeferredState(
    [
      {deferred: clientChunkMetadata, enabled: new SyncState(true)},
      {deferred: legacyClientChunkMetadata, enabled: legacyBuildEnabled},
    ],
    mergeChunkMetadata
  );

  const state = {
    clientChunkMetadata,
    legacyClientChunkMetadata,
    mergedClientChunkMetadata,
    i18nManifest: new DeferredState(),
    legacyBuildEnabled,
  };
  const root = path.resolve(dir);
  const fusionConfig = loadFusionRC(root);
  const legacyPkgConfig = loadLegacyPkgConfig(root);

  const sharedOpts = {
    dir: root,
    watch,
    state,
    fusionConfig,
    legacyPkgConfig,
    preserveNames,
  };

  const dev = env === 'development';
  const compiler = webpack([
    getWebpackConfig({id: 'client-modern', dev, ...sharedOpts}),
    getWebpackConfig({id: 'server', dev, ...sharedOpts}),
  ]);

  const statsLogger = getStatsLogger({dir, logger, env});

  this.on = (type, callback) => compiler.hooks[type].tap('compiler', callback);
  this.start = cb => {
    cb = cb || function noop(err, stats) {};
    // Handler may be called multiple times by `watch`
    // But only call `cb` the first time
    // subsequent rebuilds are subscribed to with 'compiler.on('done')'
    let hasCalledCb = false;
    const handler = (err, stats) => {
      statsLogger(err, stats);
      if (!hasCalledCb) {
        hasCalledCb = true;
        cb(err, stats);
      }
    };
    if (watch) {
      return compiler.watch({}, handler);
    } else {
      compiler.run(handler);
      // mimic watcher interface for API consistency
      return {
        close() {},
        invalidate() {},
      };
    }
  };

  this.getMiddleware = () => {
    const dev = webpackDevMiddleware(compiler);
    const hot = webpackHotMiddleware(compiler, {log: false});
    return (req, res, next) => {
      dev(req, res, err => {
        if (err) return next(err);
        return hot(req, res, next);
      });
    };
  };

  this.clean = () => {
    return new Promise((resolve, reject) => {
      rimraf(`${dir}/.fusion`, e => (e ? reject(e) : resolve()));
    });
  };

  return this;
}

function loadLegacyPkgConfig(dir) {
  const appPkgJsonPath = path.join(dir, 'package.json');
  const legacyPkgConfig = {};
  if (fs.existsSync(appPkgJsonPath)) {
    // $FlowFixMe
    const appPkg = require(appPkgJsonPath);
    if (typeof appPkg.node !== 'undefined') {
      // eslint-disable-next-line no-console
      console.warn(
        [
          `Warning: using a top-level "node" field in your app package.json to override node built-in shimming is deprecated.`,
          `Please use the "nodeBuiltins" field in .fusionrc.js instead.`,
          `See: https://github.com/fusionjs/fusion-cli/blob/master/docs/fusionrc.md#nodebuiltins`,
        ].join(' ')
      );
    }
    legacyPkgConfig.node = appPkg.node;
  }
  return legacyPkgConfig;
}

module.exports.Compiler = Compiler;
