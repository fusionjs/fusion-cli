/* @flow */
/* eslint-env node */
const winston = require('winston');
const {Compiler} = require('../build/compiler.js');

exports.command = 'build [dir]';
exports.desc = 'Build your app';
exports.builder = {
  cover: {
    type: 'boolean',
    default: false,
    describe: 'Build tests (with coverage) as well as application',
  },
  test: {
    type: 'boolean',
    default: false,
    describe: 'Build tests as well as application',
  },
  production: {
    type: 'boolean',
    default: false,
    describe: 'Build production assets',
  },
  'log-level': {
    type: 'string',
    default: 'info',
    describe: 'Log level to show',
  },
};

exports.run = async function(
  {
    dir = '.',
    production,
    test,
    cover,
    logLevel,
  } /*: {
    dir: string,
    production: boolean,
    test: boolean,
    cover: boolean,
    logLevel: string,
  }*/
) {
  const logger = new winston.Logger({
    transports: [
      new winston.transports.Console({colorize: true, level: logLevel}),
    ],
  });

  const envs = [];
  if (production) envs.push('production');
  if (test) envs.push('test');
  if (envs.length === 0) envs.push('development');
  const compiler = new Compiler({envs, dir, cover, logger});

  await compiler.clean();

  await new Promise((resolve, reject) => {
    compiler.start((err, stats) => {
      if (err || stats.hasErrors()) {
        return reject(err || new Error('Compiler stats included errors.'));
      }
      return resolve();
    });
  });

  return compiler;
};
