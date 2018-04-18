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
   * @param {Function} options.resolve
   * @param {Function} options.parse
   * @returns {Promise}
   */
  constructor(options) {
    // Assert resolve and parse
    ['resolve', 'parse'].forEach(name => {
      if (options && typeof options[name] !== 'function') {
        throw new TypeError(`The options.${name} must be a function`);
      }
    });

    // Returned bundles
    return new Visitor(options);
  }
}
