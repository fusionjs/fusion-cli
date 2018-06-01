// @flow
// parseUri 1.2.2
// (c) Steven Levithan <stevenlevithan.com>
// MIT License
/* eslint-env node */

const options = {
  strictMode: false,
  key: [
    'source',
    'protocol',
    'authority',
    'userInfo',
    'user',
    'password',
    'host',
    'port',
    'relative',
    'path',
    'directory',
    'file',
    'query',
    'anchor',
  ],
  parser: {
    // eslint-disable-next-line no-useless-escape
    strict: /^(?:([^:\/?#]+):)?(?:\/\/((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?))?((((?:[^?#\/]*\/)*)([^?#]*))(?:\?([^#]*))?(?:#(.*))?)/,
    // eslint-disable-next-line no-useless-escape
    loose:  /^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/
  },
};

module.exports = function parseUri(str) {
  let m = options.parser[options.strictMode ? 'strict' : 'loose'].exec(str),
    uri = {},
    i = options.key.length;
  while (i--) uri[options.key[i]] = m[i] || '';
  return uri;
};
