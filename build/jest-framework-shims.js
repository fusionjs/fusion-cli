/* eslint-env node */
global.requestAnimationFrame = callback => {
  setTimeout(callback, 0);
};

global.__BROWSER__ = Boolean(global.window);
global.__NODE__ = !global.__BROWSER__;
global.__DEV__ = process.env !== 'production';
