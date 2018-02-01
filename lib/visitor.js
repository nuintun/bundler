/**
 * @module visitor
 * @license MIT
 * @version 2018/01/25
 */

import File from './file';

/**
 * @class Visitor
 */
export default class Visitor {
  /**
   * @constructor
   * @param {Object} options
   * @returns {Promise}
   */
  constructor(options = {}) {
    this.files = new Set();
    this.visited = new Map();
    this.waiting = new Set();

    /**
     * @function traverse
     * @param {string} input
     * @param {Object} options
     * @returns {Promise}
     */
    const traverse = async (input, options) => {
      // Await all files ready
      await this.traverse(input, options);

      // Returned files
      return this.files;
    };

    // Returned bundles
    return traverse(options.input, options);
  }

  /**
   * @method cycle
   * @param {string} input
   * @param {string} referer
   * @returns {boolean}
   */
  cycle(input, referer) {
    return this.waiting.has(input);
  }

  /**
   * @method visit
   * @param {string} input
   * @param {Object} options
   * @returns {Primise}
   */
  async visit(input, options) {
    // Add waiting
    this.waiting.add(input);

    const meta = (await options.parse(input)) || {};
    const file = new File(input, meta.dependencies, meta.contents);
    const dependencies = file.dependencies;

    // Traverse dependencies
    if (dependencies.size) {
      for (let dependency of dependencies) {
        // Recursive
        await this.traverse(dependency, options, input);
      }
    }

    // Add file
    this.files.add(file);

    // Delete waiting
    this.waiting.delete(input);

    // Returned
    return true;
  }

  /**
   * @method traverse
   * @param {string} input
   * @param {Object} options
   * @returns {Primise}
   */
  async traverse(input, options, referer) {
    // Resolve input path
    input = String(await options.resolve(String(input), referer));

    // Hit visited file
    if (this.visited.has(input)) {
      // Found circularly dependency
      if (this.cycle(input, referer)) {
        // When not allowed cycle throw error
        if (!options.cycle) {
          throw new ReferenceError(`Found circularly dependency ${input} at ${referer}.`);
        }

        // Returned
        return true;
      }

      // Await ready
      return await this.visited.get(input);
    }

    // Get ready
    const ready = this.visit(input, options);

    // Cache file
    this.visited.set(input, ready);

    // Await ready
    return await ready;
  }
}
