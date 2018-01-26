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
