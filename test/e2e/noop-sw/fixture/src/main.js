// @flow
import App from 'fusion-core';

// $FlowFixMe
import sw from '__SECRET_SW_LOADER__!';

export default async function() {
  const bundle = sw({foo: 'bar'});
  const app = new App('element', el => el);
  app.middleware((ctx, next) => {
    if (ctx.url === '/sw.js') {
      ctx.body = bundle;
    }
    return next();
  });
  return app;
}
