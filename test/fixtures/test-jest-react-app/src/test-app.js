import Enzyme, {mount} from 'enzyme';
import {renderToStaticMarkup} from 'react-dom/server';
import Adapter from 'enzyme-adapter-react-16';

import getApp from './main';

const defaultRender = __NODE__ ? renderToStaticMarkup : mount;

Enzyme.configure({adapter: new Adapter()});

export default async function start({render = defaultRender} = {}) {
  const app = await getApp({render});
  return app;
}
