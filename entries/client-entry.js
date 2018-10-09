/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env browser */
/* global module */

import {createPlugin, RoutePrefixToken} from 'fusion-core';

function reload() {
  // $FlowFixMe
  const main = require('__FRAMEWORK_SHARED_ENTRY__'); // eslint-disable-line
  const initialize = main.default || main;
  Promise.resolve(initialize()).then(app => {
    if (window.__ROUTE_PREFIX__) {
      // No-op plugin so token can be registered without any consumers
      // Should not be needed when route prefixing is refactored into a separate plugin
      app.register(
        createPlugin({
          deps: {routePrefix: RoutePrefixToken.optional},
        })
      );
      app.register(RoutePrefixToken, window.__ROUTE_PREFIX__);
    }
    app.callback().call();
  });
}
reload();

// $FlowFixMe
if (module.hot) {
  module.hot.accept('__FRAMEWORK_SHARED_ENTRY__', reload);
}
