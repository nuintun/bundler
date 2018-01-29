/**
 * @module index
 * @license MIT
 * @version 2018/01/25
 */

import Visitor from './lib/visitor';
import { unique } from './lib/utils';

/**
 * @class Bundler
 */
export default class Bundler {
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
      let files;

      try {
        files = await new Visitor(options);
      } catch (error) {
        return reject(error);
      }

      // Resolved
      resolve(unique(files, file => file.path));
    });
  }
}
