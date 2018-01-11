//@flow
/* eslint-env node */
const envVarsPlugin = require('./environment-variables-plugin');

const mount = require('koa-mount');
const serve = require('koa-static');

module.exports = function() {
  const {assetPath, env} = envVarsPlugin().of();
  // setting defer here tells the `serve` middleware to `await next` first before
  // setting the response. This allows composition with user middleware
  return mount(assetPath, serve(`.fusion/dist/${env}/client`, {defer: true}));
};
