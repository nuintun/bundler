/**
 * @module test
 * @license MIT
 * @version 2018/01/26
 */

const Bundler = require('../dist/bundler');

const files = {
  1: { dependencies: ['2', '3'] },
  2: { dependencies: ['4', '5', '6'] },
  3: { dependencies: ['6', '7'] },
  4: { dependencies: ['7'] },
  5: { dependencies: [] },
  6: { dependencies: [] },
  7: { dependencies: [1] }
};

async function test(params) {
  console.time('Bundler');
  console.log(
    await new Bundler({
      input: '1',
      resolve: id => id,
      parse: id => Promise.resolve(files[id])
    })
  );
  console.timeEnd('Bundler');
}

test();