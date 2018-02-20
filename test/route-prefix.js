/* eslint-env node */
const tape = require('tape');
const http = require('http');
const getPort = require('get-port');
const request = require('request-promise');
const stripRoutePrefix = require('../lib/strip-prefix.js');

tape('route prefix stripping', async t => {
  const port = await getPort();
  const expectedUrls = ['/test', '/', '/', '/', '/'];
  const server = http.createServer((req, res) => {
    stripRoutePrefix(req, '/prefix');
    t.equal(req.url, expectedUrls.shift());
    res.end('OK');
  });
  const connection = server.listen(port);
  await request(`http://localhost:${port}/prefix/test`);
  await request(`http://localhost:${port}/prefix/`);
  await request(`http://localhost:${port}/prefix`);
  await request(`http://localhost:${port}/`);
  await request(`http://localhost:${port}`);
  connection.close();
  t.end();
});
