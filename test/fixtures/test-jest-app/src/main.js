// @flow
import {foo} from './foo.js';
import noop from './istanbul-ignore-coverage.js';
import type {Something} from './istanbul-ignore-coverage.flow.js';

export default function() {
  noop();
  return foo();
}
