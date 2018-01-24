//@flow
/* eslint-env node */

/*
This is where environment variables should be defined
*/

const assert = require('assert');
const {SingletonPlugin} = require('fusion-core');

const rootDir = load('ROOT_DIR', '.');
const env = load('NODE_ENV', 'development');
if (!(env === 'development' || env === 'production')) {
  throw new Error(`Invalid NODE_ENV loaded: ${env}.`);
}
const prefix = load('ROUTE_PREFIX', '');
assert(!prefix.endsWith('/'), 'ROUTE_PREFIX must not end with /');
const assetPath = load('FRAMEWORK_STATIC_ASSET_PATH', `${prefix}/_static`);
assert(
  !assetPath.endsWith('/'),
  'FRAMEWORK_STATIC_ASSET_PATH must not end with /'
);
const cdnUrl = load('CDN_URL', '');
assert(!cdnUrl.endsWith('/'), 'CDN_URL must not end with /');

module.exports = function() {
  return new SingletonPlugin({
    Service: class EnvVarPlugin {
      /*::
        rootDir: string;
        env: 'development' | 'production';
        prefix: string;
        assetPath: string;
        cdnUrl: string;
      */

      constructor() {
        this.rootDir = rootDir;
        this.env = env;
        this.prefix = prefix;
        this.assetPath = this.prefix + assetPath;
        this.cdnUrl = cdnUrl;
      }
    },
  });
};

function load(key, value) {
  return process.env[key] || value;
}
