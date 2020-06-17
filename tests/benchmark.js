/**
 * @module benchmark
 * @license MIT
 * @version 2018/01/29
 */

const Bundler = require('../');

const files = {};
const length = 100000;

for (let i = 1; i < length; i++) {
  const path = `/src/${i}.js`;
  const contents = `${path} contents`;
  const dependencies = i < length - 3 ? [`/src/${i + 1}.js`, `/src/${i + 2}.js`, `/src/${i + 3}.js`] : [];

  files[path] = { dependencies, contents };
}

async function parse(input) {
  console.time('Bundler');

  const bunder = new Bundler({
    resolve: path => path,
    parse: path => files[path]
  });

  try {
    await bunder.parse(input);
  } catch (error) {
    console.error(error);
  }

  console.timeEnd('Bundler');
}

parse('/src/1.js');
