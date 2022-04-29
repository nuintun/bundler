/**
 * @module bunder
 * @license MIT
 * @version 2018/01/26
 */

const Bundler = require('../cjs');

const files = {
  '/src/1.js': { contents: 'file 1', dependencies: ['2.js', '4.js'] },
  '/src/2.js': { contents: 'file 2', dependencies: ['./3.js', './5.js'] },
  '/src/3.js': { contents: 'file 3', dependencies: ['/src/4.js', '/src/6.js'] },
  '/src/4.js': { contents: 'file 4', dependencies: ['5.js', './7.js'] },
  '/src/5.js': { contents: 'file 5', dependencies: ['6.js', '/src/8.js'] },
  '/src/6.js': { contents: 'file 6', dependencies: ['./7.js', '/src/9.js'] },
  '/src/7.js': { contents: 'file 7', dependencies: ['8.js'] },
  '/src/8.js': { contents: 'file 8', dependencies: ['./9.js'] },
  '/src/9.js': { contents: 'file 9', dependencies: ['/src/1.js'] }
};

// npm test allow-cycle
const cycle = process.argv[2] === '--cycle';

const oncycle = (path, referrer) => {
  throw new ReferenceError(`Found circular dependency ${path} in ${referrer}`);
};

function getRandom(min, max, fixed = 0) {
  const differ = max - min;
  const random = Math.random();

  return +(min + differ * random).toFixed(fixed);
}

async function parse(input) {
  console.time('Bundler');

  const bunder = new Bundler({
    oncycle: cycle ? null : oncycle,
    resolve: (path, referrer) => {
      if (/^\//.test(path)) return path;

      const dirname = referrer.replace(/\/[^\/]+$/, '');

      return `${dirname}/${path}`.replace(/(\.\/)+/g, '');
    },
    parse: path => {
      return new Promise(resolve => {
        const delay = getRandom(10, 100);

        setTimeout(() => resolve(files[path]), delay);

        console.log(`Read: %o, Waiting: %oms`, path, delay);
      });
    }
  });

  try {
    console.log('Result: %o', await bunder.parse(input));
  } catch (error) {
    console.error(error);
  }

  console.timeEnd('Bundler');
}

parse('/src/1.js');
