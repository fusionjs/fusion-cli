// @flow
import App from 'fusion-core';
import {assetUrl} from 'fusion-core';
import * as jsonData from './static/test.json';

const hoistedUrl = assetUrl('./static/test.css');
if (typeof window !== 'undefined') {
  window.__hoistedUrl__ = hoistedUrl;
}

import {serverAsset} from "./server-asset.js";

export default (async function() {
  const app = new App('element', el => el);
  __NODE__ &&
    app.middleware((ctx, next) => {
      if (ctx.url.startsWith('/_static')) {
        ctx.set('x-test', 'test');
      } else if (ctx.url === '/test') {
        ctx.body = assetUrl('./static/test.css');
      } else if (ctx.url === '/dirname') {
        ctx.body = __dirname;
      } else if (ctx.url === '/filename') {
        ctx.body = __filename;
      } else if (ctx.url === '/hoisted') {
        ctx.body = hoistedUrl;
      } else if (ctx.url === '/json') {
        ctx.body = assetUrl('./static/test.json');
      } else if (ctx.url === '/json-import') {
        ctx.body = JSON.stringify(jsonData);
      } else if (ctx.url === '/server-asset') {
        ctx.body = assetUrl("./static/test-server-asset.txt");
      } else if (ctx.url === '/cacheable-paths') {
        ctx.body = JSON.stringify(ctx.cacheablePaths);
      }
      return next();
    });

  __BROWSER__ && console.log('Dirname is', __dirname);
  __BROWSER__ && console.log('Filename is', __filename);
  return app;
});
