/* eslint-env node */

module.exports = {
  cache: false,
  projects: process.env.JEST_ENV.split(',').map(
    project => `<rootDir>/${project}`
  ),
};
