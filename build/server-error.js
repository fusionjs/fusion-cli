/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env node */

const React = require('react');
const RedBox = require('redbox-react').RedBoxError;
const ReactDOMServer = require('react-dom/server');

function renderError(error /*: any */) {
  const content = [
    '<!DOCTYPE html><html><head><title>Server error</title></head><body>',
  ];

  const displayError = typeof error === 'string' ? new Error(error) : error;
  const errorComponent = ReactDOMServer.renderToString(
    React.createElement(RedBox, {error: displayError})
  );
  content.push(errorComponent);

  content.push('</body></html>');
  return content.join('');
}

module.exports.renderError = renderError;
