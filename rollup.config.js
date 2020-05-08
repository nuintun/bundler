/**
 * @module rollup.config
 */

import pkg from './package.json';
import typescript from 'rollup-plugin-typescript2';

const banner = `/**
 * @module ${pkg.name}
 * @license ${pkg.license}
 * @version ${pkg.version}
 * @author ${pkg.author.name}
 * @description ${pkg.description}
 * @see ${pkg.homepage}
 */
`;

const tsconfigOverride = { compilerOptions: { declaration: true, declarationDir: 'typings' } };

export default {
  input: 'src/index.ts',
  output: {
    banner,
    indent: true,
    strict: true,
    format: 'cjs',
    interop: false,
    esModule: false,
    file: 'index.js',
    preferConst: true
  },
  plugins: [typescript({ tsconfigOverride, clean: true, useTsconfigDeclarationDir: true })]
};
