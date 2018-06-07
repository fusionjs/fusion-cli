/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env node */

const {Compiler} = require('../build/compiler');
const analyzer = require('bundle-analyzer');
const fs = require('fs');
const util = require('util');

const unlink = util.promisify(fs.unlink);
const readDir = util.promisify(fs.readdir);

exports.command = 'profile [--dir] [--environment] [--port]';
exports.desc = 'Profile your application';
exports.builder = {
  dir: {
    type: 'string',
    default: '.',
    describe: 'Root path for the application relative to CLI CWD',
  },
  environment: {
    type: 'string',
    default: 'production',
    describe: 'Either `production` or `development`',
  },
  port: {
    type: 'number',
    default: '4000',
    describe: 'Port for the bundle analyzer server',
  },
};
exports.run = async function profileHandler(
  {dir = '.', port, environment} /*: any */
) {
  const compiler = new Compiler({envs: [environment], dir, watch: true});
  const server = analyzer.start({
    dir: `${dir}/.fusion/dist/${environment}/client`,
    port,
  });

  const run = async ({stats}) => {
    const filenames = Object.keys(stats[0].compilation.assets);
    const dirname = `${dir}/.fusion/dist/${environment}/client`;
    const files = await readDir(dirname);
    const obsolete = files.filter(f => !filenames.find(n => f.match(n)));
    await Promise.all(obsolete.map(o => unlink(`${dirname}/${o}`)));
    server.update();
  };
  const watcher = compiler.start();
  compiler.on('done', run);

  return {
    compiler,
    stop() {
      watcher.close();
      server.close();
    },
  };
};
