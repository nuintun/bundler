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
    return new Promise(async (resolve, reject) => {
      try {
        resolve(unique(await new Visitor(options)));
      } catch (error) {
        return reject(error);
      }
    });
  }
}
