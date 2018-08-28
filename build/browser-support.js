/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env node */

const conservative = [
  '>1%',
  'last 4 versions',
  'Firefox ESR',
  'not ie < 9', // React doesn't support IE8 anyway
];

module.exports.conservative = conservative;
