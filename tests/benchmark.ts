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
  const dependencies =
    i < length - 3
      ? [
          // dependencies 1
          `/src/${i + 1}.js`,
          // dependencies 2
          `/src/${i + 2}.js`,
          // dependencies 3
          `/src/${i + 3}.js`
        ]
      : [];
  const contents = `${path} contents`;

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
