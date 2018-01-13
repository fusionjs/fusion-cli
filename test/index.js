/* eslint-env node */

const testFiles = [
  './cli/dev',
  './cli/test-app',
  './cli/test',
  './cli/build',
  './compiler/api',
  './compiler/errors',

  /*
  './browser-support',
  */
  '../build/babel-plugins/babel-plugin-asseturl/test',
  '../build/babel-plugins/babel-plugin-chunkid/test',
  '../build/babel-plugins/babel-plugin-experimentation/test',
  '../build/babel-plugins/babel-plugin-i18n/test',
  '../build/babel-plugins/babel-plugin-sw/test',
  '../build/babel-plugins/babel-plugin-sync-chunk-ids/test',
  '../build/babel-plugins/babel-plugin-sync-chunk-paths/test',
  '../build/babel-plugins/babel-plugin-utils/test',
];

const thisChunk = process.env.THIS_CHUNK
  ? parseInt(process.env.THIS_CHUNK, 10)
  : 0;
const totalChunks = process.env.TOTAL_CHUNKS
  ? parseInt(process.env.TOTAL_CHUNKS, 10)
  : 1;

testFiles.forEach((file, index) => {
  if (index % totalChunks === thisChunk) {
    require(file);
  }
});
