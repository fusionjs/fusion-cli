// @flow
/* eslint-env node */

const path = require('path');
const testEnvs = require('../errors.js');
const t = require('assert');

const dir = path.resolve(__dirname, './fixture');

testEnvs('missing module', dir);
