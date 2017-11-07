// @flow
/* eslint-env node */
const createNamedModuleVisitor = require('../babel-plugin-utils/visit-named-module');

module.exports = chunkIdPlugin;

function chunkIdPlugin(babel /*: Object */) {
  const t = babel.types;
  // TODO: use config instead of hardcoded constants
  const visitor = createNamedModuleVisitor(
    t,
    'syncChunkIds',
    'fusion-core',
    refsHandler
  );
  return {visitor};
}

function refsHandler(t, context, refs = []) {
  refs.forEach(refPath => {
    const parentPath = refPath.parentPath;
    if (!t.isCallExpression(parentPath)) {
      return;
    }
    const args = parentPath.get('arguments');
    if (args.length !== 0) {
      throw parentPath.buildCodeFrameError('syncChunkIds takes no arguments');
    }
    parentPath.set('arguments', [
      t.callExpression(t.identifier('require'), [
        // TODO: use config instead of hardcoded constants
        t.stringLiteral('__SECRET_SYNC_CHUNK_IDS_LOADER__!'),
      ]),
    ]);
  });
}
