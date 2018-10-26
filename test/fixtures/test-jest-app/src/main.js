// @flow
import {foo} from './foo.js';
import noopIgnoredCoverage from './generated/generated-file.js';

export default function() {
  noopIgnoredCoverage();
  return foo();
}
