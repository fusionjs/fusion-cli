// @flow
import App from 'fusion-core';

// $FlowFixMe
import sw from '__SECRET_SW_LOADER__!';

export default async function() {
  const app = new App('element', el => el);
  return app;
}
