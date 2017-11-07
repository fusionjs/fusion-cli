#!/usr/bin/env node
/* eslint-env node */
require('./cli-runner').run(process.argv.slice(2).join(' ')).catch(e => {
  // eslint-disable-next-line no-console
  console.error(e.message);
  // TODO: this errors with Cannot read property 'showHelp' of undefined
  // e.yargs.showHelp();
  // Rethrow so that there's a non-zero exit code
  throw e;
});
