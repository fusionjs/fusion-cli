/* eslint-env node */

/**
 * This babel config is used for fusion-related compilation,
 * including non-standard language features (e.g. React and Flow).
 * This should only be applied when compiling files in src/
 */

// Needs to be a preset, because tree shaking must run after JSX plugin (in React preset)
function globalsPreset(context, {target, transformGlobals}) {
  return {
    plugins: [
      ...(transformGlobals
        ? [
            [
              require.resolve('babel-plugin-transform-cup-globals'),
              {target: target},
            ],
            // Note: plugins run first to last, cup globals must be transformed before tree shaking
            require.resolve(
              './babel-plugins/babel-plugin-transform-tree-shake'
            ),
          ]
        : []),
    ],
  };
}

module.exports = function buildPreset(
  context,
  {targets, transformGlobals = true}
) {
  const target = targets.hasOwnProperty('node') ? 'node' : 'browser';

  return {
    presets: [
      require('@babel/preset-react'),
      require('@babel/preset-flow'),
      [globalsPreset, {target, transformGlobals}],
    ],
    plugins: [
      require('@babel/plugin-syntax-object-rest-spread'),
      require('@babel/plugin-syntax-dynamic-import'),
    ],
  };
};
