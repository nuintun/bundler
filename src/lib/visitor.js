/**
 * @module visitor
 * @license MIT
 * @author nuintun
 */

import File from './file';

/**
 * @class Visitor
 */
export default class Visitor {
  /**
   * @constructor
   * @param {Object} options
   * @param {Function} options.resolve
   * @param {Function} options.parse
   * @param {boolean} [options.cycle]
   * @returns {Promise}
   */
  constructor(options) {
    this.files = new Set();
    this.waiting = new Map();
    this.completed = new Set();

    /**
     * @function traverse
     * @param {string} input
     * @param {Object} options
     * @returns {Promise}
     */
    const traverse = async (input, options) => {
      // Await all files ready
      await this.traverse(await input, options);

      // Clear completed
      this.completed.clear();

      // Returned files
      return this.files;
    };

    // Returned bundles
    return traverse(options.input, options);
  }

  /**
   * @method visit
   * @param {string} input
   * @param {Object} options
   * @returns {Primise}
   */
  async visit(input, options) {
    const meta = (await options.parse(input)) || {};
    const file = new File(input, meta.dependencies, meta.contents);
    const dependencies = file.dependencies;

    // Traverse dependencies
    if (dependencies.size) {
      for (let dependency of dependencies) {
        // Resolve dependency path
        dependency = await options.resolve(String(dependency), input);

        // Recursive
        await this.traverse(dependency, options, input);
      }
    }

    // Add file
    this.files.add(file);
    // Delete waiting
    this.waiting.delete(input);
    // Add completed
    this.completed.add(input);

    // Returned
    return true;
  }

  /**
   * @method traverse
   * @param {string} input
   * @param {Object} options
   * @param {string} [referer]
   * @returns {Primise}
   */
  async traverse(input, options, referer) {
    // Normalize input path
    input = String(input);

    // If completed do nothing
    if (this.completed.has(input)) return true;

    // Found circularly dependency
    if (this.waiting.has(input)) {
      if (options.cycle) {
        // If allow cycle do nothing
        return true;
      } else {
        // When not allowed cycle throw error
        throw new ReferenceError(`Found circularly dependency ${input} at ${referer}`);
      }
    }

    // Visit file
    const ready = this.visit(input, options);

    // Add file to waiting
    this.waiting.set(input, ready);

    // Await ready
    return await ready;
  }
}
