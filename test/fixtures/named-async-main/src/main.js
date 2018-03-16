import App from 'fusion-core';
export default async function start(something: any) {
  const app = new App('element', el => el);
  return app;
}
