/**
 * @module visitor
 * @license MIT
 * @version 2018/01/25
 */

import File from './file';
import { flatten, cycle } from './utils';

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
