/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env browser */
/* global module */

__webpack_public_path__ = window.__FUSION_ASSET_PATH__;

// Require is used and assigned to an identifier to opt out of webpack tree-shaking of ununsed imports
// See: https://github.com/webpack/webpack/issues/6571
let some_identifier = require('core-js'); // eslint-disable-line

function reload() {
  // $FlowFixMe
  const main = require('__FRAMEWORK_SHARED_ENTRY__'); // eslint-disable-line
  const initialize = main.default || main;
  Promise.resolve(initialize()).then(app => {
    app.callback().call();
  });
}
reload();

// $FlowFixMe
if (module.hot) {
  module.hot.accept('__FRAMEWORK_SHARED_ENTRY__', reload);
}
