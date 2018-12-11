// @flow
/* eslint-env node */

const t = require('assert');
const path = require('path');
const CDP = require('chrome-remote-interface');
const spawn = require('child_process').spawn;

const getPort = require('get-port');

const dir = path.resolve(__dirname, './fixture');
const runnerPath = require.resolve('../../../bin/cli-runner');

const {cmd} = require('../utils.js');

test('generates error if missing default export', async () => {
  await cmd(`build --dir=${dir}`);

  const promise = cmd(`start --dir=${dir} --port=${await getPort()}`, {
    stdio: 'pipe',
  });
  // $FlowFixMe
  const {proc} = promise;

  try {
    await promise;
    // $FlowFixMe
    t.fail('did not error');
  } catch (e) {
    t.ok(e.stderr.includes('initialize is not a function'));
  } finally {
    proc.kill();
  }
});

async function triggerCodeStep() {
  return new Promise(resolve => {
    CDP({port: '9229'}, async client => {
      const {Runtime} = client;
      await Runtime.runIfWaitingForDebugger();
      await client.close();
      resolve();
    }).on('error', err => {
      throw err;
    });
  });
}

test('`fusion test --debug --env=jsdom,node`', async () => {
  const args = `test --dir=${dir} --configPath=../../../../build/jest/jest-config.js --debug --env=jsdom,node  --match=passes`;

  const cmd = `require('${runnerPath}').run('node ${runnerPath} ${args}')`;
  const stderrLines = [];
  const child = spawn('node', ['-e', cmd]);

  const listenAddresses = {};
  let numResults = 0;
  child.stderr &&
    child.stderr.on('data', data => {
      const line = data.toString();
      // eslint-disable-next-line no-console
      console.log(` - received spawn line: ${line}`);
      stderrLines.push(line);
      // Keep track of all addresses that we start listening to.
      if (line.startsWith('Debugger listening on ws')) {
        listenAddresses[line] = true;
      }
      // Wait until we have results for both environments before ending the test.
      if (/Tests:.*2\s+passed,\s+2\s+total/.test(line)) {
        numResults += 1;
        if (numResults == 1) {
          // TODO
        }
      }
    });

  // Poll until we get a listener message.
  async function checkStartedMessageCount(count) {
    return new Promise(async resolve => {
      while (Object.keys(listenAddresses).length < count) {
        await new Promise(r => setTimeout(r, 100));
      }
      resolve();
    });
  }

  // Step through the environment
  await checkStartedMessageCount(1);
  await triggerCodeStep();

  t.ok(
    Object.keys(listenAddresses).length >= 1,
    'found a remote debug connection'
  );

  child.kill();
}, 100000);
