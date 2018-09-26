// @flow
import {foo} from './foo.js';
import noop from './istanbul-ignore-coverage';

export default function() {
  noop();
  return foo();
}
