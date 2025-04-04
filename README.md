# bundler

<!-- prettier-ignore -->
> An async file dependency bundle parser
>
> [![NPM Version][npm-image]][npm-url]
> [![Download Status][download-image]][npm-url]
> ![Node Version][node-image]
> [![License][license-image]][license-url]

### interface

```ts
interface ParsedMeta<T> {
  contents?: T;
  dependencies?: string[];
}

interface Parse<T> {
  (path: string): ParsedMeta<T> | void;
  (path: string): Promise<ParsedMeta<T> | void>;
}

interface OnCycle {
  (path: string, referrer: string): void | never;
}

interface Resolve {
  (src: string, referrer?: string): string;
  (src: string, referrer?: string): Promise<string>;
}

export interface File<T> {
  path: string;
  contents: T | null;
  dependencies: string[];
}

export interface Options<T> {
  parse: Parse<T>;
  resolve: Resolve;
  oncycle?: OnCycle;
}

export declare class Bundler<T> {
  constructor(options: Options<T>);
  /**
   * @public
   * @method parse
   * @param {string} input
   * @description Get the list of dependent files of input file.
   */
  parse(input: string): Promise<File<T>[]>;
}
```

### API

> #### new Bundler\<T\>(options: Options) => Bundler\<T\>
>
> options?.oncycle: (path: string, referrer: string) => void
>
> - found circularly dependency callback function
>
> options.resolve(path: string, referrer: string) => string
>
> options.resolve(path: string, referrer: string) => Promise\<string\>
>
> - path resolve function, support async function
>
> options.parse(path: string) => { contents?: T, dependencies?: string[] }
>
> options.parse(path: string) => Promise\<{ contents?: T, dependencies?: string[] }\>
>
> - file dependencies parse function, support async function
>
> #### new Bundler(options: Options).parse(input: string) => Promise\<File[]\>
>
> input: string
>
> - path of input file

### Examples

```js
import { Bundler } from '@nuintun/bundler';

const files = {
  '/src/1.js': { contents: 'file 1', dependencies: ['2.js', '4.js'] },
  '/src/2.js': { contents: 'file 2', dependencies: ['./3.js', './5.js'] },
  '/src/3.js': { contents: 'file 3', dependencies: ['/src/4.js', '/src/6.js'] },
  '/src/4.js': { contents: 'file 4', dependencies: ['5.js', './7.js'] },
  '/src/5.js': { contents: 'file 5', dependencies: ['6.js', '/src/8.js'] },
  '/src/6.js': { contents: 'file 6', dependencies: ['./7.js', '/src/9.js'] },
  '/src/7.js': { contents: 'file 7', dependencies: ['8.js'] },
  '/src/8.js': { contents: 'file 8', dependencies: ['./9.js'] },
  '/src/9.js': { contents: 'file 9', dependencies: [] }
};

const bunder = new Bundler({
  resolve(path, referrer) {
    if (/^\//.test(path)) return path;

    const dirname = referrer.replace(/\/[^\/]+$/, '');

    return `${dirname}/${path}`.replace(/(\.\/)+/g, '');
  },
  parse(path) {
    return new Promise(resolve => {
      const delay = 20;

      setTimeout(() => resolve(files[path]), delay);

      console.log(`Read: %o, Waiting: %oms`, path, delay);
    });
  }
});

async function parse(input) {
  try {
    console.log(await bunder.parse(input));
  } catch (error) {
    console.error(error);
  }
}

parse('/src/1.js');

// Output: [
//  {
//    path: '/src/9.js',
//    contents: 'file 9',
//    dependencies: []
//  },
//  {
//    path: '/src/8.js',
//    contents: 'file 8',
//    dependencies: ['./9.js']
//  },
//  {
//    path: '/src/7.js',
//    contents: 'file 7',
//    dependencies: ['8.js']
//  },
//  {
//    path: '/src/6.js',
//    contents: 'file 6',
//    dependencies: ['./7.js', '/src/9.js']
//  },
//  {
//    path: '/src/5.js',
//    contents: 'file 5',
//    dependencies: ['6.js', '/src/8.js']
//  },
//  {
//    path: '/src/4.js',
//    contents: 'file 4',
//    dependencies: ['5.js', './7.js']
//  },
//  {
//    path: '/src/3.js',
//    contents: 'file 3',
//    dependencies: ['/src/4.js', '/src/6.js']
//  },
//  {
//    path: '/src/2.js',
//    contents: 'file 2',
//    dependencies: ['./3.js', './5.js']
//  },
//  {
//    path: '/src/1.js',
//    contents: 'file 1',
//    dependencies: ['2.js', '4.js']
//  }
//]
```

[npm-image]: https://img.shields.io/npm/v/@nuintun/bundler.svg?style=flat-square
[node-image]: https://img.shields.io/node/v/@nuintun/bundler.svg?style=flat-square
[download-image]: https://img.shields.io/npm/dm/@nuintun/bundler?style=flat-square
[npm-url]: https://www.npmjs.org/package/@nuintun/bundler
[license-image]: https://img.shields.io/github/license/nuintun/bundler?style=flat-square
[license-url]: https://github.com/nuintun/bundler/blob/main/LICENSE
