/* eslint-env node */
const path = require('path');
const {spawn} = require('child_process');
const rimraf = require('rimraf');

const mergeCoverage = require('./merge-coverage');

module.exports.TestAppRuntime = function({
  dir = '.',
  watch = false,
  debug = false,
  match,
  env,
  testFolder,
  updateSnapshot,
  coverage,
  configPath,
}) {
  const state = {procs: []};
  const rootDir = path.resolve(process.cwd(), dir);

  this.run = () => {
    this.stop();
    const allTestEnvs = env.split(',');

    const getArgs = () => {
      let args = [require.resolve('jest/bin/jest.js')];
      if (debug) {
        args = [
          '--inspect-brk',
          require.resolve('jest/bin/jest.js'),
          '--runInBand',
        ];
      }

      args = args.concat(['--config', configPath]);

      if (watch) {
        args.push('--watch');
      }

      if (coverage) {
        args.push('--coverage');
      }

      if (match && match.length > 0) {
        args.push(match);
      }

      if (updateSnapshot) {
        args.push('--updateSnapshot');
      }

      return args;
    };

    const setup = () => {
      if (!coverage) {
        return Promise.resolve();
      }

      // Remove existing coverage directories
      const folders = [
        `${rootDir}/coverage/`,
        `${rootDir}/coverage-node/`,
        `${rootDir}/coverage-jsdom/`,
      ];
      return Promise.all(
        folders.map(
          folder => new Promise(resolve => rimraf(folder, () => resolve))
        )
      );
    };

    const spawnProc = testEnv => {
      return new Promise((resolve, reject) => {
        const args = getArgs();
        args.push('--env');
        args.push(testEnv);

        const procEnv = {
          JEST_ENV: testEnv,
          TEST_FOLDER: testFolder,
        };

        // Pass in the CI flag to prevent console clearing when watching on more than one suite
        if (allTestEnvs.length > 1 && watch) {
          procEnv.CI = 'true';
        }
        const proc = spawn('node', args, {
          cwd: rootDir,
          stdio: 'inherit',
          env: Object.assign(procEnv, process.env),
        });
        proc.on('error', reject);
        proc.on('exit', (code, signal) => {
          if (code) {
            return reject(new Error(`Test exited with code ${code}`));
          }

          if (signal) {
            return reject(
              new Error(`Test process exited with signal ${signal}`)
            );
          }

          return resolve();
        });
        state.procs.push(proc);
      });
    };

    const finish = () => {
      if (!coverage) {
        return Promise.resolve();
      }
      return mergeCoverage({
        dir: rootDir,
        environments: allTestEnvs,
      });
    };

    const getResolveChain = () => {
      if (!debug) {
        return Promise.all(allTestEnvs.map(spawnProc));
      }
      // Run environments in serial when debugging so we don't get a port collision.
      let chain = Promise.resolve();
      allTestEnvs.forEach(env => {
        chain = chain.then(() => spawnProc(env));
      });
      return chain;
    };

    return setup()
      .then(getResolveChain())
      .then(finish());
  };

  this.stop = () => {
    if (state.procs.length) {
      state.procs.forEach(proc => proc.kill());
      state.procs = [];
    }
  };
};
