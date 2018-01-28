/**
 * @module bundler
 * @author nuintun
 * @license MIT
 * @version 0.0.1
 * @description A file dependency bundle parser.
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
   * @param {Array} dependencies
   * @param {any} contents
   */
  constructor(path, dependencies = [], contents = null) {
    this.path = path;
    this.dependencies = dependencies;
    this.contents = contents;
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
 * @function function
 * @param {Array} array
 * @returns {Array}
 */
function unique(array) {
  const cached = new Set();

  return array.filter(file => {
    const path = file.path;

    if (cached.has(path)) return false;

    cached.add(path);

    return true;
  });
}

/**
 * @function cycle
 * @param {string} path
 * @param {string} referers
 * @param {Map} visited
 * @returns {boolean}
 */
function cycle(path, referer, visited) {
  if (path === referer) return true;

  const referers = visited.get(referer).referers;

  if (referers.has(path)) return true;

  for (let referer of referers) {
    if (cycle(path, referer, visited)) return true;
  }

  return false;
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
    this.visited = new Map();

    return this.traverse(options.input, options);
  }

  /**
   * @method traverse
   * @param {string} input
   * @param {Object} options
   * @returns {Primise}
   */
  traverse(input, options, referer) {
    return new Promise(async (resolve, reject) => {
      const path = String(await options.resolve(String(input), referer));

      // If visited return cached file
      if (this.visited.has(path)) {
        const cached = this.visited.get(path);

        if (!options.cycle) {
          if (cycle(path, referer, this.visited)) {
            return reject(new ReferenceError(`Found circularly dependency ${path} at ${referer}.`));
          }

          cached.referers.add(referer);
        }

        try {
          return resolve(await cached.ready);
        } catch (error) {
          return reject(error);
        }
      }

      const ready = new Promise(async (resolve, reject) => {
        const meta = (await options.parse(path)) || {};
        const dependencies = meta.dependencies;
        const file = new File(path, dependencies, meta.contents);

        // Traverse dependencies
        if (Array.isArray(dependencies) && dependencies.length) {
          let bundle;
          const promises = dependencies.map(dependency => this.traverse(dependency, options, path));

          try {
            bundle = await Promise.all(promises);
          } catch (error) {
            return reject(error);
          }

          // Flatten bundle
          bundle = flatten(bundle);

          // Put file at last
          bundle.push(file);

          return resolve(bundle);
        }

        // Resolved
        resolve(file);
      });

      // Set visited
      if (!options.cycle) {
        const referers = new Set();

        referer && referers.add(referer);

        this.visited.set(path, { referers, ready });
      } else {
        this.visited.set(path, { ready });
      }

      try {
        resolve(await ready);
      } catch (error) {
        reject(error);
      }
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
    // Returned promise
    return new Promise(async (resolve, reject) => {
      let bundle;

      try {
        bundle = await new Visitor(options);
      } catch (error) {
        return reject(error);
      }

      // Resolved
      resolve(unique(bundle));
    });
  }
}

module.exports = Bundler;
