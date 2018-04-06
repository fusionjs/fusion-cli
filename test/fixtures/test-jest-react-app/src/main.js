// @flow
import React from 'react';
import unfetch from 'unfetch';

import App from 'fusion-react';
import {FetchToken, LoggerToken, SessionToken} from 'fusion-tokens';
import CsrfProtectionPlugin, {
  FetchForCsrfToken,
  CsrfIgnoreRoutesToken,
} from 'fusion-plugin-csrf-protection-react';
import Session, {
  SessionSecretToken,
  SessionCookieNameToken,
} from 'fusion-plugin-jwt';

export default async function start(options: *) {
  const app = new App(<div>test-jest-react-app</div>, options.render);

  app.register(FetchToken, CsrfProtectionPlugin);
  __NODE__ && app.register(CsrfIgnoreRoutesToken, ['/_errors']);
  if (__NODE__) {
    app.register(SessionToken, Session);
    app.register(SessionCookieNameToken, 'jwt-session');
    app.register(SessionSecretToken, 'test');
  } else {
    app.register(FetchForCsrfToken, unfetch);
  }

  return app;
}
