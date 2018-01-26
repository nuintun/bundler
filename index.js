/**
 * @module index
 * @license MIT
 * @version 2018/01/25
 */

import Visitor from './lib/visitor';

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
    return new Promise(async resolve => {
      resolve(await new Visitor(options));
    });
  }
}
