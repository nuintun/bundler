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
    return array.concat(Array.isArray(value) ? flatten(value) : value);
  }, []);
}

/**
 * @function unique
 * @param {Array} array
 * @param {Function} filter
 * @returns {Array}
 */
function unique(array, filter = value => value) {
  const marks = new Set();

  return array.filter(value => {
    const mark = filter(value);

    if (marks.has(mark)) return false;

    marks.add(mark);

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
    this.error = null;
    this.visited = new Map();

    return this.traverse(options.input, options);
  }

  /**
   * @method visitDependencies
   * @param {Array} dependencies
   * @param {Object} options
   * @param {string} referer
   * @returns {Primise}
   */
  visitDependencies(dependencies, options, referer) {
    const cache = new Set();
    const promises = dependencies.reduce((promises, dependency) => {
      if (cache.has(dependency)) return promises;

      cache.add(dependency);
      promises.push(this.traverse(dependency, options, referer));

      return promises;
    }, []);

    return Promise.all(promises);
  }

  /**
   * @method traverse
   * @param {string} input
   * @param {Object} options
   * @returns {Primise}
   */
  traverse(input, options, referer) {
    return new Promise(async (resolve, reject) => {
      // If has error reject error
      if (this.error) return reject(this.error);

      // Format input
      input = String(input);

      // Resolve input path
      try {
        input = await options.resolve(input, referer);
      } catch (error) {
        return reject((this.error = error));
      }

      // Ready
      let ready;

      // Format input
      input = String(input);

      // Hit visited file
      if (this.visited.has(input)) {
        const visited = this.visited.get(input);

        // Circularly dependency
        if (cycle(input, referer, this.visited)) {
          if (!options.cycle) {
            return reject((this.error = new ReferenceError(`Found circularly dependency ${input} at ${referer}.`)));
          } else {
            return resolve([]);
          }
        }

        // Cache referer
        visited.referers.add(referer);

        // Get ready promise
        ready = visited.ready;
      } else {
        // Define ready promise
        ready = new Promise(async (resolve, reject) => {
          let meta;

          try {
            meta = await options.parse(input);
          } catch (error) {
            return reject((this.error = error));
          }

          // Fallback meta
          meta = meta || {};

          const dependencies = meta.dependencies;
          const file = new File(input, dependencies, meta.contents);

          // Traverse dependencies
          if (Array.isArray(dependencies) && dependencies.length) {
            let files;

            try {
              files = await this.visitDependencies(dependencies, options, input);
            } catch (error) {
              return reject(error);
            }

            // Flatten files
            files = flatten(files);

            // Put current file at last
            files.push(file);

            return resolve(files);
          }

          // Resolved
          resolve([file]);
        });

        // Referers Set
        const referers = new Set();

        // Add referer
        referer && referers.add(referer);

        // Set visited
        this.visited.set(input, { referers, ready });
      }

      // Await ready
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
      resolve(unique(bundle, file => file.path));
    });
  }
}

module.exports = Bundler;
