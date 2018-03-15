/**
 * @module rollup
 * @license MIT
 * @version 2017/10/24
 */

'use strict';

const fs = require('fs');
const rollup = require('rollup');
const pkg = require('./package.json');

const banner = `/**
 * @module bundler
 * @author ${pkg.author.name}
 * @license ${pkg.license}
 * @version ${pkg.version}
 * @description ${pkg.description}
 * @see ${pkg.homepage}
 */
`;

rollup
  .rollup({
    input: 'index.js',
    preferConst: true
  })
  .then(bundle => {
    try {
      fs.statSync('dist');
    } catch (e) {
      // Make directory
      fs.mkdirSync('dist');
    }

    bundle
      .generate({
        format: 'cjs',
        strict: true,
        indent: true,
        interop: false,
        banner: banner
      })
      .then(result => {
        const output = 'dist/bundler.js';

        fs.writeFileSync(output, result.code);
        console.log(`  Build ${output} success!`);
      })
      .catch(error => {
        console.error(error);
      });
  })
  .catch(error => {
    console.error(error);
  });
