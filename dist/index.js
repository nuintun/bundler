/**
 * @module bundler
 * @author nuintun
 * @license MIT
 * @version 0.0.1
 * @description A file dependency tree parser.
 * @see https://github.com/nuintun/bundler#readme
 */

'use strict';

/**
 * @module file
 * @license MIT
 * @version 2018/01/25
 */

class File {
  constructor(path, data = null) {
    this.path = path;
    this.data = data;
  }
}

/**
 * @module visitor
 * @license MIT
 * @version 2018/01/25
 */

function unzip(array) {
  let set = [];

  array.forEach(element => {
    if (element) {
      if (Array.isArray(element)) {
        set = set.concat(unzip(element));
      } else {
        set.push(element);
      }
    }
  });

  return set;
}

class Visitor {
  constructor(options = {}) {
    this.visited = new Set();

    return this.traverse(options.input, options);
  }

  traverse(input, options) {
    return new Promise(async resolve => {
      const path = await options.resolve(input);

      if (!this.visited.has(path)) {
        this.visited.add(path);
        const meta = await options.parse(path);
        const dependencies = meta.dependencies;
        const file = new File(path, meta.data);

        if (Array.isArray(dependencies) && dependencies.length) {
          let bundler = await Promise.all(dependencies.map(dependency => this.traverse(dependency, options)));

          bundler = unzip(bundler);

          bundler.push(file);

          return resolve(bundler);
        }

        return resolve(file);
      }

      resolve();
    });
  }
}

/**
 * @module index
 * @license MIT
 * @version 2018/01/25
 */

class Bundler {
  constructor(options = {}) {
    return this.bundle(options);
  }

  bundle(options) {
    return new Promise(async resolve => {
      resolve(await new Visitor(options));
    });
  }
}

module.exports = Bundler;
