/**
 * @module index
 * @license MIT
 * @author nuintun
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
   * @param {boolean} [options.cycle]
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
