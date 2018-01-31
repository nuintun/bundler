/**
 * @module bunder
 * @license MIT
 * @version 2018/01/26
 */

const Bundler = require('../dist/bundler');

const files = {
  1: { dependencies: ['2', '3'], contents: '1' },
  2: { dependencies: ['3', '4'], contents: '2' },
  3: { dependencies: ['5'], contents: '3' },
  4: { dependencies: ['3', '6'], contents: '4' },
  5: { dependencies: ['6'], contents: '5' },
  6: { dependencies: ['7'], contents: '6' },
  7: { dependencies: ['8'], contents: '7' },
  8: { dependencies: ['9'], contents: '8' },
  9: { dependencies: [], contents: '9' }
};

async function bunder(input) {
  console.time('Bundler');

  try {
    console.log(
      await new Bundler({
        input,
        cycle: false,
        resolve: id => id,
        parse: id => {
          return new Promise((resolve, reject) => {
            if (id === '3') {
              setTimeout(() => resolve(files[id]), 1000);
            } else {
              resolve(files[id]);
            }
          });
        }
      })
    );
  } catch (error) {
    console.error(error);
  }

  console.timeEnd('Bundler');
}

bunder('1');
console.log('async');