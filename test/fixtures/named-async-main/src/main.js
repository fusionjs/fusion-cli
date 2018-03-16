import App from 'fusion-core';
export default async function start() {
  const app = new App('element', el => el);
  return app;
}
