/**
 * @module benchmark
 * @license MIT
 * @version 2018/01/29
 */

const Bundler = require('../dist/bundler');

const files = {};
const length = 10000;

for (let i = 1; i < length; i++) {
  const contents = String(i);
  const dependencies = i < length - 3 ? [String(i + 1), String(i + 2), String(i + 3)] : [];

  files[i] = { dependencies, contents };
}

async function bunder(input) {
  console.time('Bundler');

  try {
    await new Bundler({
      input,
      cycle: false,
      resolve: id => id,
      parse: id => Promise.resolve(files[id])
    });
  } catch (error) {
    console.error(error);
  }

  console.timeEnd('Bundler');
}

bunder('1');
