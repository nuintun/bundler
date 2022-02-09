/**
 * @module rollup.config
 */

import rimraf from 'rimraf';
import pkg from './package.json';
import typescript from '@rollup/plugin-typescript';

rimraf.sync('typings');
rimraf.sync('index.js');

const banner = `/**
 * @module ${pkg.name}
 * @license ${pkg.license}
 * @version ${pkg.version}
 * @author ${pkg.author.name}
 * @description ${pkg.description}
 * @see ${pkg.homepage}
 */
`;

export default {
  input: 'src/index.ts',
  output: {
    banner,
    indent: true,
    strict: true,
    format: 'cjs',
    interop: false,
    exports: 'auto',
    esModule: false,
    file: 'index.js',
    preferConst: true
  },
  plugins: [typescript()],
  onwarn(error, warn) {
    if (error.code !== 'CIRCULAR_DEPENDENCY') {
      warn(error);
    }
  }
};
