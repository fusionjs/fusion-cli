console.log('helloworld');
import App from 'fusion-core';

import test from 'mapbox-gl';
import other from 'other';
console.log(test);
console.log(other);

export default (async function() {
  return new App('el', el => el);
});
