# `.fusionrc.js`

Fusion supports a `.fusionrc.js` in the root directory of your application. This must be a CommonJS module exporting an object.

This configuration object supports the following fields:

## `babel`

### Adding plugins/presets

For example, to add your own Babel plugins/preset:

```
module.exports = {
  babel: {
    presets: ["some-babel-preset"],
    plugins: ["some-babel-plugin"]
  }
};
```

**Please note that custom Babel config is an unstable API and may not be supported in future releases.**


## `assumeNoImportSideEffects`

By default this is `false`.

Setting this to `true` enables the assumption that modules in your code do not have any import side effects. This assumption allows for more powerful tree shaking and pruning of unused imports.

This option may be useful if you import modules that use Node.js built-ins. This option makes it easier to avoid uninintionally including server-specific code in the browser bundle.
