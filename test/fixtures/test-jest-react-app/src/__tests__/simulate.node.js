import {test, getSimulator} from 'fusion-test-utils';
import app from '../test-app';

for (let i = 0; i < 2; i++) {
  test('node simulate', async assert => {
    const sim = getSimulator(await app());
    await sim.render('/');
  });
}
