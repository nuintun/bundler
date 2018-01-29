/**
 * @module test
 * @license MIT
 * @version 2018/01/26
 */

const Bundler = require('../dist/bundler');

const files = {
  1: { dependencies: ['2', '3'], contents: '1' },
  2: { dependencies: ['3', '4'], contents: '2' },
  3: { dependencies: ['4', '5'], contents: '3' },
  4: { dependencies: ['5', '6'], contents: '4' },
  5: { dependencies: ['6'], contents: '5' },
  6: { dependencies: ['7'], contents: '6' },
  7: { dependencies: ['8'], contents: '7' },
  8: { dependencies: [], contents: '8' }
};

async function bunder(input) {
  console.time('Bundler');

  try {
    console.log(
      await new Bundler({
        input,
        cycle: true,
        resolve: id => id,
        parse: id => Promise.resolve(files[id])
      })
    );
  } catch (error) {
    console.error(error);
  }

  console.timeEnd('Bundler');
}

bunder('1');
