/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
/* eslint-env node */

const loaderUtils = require('loader-utils');
const webpack = require('webpack');
const MemoryFileSystem = require('memory-fs');

/*::
import type {WebpackConfigOpts} from "../get-webpack-config.js";
*/

module.exports = loader;

const instances = {};

function getCompiler(opts, resourcePath, filename) {
  if (instances[filename]) {
    return instances[filename];
  }
  const getWebpackConfig = require('../get-webpack-config.js');

  const config = getWebpackConfig({
    ...opts,
    id: 'worker',
  });
  config.output.filename = filename;

  // $FlowFixMe
  config.output.libraryExport = 'default';
  config.output.path = '/';
  // $FlowFixMe
  config.entry = resourcePath;
  const instance = webpack(config);
  instance.outputFileSystem = new MemoryFileSystem();

  instances[filename] = instance;

  return instance;
}

function loader() {
  if (!this['optsContext']) {
    return '// not supported';
  }

  this.cacheable(false);
  const callback = this.async();
  const opts /*: WebpackConfigOpts*/ = this['optsContext'];

  // TODO: Better way of getting the filename?
  const filename = this.resourcePath
    .replace(/\\/g, '/')
    .split('/')
    .pop();

  const compiler = getCompiler(opts, this.resourcePath, filename);

  compiler.run((err, stats) => {
    if (err || stats.hasErrors()) {
      const info = stats.toJson();

      for (let err of info.errors) {
        return void callback(new Error(err));
      }
    }

    // Let loader know about compilation dependencies so re-builds are triggered appropriately
    for (let fileDep of stats.compilation.fileDependencies) {
      this.addDependency(fileDep);
    }
    for (let contextDep of stats.compilation.contextDependencies) {
      this.addContextDependency(contextDep);
    }
    for (let missingDep of stats.compilation.missingDependencies) {
      this.addDependency(missingDep);
      this.addContextDependency(missingDep);
    }

    const assetContents = compiler.outputFileSystem.readFileSync(
      '/' + filename
    );

    const url = loaderUtils.interpolateName(this, '[hash].[ext]', {
      context: this.rootContext,
      content: assetContents,
    });

    const source = `module.exports = __webpack_public_path__ + ${JSON.stringify(
      url
    )};`;
    callback(null, source);
  });
}
