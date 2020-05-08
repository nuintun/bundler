/**
 * @module bunder
 * @license MIT
 * @version 2018/01/26
 */

const Bundler = require('../');

const files = {
  '/src/1.js': { dependencies: ['2.js', '4.js'], contents: 'file 1' },
  '/src/2.js': { dependencies: ['./3.js', './5.js'], contents: 'file 2' },
  '/src/3.js': { dependencies: ['/src/4.js', '/src/6.js'], contents: 'file 3' },
  '/src/4.js': { dependencies: ['5.js', './7.js'], contents: 'file 4' },
  '/src/5.js': { dependencies: ['6.js', '/src/8.js'], contents: 'file 5' },
  '/src/6.js': { dependencies: ['./7.js', '/src/9.js'], contents: 'file 6' },
  '/src/7.js': { dependencies: ['8.js'], contents: 'file 7' },
  '/src/8.js': { dependencies: ['./9.js'], contents: 'file 8' },
  '/src/9.js': { dependencies: ['/src/1.js'], contents: 'file 9' }
};

// npm test allow-cycle
const cycle = process.argv[2] === '--cycle';

async function parse(input) {
  console.time('Bundler');

  const bunder = new Bundler({
    cycle,
    resolve: (path, referer) => {
      if (/^\//.test(path)) return path;

      const dirname = referer.replace(/\/[^\/]+$/, '');

      return `${dirname}/${path}`.replace(/(\.\/)+/g, '');
    },
    parse: path => {
      return new Promise(resolve => {
        const delay = 20;

        setTimeout(() => resolve(files[path]), delay);

        console.log(`Read: %o, Waiting: %oms`, path, delay);
      });
    }
  });

  try {
    console.log('Result: %o', Array.from(await bunder.parse(input)));
  } catch (error) {
    console.error(error);
  }

  console.timeEnd('Bundler');
}

parse('/src/1.js');
