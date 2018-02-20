/* eslint-env node */
const fs = require('fs');
const path = require('path');
const test = require('tape');
const {cmd, start} = require('../run-command');
const {promisify} = require('util');
const request = require('request-promise');

const exists = promisify(fs.exists);
const readdir = promisify(fs.readdir);

test('`fusion build` works', async t => {
  const dir = path.resolve(__dirname, '../fixtures/noop');
  const serverEntryPath = path.resolve(
    dir,
    `.fusion/dist/development/server/server-main.js`
  );
  const serverMapPath = path.resolve(
    dir,
    `.fusion/dist/development/server/server-main.js.map`
  );
  const clientMain = path.resolve(
    dir,
    `.fusion/dist/development/client/client-main.js`
  );
  const clientMainMap = path.resolve(
    dir,
    `.fusion/dist/development/client/client-main.js.map`
  );
  const clientMainVendor = path.resolve(
    dir,
    `.fusion/dist/development/client/client-vendor.js`
  );
  const clientMainVendorMap = path.resolve(
    dir,
    `.fusion/dist/development/client/client-vendor.js.map`
  );
  await cmd(`build --dir=${dir}`);
  t.ok(await exists(serverEntryPath), 'Server Entry file gets compiled');
  t.ok(
    await exists(serverMapPath),
    'Server Entry file sourcemap gets compiled'
  );
  t.ok(await exists(clientMain), 'Client Entry file gets compiled');
  t.ok(
    await exists(clientMainMap),
    'Client Entry file sourcemap gets compiled'
  );
  t.ok(await exists(clientMainVendor), 'Client vendor file gets compiled');
  t.ok(
    await exists(clientMainVendorMap),
    'Client vendor file sourcemap gets compiled'
  );
  t.end();
});

test('`fusion build` works in production with a CDN_URL', async t => {
  const dir = path.resolve(__dirname, '../fixtures/noop');
  const serverEntryPath = path.resolve(
    dir,
    `.fusion/dist/production/server/server-main.js`
  );
  const serverMapPath = path.resolve(
    dir,
    `.fusion/dist/production/server/server-main.js.map`
  );
  await cmd(`build --dir=${dir} --production`);
  const clientFiles = await readdir(
    path.resolve(dir, '.fusion/dist/production/client')
  );
  t.ok(
    clientFiles.some(f => /client-main-(.*?).js$/.test(f)),
    'includes a versioned client-main.js file'
  );
  t.ok(
    clientFiles.some(f => /client-vendor-(.*?).js$/.test(f)),
    'includes a versioned client-vendor.js file'
  );
  t.ok(await exists(serverEntryPath), 'Server Entry file gets compiled');
  t.ok(
    await exists(serverMapPath),
    'Server Entry file sourcemap gets compiled'
  );
  const {res, proc} = await start(`--dir=${dir}`, {
    env: Object.assign({}, process.env, {CDN_URL: 'https://cdn.com/test'}),
  });
  t.ok(
    res.includes('src="https://cdn.com/test/client-main'),
    'includes a script reference to client-main'
  );
  t.ok(
    res.includes('src="https://cdn.com/test/client-vendor'),
    'includes a script reference to client-vendor'
  );
  proc.kill();
  t.end();
});

test('`fusion build` works in production with default asset path and supplied ROUTE_PREFIX', async t => {
  const dir = path.resolve(__dirname, '../fixtures/noop');
  const serverEntryPath = path.resolve(
    dir,
    `.fusion/dist/production/server/server-main.js`
  );
  const serverMapPath = path.resolve(
    dir,
    `.fusion/dist/production/server/server-main.js.map`
  );
  await cmd(`build --dir=${dir} --production`);
  const clientFiles = await readdir(
    path.resolve(dir, '.fusion/dist/production/client')
  );
  t.ok(
    clientFiles.some(f => /client-main-(.*?).js$/.test(f)),
    'includes a versioned client-main.js file'
  );
  t.ok(
    clientFiles.some(f => /client-vendor-(.*?).js$/.test(f)),
    'includes a versioned client-vendor.js file'
  );
  t.ok(await exists(serverEntryPath), 'Server Entry file gets compiled');
  t.ok(
    await exists(serverMapPath),
    'Server Entry file sourcemap gets compiled'
  );
  const {res, proc} = await start(`--dir=${dir}`, {
    env: Object.assign({}, process.env, {ROUTE_PREFIX: '/test-prefix'}),
  });
  t.ok(
    res.includes('src="/test-prefix/_static/client-main'),
    'includes a script reference to client-main'
  );
  t.ok(
    res.includes('src="/test-prefix/_static/client-vendor'),
    'includes a script reference to client-vendor'
  );
  proc.kill();
  t.end();
});

test('`fusion build/start with ROUTE_PREFIX and custom routes`', async t => {
  const dir = path.resolve(__dirname, '../fixtures/prefix');
  await cmd(`build --dir=${dir} --production`);
  const {proc, port} = await start(`--dir=${dir}`, {
    env: Object.assign({}, process.env, {ROUTE_PREFIX: '/test-prefix'}),
  });
  const rootRes = await request(`http://localhost:${port}/test-prefix`);
  t.equal(
    rootRes,
    'ROOT REQUEST',
    'strips route prefix correctly for root requests'
  );
  const testRes = await request(`http://localhost:${port}/test-prefix/test`);
  t.equal(
    testRes,
    'TEST REQUEST',
    'strips route prefix correctly for deep path requests'
  );
  proc.kill();
  t.end();
});

test('`fusion build` works in production', async t => {
  const dir = path.resolve(__dirname, '../fixtures/noop');
  const serverEntryPath = path.resolve(
    dir,
    `.fusion/dist/production/server/server-main.js`
  );
  const serverMapPath = path.resolve(
    dir,
    `.fusion/dist/production/server/server-main.js.map`
  );
  await cmd(`build --dir=${dir} --production`);
  const clientFiles = await readdir(
    path.resolve(dir, '.fusion/dist/production/client')
  );
  t.ok(
    clientFiles.some(f => /client-main-(.*?).js$/.test(f)),
    'includes a versioned client-main.js file'
  );
  t.ok(
    clientFiles.some(f => /client-vendor-(.*?).js$/.test(f)),
    'includes a versioned client-vendor.js file'
  );
  t.ok(await exists(serverEntryPath), 'Server Entry file gets compiled');
  t.ok(
    await exists(serverMapPath),
    'Server Entry file sourcemap gets compiled'
  );
  const {res, proc} = await start(`--dir=${dir}`);
  t.ok(
    res.includes('src="/_static/client-main'),
    'includes a script reference to client-main'
  );
  t.ok(
    res.includes('src="/_static/client-vendor'),
    'includes a script reference to client-vendor'
  );
  proc.kill();
  t.end();
});

test('`fusion build` with assets', async t => {
  const dir = path.resolve(__dirname, '../fixtures/assets');
  await cmd(`build --dir=${dir}`);
  const expectedAssetPath = '/_static/c300a7df05c8142598558365dbdaa451.css';
  try {
    const {proc, port} = await start(`--dir=${dir}`);
    const res = await request(`http://localhost:${port}${expectedAssetPath}`, {
      resolveWithFullResponse: true,
    });
    const contents = fs
      .readFileSync(path.resolve(dir, 'src/static/test.css'))
      .toString();
    t.equal(res.body, contents);
    t.equal(res.headers['x-test'], 'test');
    proc.kill();
  } catch (e) {
    t.ifError(e);
  }

  // with route prefix
  try {
    const {proc, port} = await start(`--dir=${dir}`, {
      env: Object.assign({}, process.env, {ROUTE_PREFIX: '/test-prefix'}),
    });
    const res = await request(
      `http://localhost:${port}/test-prefix${expectedAssetPath}`,
      {
        resolveWithFullResponse: true,
      }
    );
    const contents = fs
      .readFileSync(path.resolve(dir, 'src/static/test.css'))
      .toString();
    t.equal(res.body, contents);
    t.equal(res.headers['x-test'], 'test');
    proc.kill();
  } catch (e) {
    t.ifError(e);
  }
  t.end();
});
