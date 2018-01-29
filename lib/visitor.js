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
   */
  constructor(options = {}) {
    this.error = null;
    this.visited = new Map();
    this.bundles = new Set();
  }

  cycle(input, referer) {
    if (input === referer) return true;

    const bundles = this.bundles;

    for (let bundle of bundles) {
      if (input === bundle.path || referer === bundle.path) {
        return true;
      }
    }

    return false;
  }

  /**
   * @method visit
   * @param {string} input
   * @param {Object} options
   * @returns {Primise}
   */
  async visit(input, options) {
    let meta;

    try {
      meta = await options.parse(input);
    } catch (error) {
      throw (this.error = error);
    }

    // Fallback meta
    meta = meta || {};

    const dependencies = meta.dependencies;
    const file = new File(input, dependencies, meta.contents);

    // Traverse dependencies
    if (Array.isArray(dependencies) && dependencies.length) {
      try {
        await this.visitDepend(dependencies, options, input);
      } catch (error) {
        throw error;
      }
    }

    this.bundles.add(file);
  }

  /**
   * @method visitDepend
   * @param {Array} dependencies
   * @param {Object} options
   * @param {string} referer
   * @returns {Primise}
   */
  visitDepend(dependencies, options, referer) {
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
  async traverse(input, options, referer) {
    // If has error reject error
    if (this.error) throw this.error;

    // Format input
    input = String(input);

    // Resolve input path
    try {
      input = await options.resolve(input, referer);
    } catch (error) {
      throw (this.error = error);
    }

    // Ready
    let ready;

    // Format input
    input = String(input);

    // Hit visited file
    if (this.visited.has(input)) {
      // Circularly dependency
      if (this.cycle(input, referer)) {
        if (!options.cycle) {
          throw (this.error = new ReferenceError(`Found circularly dependency ${input} at ${referer}.`));
        }
      } else {
        // Get ready promise
        ready = this.visited.get(input);
      }
    } else {
      this.visited.set(input, (ready = this.visit(input, options)));
    }

    // Await ready
    await ready;

    if (!referer) {
      return Array.from(this.bundles);
    }
  }
}
