/**
 * @module benchmark
 */

import { Bundler } from '@nuintun/bundler';

interface File {
  contents: string;
  dependencies: string[];
}

const length = 100000;
const files: Record<string, File> = {};

for (let i = 1; i < length; i++) {
  const path = `/src/${i}.js`;
  const contents = `${path} contents`;
  const dependencies = i < length - 3 ? [`/src/${i + 1}.js`, `/src/${i + 2}.js`, `/src/${i + 3}.js`] : [];

  files[path] = { dependencies, contents };
}

async function parse(input: string) {
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
