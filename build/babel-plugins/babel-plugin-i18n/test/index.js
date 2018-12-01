/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env node */

const fs = require('fs');
const test = require('tape');
const {transformFileSync} = require('@babel/core');

const plugin = require('../');

 test('withTranslations string array', t => {
   const translationIds = new Set();
   const output = transformFileSync(
     __dirname + '/fixtures/string-array',
     {
       plugins: [[plugin, {translationIds}]],
     }
   );
   const expected = new Set([
     'some.translation'
   ]);
   t.deepEqual(translationIds, expected, 'parsed string list');
   t.end();
 });

test('translate prop', t => {
  const translationIds = new Set();
  const output = transformFileSync(
    __dirname + '/fixtures/translate-prop',
    {
      plugins: [[plugin, {translationIds}]],
    }
  );
  const expected = new Set([
    'some.translation'
  ]);
  t.deepEqual(translationIds, expected, 'parsed string list');
  t.end();
});

test('translate prop destructured', t => {
  const translationIds = new Set();
  const output = transformFileSync(
    __dirname + '/fixtures/destructured',
    {
      plugins: [[plugin, {translationIds}]],
    }
  );
  const expected = new Set([
    'some.translation'
  ]);
  t.deepEqual(translationIds, expected, 'parsed string list');
  t.end();
});

 test('mixed', t => {
   const translationIds = new Set();
   const output = transformFileSync(
     __dirname + '/fixtures/mixed',
     {
       plugins: [[plugin, {translationIds}]],
     }
   );
   const expected = new Set([
     'prop.translation',
     'array.translation',
   ]);
   t.deepEqual(translationIds, expected, 'parsed string list');
   t.end();
 });

 test('non-string arg', t => {
  const translationIds = new Set();
  function output () {
    transformFileSync(
      __dirname + '/fixtures/non-string-arg',
      {
        plugins: [[plugin, {translationIds}]],
      }
    );
  };
  t.throws(output, /string literal/);
  t.end();
});
