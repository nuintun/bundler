/**
 * @module rollup
 * @license MIT
 * @version 2018/03/26
 */

'use strict';

const fs = require('fs-extra');
const rollup = require('rollup');
const pkg = require('./package.json');

/**
 * @function build
 * @param {Object} inputOptions
 * @param {Object} outputOptions
 */
async function build(inputOptions, outputOptions) {
  await fs.remove('index.js');

  const bundle = await rollup.rollup(inputOptions);

  await bundle.write(outputOptions);

  console.log(`Build ${outputOptions.file} success!`);
}

const banner = `/**
 * @module bundler
 * @author ${pkg.author.name}
 * @license ${pkg.license}
 * @version ${pkg.version}
 * @description ${pkg.description}
 * @see ${pkg.homepage}
 */
`;

const inputOptions = {
  input: 'src/index.js'
};

const outputOptions = {
  banner,
  strict: true,
  indent: true,
  format: 'cjs',
  interop: false,
  file: 'index.js',
  preferConst: true
};

build(inputOptions, outputOptions);
