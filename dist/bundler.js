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
  constructor(path, dependencies = [], data = null) {
    this.path = path;
    this.dependencies = dependencies;
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
 * @function circle
 * @param {string} path
 * @param {string} referers
 * @param {Map} visited
 */
function circle(path, referer, visited) {
  if (path === referer) return true;

  const referers = visited.get(referer).referers;

  if (referers.has(path)) return true;

  for (let referer of referers) {
    if (circle(path, referer, visited)) return true;
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
      try {
        const path = String(await options.resolve(String(input), referer));

        // If visited resolved cached file
        if (this.visited.has(path)) {
          const cached = this.visited.get(path);

          if (!options.circle) {
            if (circle(path, referer, this.visited)) {
              return reject(new ReferenceError(`Found circularly dependency ${path} at ${referer}.`));
            }

            cached.referers.add(referer);
          }

          return resolve(cached.file);
        }

        const meta = (await options.parse(path)) || {};
        const dependencies = meta.dependencies;
        const file = new File(path, dependencies, meta.data);

        // Set visited
        if (!options.circle) {
          const referers = new Set();

          referer && referers.add(referer);

          this.visited.set(path, { referers, file });
        } else {
          this.visited.set(path, { file });
        }

        // Traverse dependencies
        if (Array.isArray(dependencies) && dependencies.length) {
          const bundle = flatten(
            await Promise.all(dependencies.map(dependency => this.traverse(dependency, options, path)))
          );

          // Put file at last
          bundle.push(file);

          // Resolved
          return resolve(bundle);
        }

        // Resolved
        resolve(file);
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
    return new Promise(async (resolve, reject) => {
      try {
        resolve(unique(await new Visitor(options)));
      } catch (error) {
        return reject(error);
      }
    });
  }
}

module.exports = Bundler;
