// @flow
/* eslint-env node */

const t = require('assert');
const fs = require('fs');
const path = require('path');

const CDP = require('chrome-remote-interface');
const spawn = require('child_process').spawn;

const {promisify} = require('util');
const exec = promisify(require('child_process').exec);

const readFile = promisify(fs.readFile);

const countTests = require('./fixture/src/count-tests');

const runnerPath = require.resolve('../../../bin/cli-runner');

const dir = path.resolve(__dirname, './fixture');

jest.setTimeout(10000);

test('`fusion test` passes', async () => {
  const args = `test --dir=${dir} --configPath=../../../../build/jest/jest-config.js --match=passes`;

  const cmd = `require('${runnerPath}').run('node ${runnerPath} ${args}')`;
  const response = await exec(`node -e "${cmd}"`);
  t.equal(countTests(response.stderr), 2, 'ran 2 tests');
});

test('`fusion test` failure', async () => {
  const args = `test --dir=${dir} --configPath=../../../../build/jest/jest-config.js --match=fails`;

  const cmd = `require('${runnerPath}').run('node ${runnerPath} ${args}')`;
  try {
    await exec(`node -e "${cmd}"`);
    // $FlowFixMe
    t.fail('should not succeed');
  } catch (e) {
    t.equal(countTests(e.message), 2, 'ran 2 tests');
    t.notEqual(e.code, 0, 'exits with non-zero status code');
  }
});

test('`fusion test` all passing tests', async () => {
  const args = `test --dir=${dir} --configPath=../../../../build/jest/jest-config.js --match=pass`;

  const cmd = `require('${runnerPath}').run('node ${runnerPath} ${args}')`;
  const response = await exec(`node -e "${cmd}"`);
  t.equal(countTests(response.stderr), 4, 'ran 4 tests');
});

test('`fusion test` expected test passes in browser/node', async () => {
  const args = `test --dir=${dir} --configPath=../../../../build/jest/jest-config.js --match=pass-`;

  const cmd = `require('${runnerPath}').run('node ${runnerPath} ${args}')`;
  const response = await exec(`node -e "${cmd}"`);
  t.equal(countTests(response.stderr), 2, 'ran 2 tests');
});

test('`fusion test` expected tests fail when run in browser/node', async () => {
  const args = `test --dir=${dir} --configPath=../../../../build/jest/jest-config.js --match=fail-`;

  const cmd = `require('${runnerPath}').run('node ${runnerPath} ${args}')`;
  try {
    await exec(`node -e "${cmd}"`);
    // $FlowFixMe
    t.fail('should not succeed');
  } catch (e) {
    t.notEqual(e.code, 0, 'exits with non-zero status code');
    t.equal(countTests(e.message), 2, 'ran 2 tests');
  }
});

test('`fusion test --testFolder=integration` runs correct tests', async () => {
  const args = `test --dir=${dir} --configPath=../../../../build/jest/jest-config.js --env=node --testFolder=__integration__`;

  const cmd = `require('${runnerPath}').run('node ${runnerPath} ${args}')`;
  const response = await exec(`node -e "${cmd}"`);
  t.equal(countTests(response.stderr), 1, 'ran 1 test');
});

test('`fusion test --testMatch=**/__foo__/**/*js` runs correct tests', async () => {
  const args = `test --dir=${dir} --configPath=../../../../build/jest/jest-config.js --env=node --testMatch=**/__foo__/**/*.js`;

  const cmd = `require('${runnerPath}').run('node ${runnerPath} ${args}')`;
  const response = await exec(`node -e "${cmd}"`);
  t.equal(countTests(response.stderr), 1, 'ran 1 test');
});

test('`fusion test --testMatch=**/__foo__/**/*js,**/__integration__/**/*.js` runs correct tests', async () => {
  const args = `test --dir=${dir} --configPath=../../../../build/jest/jest-config.js --env=node --testMatch=**/__foo__/**/*.js,**/__integration__/**/*.js`;

  const cmd = `require('${runnerPath}').run('node ${runnerPath} ${args}')`;
  const response = await exec(`node -e "${cmd}"`);

  t.equal(countTests(response.stderr), 2, 'ran 2 tests');
});

test('`fusion test --testRegex=/__foo__/.*` runs correct tests', async () => {
  const args = `test --dir=${dir} --configPath=../../../../build/jest/jest-config.js --env=node --testRegex=.*/__foo__/.*`;

  const cmd = `require('${runnerPath}').run('node ${runnerPath} ${args}')`;
  const response = await exec(`node -e "${cmd}"`);
  t.equal(countTests(response.stderr), 1, 'ran 1 test');
});

test('`fusion test --testRegex and --testMatch cannot occur at same time', async () => {
  const args = `test --dir=${dir} --configPath=../../../../build/jest/jest-config.js --env=node --testMatch=**/__foo__/**/*.js --testRegex=.*/__foo__/.*`;

  const cmd = `require('${runnerPath}').run('node ${runnerPath} ${args}')`;

  await exec(`node -e "${cmd}"`).catch(e => t.ok('ok'));
});

test('`fusion test --testFolder and --testMatch cannot occur at same time', async () => {
  const args = `test --dir=${dir} --configPath=../../../../build/jest/jest-config.js --env=node --testMatch=**/__foo__/**/*.js --testFolder=__foo__`;

  const cmd = `require('${runnerPath}').run('node ${runnerPath} ${args}')`;
  // $FlowFixMe
  await exec(`node -e "${cmd}"`).then(() => t.fail(), e => t.ok('ok'));
});

test('`fusion test --testFolder and --testRegex cannot occur at same time', async () => {
  const args = `test --dir=${dir} --configPath=../../../../build/jest/jest-config.js --env=node --testRegex=.*/__foo__/.* --testFolder=__foo__`;

  const cmd = `require('${runnerPath}').run('node ${runnerPath} ${args}')`;
  // $FlowFixMe
  await exec(`node -e "${cmd}"`).then(() => t.fail(), e => t.ok('ok'));
});

test('`fusion test` snapshotting', async () => {
  const args = `test --dir=${dir} --configPath=../../../../build/jest/jest-config.js --match=snapshot-no-match`;

  const snapshotFile = path.join(
    dir,
    'src/__tests__/__snapshots__/snapshot-no-match.js.fixture'
  );
  const backupSnapshot = path.join(
    __dirname,
    'backup-snapshots/snapshot-no-match.js.fixture'
  );

  // Copy fixture to snapshot
  fs.createReadStream(snapshotFile).pipe(
    fs.createWriteStream(snapshotFile.replace(/fixture$/, 'snap'))
  );

  const cmd = `require('${runnerPath}').run('node ${runnerPath} ${args}')`;
  try {
    await exec(`node -e "${cmd}"`);
    // $FlowFixMe
    t.fail('should not succeed');
  } catch (e) {
    t.notEqual(e.code, 0, 'exits with non-zero status code');
    t.equal(countTests(e.message), 2, 'ran 2 tests');
  }

  const updateSnapshot = `require('${runnerPath}').run('node ${runnerPath} ${args} --updateSnapshot')`;
  await exec(`node -e "${updateSnapshot}"`);

  const newSnapshotCode = await readFile(snapshotFile);
  const originalSnapshotCode = await readFile(backupSnapshot);
  t.notEqual(newSnapshotCode, originalSnapshotCode, 'snapshot is updated');

  fs.unlinkSync(snapshotFile.replace(/fixture$/, 'snap'));
}, 60000);

test('`fusion test` snapshotting with -u option', async () => {
  const args = `test --dir=${dir} --configPath=../../../../build/jest/jest-config.js --match=snapshot-no-match`;

  const snapshotFile = path.join(
    dir,
    'src/__tests__/__snapshots__/snapshot-no-match.js.fixture'
  );

  const backupSnapshot = path.join(
    __dirname,
    'backup-snapshots/snapshot-no-match.js.fixture'
  );

  // Copy fixture to snapshot
  fs.createReadStream(snapshotFile).pipe(
    fs.createWriteStream(snapshotFile.replace(/fixture$/, 'snap'))
  );

  const cmd = `require('${runnerPath}').run('node ${runnerPath} ${args}')`;
  try {
    await exec(`node -e "${cmd}"`);
    // $FlowFixMe
    t.fail('should not succeed');
  } catch (e) {
    t.notEqual(e.code, 0, 'exits with non-zero status code');
    t.equal(countTests(e.message), 2, 'ran 2 tests');
  }

  const updateSnapshot = `require('${runnerPath}').run('node ${runnerPath} ${args} -u')`;
  await exec(`node -e "${updateSnapshot}"`);

  const newSnapshotCode = await readFile(snapshotFile);
  const originalSnapshotCode = await readFile(backupSnapshot);
  t.notEqual(newSnapshotCode, originalSnapshotCode, 'snapshot is updated');

  fs.unlinkSync(snapshotFile.replace(/fixture$/, 'snap'));
}, 60000);

test('`fusion test` snapshotting - enzyme serializer', async () => {
  const args = `test --dir=${dir} --configPath=../../../../build/jest/jest-config.js --match=snapshot-enzyme-no-match`;

  const snapshotFile = path.join(
    dir,
    'src/__tests__/__snapshots__/snapshot-enzyme-no-match.js.fixture'
  );

  const backupSnapshot = path.join(
    __dirname,
    'backup-snapshots/snapshot-enzyme-no-match.js.fixture'
  );

  // Copy fixture to snapshot
  fs.createReadStream(snapshotFile).pipe(
    fs.createWriteStream(snapshotFile.replace(/fixture$/, 'snap'))
  );

  const cmd = `require('${runnerPath}').run('node ${runnerPath} ${args}')`;
  try {
    await exec(`node -e "${cmd}"`);
    // $FlowFixMe
    t.fail('should not succeed');
  } catch (e) {
    t.notEqual(e.code, 0, 'exits with non-zero status code');
    t.equal(countTests(e.message), 2, 'ran 2 tests');
  }

  await exec(`node ${runnerPath} ${args} --updateSnapshot`);

  const newSnapshotCode = await readFile(snapshotFile);
  const originalSnapshotCode = await readFile(backupSnapshot);
  t.notEqual(newSnapshotCode, originalSnapshotCode, 'snapshot is updated');

  fs.unlinkSync(snapshotFile.replace(/fixture$/, 'snap'));
});

test('`fusion test` dynamic imports', async () => {
  const args = `test --dir=${dir} --configPath=../../../../build/jest/jest-config.js --match=dynamic-imports`;

  const cmd = `require('${runnerPath}').run('node ${runnerPath} ${args}')`;
  const response = await exec(`node -e "${cmd}"`);
  t.equal(countTests(response.stderr), 2, 'ran 2 tests');
});

test('`fusion test` coverage', async () => {
  const args = `test --dir=${dir} --configPath=../../../../build/jest/jest-config.js --coverage --match=passes --collectCoverageFrom=!**/istanbul-ignore-coverage-cli.js`;

  const cmd = `require('${runnerPath}').run('node ${runnerPath} ${args}')`;
  const response = await exec(`node -e "${cmd}"`);

  t.equal(countTests(response.stderr), 2, 'ran 2 tests');

  // Look for something like coverage
  t.ok(response.stdout.includes('Uncovered Line #s'));

  // This file is outside of src and should not be included in coverage
  t.ok(!response.stdout.includes('should-not-count-for-coverage.js'));

  // These files instruments the istanbul ignore annotation and should not be included in coverage
  t.ok(!response.stdout.includes('istanbul-ignore-coverage.js'));

  // Ignored by the CLI flag
  t.ok(!response.stdout.includes('istanbul-ignore-coverage-cli.js'));
});

test('`fusion test` coverage ignore multiple globs from collectCoverageFrom', async () => {
  const args = `test --dir=${dir} --configPath=../../../../build/jest/jest-config.js --coverage --match=passes --collectCoverageFrom=!**/istanbul-ignore-coverage-cli.js --collectCoverageFrom=!**/class-props.js`;

  const cmd = `require('${runnerPath}').run('node ${runnerPath} ${args}')`;
  const response = await exec(`node -e "${cmd}"`);

  // Ignored by the CLI flags
  t.ok(!response.stdout.includes('istanbul-ignore-coverage-cli.js'));
  t.ok(!response.stdout.includes('class-props.js'));
});

test('`fusion test` class properties', async () => {
  const args = `test --dir=${dir} --configPath=../../../../build/jest/jest-config.js --match=class-props`;

  const cmd = `require('${runnerPath}').run('node ${runnerPath} ${args}')`;
  const response = await exec(`node -e "${cmd}"`);
  t.equal(countTests(response.stderr), 2, 'ran 2 tests');
});

test('`fusion test` cobertura coverage reports', async () => {
  const args = `test --dir=${dir} --configPath=../../../../build/jest/jest-config.js --coverage --match=passes`;

  const cmd = `require('${runnerPath}').run('node ${runnerPath} ${args} --env=jsdom')`;
  const response = await exec(`node -e "${cmd}"`);
  t.equal(countTests(response.stderr), 1, 'ran 1 tests');

  const cobertunaReport = await readFile(
    path.resolve(dir, 'coverage/cobertura-coverage.xml'),
    'utf8'
  );
  // Only a single report should be generated
  t.ok(cobertunaReport.includes('<line number="2" hits="1"/>'));
  t.ok(!cobertunaReport.includes('<line number="2" hits="2"/>'));

  t.ok(
    cobertunaReport.includes('not-imported-in-tests.js'),
    'report includes files not imported in tests'
  );

  // Assert that there's two hits when combining coverage
  const cmd2 = `require('${runnerPath}').run('node ${runnerPath} ${args}')`;
  const response2 = await exec(`node -e "${cmd2}"`);
  t.equal(countTests(response2.stderr), 2, 'ran 2 tests');

  const combinedReport = await readFile(
    path.resolve(dir, 'coverage/cobertura-coverage.xml')
  );

  t.ok(combinedReport.includes('<line number="2" hits="2"/>'));
  t.ok(!combinedReport.includes('<line number="2" hits="1"/>'));

  t.ok(
    combinedReport.includes('not-imported-in-tests.js'),
    'report includes files not imported in tests'
  );
}, 60000);

test('`fusion test` environment variables', async () => {
  const args = `test --dir=${dir} --configPath=../../../../build/jest/jest-config.js --match=environment-variables`;

  const cmd = `require('${runnerPath}').run('node ${runnerPath} ${args}')`;
  const response = await exec(`node -e "${cmd}"`, {
    env: Object.assign({}, process.env, {
      NODE_ENV: 'development',
    }),
  });
  t.equal(countTests(response.stderr), 2, 'ran 2 tests');
});

test('`fusion test` writes results to disk based on env var', async () => {
  const args = `test --dir=${dir} --configPath=../../../../build/jest/jest-config.js --match=passes`;

  const testMetadataPath = path.join(dir, 'test-results.json');

  const cmd = `require('${runnerPath}').run('node ${runnerPath} ${args}')`;
  const response = await exec(`node -e "${cmd}"`, {
    env: Object.assign({}, process.env, {
      FUSION_TEST_METADATA_PATH: testMetadataPath,
    }),
  });
  t.equal(countTests(response.stderr), 2, 'ran 2 tests');
  const results = require(testMetadataPath);
  t.equal(results.numTotalTests, 2, 'two tests in results json');
  fs.unlinkSync(testMetadataPath);
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

  let completed = new Promise(resolve => {
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
            t.ok('ok');
            resolve();
          }
        }
      });
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

  await completed;

  t.ok(
    Object.keys(listenAddresses).length >= 1,
    'found a remote debug connection'
  );

  child.kill();
}, 100000);
