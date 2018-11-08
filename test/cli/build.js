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
const test = require('tape');
const {promisify} = require('util');
const babel = require('@babel/core');
const request = require('request-promise');
const puppeteer = require('puppeteer');

const {cmd, run, start} = require('../run-command');

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

test('`fusion build` transpiles async middleware', async t => {
  const dir = path.resolve(__dirname, '../fixtures/transpile-async-plugin');
  const serverEntryPath = path.resolve(
    dir,
    `.fusion/dist/production/server/server-main.js`
  );
  const serverMapPath = path.resolve(
    dir,
    `.fusion/dist/production/server/server-main.js.map`
  );
  await cmd(`build --dir=${dir} --production`);
  const distPath = path.resolve(dir, '.fusion/dist/production/client');
  const clientFiles = await readdir(distPath);
  t.ok(
    clientFiles.some(f => /client-legacy-main-(.*?).js$/.test(f)),
    'includes a versioned client-legacy-main.js file'
  );
  t.ok(
    clientFiles.some(f => /client-legacy-vendor-(.*?).js$/.test(f)),
    'includes a versioned client-legacy-vendor.js file'
  );
  t.ok(await exists(serverEntryPath), 'Server Entry file gets compiled');
  t.ok(
    await exists(serverMapPath),
    'Server Entry file sourcemap gets compiled'
  );

  const legacyFiles = clientFiles.filter(f => /client-legacy/.test(f));
  legacyFiles.filter(file => path.extname(file) === '.js').forEach(file => {
    babel.transformFileSync(path.join(distPath, file), {
      plugins: [
        () => {
          return {
            visitor: {
              FunctionDeclaration: path => {
                if (path.node.async) {
                  t.fail(`bundle has untranspiled async function`);
                }
              },
              ArrowFunctionExpression: path => {
                if (path.node.async) {
                  t.fail('bundle has untranspiled async function');
                }
              },
              FunctionExpression: path => {
                if (path.node.async) {
                  t.fail('bundle has untranspiled async function');
                }
              },
            },
          };
        },
      ],
    });
  });

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
    res.includes('https://cdn.com/test/client-main'),
    'includes a reference to client-main'
  );
  t.ok(
    res.includes('https://cdn.com/test/client-vendor'),
    'includes a reference to client-vendor'
  );
  proc.kill();
  t.end();
});

async function getDistFiles(dir) {
  const clientFiles = await readdir(
    path.resolve(dir, '.fusion/dist/production/client')
  );
  const clientMainFile = clientFiles.filter(f =>
    /client-main-(.*?).js$/.test(f)
  )[0];
  const clientVendorFile = clientFiles.filter(f =>
    /client-vendor-(.*?).js$/.test(f)
  )[0];
  const splitClientChunks = clientFiles.filter(f => /[0-9]+-(.*?).js$/.test(f));
  return {
    clientFiles,
    clientMainFile,
    clientVendorFile,
    splitClientChunks,
  };
}

test('`fusion build` app with dynamic imports chunk hashing', async t => {
  const dir = path.resolve(__dirname, '../fixtures/dynamic-import-app');
  await cmd(`build --dir=${dir} --production`);

  const splitChunkId = 0;
  const distFiles = await getDistFiles(dir);
  const dynamicFileBundlePath = path.resolve(
    dir,
    '.fusion/dist/production/client',
    distFiles.splitClientChunks[splitChunkId]
  );

  // Ensure that we have a dynamic chunk with content
  const dynamicFileBundleContent = fs
    .readFileSync(dynamicFileBundlePath)
    .toString();
  t.ok(
    dynamicFileBundleContent.includes('loaded-dynamic-import'),
    'dynamic content exists in bundle'
  );

  // Update dynamic file content, and rebuild.
  const dynamicFileContent = fs
    .readFileSync(path.resolve(dir, 'src/dynamic.js'))
    .toString();
  const newContent = dynamicFileContent.replace(
    'loaded-dynamic-import',
    'loaded-dynamic-import-updated'
  );
  fs.writeFileSync(path.resolve(dir, 'src/dynamic.js'), newContent);
  await cmd(`build --dir=${dir} --production`);

  // Ensure that vendor and main chunks do not change.
  const rebuiltDistFiles = await getDistFiles(dir);
  t.equal(
    distFiles.clientVendorFile,
    rebuiltDistFiles.clientVendorFile,
    'vendor file hash should not change'
  );
  t.equal(
    distFiles.clientMainFile,
    rebuiltDistFiles.clientMainFile,
    'main file hash should not change'
  );
  t.notEqual(
    distFiles.splitClientChunks[splitChunkId],
    rebuiltDistFiles.splitClientChunks[splitChunkId],
    'split client file hash should change'
  );

  // Clean up changed files
  fs.writeFileSync(path.resolve(dir, 'src/dynamic.js'), dynamicFileContent);
  t.end();
});

test('`fusion build` app with dynamic imports integration', async t => {
  const dir = path.resolve(__dirname, '../fixtures/dynamic-import-app');

  var env = Object.create(process.env);
  env.NODE_ENV = 'production';

  await cmd(`build --dir=${dir} --production`, {env});

  // Run puppeteer test to ensure that page loads with dynamic content.
  const {proc, port} = await start(`--dir=${dir}`, {env});
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  await page.goto(`http://localhost:${port}/`, {waitUntil: 'load'});
  const content = await page.content();
  t.ok(
    content.includes('loaded-dynamic-import'),
    'app content contains loaded-dynamic-import'
  );
  const SYNC_CHUNK_COUNT = 3; // runtime + main + vendor
  const ROUTE_INDEPENDENT_ASYNC_CHUNK_COUNT = 1;

  const BASE_COUNT = SYNC_CHUNK_COUNT + ROUTE_INDEPENDENT_ASYNC_CHUNK_COUNT;

  t.equal(
    await page.$$eval('link[rel="modulepreload"]', els => els.length),
    BASE_COUNT
  );
  t.equal(
    await page.$$eval(
      'script[src]:not([type="module"]):not([type="application/json"])',
      els => els.length
    ),
    BASE_COUNT
  );
  t.equal(
    await page.$$eval('script[src][type="module"]', els => els.length),
    BASE_COUNT
  );

  // Async can causes race conditions as scripts may be executed before DOM is fully parsed.
  t.ok(
    await page.$$eval('script[src]:not([type="application/json"])', els =>
      els.every(el => el.async === false)
    ),
    'all scripts not be async'
  );

  await page.click('#split-route-link');
  t.equal(
    await page.$$eval(
      'script[src]:not([type="module"]):not([type="application/json"])',
      els => els.length
    ),
    BASE_COUNT + 1,
    'one extra script after loading new route'
  );

  t.ok(
    await page.$$eval('script[src]:not([type="application/json"])', els =>
      els.every(el => el.crossOrigin === null)
    ),
    'all scripts do not have crossorigin attribute'
  );

  t.ok(
    await page.$$eval('script[src]:not([type="application/json"])', els =>
      // eslint-disable-next-line
      els.every(el => el.getAttribute('nonce') === window.__NONCE__)
    ),
    'all scripts have nonce attribute'
  );

  await page.goto(`http://localhost:${port}/split-route`);

  t.equal(
    await page.$$eval('link[rel="modulepreload"]', els => els.length),
    BASE_COUNT + 1
  );
  t.equal(
    await page.$$eval(
      'script[src]:not([type="module"]):not([type="application/json"])',
      els => els.length
    ),
    BASE_COUNT + 1
  );
  t.equal(
    await page.$$eval('script[src][type="module"]', els => els.length),
    BASE_COUNT + 1
  );

  await browser.close();
  proc.kill();

  t.end();
});

test('`fusion build` app with split translations integration', async t => {
  const dir = path.resolve(__dirname, '../fixtures/split-translations');

  var env = Object.create(process.env);
  env.NODE_ENV = 'production';

  await cmd(`build --dir=${dir} --production`, {env});

  const {proc, port} = await start(`--dir=${dir}`, {env, cwd: dir});
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  await page.goto(`http://localhost:${port}/`, {waitUntil: 'load'});
  const content = await page.content();
  t.ok(
    content.includes('<span>__MAIN_TRANSLATED__</span>'),
    'app content contains translated main chunk'
  );
  t.ok(
    !content.includes('__SPLIT1_TRANSLATED__'),
    'split translation not inlined'
  );
  t.ok(
    !content.includes('__SPLIT2_TRANSLATED__'),
    'split translation not inlined'
  );
  t.ok(
    !content.includes('__UNUSED_TRANSLATED__'),
    'unused translation not inlined'
  );

  await Promise.all([
    page.click('#split1-link'),
    page.waitForSelector('#split1-translation'),
  ]);

  const content2 = await page.content();
  t.ok(
    content2.includes('__SPLIT1_TRANSLATED__'),
    'renders first split translation'
  );
  await Promise.all([
    page.click('#split2-link'),
    page.waitForSelector('#split2-translation'),
  ]);
  const content3 = await page.content();
  t.ok(
    content3.includes('__SPLIT2_TRANSLATED__'),
    'renders second split translation'
  );

  await browser.close();
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
    res.includes('/test-prefix/_static/client-main'),
    'includes a reference to client-main'
  );
  t.ok(
    res.includes('/test-prefix/_static/client-vendor'),
    'includes a reference to client-vendor'
  );
  proc.kill();
  t.end();
});

test('`fusion build --production` works with gql', async t => {
  const dir = path.resolve(__dirname, '../fixtures/gql');
  let browser;
  await await cmd(`build --dir=${dir} --production`);
  const {proc, port} = await start(`--dir=${dir}`, {
    env: Object.assign({}, process.env, {NODE_ENV: 'production'}),
  });
  try {
    const expectedSchema = fs
      .readFileSync(path.resolve(dir, 'src/schema.gql'))
      .toString();
    t.equal(
      await request(`http://localhost:${port}/schema`),
      expectedSchema,
      'loads schema on server'
    );
    browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();
    await page.goto(`http://localhost:${port}/`, {waitUntil: 'load'});
    const browserSchema = await page.evaluate(() => {
      return typeof window !== undefined && window.schema; //eslint-disable-line
    });
    t.equal(browserSchema, expectedSchema, 'loads schema in the browser');
  } catch (e) {
    t.iferror(e);
  }
  await (browser && browser.close());
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

  const tokenRes = await request(
    `http://localhost:${port}/test-prefix/server-token`
  );
  t.equal(tokenRes, '/test-prefix', 'server-side RoutePrefixToken is set');

  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  await page.goto(`http://localhost:${port}/test-prefix/ssr`, {
    waitUntil: 'load',
  });

  const clientRoutePrefixTokenValue = await page.evaluate(() => {
    // eslint-disable-next-line
    return window.__client_route_prefix_token_value__;
  });
  t.equal(
    clientRoutePrefixTokenValue,
    '/test-prefix',
    'RoutePrefixToken hydrated on client'
  );

  await browser.close();

  proc.kill();
  t.end();
});

test('`fusion start` does not throw error on client when using route prefix', async t => {
  const dir = path.resolve(__dirname, '../fixtures/noop');
  await cmd(`build --dir=${dir} --production`);
  const {proc, port} = await start(`--dir=${dir}`, {
    env: Object.assign({}, process.env, {ROUTE_PREFIX: '/test-prefix'}),
  });

  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();

  page.on('error', err => {
    t.fail(`Client-side error: ${err}`);
  });

  page.on('pageerror', err => {
    t.fail(`Client-side error: ${err}`);
  });

  await page.goto(`http://localhost:${port}/test-prefix/`, {
    waitUntil: 'networkidle0',
  });

  await browser.close();

  proc.kill();
  t.pass('did not error');
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
    res.includes('/_static/client-main'),
    'includes a reference to client-main'
  );
  t.ok(
    res.includes('/_static/client-vendor'),
    'includes a reference to client-vendor'
  );

  clientFiles.forEach(file => {
    if (file.endsWith('.map')) {
      t.ok(
        clientFiles.includes(path.basename(file, '.map')),
        'source map filename has same base as regular file'
      );
    }
  });

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
    t.equal(res.headers['cache-control'], 'public, max-age=31536000');
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

test('`fusion build` compresses assets for production', async t => {
  const dir = path.resolve(__dirname, '../fixtures/compress-assets');
  await cmd(`build --dir=${dir} --production`);

  const fusion_folder = '.fusion/dist/production/client/';
  fs.readdir(path.resolve(dir, fusion_folder), (err, files) => {
    if (err) throw err;
    t.ok(files.some(file => path.extname(file) === '.gz'), 'gzip works');
    t.ok(files.some(file => path.extname(file) === '.br'), 'brotli works');
    t.ok(
      files.some(
        file =>
          path.extname(file) === '.svg' &&
          fs.statSync(path.resolve(dir, fusion_folder, file)).size <
            fs.statSync(path.resolve(dir, 'src/assets/SVG_logo.svg')).size
      ),
      'svg works'
    );
    t.ok(
      fs
        .readFileSync(path.resolve(dir, 'src/assets/SVG_logo.svg'), 'utf8')
        .includes('shouldNotBeRemoved')
    );
  });
  t.end();
});

test('`fusion build` puts server assets in client directory', async t => {
  const dir = path.resolve(__dirname, '../fixtures/server-assets');
  await cmd(`build --dir=${dir} --production`);

  const fusion_folder = '.fusion/dist/production/client/';
  fs.readdir(path.resolve(dir, fusion_folder), (err, files) => {
    t.ok(
      files.includes('54dcbe888c1b1145462ae09d6610ab82.txt'),
      'has server asset'
    );
    t.ok(
      files.includes('2642b2c23331388417654062a7058f82.txt'),
      'has universal asset'
    );
  });
  t.end();
});

test('`fusion build` with dynamic imports', async t => {
  const dir = path.resolve(__dirname, '../fixtures/dynamic-import');
  await cmd(`build --dir=${dir}`);

  // Execute node script to validate dynamic imports
  const entryPath = `.fusion/dist/development/server/server-main.js`;
  const entry = path.resolve(dir, entryPath);
  // $FlowFixMe
  const {stdout} = await run(entry, {stdio: 'pipe'});
  const testContent = JSON.parse(stdout);
  t.ok(
    testContent.dynamicContent.includes('loaded dynamic import'),
    'dynamic import is executed'
  );
  t.deepEqual(
    testContent.chunkIds,
    [[10001, 1], [10000, 0]],
    'Chunk IDs are populated'
  );

  t.ok(
    await exists(
      path.resolve(dir, `.fusion/dist/development/client/client-0.js`)
    ),
    'client dynamic import bundle exists'
  );
  t.end();
});

test('`fusion build` with dynamic imports and group chunks', async t => {
  const dir = path.resolve(__dirname, '../fixtures/split');
  await cmd(`build --dir=${dir} --production`);
  const {proc, port} = await start(`--dir=${dir}`, {
    env: {
      ...process.env,
      NODE_ENV: 'production',
    },
  });
  const resA = await request(`http://localhost:${port}/test-a`);
  const resB = await request(`http://localhost:${port}/test-b`);
  const res = await request(`http://localhost:${port}/test`);
  t.deepLooseEqual(JSON.parse(res), [10003, 3]);
  t.deepLooseEqual(JSON.parse(resA), [10001, 10003, 1, 3]);
  t.deepLooseEqual(JSON.parse(resB), [10002, 10003, 2, 3]);
  proc.kill();
  t.end();
});

test('`fusion build` tree shaking unused imports in dev w/ assumeNoImportSideEffects: true', async t => {
  const dir = path.resolve(__dirname, '../fixtures/tree-shaking-unused');
  await cmd(`build --dir=${dir}`);

  const distFolder = path.resolve(dir, '.fusion/dist/development/client');
  const clientFiles = await readdir(distFolder);

  clientFiles
    .filter(file => path.extname(file) === '.js')
    .map(file => path.join(distFolder, file))
    .forEach(file => {
      t.ok(
        !fs.readFileSync(file, 'utf-8').includes('__fixture_pkg_unused__'),
        'should not include unused export in browser'
      );
    });

  t.end();
});

test('`fusion build` polyfills with assumeNoImportSideEffects: true', async t => {
  const dir = path.resolve(__dirname, '../fixtures/tree-shaking-unused');

  var env = Object.create(process.env);
  env.NODE_ENV = 'production';

  await cmd(`build --dir=${dir} --production`, {env});

  const distFolder = path.resolve(dir, '.fusion/dist/production/client');
  const clientFiles = await readdir(distFolder);

  const hasCoreJS = clientFiles
    .filter(file => path.extname(file) === '.js')
    .map(file => path.join(distFolder, file))
    .some(file => {
      return fs.readFileSync(file, 'utf-8').includes('__core-js_shared__');
    });

  t.ok(hasCoreJS, 'some client bundle JS includes core-js');

  t.end();
});

test('`fusion build` tree shaking', async t => {
  const dir = path.resolve(__dirname, '../fixtures/tree-shaking');
  await cmd(`build --dir=${dir} --production=true`);

  const serverMain = path.resolve(
    dir,
    `.fusion/dist/production/server/server-main.js`
  );
  const clientFiles = await readdir(
    path.resolve(dir, '.fusion/dist/production/client')
  );
  const clientMainFile = clientFiles.filter(f =>
    /client-main-(.*?).js$/.test(f)
  )[0];
  const clientMain = path.resolve(
    dir,
    '.fusion/dist/production/client',
    clientMainFile
  );

  // Manually instrumented
  t.ok(
    !fs
      .readFileSync(serverMain, 'utf-8')
      .includes('instrumented-as-pure-browser-plugin'),
    'should not include browserPlugin in node'
  );

  t.ok(
    !fs
      .readFileSync(clientMain, 'utf-8')
      .includes('instrumented-as-pure-node-plugin'),
    'should not include nodePlugin in browser'
  );

  // Default export
  t.ok(
    !fs
      .readFileSync(serverMain, 'utf-8')
      .includes('default-export-browser-plugin'),
    'should not include default browser export in node'
  );

  t.ok(
    !fs
      .readFileSync(clientMain, 'utf-8')
      .includes('default-export-node-plugin'),
    'should not include default node export in browser'
  );

  // Named export
  t.ok(
    !fs
      .readFileSync(serverMain, 'utf-8')
      .includes('named-export-browser-plugin'),
    'should not include named browser export in node'
  );

  t.ok(
    !fs.readFileSync(clientMain, 'utf-8').includes('named-export-node-plugin'),
    'should not include named node export in browser'
  );

  t.end();
});
