/**
 * @module visitor
 * @license MIT
 * @version 2018/01/25
 */

import File from './file';
import { flatten, circle } from './utils';

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
