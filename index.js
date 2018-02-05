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
   * @returns {Promise}
   */
  constructor(options = {}) {
    // Assert resolve and parse
    ['resolve', 'parse'].forEach(name => {
      if (typeof options[name] !== 'function') {
        throw new TypeError(`options.${name} must be a function.`);
      }
    });

    // Returned bundles
    return new Visitor(options);
  }
}
