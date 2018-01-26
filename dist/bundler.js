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

/**
 * @class File
 */
class File {
  /**
   * @constructor
   * @param {string} path
   * @param {any} data
   */
  constructor(path, data = null) {
    this.path = path;
    this.data = data;
  }
}

/**
 * @module utils
 * @license MIT
 * @version 2018/01/25
 */

/**
 * @function flatten
 * @param {Array} array
 * @returns {Array}
 */
function flatten(array) {
  return array.reduce(function(array, value) {
    if (!value) return array;

    return array.concat(Array.isArray(value) ? flatten(value) : value);
  }, []);
}

/**
 * @module visitor
 * @license MIT
 * @version 2018/01/25
 */

/**
 * @class Visitor
 */
class Visitor {
  /**
   * @constructor
   * @param {Object} options
   */
  constructor(options = {}) {
    this.visited = new Set();

    return this.traverse(options.input, options);
  }

  /**
   * @method traverse
   * @param {string} input
   * @param {Object} options
   * @returns {Primise}
   */
  traverse(input, options) {
    return new Promise(async resolve => {
      const path = String(await options.resolve(input));

      if (!this.visited.has(path)) {
        this.visited.add(path);
        const meta = await options.parse(path);
        const dependencies = meta.dependencies;
        const file = new File(path, meta.data);

        if (Array.isArray(dependencies) && dependencies.length) {
          const bundler = flatten(
            await Promise.all(dependencies.map(dependency => this.traverse(dependency, options)))
          );

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

/**
 * @class Bundler
 */
class Bundler {
  /**
   * @constructor
   * @param {Object} options
   */
  constructor(options = {}) {
    return this.bundle(options);
  }

  /**
   * @method bundle
   * @param {Object} options
   */
  bundle(options) {
    return new Promise(async resolve => {
      resolve(await new Visitor(options));
    });
  }
}

module.exports = Bundler;
