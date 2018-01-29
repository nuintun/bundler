# bundler

> A file dependency bundle parser
>
> ![Node Version][node-image]
> [![Dependencies][david-image]][david-url]

### API

> new Bundler(options)
>
> > options.input: string
> >
> > > path of input file
>
> > options.cycle: boolean
> >
> > > support circularly dependency
>
> > options.resolve(path: string, referer: string) => path: string
> >
> > > path resolve function
>
> > options.parse(path: string) => { dependencies: Array, contents: any }
> >
> > > file dependencies parse function

### Examples

```js
const Bundler = require('@nuintun/bundler');

const files = {
  1: { dependencies: ['2', '3'], contents: '1' },
  2: { dependencies: ['3', '4'], contents: '2' },
  3: { dependencies: ['4', '5'], contents: '3' },
  4: { dependencies: ['5', '6'], contents: '4' },
  5: { dependencies: ['6'], contents: '5' },
  6: { dependencies: ['7'], contents: '6' },
  7: { dependencies: ['8'], contents: '7' },
  8: { dependencies: [], contents: '8' }
};

async function bunder(params) {
  try {
    console.log(
      await new Bundler({
        input: '1',
        cycle: true,
        resolve: id => id,
        parse: id => Promise.resolve(files[id])
      })
    );
  } catch (error) {
    console.error(error);
  }
}

bunder();

// Output:
// [ File { path: '8', dependencies: [], contents: '8' },
//   File { path: '7', dependencies: [ '8' ], contents: '7' },
//   File { path: '6', dependencies: [ '7' ], contents: '6' },
//   File { path: '5', dependencies: [ '6' ], contents: '5' },
//   File { path: '4', dependencies: [ '5', '6' ], contents: '4' },
//   File { path: '3', dependencies: [ '4', '5' ], contents: '3' },
//   File { path: '2', dependencies: [ '3', '4' ], contents: '2' },
//   File { path: '1', dependencies: [ '2', '3' ], contents: '1' } ]
```

[node-image]: https://img.shields.io/node/v/@nuintun/bundler.svg?style=flat-square
[david-image]: http://img.shields.io/david/dev/nuintun/bundler.svg?style=flat-square
[david-url]: https://david-dm.org/nuintun/bundler?type=dev
