/**
 * @module visitor
 * @license MIT
 * @version 2018/01/25
 */

import File from './file';
import { flatten } from './utils';

/**
 * @class Visitor
 */
export default class Visitor {
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
    return new Promise(async resolve => {
      const path = String(await options.resolve(String(input), referer));

      // If visited resolved cached file
      if (this.visited.has(path)) return resolve(this.visited.get(path));

      const meta = (await options.parse(path)) || {};
      const dependencies = meta.dependencies;
      const file = new File(path, dependencies, meta.data);

      // Set visited
      this.visited.set(path, file);

      // Traverse dependencies
      if (Array.isArray(dependencies) && dependencies.length) {
        const bundler = flatten(
          await Promise.all(dependencies.map(dependency => this.traverse(dependency, options, path)))
        );

        bundler.push(file);

        return resolve(bundler);
      }

      // Resolved
      resolve(file);
    });
  }
}
