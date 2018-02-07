/* eslint-env node */

const testFolder = process.env.TEST_FOLDER || '__tests__';

module.exports = envs => {
  const envConfiguration = {
    jsdom: {
      displayName: 'browser',
      browser: true,
      coverageDirectory: `<rootDir>/coverage-jsdom`,
      globals: {
        // Parity with create-universal-package globals.
        // https://github.com/rtsao/create-universal-package#globals
        __NODE__: false,
        __BROWSER__: true,
        __DEV__: process.env.NODE_ENV !== 'production',
      },
      testEnvironment: 'jsdom',
      testPathIgnorePatterns: ['.*\\.node\\.js'],
    },
    node: {
      displayName: 'node',
      browser: false,
      coverageDirectory: `<rootDir>/coverage-node`,
      globals: {
        // Parity with create-universal-package globals.
        // https://github.com/rtsao/create-universal-package#globals
        __NODE__: true,
        __BROWSER__: false,
        __DEV__: process.env.NODE_ENV !== 'production',
      },
      testEnvironment: 'node',
      testPathIgnorePatterns: ['.*\\.browser\\.js'],
    },
  };
  return {
    cache: false,
    projects: envs.map(env => envConfiguration[env]),
    rootDir: process.cwd(),
    transform: {
      '^.+\\.js$': require.resolve('./jest-transformer.js'),
    },
    transformIgnorePatterns: ['/node_modules/(?!(fusion-cli.*build))'],
    // 'cobertura', 'lcov', 'text' coverage reports are written by the merge-coverage script
    coverageReporters: ['json'],
    setupFiles: [
      require.resolve('./jest-framework-shims.js'),
      require.resolve('./jest-framework-setup.js'),
    ],
    snapshotSerializers: [require.resolve('enzyme-to-json/serializer')],
    testMatch: [`**/${testFolder}/**/*.js`],
  };
};
