/* eslint-env node */

const envVarsPlugin = require('./environment-variables-plugin');

module.exports = function() {
  const envVars = envVarsPlugin().of();
  return function middleware(ctx, next) {
    const prefix = envVars.prefix;
    // store prefix in context
    ctx.prefix = prefix;

    // enhance ctx.url, sans prefix
    if (ctx.url.indexOf(prefix) === 0 /*found at index 0*/) {
      ctx.url = ctx.url.slice(prefix.length);
    }
    return next();
  };
};
